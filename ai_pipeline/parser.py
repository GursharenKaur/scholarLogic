import re
import json

def safe_json_parse(response_text):
    if not response_text:
        raise ValueError("Empty Gemini response")

    cleaned = response_text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "")

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)

    if not match:
        raise ValueError("No JSON object found")

    json_text = match.group(0)

    return json.loads(json_text)
