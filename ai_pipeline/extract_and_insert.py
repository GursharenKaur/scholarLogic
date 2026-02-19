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
    print("Starting process_text function...")
    try:
        prompt = """You are an information extraction engine.

Do NOT include explanations.
Do NOT include markdown.
Do NOT wrap in backticks.

Return ONLY valid JSON array.

Strict Format:

[
  {
    "title": "",
    "provider": "",
    "amount": 0,
    "deadline": "",
    "minCGPA": 0,
    "minIncome": 0,
    "description": "",
    "applyLink": "",
    "location": ""
  }
]

If multiple scholarships are present, return all of them in separate objects inside the array.
If a field is not found, use null.
If official website or application link is found, extract it into applyLink.
If description exists, summarize it in 4-5 lines.

Text:
""" + text
        
        print("Prompt created successfully, calling Gemini API...")
    except Exception as e:
        print(f"Error creating prompt: {e}")
        return

    try:
        print("Calling Gemini API...")
        response = call_gemini(prompt)
        print("RAW GEMINI RESPONSE:")
        print(response)
        print("--- END RESPONSE ---")
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
                print("EXTRACTED TEXT PREVIEW:")
                print(text[:500])
                print("\n--- END PREVIEW ---\n")
                print("Calling process_text...")
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
