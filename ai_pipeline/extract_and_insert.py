import os
import logging
from gemini_client import call_gemini
from validator import validate_data
from db import insert_if_not_exists
import time
import json
import fitz  # PyMuPDF for better PDF handling
import re
import pytesseract
from PIL import Image
import io

logging.basicConfig(
    filename="logs/pipeline.log",
    level=logging.INFO
)

def extract_text_from_pdf(path):
    """
    Extract structured text from PDF using PyMuPDF with OCR fallback.
    Preserves table structure and document layout better than basic text extraction.
    
    Args:
        path (str): Path to PDF file
    
    Returns:
        str: Structured text content with tables preserved in markdown format
    """
    try:
        print(f"📄 Processing PDF with enhanced extraction: {os.path.basename(path)}")
        
        # Open PDF with PyMuPDF
        doc = fitz.open(path)
        structured_text = ""
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # First try regular text extraction
            text_blocks = page.get_text()
            
            if text_blocks.strip():
                # Get text blocks with their positions for better structure
                blocks = page.get_text("dict")["blocks"]
                page_text = ""
                
                for block in blocks:
                    if "lines" in block:
                        for line in block["lines"]:
                            line_text = ""
                            for span in line["spans"]:
                                line_text += span["text"]
                            
                            # Check if this might be a table row
                            if len(line["spans"]) > 2 and abs(line["bbox"][1] - line["bbox"][3]) < 20:
                                cells = [span["text"].strip() for span in line["spans"]]
                                if any("|" in cell or "\t" in cell for cell in cells):
                                    page_text += "| " + " | ".join(cells) + " |\n"
                                else:
                                    page_text += line_text + "\n"
                            else:
                                page_text += line_text + "\n"
                
                structured_text += f"\n--- Page {page_num + 1} ---\n"
                structured_text += page_text + "\n"
            else:
                # No text found, use OCR
                print(f"🔍 Page {page_num + 1} requires OCR...")
                
                # Get page as image
                pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))  # Higher resolution
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                
                # Perform OCR
                ocr_text = pytesseract.image_to_string(img)
                
                if ocr_text.strip():
                    structured_text += f"\n--- Page {page_num + 1} (OCR) ---\n"
                    structured_text += ocr_text + "\n"
                else:
                    structured_text += f"\n--- Page {page_num + 1} ---\n[No text found in OCR]\n"
        
        doc.close()
        
        if not structured_text or len(structured_text.strip()) < 20:
            raise ValueError("PDF contains insufficient readable content")
        
        print(f"✅ Successfully extracted {len(structured_text)} characters with enhanced structure")
        return structured_text
        
    except Exception as e:
        # Handle various PDF-related errors
        error_msg = str(e).lower()
        if "encrypted" in error_msg or "password" in error_msg:
            raise ValueError(f"PDF is encrypted or password-protected: {path}")
        elif "corrupted" in error_msg or "invalid" in error_msg or "damaged" in error_msg:
            raise ValueError(f"PDF file is corrupted or damaged: {path}")
        elif "permission" in error_msg or "access" in error_msg:
            raise ValueError(f"Insufficient permissions to read PDF: {path}")
        elif "not found" in error_msg or "does not exist" in error_msg:
            raise FileNotFoundError(f"PDF file not found: {path}")
        else:
            logging.error(f"PDF extraction error for {path}: {str(e)}")
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")




def process_text(text, pdf_filename):
    """
    Process structured text (with tables) to extract scholarship information.
    
    Args:
        text (str): Structured text content from PDF with enhanced formatting
        pdf_filename (str): Name of the source PDF file
    """
    prompt = """You are an exhaustive data extraction engine. Scan the entire document from start to finish. If the document contains a list or table of multiple scholarship schemes (e.g., NSP schemes or university lists), you must create a separate JSON object for EVERY entry found. DO NOT truncate the list. If there are 20 scholarships, return 20 objects.

CRITICAL EXTRACTION RULES:
1. Return ONLY a JSON array of scholarships - NO EXPLANATIONS
2. NEVER guess values - if not clearly found, use null
3. Create a separate JSON object for EVERY scholarship entry found
4. DO NOT truncate or summarize - extract ALL entries
5. Convert percentages to CGPA out of 10 (75% → 7.5)
6. Extract numeric values only (remove currency symbols, commas)
7. Dates must be in YYYY-MM-DD format
8. URLs must start with http
9. Keep descriptions to 2-3 sentences

TABLE COLUMN MAPPING:
- For NSP-style tables: Each row/scheme = separate scholarship object
- Map columns accurately: Scheme Name → title, Department → provider, Amount → amount, etc.
- Sub-schemes under departments should be individual scholarship entries
- If table has columns like "Scheme Name", "Eligibility", "Amount", "Deadline", map each to corresponding fields
- Treat each department's sub-scheme as a unique scholarship entry

FIELD SPECIFICATIONS:
- title: Exact scholarship name (from scheme name column)
- provider: Institution/organization name (from department/ministry column)
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

EXHAUSTIVE EXTRACTION COMMAND:
SCAN EVERY PAGE, EVERY TABLE, EVERY LIST. Create individual JSON objects for ALL scholarship entries found. If you find 50 scholarships in a table, return 50 JSON objects. Do not stop early, do not summarize, do not truncate.

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

STRUCTURED TEXT TO ANALYZE:
""" + text

    try:
        response = call_gemini(prompt, use_json_mode=True)
    except Exception as e:
        print("Gemini error:", e)
        return

    try:
        # Since we're using JSON mode, the response should be valid JSON
        data_list = json.loads(response)
        for data in data_list:
            validated = validate_data(data)
            success = insert_if_not_exists(validated, pdf_filename)
            if success:
                logging.info(f"Inserted scholarship: {validated['title']}")
            time.sleep(5)

    except json.JSONDecodeError as e:
        logging.error(f"JSON parsing error: {str(e)}")
        print(f"JSON parsing error: {str(e)}")
        return
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

            try:
                text = extract_text_from_pdf(file_path)
                process_text(text, file)
                print(f"✅ Successfully processed: {file}")
            except ValueError as ve:
                logging.error(f"Value error processing {file}: {str(ve)}")
                print(f"❌ Failed: {file} - {str(ve)}")
            except Exception as e:
                logging.error(f"Error processing {file}: {str(e)}")
                print(f"❌ Failed: {file} - {str(e)}")


if __name__ == "__main__":
    main()
