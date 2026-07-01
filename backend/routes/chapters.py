from flask import Blueprint, jsonify, request
from backend.database import get_db
from bson import ObjectId
import datetime

chapters_bp = Blueprint("chapters", __name__)

def fmt(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    if "series_id" in doc:
        doc["series_id"] = str(doc["series_id"])
    return doc

@chapters_bp.route("/series/<series_id>", methods=["GET"])
def list_chapters(series_id):
    db = get_db()
    page  = max(1, int(request.args.get("page", 1)))
    limit = min(100, int(request.args.get("limit", 20)))
    skip  = (page - 1) * limit
    try:
        oid = ObjectId(series_id)
    except Exception:
        return jsonify({"error": "Invalid series ID"}), 400
    cursor = db.chapters.find({"series_id": oid}).sort("number", -1).skip(skip).limit(limit)
    total  = db.chapters.count_documents({"series_id": oid})
    return jsonify({"items": [fmt(doc) for doc in cursor], "total": total, "page": page, "limit": limit})

_COVER_FIELDS = ["cover_url", "cover_image", "coverImage", "image_url", "image", "thumbnail", "poster"]


def _pick_cover(doc):
    for field in _COVER_FIELDS:
        val = doc.get(field)
        if val and isinstance(val, str) and val.strip():
            return val.strip()
    return ""


@chapters_bp.route("/latest", methods=["GET"])
def latest_chapters():
    db = get_db()
    limit = min(30, int(request.args.get("limit", 14)))
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "series",
            "localField": "series_id",
            "foreignField": "_id",
            "as": "series"
        }},
        {"$addFields": {"series_doc": {"$arrayElemAt": ["$series", 0]}}},
        {"$addFields": {
            "series_slug": "$series_doc.slug",
            "type": {"$ifNull": ["$type", "$series_doc.type"]},
            "genres": {"$ifNull": ["$series_doc.genres", []]},
            "rating": "$series_doc.rating",
            "views": "$series_doc.views",
            "cover_url": {"$ifNull": ["$series_doc.cover_url", ""]},
            "cover_image": {"$ifNull": ["$series_doc.cover_image", ""]},
            "coverImage": {"$ifNull": ["$series_doc.coverImage", ""]},
            "image_url": {"$ifNull": ["$series_doc.image_url", ""]},
            "thumbnail": {"$ifNull": ["$series_doc.thumbnail", ""]},
        }},
        {"$project": {"series": 0, "series_doc": 0}}
    ]
    return jsonify([fmt(doc) | {"cover_url": _pick_cover(doc)} for doc in db.chapters.aggregate(pipeline)])

@chapters_bp.route("/<chapter_id>", methods=["GET"])
def get_chapter(chapter_id):
    db = get_db()
    try:
        doc = db.chapters.find_one({"_id": ObjectId(chapter_id)})
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    if not doc:
        return jsonify({"error": "Not found"}), 404
    return jsonify(fmt(doc))

@chapters_bp.route("/", methods=["POST"])
def create_chapter():
    db = get_db()
    data = request.get_json(force=True) or {}
    required = ["series_id", "number"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"Missing field: {f}"}), 400
    try:
        series_oid = ObjectId(data["series_id"])
    except Exception:
        return jsonify({"error": "Invalid series_id"}), 400
    series = db.series.find_one({"_id": series_oid})
    if not series:
        return jsonify({"error": "Series not found"}), 404
    doc = {
        "series_id":     series_oid,
        "series_title":  series.get("title", ""),
        "number":        int(data["number"]),
        "title":         data.get("title", f"Chapter {data['number']}"),
        "pages":         int(data.get("pages", 0)),
        "created_at":    datetime.datetime.utcnow(),
        "updated_label": "Just now",
    }
    result = db.chapters.insert_one(doc)
    db.series.update_one(
        {"_id": series_oid},
        {"$set": {"updated_at": datetime.datetime.utcnow()},
         "$inc": {"chapter_count": 1}}
    )
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc["series_id"] = str(doc["series_id"])
    return jsonify(doc), 201

@chapters_bp.route("/<chapter_id>", methods=["DELETE"])
def delete_chapter(chapter_id):
    db = get_db()
    try:
        doc = db.chapters.find_one({"_id": ObjectId(chapter_id)})
        if not doc:
            return jsonify({"error": "Not found"}), 404
        db.chapters.delete_one({"_id": ObjectId(chapter_id)})
        db.series.update_one(
            {"_id": doc["series_id"]},
            {"$inc": {"chapter_count": -1}}
        )
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    return jsonify({"deleted": True})
