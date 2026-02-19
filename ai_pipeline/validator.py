def validate_data(data):
    data["amount"] = int(data.get("amount") or 0)
    data["minCGPA"] = normalize_cgpa(data.get("minCGPA"))
    data["minIncome"] = int(data.get("minIncome") or 0)

    if not data.get("title"):
        raise ValueError("Missing title")

    if not data.get("provider"):
        raise ValueError("Missing provider")

    return data

def normalize_cgpa(value):
    if not value:
        return 0

    value = float(value)

    # If value looks like percentage (greater than 10)
    if value > 10:
        # Convert percentage to CGPA (simple conversion)
        return round(value / 10, 2)

    return value
