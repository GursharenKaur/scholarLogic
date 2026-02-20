from google import genai
from config import GEMINI_API_KEY
import json
import re

# Configure the Gemini API
client = genai.Client(api_key=GEMINI_API_KEY)

def call_gemini(prompt, use_json_mode=True):
    """
    Call Gemini API with optional JSON mode for structured responses.
    
    Args:
        prompt (str): The prompt to send to Gemini
        use_json_mode (bool): Whether to request JSON response format
    
    Returns:
        str: The response text from Gemini
    """
    # Configure generation parameters
    config = {
        "temperature": 0.1,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 8192,
    }
    
    # Add JSON mode instruction if requested
    if use_json_mode:
        prompt = prompt + "\n\nIMPORTANT: You must respond with valid JSON only. Do not include any explanatory text outside the JSON structure."
        config["response_mime_type"] = "application/json"
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=config
        )
        
        if response.text:
            text = response.text.strip()
            
            # Remove markdown code blocks if present
            if text.startswith('```json'):
                text = re.sub(r'```json\s*', '', text)
            if text.startswith('```'):
                text = re.sub(r'```\s*', '', text)
            if text.endswith('```'):
                text = re.sub(r'\s*```$', '', text)
            
            return text.strip()
        else:
            raise Exception("Empty response from Gemini")
            
    except Exception as e:
        raise Exception(f"Gemini API Error: {str(e)}")

def call_gemini_with_json_schema(prompt, json_schema):
    """
    Call Gemini API with structured output using JSON schema.
    
    Args:
        prompt (str): The prompt to send to Gemini
        json_schema (dict): JSON schema for response structure
    
    Returns:
        dict: Parsed JSON response matching the schema
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                "temperature": 0.1,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json",
                "response_schema": json_schema
            }
        )
        
        if response.text:
            # Parse and return the JSON response
            return json.loads(response.text.strip())
        else:
            raise Exception("Empty response from Gemini")
            
    except json.JSONDecodeError as e:
        raise Exception(f"Invalid JSON response from Gemini: {str(e)}")
    except Exception as e:
        raise Exception(f"Gemini API Error: {str(e)}")
