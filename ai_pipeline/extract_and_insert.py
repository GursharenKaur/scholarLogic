import os
import logging
from gemini_client import call_gemini
from parser import safe_json_parse
from validator import validate_data
from db import insert_if_not_exists
import time
import pdfplumber
import pytesseract
from pdf2image import convert_from_path

logging.basicConfig(
    filename="logs/pipeline.log",
    level=logging.INFO
)

def extract_text_from_pdf(path):
    text = ""

    # First attempt: normal extraction
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted

    # If text too short → run OCR
    if len(text.strip()) < 100:
        print("⚠ No text layer detected. Running OCR...")
        images = convert_from_path(path)

        for img in images:
            ocr_text = pytesseract.image_to_string(img)
            text += ocr_text
    
    if not text.strip():
        raise ValueError("PDF contains no readable text")

    return text




def process_text(text):
    prompt = """You are a precise scholarship information extraction engine.

STRICT RULES:
1. Return ONLY a JSON array of scholarships
2. NEVER guess values - if not clearly found, use null
3. Split multiple scholarships into separate objects
4. Convert percentages to CGPA out of 10 (75% → 7.5)
5. Extract numeric values only (remove currency symbols, commas)
6. Dates must be in YYYY-MM-DD format
7. URLs must start with http
8. Keep descriptions to 2-3 sentences

FIELD SPECIFICATIONS:
- title: Exact scholarship name
- provider: Institution/organization name
- amount: Numeric value only, null if not specified
- amountType: "CASH" for monetary awards, "WAIVER" for tuition waivers
- deadline: YYYY-MM-DD format, null if not found
- minCGPA: 0-10 scale, convert from percentage if needed
- maxIncome: Numeric family income limit, null if not specified
- courseRestriction: e.g., "BE/BTech", "MBA", etc.
- categoryRestriction: e.g., "SC/ST", "General", etc.
- yearRestriction: e.g., "1st year", "2nd-4th year", etc.
- applyLink: Full URL starting with http, null if not found
- description: Clean 2-3 sentence summary

RETURN FORMAT:
[
  {
    "title": "",
    "provider": "",
    "amount": null,
    "amountType": null,
    "deadline": null,
    "minCGPA": null,
    "maxIncome": null,
    "courseRestriction": null,
    "categoryRestriction": null,
    "yearRestriction": null,
    "applyLink": null,
    "description": null
  }
]

TEXT TO ANALYZE:
""" + text

    try:
        response = call_gemini(prompt)
    except Exception as e:
        print("Gemini error:", e)
        return

    try:
        data_list = safe_json_parse(response)
        for data in data_list:
            validated = validate_data(data)
            success = insert_if_not_exists(validated)
            if success:
                logging.info(f"Inserted scholarship: {validated['title']}")
            time.sleep(5)

    except Exception as e:
        logging.error(f"Processing error: {str(e)}")
        print(f"Processing error: {str(e)}")
        return

def main():
    folder = "pdfs"

    for file in os.listdir(folder):
        if file.endswith(".pdf"):
            print(f"Processing {file}...")
            file_path = os.path.join(folder, file)
            text = extract_text_from_pdf(file_path)

            try:
                process_text(text)
                print(f"✅ Successfully processed: {file}")
            except ValueError as ve:
                logging.error(f"Value error processing {file}: {str(ve)}")
                print(f"❌ Failed: {file} - {str(ve)}")
            except Exception as e:
                logging.error(f"Error processing {file}: {str(e)}")
                print(f"❌ Failed: {file} - {str(e)}")


if __name__ == "__main__":
    main()
