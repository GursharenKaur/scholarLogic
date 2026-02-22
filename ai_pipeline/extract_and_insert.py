import os
import sys

# 🚀 ADD THIS EXACT LINE HERE (Before any other imports!)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


import argparse
import logging
import json
import re
import io
import fitz          # PyMuPDF
import pytesseract
from PIL import Image

from megallm_client import call_megallm
from validator import validate_data
from db import (
    insert_if_not_exists,
    is_pdf_already_processed,
    mark_pdf_as_processed,
    backfill_norm_fields,
    deduplicate_existing,
)

# 🚀 ADD THIS TO AUTO-CREATE THE FOLDER:
os.makedirs("logs", exist_ok=True)

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    filename="logs/pipeline.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

# ── PDF Text Extraction ──────────────────────────────────────────────────────
def extract_text_from_pdf(path: str) -> str:
    """
    Extract structured text from a PDF using PyMuPDF with per-page OCR fallback.
    Returns text with page separators preserved for the LLM.
    """
    print(f"📄 Extracting: {os.path.basename(path)}")
    doc = fitz.open(path)
    structured_text = ""

    for page_num in range(len(doc)):
        page = doc[page_num]
        raw_text = page.get_text()

        if raw_text.strip():
            blocks = page.get_text("dict")["blocks"]
            page_text = ""
            for block in blocks:
                if "lines" in block:
                    for line in block["lines"]:
                        line_text = "".join(span["text"] for span in line["spans"])
                        # Detect possible table row (many spans, small height)
                        if len(line["spans"]) > 2 and abs(line["bbox"][1] - line["bbox"][3]) < 20:
                            cells = [s["text"].strip() for s in line["spans"]]
                            if any("|" in c or "\t" in c for c in cells):
                                page_text += "| " + " | ".join(cells) + " |\n"
                                continue
                        page_text += line_text + "\n"
            structured_text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
        else:
            print(f"  🔍 Page {page_num + 1}: OCR fallback")
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            ocr_text = pytesseract.image_to_string(img)
            label = "(OCR)" if ocr_text.strip() else ""
            content = ocr_text if ocr_text.strip() else "[No readable text]"
            structured_text += f"\n--- Page {page_num + 1} {label} ---\n{content}\n"

    doc.close()

    char_count = len(structured_text.strip())
    if char_count < 20:
        raise ValueError(f"PDF contains insufficient readable content ({char_count} chars)")

    print(f"  ✅ Extracted {char_count:,} characters")
    return structured_text


# ── LLM Extraction Prompt ────────────────────────────────────────────────────
EXTRACTION_PROMPT = """\
You are an exhaustive scholarship data extraction engine.

MISSION: Extract EVERY SINGLE scholarship from this document — tables, lists, paragraphs. \
If a table has 30 rows, produce 30 JSON objects. Never truncate. Never summarize.

CRITICAL RULES:
1. Output ONLY a raw JSON array — no markdown, no explanation, no preamble
2. One JSON object per scholarship/scheme entry
3. Never guess — use null for any field not explicitly stated
4. amounts: numeric only (strip ₹, commas, "per annum")
5. Convert % CGPA to 10-point scale (75% → 7.5)
6. deadline: YYYY-MM-DD format only, or null
7. applyLink: must start with http, or null
8. description: 2-3 sentences max

TABLE PARSING RULES:
- NSP-style tables: each row = one scholarship object
- "Scheme Name" column → title
- "Department / Ministry" column → provider
- Sub-schemes under a department = individual entries

REQUIRED OUTPUT FORMAT (array of objects):
[
  {
    "title": "Exact scheme name",
    "provider": "Ministry or institution name",
    "amount": 50000,
    "amountType": "CASH",
    "deadline": "2025-10-31",
    "minCGPA": 6.0,
    "maxIncome": 250000,
    "courseRestriction": "BE/BTech",
    "categoryRestriction": "SC/ST",
    "yearRestriction": "1st year",
    "applyLink": "https://scholarships.gov.in",
    "description": "Brief 2-3 sentence summary."
  }
]

START your response with [ and END with ]. No other text.

DOCUMENT TEXT:
"""


