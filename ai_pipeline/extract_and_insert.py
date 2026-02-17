import os
import pdfplumber
from dotenv import load_dotenv
from pymongo import MongoClient
import requests
import json

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
print("Using Key:", GEMINI_KEY[:6])

# MongoDB
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["test"]
collection = db["scholarships"]

# Gemini REST endpoint
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"

def extract_text(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

def call_gemini(prompt):
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    response = requests.post(GEMINI_URL, json=payload)
    response.raise_for_status()

    result = response.json()
    return result["candidates"][0]["content"]["parts"][0]["text"]

def extract_structured_data(raw_text):
    prompt = f"""
    Extract scholarship information strictly in JSON format.
    Do not wrap in markdown.
    Do not explain.

    Format:

    {{
        "title": "",
        "provider": "",
        "amount": 0,
        "deadline": "",
        "minCGPA": 0,
        "maxIncome": 0,
        "applyLink": "",
        "description": ""
    }}

    Text:
    {raw_text}
    """

    response_text = call_gemini(prompt)

    clean_text = response_text.strip()

    if clean_text.startswith("```"):
        clean_text = clean_text.split("```")[1]

    return json.loads(clean_text)

def main():
    raw_text = extract_text("sample.pdf")
    structured_data = extract_structured_data(raw_text)
    collection.insert_one(structured_data)
    print("✅ Scholarship inserted successfully!")

if __name__ == "__main__":
    main()
