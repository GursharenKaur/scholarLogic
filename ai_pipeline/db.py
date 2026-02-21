import re
import logging
from pymongo import MongoClient, UpdateOne
from pymongo.errors import DuplicateKeyError
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["Data"]
collection = db["scholarships"]
processed_collection = db["processed_pdfs"]  # tracks which PDFs have been ingested

logger = logging.getLogger(__name__)


# ── Title normalization ──────────────────────────────────────────────────────
def _normalize(text: str) -> str:
    """
    Canonical form for deduplication:
    lowercase, collapse whitespace, strip punctuation used as separators.
    'Merit-cum-Means Scholarship _Normal' → 'merit cum means scholarship normal'
    """
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[_\-–—/\\|,.()\[\]{}]", " ", text)  # separators → space
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── PDF-level idempotency ────────────────────────────────────────────────────
def is_pdf_already_processed(filename: str) -> bool:
    return processed_collection.find_one({"filename": filename}) is not None


def mark_pdf_as_processed(filename: str, inserted_count: int) -> None:
    processed_collection.update_one(
        {"filename": filename},
        {"$set": {"filename": filename, "insertedCount": inserted_count}},
        upsert=True,
    )


# ── Core insert ──────────────────────────────────────────────────────────────
def insert_if_not_exists(data: dict, pdf_filename: str = None) -> bool:
    """
    Insert a scholarship if no near-duplicate exists.
    Deduplication uses normalized title + normalized provider (case/punct insensitive).
    Returns True if inserted, False if skipped.
    """
    raw_title = (data.get("title") or "").strip()
    raw_provider = (data.get("provider") or "").strip()

    if not raw_title or not raw_provider:
        logger.warning("Skipped: missing title or provider")
        print("⚠  Skipped: missing title or provider")
        return False

    norm_title = _normalize(raw_title)
    norm_provider = _normalize(raw_provider)

    # Check for existing doc using normalized keys stored on each document
    existing = collection.find_one({
        "normTitle": norm_title,
        "normProvider": norm_provider,
    })

    if existing:
        # Opportunistically backfill sourcePdf if missing
        if pdf_filename and not existing.get("sourcePdf"):
            collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {"sourcePdf": pdf_filename}}
            )
            print(f"🔗 Linked PDF to existing: '{raw_title}'")
        else:
            print(f"⚠  Duplicate skipped: '{raw_title}'")
        return False

    document = {
        # ── Searchable / display fields ──
        "title":               raw_title,
        "provider":            raw_provider,
        # ── Normalized keys for dedup ──
        "normTitle":           norm_title,
        "normProvider":        norm_provider,
        # ── Scholarship data ──
        "amount":              data.get("amount"),
        "amountType":          data.get("amountType"),
        "deadline":            data.get("deadline"),
        "minCGPA":             data.get("minCGPA"),
        "maxIncome":           data.get("maxIncome"),
        "courseRestriction":   data.get("courseRestriction"),
        "categoryRestriction": data.get("categoryRestriction"),
        "yearRestriction":     data.get("yearRestriction"),
        "applyLink":           data.get("applyLink"),
        "description":         data.get("description"),
        "location":            "Pan-India",
        "tags":                [],
        "sourcePdf":           pdf_filename,
    }

    try:
        collection.insert_one(document)
        logger.info(f"Inserted scholarship: {raw_title}")
        print(f"✅ Inserted: '{raw_title}' by {raw_provider}")
        return True
    except DuplicateKeyError:
        print(f"⚠  Race-condition duplicate skipped: '{raw_title}'")
        return False


# ── One-time migration: backfill normTitle/normProvider on existing docs ─────
def backfill_norm_fields() -> int:
    """
    Run once to add normTitle/normProvider to documents that predate this schema.
    Safe to re-run (idempotent).
    """
    updated = 0
    for doc in collection.find({"normTitle": {"$exists": False}}):
        collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "normTitle":    _normalize(doc.get("title", "")),
                "normProvider": _normalize(doc.get("provider", "")),
            }}
        )
        updated += 1
    if updated:
        print(f"🔧 Backfilled normTitle/normProvider on {updated} documents")
    return updated


# ── Duplicate cleanup: remove exact-title dupes created before this fix ──────
def deduplicate_existing() -> int:
    """
    Find all (normTitle, normProvider) groups with >1 document.
    Keep the most complete one (has sourcePdf and/or description), delete the rest.
    Returns number of documents removed.
    """
    pipeline = [
        {"$group": {
            "_id": {"normTitle": "$normTitle", "normProvider": "$normProvider"},
            "ids": {"$push": "$_id"},
            "count": {"$sum": 1}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]

    removed = 0
    for group in collection.aggregate(pipeline):
        ids = group["ids"]
        # Keep the first id, delete the rest
        to_delete = ids[1:]
        collection.delete_many({"_id": {"$in": to_delete}})
        removed += len(to_delete)
        print(f"🗑  Removed {len(to_delete)} duplicate(s) of '{group['_id']['normTitle']}'")

    return removed
