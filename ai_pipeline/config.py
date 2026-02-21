import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI       = os.getenv("MONGODB_URI")
MEGALLM_API_KEY = os.getenv("MEGALLM_API_KEY")
MEGALLM_MODEL   = os.getenv("MEGALLM_MODEL", "deepseek-ai/deepseek-v3.1")

if not MONGO_URI or not MEGALLM_API_KEY:
    raise ValueError("Missing environment variables: MONGODB_URI and MEGALLM_API_KEY are required")
