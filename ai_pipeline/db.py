from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["Data"]
collection = db["scholarships"]

def insert_if_not_exists(data):
    data["title"] = data["title"].strip()
    data["provider"] = data["provider"].strip()

    existing = collection.find_one({
        "title": data["title"],
        "provider": data["provider"]
    })

    if existing:
        print("⚠ Scholarship already exists.")
        return False

    collection.insert_one(data)
    print("✅ Scholarship inserted successfully!")
    return True

