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
    prompt = f"""
You are an information extraction engine.

Return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown.
Do NOT wrap in backticks.

Strict format:

{{
  "title": "",
  "provider": "",
  "amount": 0,
  "deadline": "",
  "minCGPA": 0,
  "maxIncome": 0,
  "courseRestriction": "",
  "categoryRestriction": "",
  "yearRestriction": ""
}}

If a field is not found, use null.

Text:
{text}
"""

    try:
        response = call_gemini(prompt)
        # print("RAW GEMINI RESPONSE:\n", response)
    except Exception as e:
        print("Gemini error:", e)
        return

    try:
        data = safe_json_parse(response)
    except Exception as e:
        logging.error(f"JSON parse error: {str(e)}")
        return

    data = validate_data(data)

    insert_if_not_exists(data)
    time.sleep(5)

def main():
    folder = "pdfs"

    for file in os.listdir(folder):
        if file.endswith(".pdf"):
            print(f"Processing {file}...")
            file_path = os.path.join(folder, file)
            text = extract_text_from_pdf(file_path)

            try:
                # print("EXTRACTED TEXT PREVIEW:\n")
                # print(text[:1000])
                # print("\n--- END PREVIEW ---\n")
                process_text(text)
            except Exception as e:
                logging.error(f"Error processing {file}: {str(e)}")
                print(f"❌ Failed: {file}")


if __name__ == "__main__":
    main()
