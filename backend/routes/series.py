from flask import Blueprint, jsonify, request
from backend.database import get_db
from bson import ObjectId

series_bp = Blueprint("series", __name__)

def fmt(doc):
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

@series_bp.route("/", methods=["GET"])
def list_series():
    db = get_db()
    type_filter  = request.args.get("type", "")
    status_filter = request.args.get("status", "")
    sort_by      = request.args.get("sort", "updated")
    page         = max(1, int(request.args.get("page", 1)))
    limit        = min(48, int(request.args.get("limit", 24)))
    skip         = (page - 1) * limit

    query = {}
    if type_filter:   query["type"]   = type_filter
    if status_filter: query["status"] = status_filter

    sort_map = {
        "updated": [("updated_at", -1)],
        "rating":  [("rating", -1)],
        "views":   [("views", -1)],
        "az":      [("title", 1)],
    }
    sort = sort_map.get(sort_by, sort_map["updated"])

    cursor = db.series.find(query).sort(sort).skip(skip).limit(limit)
    total  = db.series.count_documents(query)
    items  = [fmt(doc) for doc in cursor]

    return jsonify({"items": items, "total": total, "page": page, "limit": limit})

@series_bp.route("/trending", methods=["GET"])
def trending():
    db = get_db()
    type_filter = request.args.get("type", "")
    limit = min(24, int(request.args.get("limit", 12)))
    query = {}
    if type_filter: query["type"] = type_filter
    cursor = db.series.find(query).sort([("views", -1)]).limit(limit)
    return jsonify([fmt(doc) for doc in cursor])

@series_bp.route("/latest-updated", methods=["GET"])
def latest_updated():
    db = get_db()
    limit = min(20, int(request.args.get("limit", 14)))
    pipeline = [
        {"$sort": {"updated_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "chapters",
            "let": {"sid": "$_id"},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$series_id", "$$sid"]}}},
                {"$sort": {"number": -1}},
                {"$limit": 1}
            ],
            "as": "latest_ch"
        }},
        {"$addFields": {
            "latest_chapter": {"$arrayElemAt": ["$latest_ch.title", 0]},
            "latest_chapter_num": {"$arrayElemAt": ["$latest_ch.number", 0]},
            "updated_label": {"$arrayElemAt": ["$latest_ch.updated_label", 0]},
        }},
        {"$project": {"latest_ch": 0}}
    ]
    items = [fmt(doc) for doc in db.series.aggregate(pipeline)]
    return jsonify(items)

@series_bp.route("/ranking", methods=["GET"])
def ranking():
    db = get_db()
    period = request.args.get("period", "weekly")
    limit  = min(20, int(request.args.get("limit", 12)))
    sort_map = {
        "weekly":  [("views", -1)],
        "monthly": [("rating", -1)],
        "alltime": [("views", -1), ("rating", -1)],
    }
    sort = sort_map.get(period, sort_map["weekly"])
    cursor = db.series.find().sort(sort).limit(limit)
    return jsonify([fmt(doc) for doc in cursor])

@series_bp.route("/<series_id>", methods=["GET"])
def get_series(series_id):
    db = get_db()
    try:
        doc = db.series.find_one({"_id": ObjectId(series_id)})
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    if not doc:
        return jsonify({"error": "Not found"}), 404
    return jsonify(fmt(doc))

@series_bp.route("/", methods=["POST"])
def create_series():
    db = get_db()
    import datetime
    data = request.get_json(force=True) or {}
    required = ["title", "type", "status"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400
    doc = {
        "title":         data["title"].strip(),
        "type":          data["type"],
        "status":        data["status"],
        "rating":        float(data.get("rating", 0)),
        "views":         int(data.get("views", 0)),
        "genres":        data.get("genres", []),
        "author":        data.get("author", ""),
        "artist":        data.get("artist", ""),
        "alt_title":     data.get("alt_title", ""),
        "description":   data.get("description", ""),
        "cover_color":   data.get("cover_color", "manga"),
        "chapter_count": int(data.get("chapter_count", 0)),
        "updated_at":    datetime.datetime.utcnow(),
    }
    result = db.series.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return jsonify(doc), 201

@series_bp.route("/<series_id>", methods=["PUT"])
def update_series(series_id):
    db = get_db()
    import datetime
    data = request.get_json(force=True) or {}
    data.pop("_id", None)
    data["updated_at"] = datetime.datetime.utcnow()
    try:
        res = db.series.update_one({"_id": ObjectId(series_id)}, {"$set": data})
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    if res.matched_count == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"updated": True})

@series_bp.route("/<series_id>", methods=["DELETE"])
def delete_series(series_id):
    db = get_db()
    try:
        res = db.series.delete_one({"_id": ObjectId(series_id)})
        db.chapters.delete_many({"series_id": ObjectId(series_id)})
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    if res.deleted_count == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"deleted": True})