# ── Core Processing ──────────────────────────────────────────────────────────
def process_pdf(pdf_path: str, pdf_filename: str) -> int:
    """
    Extract text → call LLM → validate → insert.
    Returns number of new scholarships inserted.
    """
    try:
        text = extract_text_from_pdf(pdf_path)
    except (ValueError, FileNotFoundError) as e:
        logger.error(f"Extraction failed [{pdf_filename}]: {e}")
        print(f"  ❌ Extraction failed: {e}")
        return 0

    prompt = EXTRACTION_PROMPT + text

    try:
        response = call_megallm(prompt, use_json_mode=True)
    except Exception as e:
        logger.error(f"LLM call failed [{pdf_filename}]: {e}")
        print(f"  ❌ LLM error: {e}")
        return 0

    # ── Parse JSON ───────────────────────────────────────────────────────────
    try:
        parsed = json.loads(response)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed [{pdf_filename}]: {e}\nRaw: {response[:300]}")
        print(f"  ❌ JSON parse error: {e}")
        return 0

    # Normalise: handle wrapped dict {"scholarships": [...]} or bare list
    if isinstance(parsed, dict):
        data_list = next(
            (v for v in parsed.values() if isinstance(v, list)),
            [parsed]  # single scholarship as dict
        )
    elif isinstance(parsed, list):
        data_list = parsed
    else:
        logger.error(f"Unexpected JSON root type [{pdf_filename}]: {type(parsed)}")
        print(f"  ❌ Unexpected JSON type: {type(parsed)}")
        return 0

    print(f"  📊 LLM found {len(data_list)} scholarship entries")

    # ── Validate & Insert ─────────────────────────────────────────────────────
    inserted = 0
    for entry in data_list:
        if not isinstance(entry, dict):
            print(f"  ⚠  Skipped non-dict entry: {type(entry)}")
            continue
        try:
            validated = validate_data(entry)
            if insert_if_not_exists(validated, pdf_filename):
                inserted += 1
        except ValueError as ve:
            print(f"  ⚠  Validation failed: {ve}")
        except Exception as e:
            logger.error(f"Insert error [{pdf_filename}]: {e}")
            print(f"  ⚠  Insert error: {e}")

    print(f"  💾 Inserted {inserted}/{len(data_list)} new scholarships")
    return inserted


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    pdf_folder = "pdfs"

    # ── One-time migrations (safe to run on every startup) ───────────────────
    print("🔧 Running DB maintenance...")
    backfill_norm_fields()
    removed = deduplicate_existing()
    if removed:
        print(f"🗑  Cleaned {removed} duplicate documents from DB")
    print()

    # ── Process PDFs ─────────────────────────────────────────────────────────
    pdf_files = sorted(f for f in os.listdir(pdf_folder) if f.lower().endswith(".pdf"))

    if not pdf_files:
        print("📁 No PDF files found in pdfs/ folder.")
        return

    print(f"📁 Found {len(pdf_files)} PDF(s) to check\n")
    total_inserted = 0

    for filename in pdf_files:
        pdf_path = os.path.join(pdf_folder, filename)

        # ── Skip already-processed PDFs ──────────────────────────────────────
        if is_pdf_already_processed(filename):
            print(f"⏭  Already processed: {filename}")
            continue

        print(f"{'='*60}")
        print(f"📂 Processing: {filename}")

        inserted = process_pdf(pdf_path, filename)
        total_inserted += inserted

        # Mark as done regardless of insert count (0 inserts = all duplicates)
        mark_pdf_as_processed(filename, inserted)
        print(f"✅ Done: {filename}\n")

    print(f"{'='*60}")
    print(f"🏁 Pipeline complete. Total new scholarships inserted: {total_inserted}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scholarship PDF pipeline")
    parser.add_argument("--file", type=str, help="Path to a single PDF to process (outputs JSON to stdout)")
    args = parser.parse_args()

    if args.file:
        # ── Single-file mode: used by the Next.js API route ──────────────────
        pdf_path = args.file
        pdf_filename = os.path.basename(pdf_path)
        errors: list[str] = []
        inserted = 0
        skipped = 0

        try:
            text = extract_text_from_pdf(pdf_path)
            prompt = EXTRACTION_PROMPT + text

            try:
                response = call_megallm(prompt, use_json_mode=True)
            except Exception as e:
                raise RuntimeError(f"LLM call failed: {e}")

            try:
                parsed = json.loads(response)
            except json.JSONDecodeError as e:
                raise RuntimeError(f"JSON parse error: {e}")

            if isinstance(parsed, dict):
                data_list = next((v for v in parsed.values() if isinstance(v, list)), [parsed])
            elif isinstance(parsed, list):
                data_list = parsed
            else:
                raise RuntimeError(f"Unexpected JSON root type: {type(parsed)}")

            for entry in data_list:
                if not isinstance(entry, dict):
                    skipped += 1
                    errors.append(f"Non-dict entry skipped: {type(entry)}")
                    continue
                try:
                    validated = validate_data(entry)
                    if insert_if_not_exists(validated, pdf_filename):
                        inserted += 1
                    else:
                        skipped += 1
                except ValueError as ve:
                    skipped += 1
                    errors.append(str(ve))
                except Exception as e:
                    skipped += 1
                    errors.append(str(e))

            # Mark PDF as processed
            mark_pdf_as_processed(pdf_filename, inserted)

            result = {
                "success": True,
                "insertedCount": inserted,
                "skippedCount": skipped,
                "errors": errors,
            }
        except Exception as e:
            result = {
                "success": False,
                "insertedCount": 0,
                "skippedCount": 0,
                "errors": [str(e)],
            }

        # Write ONLY the JSON to stdout — no other print() output should reach stdout
        sys.stdout.write(json.dumps(result) + "\n")
        sys.exit(0)
    else:
        main()
