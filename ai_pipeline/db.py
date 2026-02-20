from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["Data"]
collection = db["scholarships"]

def insert_if_not_exists(data, pdf_filename=None):
    # Clean and validate required fields
    data["title"] = data["title"].strip() if data.get("title") else ""
    data["provider"] = data["provider"].strip() if data.get("provider") else ""

    if not data["title"] or not data["provider"]:
        print("⚠ Missing required fields (title or provider)")
        return False

    existing = collection.find_one({
        "title": data["title"],
        "provider": data["provider"]
    })

    if existing:
        if pdf_filename and not existing.get("sourcePdf"):
            collection.update_one({"_id": existing["_id"]}, {"$set": {"sourcePdf": pdf_filename}})
            print(f"✅ Updated existing scholarship '{data['title']}' with PDF link: {pdf_filename}")
        else:
            print("⚠ Scholarship already exists.")
        return False

    # Prepare document with new schema
    document = {
        "title": data["title"],
        "provider": data["provider"],
        "amount": data.get("amount"),
        "amountType": data.get("amountType"),
        "deadline": data.get("deadline"),
        "minCGPA": data.get("minCGPA"),
        "maxIncome": data.get("maxIncome"),
        "courseRestriction": data.get("courseRestriction"),
        "categoryRestriction": data.get("categoryRestriction"),
        "yearRestriction": data.get("yearRestriction"),
        "applyLink": data.get("applyLink"),
        "description": data.get("description"),
        "location": "Pan-India",  # Default location
        "tags": [],  # Default empty tags
        "sourcePdf": pdf_filename,
    }

    collection.insert_one(document)
    print("✅ Scholarship inserted successfully!")
    return True

