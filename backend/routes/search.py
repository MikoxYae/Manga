from flask import Blueprint, jsonify, request
from backend.database import get_db
import re

search_bp = Blueprint("search", __name__)

_COVER_FIELDS = ["cover_url", "cover_image", "coverImage", "image_url", "image", "thumbnail", "poster"]


def _pick_cover(doc):
    for field in _COVER_FIELDS:
        val = doc.get(field)
        if val and isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def fmt(doc):
    doc["id"] = str(doc.pop("_id"))
    doc["cover_url"] = _pick_cover(doc)
    return doc

@search_bp.route("/", methods=["GET"])
def search():
    db = get_db()
    q      = request.args.get("q", "").strip()
    limit  = min(24, int(request.args.get("limit", 12)))

    if not q:
        return jsonify({"items": [], "total": 0})

    pattern = re.compile(re.escape(q), re.IGNORECASE)
    query = {
        "$or": [
            {"title":     {"$regex": pattern}},
            {"alt_title": {"$regex": pattern}},
            {"author":    {"$regex": pattern}},
            {"genres":    {"$elemMatch": {"$regex": pattern}}},
            {"type":      {"$regex": pattern}},
        ]
    }
    cursor = db.series.find(query).sort("views", -1).limit(limit)
    items  = [fmt(doc) for doc in cursor]
    return jsonify({"items": items, "total": len(items), "query": q})
