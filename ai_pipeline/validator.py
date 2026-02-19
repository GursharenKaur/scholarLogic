def validate_data(data):
    # Title and provider are required
    if not data.get("title") or not data.get("title").strip():
        raise ValueError("Missing title")
    
    if not data.get("provider") or not data.get("provider").strip():
        raise ValueError("Missing provider")
    
    # Convert numeric fields properly
    data["amount"] = convert_to_numeric(data.get("amount"))
    data["minCGPA"] = convert_to_numeric(data.get("minCGPA"))
    data["maxIncome"] = convert_to_numeric(data.get("maxIncome"))
    
    # Validate CGPA range
    if data["minCGPA"] is not None and (data["minCGPA"] < 0 or data["minCGPA"] > 10):
        data["minCGPA"] = None
    
    # Validate amountType
    valid_amount_types = ["CASH", "WAIVER"]
    if data.get("amountType") not in valid_amount_types:
        data["amountType"] = None
    
    # Validate deadline format (basic check)
    if data.get("deadline"):
        if not is_valid_date_format(data["deadline"]):
            data["deadline"] = None
    
    # Validate URL
    if data.get("applyLink"):
        if not data["applyLink"].startswith(("http://", "https://")):
            data["applyLink"] = None
    
    # Clean up string fields
    string_fields = ["title", "provider", "courseRestriction", "categoryRestriction", 
                     "yearRestriction", "description"]
    for field in string_fields:
        if data.get(field):
            data[field] = data[field].strip()
    
    return data

def convert_to_numeric(value):
    if value is None or value == "":
        return None
    
    try:
        # Handle string inputs
        if isinstance(value, str):
            # Remove currency symbols, commas, and whitespace
            cleaned = value.replace("₹", "").replace("$", "").replace(",", "").strip()
            if cleaned == "":
                return None
            return float(cleaned)
        return float(value)
    except (ValueError, TypeError):
        return None

def is_valid_date_format(date_str):
    if not date_str or not isinstance(date_str, str):
        return False
    # Basic YYYY-MM-DD format check
    import re
    return bool(re.match(r'^\d{4}-\d{2}-\d{2}$', date_str))
