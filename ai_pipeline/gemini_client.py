"""
MegaLLM client — drop-in replacement for the old Gemini client.

MegaLLM exposes an OpenAI-compatible API at https://ai.megallm.io/v1,
so we use the standard `openai` SDK with a custom base_url.

Import unchanged in the rest of the pipeline:
    from gemini_client import call_gemini, call_gemini_with_json_schema
"""

from openai import OpenAI
from config import MEGALLM_API_KEY, MEGALLM_MODEL
import json
import re

# ── Client setup ────────────────────────────────────────────────────────────
client = OpenAI(
    base_url="https://ai.megallm.io/v1",
    api_key=MEGALLM_API_KEY,
)

# ── Helpers ──────────────────────────────────────────────────────────────────
def _clean_json_response(text: str) -> str:
    """
    Strip markdown code fences and surrounding whitespace from model output.
    Handles:
      - ```json\\n[...]\\n```
      - ```\\n[...]\\n```
      - Leading/trailing whitespace and newlines
    """
    text = text.strip()
    # Remove opening fence (```json or ```)
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE)
    # Remove closing fence
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def _extract_json_block(text: str) -> str:
    """
    Try to extract the first valid JSON array or object from the text,
    even if there is surrounding prose.
    """
    text = _clean_json_response(text)

    # Fast path: if it already parses, return as-is
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass

    # Try to find a JSON array first (our expected format)
    match = re.search(r"(\[.*\])", text, re.DOTALL)
    if match:
        candidate = match.group(1)
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            pass

    # Try to find a JSON object
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        candidate = match.group(1)
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            pass

    # Give up and return cleaned text (caller will handle JSONDecodeError)
    return text


# ── Public API (same signatures as the old Gemini client) ───────────────────
def call_gemini(prompt: str, use_json_mode: bool = True) -> str:
    """
    Call MegaLLM with optional JSON mode for structured responses.

    Args:
        prompt (str): The prompt to send.
        use_json_mode (bool): Whether to request JSON-only output.

    Returns:
        str: Cleaned response text (valid JSON string when use_json_mode=True).
    """
    full_prompt = prompt
    if use_json_mode:
        full_prompt = (
            prompt
            + "\n\nCRITICAL: Respond with RAW JSON only — no markdown fences, "
            "no ```json blocks, no explanation. Start your response directly "
            "with [ or { and end with ] or }."
        )

    kwargs = {
        "model": MEGALLM_MODEL,
        "messages": [{"role": "user", "content": full_prompt}],
        "temperature": 0.1,
        "top_p": 0.8,
        "max_tokens": 8192,
    }

    try:
        response = client.chat.completions.create(**kwargs)
        text = response.choices[0].message.content

        if not text or not text.strip():
            raise Exception("Empty response from MegaLLM")

        if use_json_mode:
            return _extract_json_block(text)

        return text.strip()

    except Exception as e:
        raise Exception(f"MegaLLM API Error: {str(e)}")


def call_gemini_with_json_schema(prompt: str, json_schema: dict) -> dict:
    """
    Call MegaLLM with a schema hint injected into the prompt.

    Args:
        prompt (str): The prompt to send.
        json_schema (dict): JSON schema describing the expected response.

    Returns:
        dict: Parsed JSON response.
    """
    schema_hint = json.dumps(json_schema, indent=2)
    augmented_prompt = (
        f"{prompt}\n\n"
        f"Respond ONLY with valid JSON matching this schema:\n{schema_hint}"
    )

    try:
        raw = call_gemini(augmented_prompt, use_json_mode=True)
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise Exception(f"Invalid JSON response from MegaLLM: {str(e)}")
    except Exception as e:
        raise Exception(f"MegaLLM API Error: {str(e)}")
