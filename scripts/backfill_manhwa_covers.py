import os, sys, time, json
import requests
from pymongo import MongoClient

URI = os.environ.get("MONGODB_URI", "")
DB_NAME = os.environ.get("MONGO_DB_NAME", "mikoreads")
ANILIST = "https://graphql.anilist.co"

QUERY = """
query($search:String){
  Page(page:1,perPage:5){
    media(type:MANGA,search:$search,isAdult:false){
      id
      title{romaji english native}
      countryOfOrigin
      format
      coverImage{extraLarge large}
    }
  }
}
"""

if not URI:
    print("ERROR: MONGODB_URI not set"); sys.exit(1)

client = MongoClient(URI)
db = client[DB_NAME]

# All manhwa with missing cover OR MangaDex cover URL
series = list(db.series.find({
    "$and": [
        {"$or": [{"type": "Manhwa"}, {"cover_color": "manhwa"}]},
        {"$or": [
            {"cover_url": {"$in": [None, ""]}},
            {"cover_url": {"$regex": "mangadex"}}
        ]}
    ]
}, {"title": 1, "alt_title": 1, "cover_url": 1}))

print(f"Manhwa to update: {len(series)}")
updated = 0

for s in series:
    title = s.get("title", "") or s.get("alt_title", "")
    if not title:
        continue
    try:
        r = requests.post(
            ANILIST,
            json={"query": QUERY, "variables": {"search": title}},
            timeout=12,
            headers={"Content-Type": "application/json"}
        )
        media = r.json().get("data", {}).get("Page", {}).get("media") or []
        cover = ""
        for m in media:
            ci = m.get("coverImage") or {}
            u = ci.get("extraLarge") or ci.get("large") or ""
            if u:
                # Prefer Korean (manhwa) match
                if m.get("countryOfOrigin") == "KR":
                    cover = u
                    break
                elif not cover:
                    cover = u  # fallback: first result
        if cover:
            db.series.update_one(
                {"_id": s["_id"]},
                {"$set": {"cover_url": cover}}
            )
            print(f"  OK: {title[:50]}")
            updated += 1
        else:
            print(f"  NOT_FOUND: {title[:50]}")
        time.sleep(0.75)
    except Exception as e:
        print(f"  ERR {title[:30]}: {e}")
        time.sleep(1)

print(f"\nDone: {updated}/{len(series)} covers updated")
