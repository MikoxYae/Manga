"""
One-shot migration: backfill author/artist for MangaDex-sourced series
that currently have empty author/artist fields.

Usage (run on VPS where MONGODB_URI is set):
  cd /root/Manga
  python3 scripts/fix_mangadex_authors.py

Fetches relationships from MangaDex API in batches of 100.
"""
import os, sys, time, json, urllib.request, urllib.parse
from pymongo import MongoClient

MANGADEX_API = "https://api.mangadex.org"
MONGO_URI    = os.environ.get("MONGODB_URI", "")
DB_NAME      = os.environ.get("MONGO_DB_NAME", "mikoreads")

if not MONGO_URI:
    print("ERROR: MONGODB_URI not set")
    sys.exit(1)

client = MongoClient(MONGO_URI)
db     = client[DB_NAME]


def api_get(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MikoReads-Migrator/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  API error: {e}")
        return {}


def fetch_relationships_batch(manga_ids):
    """Return dict of {manga_id: {author, artist}} for a batch of IDs."""
    params = [("includes[]", "author"), ("includes[]", "artist"), ("limit", str(len(manga_ids)))]
    for mid in manga_ids:
        params.append(("ids[]", mid))
    url = MANGADEX_API + "/manga?" + urllib.parse.urlencode(params)
    data = api_get(url)
    result = {}
    for item in data.get("data") or []:
        mid = item.get("id")
        author = artist = ""
        for rel in item.get("relationships") or []:
            attrs = rel.get("attributes") or {}
            rtype = rel.get("type")
            if rtype == "author" and not author:
                author = attrs.get("name") or ""
            elif rtype == "artist" and not artist:
                artist = attrs.get("name") or ""
        result[mid] = {"author": author, "artist": artist or author}
    return result


# Find all MangaDex series with empty author
query = {"source": "mangadex", "$or": [{"author": ""}, {"author": None}]}
total = db.series.count_documents(query)
print(f"Found {total} MangaDex series with empty author/artist")
if total == 0:
    print("Nothing to update.")
    sys.exit(0)

# Get their mangadex IDs (stored in source_ids.mangadex)
cursor = db.series.find(query, {"_id": 1, "title": 1, "source_ids": 1})
records = list(cursor)

# Map mangadex_id -> mongo _id
id_map = {}
for rec in records:
    mdx_id = (rec.get("source_ids") or {}).get("mangadex") or ""
    if mdx_id:
        id_map[mdx_id] = rec["_id"]

print(f"{len(id_map)} have a mangadex source ID, fetching from API in batches...")

BATCH = 50
mdx_ids = list(id_map.keys())
updated = 0
skipped = 0

for i in range(0, len(mdx_ids), BATCH):
    batch = mdx_ids[i:i+BATCH]
    print(f"  Batch {i//BATCH + 1}: fetching {len(batch)} IDs...")
    rels = fetch_relationships_batch(batch)
    for mdx_id, fields in rels.items():
        mongo_id = id_map.get(mdx_id)
        if not mongo_id:
            skipped += 1
            continue
        if fields["author"]:
            db.series.update_one(
                {"_id": mongo_id},
                {"$set": {"author": fields["author"], "artist": fields["artist"]}}
            )
            print(f"    Updated: {fields['author']} / {fields['artist']}")
            updated += 1
        else:
            skipped += 1
    time.sleep(1.0)

print(f"\nDone. Updated: {updated}, Skipped (no data): {skipped}")
