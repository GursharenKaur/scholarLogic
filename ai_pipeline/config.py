import os
from pathlib import Path
from dotenv import load_dotenv

# Load variables from the single root .env.local (one level above ai_pipeline/)
dotenv_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(dotenv_path=dotenv_path)

MONGO_URI = os.getenv("MONGODB_URI")
MEGALLM_API_KEY = os.getenv("MEGALLM_API_KEY")
MEGALLM_MODEL = os.getenv("MEGALLM_MODEL", "deepseek-ai/deepseek-v3.1")

if not MONGO_URI or not MEGALLM_API_KEY:
    raise ValueError("Missing environment variables: MONGODB_URI and/or MEGALLM_API_KEY")
