def validate_data(data):
    data["amount"] = int(data.get("amount") or 0)
    data["minCGPA"] = float(data.get("minCGPA") or 0)
    data["maxIncome"] = int(data.get("maxIncome") or 0)

    if not data.get("title"):
        raise ValueError("Missing title")

    if not data.get("provider"):
        raise ValueError("Missing provider")

    return data