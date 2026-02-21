import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
MEGALLM_API_KEY = os.getenv("MEGALLM_API_KEY")
MEGALLM_MODEL = os.getenv("MEGALLM_MODEL", "gemini-2.5-flash")  # default model

if not MONGO_URI:
    raise ValueError("Missing MONGODB_URI environment variable")
if not MEGALLM_API_KEY:
    raise ValueError("Missing MEGALLM_API_KEY environment variable")
