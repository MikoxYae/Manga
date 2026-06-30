#!/usr/bin/env python3
"""
Import clean manga/manhwa/manhua metadata into MongoDB.

Sources:
- AniList GraphQL API for manga metadata.
- MangaDex public API for safe-content manga metadata.

No chapter image scraping is done here. Optional placeholder chapter metadata can be
created so the current frontend latest/reader pages have real DB records to show.
"""

import argparse
import datetime as dt
import html
import json
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Allow running from repo root or scripts folder.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import get_db, init_db


ANILIST_ENDPOINT = "https://graphql.anilist.co"
MANGADEX_ENDPOINT = "https://api.mangadex.org"

ADULT_WORDS = {
    "adult", "hentai", "erotica", "pornographic", "sexual violence",
    "doujinshi", "smut", "ecchi"
}

STATUS_MAP_ANILIST = {
    "FINISHED": "Completed",
    "RELEASING": "Ongoing",
    "NOT_YET_RELEASED": "Upcoming",
    "HIATUS": "Hiatus",
    "CANCELLED": "Cancelled",
}

STATUS_MAP_MANGADEX = {
    "completed": "Completed",
    "ongoing": "Ongoing",
    "hiatus": "Hiatus",
    "cancelled": "Cancelled",
}

LANG_TYPE_MAP = {
    "ja": "Manga",
    "ko": "Manhwa",
    "zh": "Manhua",
    "zh-hk": "Manhua",
    "zh-ro": "Manhua",
}

COUNTRY_TYPE_MAP = {
    "JP": "Manga",
    "KR": "Manhwa",
    "CN": "Manhua",
    "TW": "Manhua",
    "HK": "Manhua",
}


ANILIST_QUERY = """
query ($page: Int, $perPage: Int, $sort: [MediaSort], $search: String, $genres: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(
      type: MANGA
      isAdult: false
      search: $search
      genre_in: $genres
      sort: $sort
    ) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      synonyms
      description(asHtml: false)
      format
      status
      chapters
      volumes
      countryOfOrigin
      source
      genres
      averageScore
      meanScore
      popularity
      favourites
      isAdult
      siteUrl
      coverImage {
        large
        extraLarge
        color
      }
      bannerImage
      startDate {
        year
        month
        day
      }
      tags {
        name
        isAdult
      }
      staff(sort: RELEVANCE, perPage: 6) {
        nodes {
          name {
            full
          }
        }
      }
    }
  }
}
"""


CURATED_TITLES = [
    {
        "title": "Solo Leveling",
        "type": "Manhwa",
        "status": "Completed",
        "rating": 9.6,
        "views": 2400000,
        "popularity": 2400000,
        "genres": ["Action", "Fantasy", "Adventure"],
        "author": "Chugong",
        "artist": "DUBU",
        "alt_title": "Only I Level Up",
        "description": "A weak hunter receives a mysterious system and begins a path of growth.",
        "chapter_count": 201,
        "source": "curated",
        "source_url": "",
    },
    {
        "title": "Omniscient Reader",
        "type": "Manhwa",
        "status": "Ongoing",
        "rating": 9.4,
        "views": 1800000,
        "popularity": 1800000,
        "genres": ["Action", "Fantasy", "Drama"],
        "author": "sing N song",
        "artist": "Sleepy-C",
        "alt_title": "Omniscient Reader's Viewpoint",
        "description": "A reader finds himself inside the novel he spent years reading.",
        "chapter_count": 220,
        "source": "curated",
        "source_url": "",
    },
    {
        "title": "Tower of God",
        "type": "Manhwa",
        "status": "Ongoing",
        "rating": 9.2,
        "views": 1100000,
        "popularity": 1100000,
        "genres": ["Adventure", "Fantasy", "Mystery"],
        "author": "SIU",
        "artist": "SIU",
        "alt_title": "",
        "description": "A boy enters an infinite tower to find his only friend.",
        "chapter_count": 642,
        "source": "curated",
        "source_url": "",
    },
    {
        "title": "One Piece",
        "type": "Manga",
        "status": "Ongoing",
        "rating": 9.8,
        "views": 5100000,
        "popularity": 5100000,
        "genres": ["Adventure", "Comedy", "Action"],
        "author": "Eiichiro Oda",
        "artist": "Eiichiro Oda",
        "alt_title": "",
        "description": "A pirate boy sets out to find the legendary treasure and become Pirate King.",
        "chapter_count": 1124,
        "source": "curated",
        "source_url": "",
    },
    {
        "title": "Jujutsu Kaisen",
        "type": "Manga",
        "status": "Completed",
        "rating": 9.5,
        "views": 3200000,
        "popularity": 3200000,
        "genres": ["Action", "Supernatural", "Drama"],
        "author": "Gege Akutami",
        "artist": "Gege Akutami",
        "alt_title": "",
        "description": "A student joins a secret organization to fight cursed spirits.",
        "chapter_count": 271,
        "source": "curated",
        "source_url": "",
    },
    {
        "title": "Magic Emperor",
        "type": "Manhua",
        "status": "Ongoing",
        "rating": 9.1,
        "views": 1200000,
        "popularity": 1200000,
        "genres": ["Martial Arts", "Action", "Fantasy"],
        "author": "Ye Xiao",
        "artist": "",
        "alt_title": "",
        "description": "A powerful cultivator reincarnates and rises again.",
        "chapter_count": 610,
        "source": "curated",
        "source_url": "",
    },
]


def json_request(url, method="GET", payload=None, headers=None, retries=3, sleep=1.2):
    headers = headers or {}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    headers.setdefault("Accept", "application/json")
    headers.setdefault("User-Agent", "MikoReads-Metadata-Importer/1.0")

    last_error = None
    for attempt in range(1, retries + 1):
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                return json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last_error = f"HTTP {e.code}: {e.read().decode('utf-8', errors='ignore')[:300]}"
            if e.code == 429:
                time.sleep(sleep * attempt * 2)
                continue
            break
        except Exception as e:
            last_error = str(e)
            time.sleep(sleep * attempt)
    raise RuntimeError(f"Request failed: {url} :: {last_error}")


def clean_text(value):
    if not value:
        return ""
    value = html.unescape(str(value))
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def slugify(text):
    text = clean_text(text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:90] or "series"


def score_to_rating(score):
    if score is None:
        return 0
    try:
        return round(float(score) / 10, 1)
    except Exception:
        return 0


def is_adult_doc(doc):
    if doc.get("is_adult") is True:
        return True
    words = []
    words.extend(doc.get("genres") or [])
    words.extend(doc.get("tags") or [])
    words.append(doc.get("title", ""))
    text = " ".join(str(x).lower() for x in words)
    return any(word in text for word in ADULT_WORDS)


def choose_title(title_obj):
    if not title_obj:
        return ""
    return (
        title_obj.get("english")
        or title_obj.get("userPreferred")
        or title_obj.get("romaji")
        or title_obj.get("native")
        or ""
    )


def choose_alt_title(title_obj, synonyms=None):
    synonyms = synonyms or []
    values = [
        title_obj.get("romaji") if title_obj else "",
        title_obj.get("native") if title_obj else "",
        title_obj.get("userPreferred") if title_obj else "",
    ] + synonyms
    seen = set()
    cleaned = []
    for value in values:
        value = clean_text(value)
        if value and value.lower() not in seen:
            cleaned.append(value)
            seen.add(value.lower())
    return ", ".join(cleaned[:5])


def map_anilist(item):
    title = choose_title(item.get("title"))
    country = item.get("countryOfOrigin") or ""
    staff = item.get("staff", {}).get("nodes", []) or []
    staff_names = [node.get("name", {}).get("full", "") for node in staff if node.get("name")]
    genres = item.get("genres") or []
    tags = [t.get("name") for t in (item.get("tags") or []) if t.get("name") and not t.get("isAdult")]
    rating = score_to_rating(item.get("averageScore") or item.get("meanScore"))

    doc = {
        "title": title,
        "slug": slugify(title),
        "type": COUNTRY_TYPE_MAP.get(country, "Manga"),
        "status": STATUS_MAP_ANILIST.get(item.get("status"), item.get("status") or "Unknown"),
        "rating": rating,
        "views": int(item.get("popularity") or 0),
        "popularity": int(item.get("popularity") or 0),
        "favourites": int(item.get("favourites") or 0),
        "genres": genres[:10],
        "tags": tags[:12],
        "author": staff_names[0] if staff_names else "",
        "artist": staff_names[1] if len(staff_names) > 1 else (staff_names[0] if staff_names else ""),
        "alt_title": choose_alt_title(item.get("title") or {}, item.get("synonyms") or []),
        "description": clean_text(item.get("description")),
        "chapter_count": int(item.get("chapters") or 0),
        "volume_count": int(item.get("volumes") or 0),
        "country": country,
        "cover_url": (item.get("coverImage") or {}).get("extraLarge") or (item.get("coverImage") or {}).get("large") or "",
        "banner_url": item.get("bannerImage") or "",
        "cover_color": "manhwa" if COUNTRY_TYPE_MAP.get(country) == "Manhwa" else "manhua" if COUNTRY_TYPE_MAP.get(country) == "Manhua" else "manga",
        "source": "anilist",
        "source_url": item.get("siteUrl") or "",
        "source_ids": {"anilist": str(item.get("id")), "mal": str(item.get("idMal") or "")},
        "is_adult": bool(item.get("isAdult")),
    }
    return doc


def fetch_anilist(limit, search=None, genres=None, sort="POPULARITY_DESC"):
    per_page = min(50, max(1, limit))
    page = 1
    imported = 0
    while imported < limit:
        variables = {
            "page": page,
            "perPage": min(per_page, limit - imported),
            "sort": [sort],
            "search": search or None,
            "genres": genres or None,
        }
        data = json_request(ANILIST_ENDPOINT, method="POST", payload={"query": ANILIST_QUERY, "variables": variables})
        if data.get("errors"):
            raise RuntimeError(json.dumps(data["errors"], ensure_ascii=False)[:1000])
        page_data = data.get("data", {}).get("Page", {})
        items = page_data.get("media") or []
        if not items:
            break
        for item in items:
            doc = map_anilist(item)
            if doc.get("title") and not is_adult_doc(doc):
                yield doc
                imported += 1
                if imported >= limit:
                    break
        if not page_data.get("pageInfo", {}).get("hasNextPage"):
            break
        page += 1
        time.sleep(0.8)


def title_from_mangadex_titles(titles):
    if not titles:
        return ""
    return titles.get("en") or next(iter(titles.values()), "")


def alt_from_mangadex(alt_titles):
    values = []
    for item in alt_titles or []:
        if not isinstance(item, dict):
            continue
        value = item.get("en") or next(iter(item.values()), "")
        value = clean_text(value)
        if value and value not in values:
            values.append(value)
    return ", ".join(values[:5])


def map_mangadex(item):
    attr = item.get("attributes") or {}
    mid = item.get("id")
    lang = attr.get("originalLanguage") or ""
    title = title_from_mangadex_titles(attr.get("title") or {})
    desc = (attr.get("description") or {}).get("en") or ""
    genres = []
    tags = []
    for tag in attr.get("tags") or []:
        name = ((tag.get("attributes") or {}).get("name") or {}).get("en")
        group = (tag.get("attributes") or {}).get("group")
        if name:
            tags.append(name)
            if group == "genre":
                genres.append(name)

    cover_file = ""
    author = ""
    artist = ""
    for rel in item.get("relationships") or []:
        attrs = rel.get("attributes") or {}
        if rel.get("type") == "cover_art":
            cover_file = attrs.get("fileName") or ""
        elif rel.get("type") == "author" and not author:
            author = attrs.get("name") or ""
        elif rel.get("type") == "artist" and not artist:
            artist = attrs.get("name") or ""

    cover_url = f"https://uploads.mangadex.org/covers/{mid}/{cover_file}.512.jpg" if cover_file else ""

    rating = 0
    follows = int((attr.get("followedCount") or 0) if isinstance(attr.get("followedCount"), int) else 0)
    latest = attr.get("lastChapter") or attr.get("latestUploadedChapter") or ""

    doc = {
        "title": title,
        "slug": slugify(title),
        "type": LANG_TYPE_MAP.get(lang, "Manga"),
        "status": STATUS_MAP_MANGADEX.get(attr.get("status"), (attr.get("status") or "Unknown").title()),
        "rating": rating,
        "views": follows,
        "popularity": follows,
        "genres": genres[:10],
        "tags": tags[:14],
        "author": author,
        "artist": artist or author,
        "alt_title": alt_from_mangadex(attr.get("altTitles") or []),
        "description": clean_text(desc),
        "chapter_count": int(float(latest)) if str(latest).replace(".", "", 1).isdigit() else 0,
        "volume_count": 0,
        "country": lang,
        "cover_url": cover_url,
        "banner_url": "",
        "cover_color": "manhwa" if LANG_TYPE_MAP.get(lang) == "Manhwa" else "manhua" if LANG_TYPE_MAP.get(lang) == "Manhua" else "manga",
        "source": "mangadex",
        "source_url": f"https://mangadex.org/title/{mid}",
        "source_ids": {"mangadex": str(mid)},
        "is_adult": False,
        "available_translated_languages": attr.get("availableTranslatedLanguages") or [],
    }
    return doc


def fetch_mangadex(limit, search=None, included_tags=None, order="followedCount"):
    offset = 0
    got = 0
    while got < limit:
        batch = min(100, limit - got)
        params = [
            ("limit", str(batch)),
            ("offset", str(offset)),
            ("includes[]", "cover_art"),
            ("includes[]", "author"),
            ("includes[]", "artist"),
            ("contentRating[]", "safe"),
            ("hasAvailableChapters", "true"),
            ("availableTranslatedLanguage[]", "en"),
        ]
        if search:
            params.append(("title", search))
        if included_tags:
            for tag_id in included_tags:
                params.append(("includedTags[]", tag_id))
        if order == "latest":
            params.append(("order[latestUploadedChapter]", "desc"))
        elif order == "title":
            params.append(("order[title]", "asc"))
        else:
            params.append(("order[followedCount]", "desc"))
        url = MANGADEX_ENDPOINT + "/manga?" + urllib.parse.urlencode(params)
        data = json_request(url)
        items = data.get("data") or []
        if not items:
            break
        for item in items:
            doc = map_mangadex(item)
            if doc.get("title") and not is_adult_doc(doc):
                yield doc
                got += 1
                if got >= limit:
                    break
        total = data.get("total") or 0
        offset += batch
        if offset >= total:
            break
        time.sleep(0.8)


def fetch_curated(limit):
    for doc in CURATED_TITLES[:limit]:
        clean = dict(doc)
        clean["slug"] = slugify(clean["title"])
        clean["source_ids"] = {"curated": slugify(clean["title"])}
        clean["is_adult"] = False
        clean.setdefault("cover_url", "")
        clean.setdefault("banner_url", "")
        clean.setdefault("tags", [])
        clean.setdefault("country", "")
        clean.setdefault("volume_count", 0)
        clean.setdefault("favourites", 0)
        yield clean


def upsert_series(db, doc):
    now = dt.datetime.utcnow()
    doc["title"] = clean_text(doc.get("title"))
    doc["alt_title"] = clean_text(doc.get("alt_title"))
    doc["description"] = clean_text(doc.get("description"))
    doc["genres"] = [clean_text(g) for g in (doc.get("genres") or []) if clean_text(g)]
    doc["tags"] = [clean_text(g) for g in (doc.get("tags") or []) if clean_text(g)]
    doc["updated_at"] = now
    doc["imported_at"] = now

    if not doc.get("slug"):
        doc["slug"] = slugify(doc["title"])

    source = doc.get("source")
    sid = (doc.get("source_ids") or {}).get(source) if source else None

    query = None
    if source and sid:
        query = {f"source_ids.{source}": str(sid)}
    if not query:
        query = {"slug": doc["slug"]}

    # MongoDB cannot update the same field in both $set and $setOnInsert.
    # Keep created_at only for first insert, and never overwrite it on later imports.
    set_doc = dict(doc)
    set_doc.pop("created_at", None)
    update = {
        "$set": set_doc,
        "$setOnInsert": {"created_at": now},
    }
    result = db.series.update_one(query, update, upsert=True)
    saved = db.series.find_one(query)
    return saved, bool(result.upserted_id)


def upsert_placeholder_chapters(db, series_doc, count):
    if count <= 0:
        return 0

    chapter_count = int(series_doc.get("chapter_count") or 0)
    if chapter_count <= 0:
        chapter_count = count

    created = 0
    now = dt.datetime.utcnow()
    latest_numbers = list(range(max(1, chapter_count - count + 1), chapter_count + 1))
    labels = ["Just now", "2 hours ago", "8 hours ago", "1 day ago", "2 days ago", "1 week ago"]

    for num in latest_numbers:
        doc = {
            "series_id": series_doc["_id"],
            "series_title": series_doc.get("title", ""),
            "type": series_doc.get("type", ""),
            "number": int(num),
            "title": f"Chapter {num}",
            "pages": 0,
            "created_at": now - dt.timedelta(hours=random.randint(0, 120)),
            "updated_label": random.choice(labels),
            "is_placeholder": True,
            "source": series_doc.get("source", ""),
            "source_url": series_doc.get("source_url", ""),
        }
        # Same rule for chapters: created_at should only be written on first insert.
        set_doc = dict(doc)
        created_at = set_doc.pop("created_at")
        result = db.chapters.update_one(
            {"series_id": series_doc["_id"], "number": int(num)},
            {"$set": set_doc, "$setOnInsert": {"created_at": created_at}},
            upsert=True,
        )
        if result.upserted_id:
            created += 1
    return created


def import_source(args):
    db = get_db()
    init_db(seed_demo=False)

    started_at = dt.datetime.utcnow()
    run_doc = {
        "source": args.source,
        "limit": args.limit,
        "search": args.search,
        "genres": args.genres or [],
        "status": "running",
        "started_at": started_at,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "chapters_created": 0,
        "errors": [],
    }
    if not args.dry_run:
        run_id = db.import_runs.insert_one(run_doc).inserted_id
    else:
        run_id = None

    if args.reset and not args.dry_run:
        print("[RESET] Clearing series and chapters collections")
        db.series.delete_many({})
        db.chapters.delete_many({})

    sources = [args.source]
    if args.source == "all":
        sources = ["anilist", "mangadex"]

    total_created = total_updated = total_skipped = total_chapters = 0

    for source in sources:
        print(f"[IMPORT] Source: {source}")
        if source == "anilist":
            docs = fetch_anilist(args.limit, search=args.search, genres=args.genres, sort=args.anilist_sort)
        elif source == "mangadex":
            docs = fetch_mangadex(args.limit, search=args.search, order=args.mangadex_order)
        elif source == "curated":
            docs = fetch_curated(args.limit)
        else:
            raise SystemExit(f"Unknown source: {source}")

        for doc in docs:
            try:
                if is_adult_doc(doc):
                    total_skipped += 1
                    continue

                if args.dry_run:
                    print(f"[DRY] {doc['source']}: {doc['title']} ({doc['type']})")
                    continue

                saved, created = upsert_series(db, doc)
                if created:
                    total_created += 1
                    action = "created"
                else:
                    total_updated += 1
                    action = "updated"

                ch_count = upsert_placeholder_chapters(db, saved, args.placeholder_chapters)
                total_chapters += ch_count
                print(f"[OK] {action}: {saved.get('title')} | {saved.get('type')} | chapters+{ch_count}")
            except Exception as e:
                total_skipped += 1
                msg = f"{doc.get('title', 'unknown')}: {e}"
                print(f"[ERR] {msg}")
                if not args.dry_run:
                    db.import_runs.update_one({"_id": run_id}, {"$push": {"errors": msg}})

    if not args.dry_run:
        db.import_runs.update_one(
            {"_id": run_id},
            {"$set": {
                "status": "completed",
                "finished_at": dt.datetime.utcnow(),
                "created": total_created,
                "updated": total_updated,
                "skipped": total_skipped,
                "chapters_created": total_chapters,
            }}
        )

    print("\nImport completed")
    print(f"Created: {total_created}")
    print(f"Updated: {total_updated}")
    print(f"Skipped: {total_skipped}")
    print(f"Placeholder chapters created: {total_chapters}")


def parse_args():
    parser = argparse.ArgumentParser(description="Import clean manga/manhwa/manhua metadata into MongoDB")
    parser.add_argument("--mongo-uri", default="", help="MongoDB connection string. Prefer env MONGODB_URI for security.")
    parser.add_argument("--db-name", default="", help="Mongo database name. Prefer env MONGO_DB_NAME.")
    parser.add_argument("--source", choices=["anilist", "mangadex", "curated", "all"], default="all")
    parser.add_argument("--limit", type=int, default=60, help="Number of series to import per selected source")
    parser.add_argument("--search", default="", help="Search keyword/title")
    parser.add_argument("--genres", nargs="*", default=None, help="AniList genre filters, example: Action Fantasy")
    parser.add_argument("--anilist-sort", default="POPULARITY_DESC", help="AniList sort, example: POPULARITY_DESC, SCORE_DESC, TRENDING_DESC")
    parser.add_argument("--mangadex-order", default="followedCount", choices=["followedCount", "latest", "title"])
    parser.add_argument("--placeholder-chapters", type=int, default=3, help="Create latest chapter metadata placeholders per series. Use 0 to disable.")
    parser.add_argument("--reset", action="store_true", help="Clear series and chapters before importing")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print only, do not write MongoDB")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.mongo_uri:
        import os
        os.environ["MONGODB_URI"] = args.mongo_uri
    if args.db_name:
        import os
        os.environ["MONGO_DB_NAME"] = args.db_name
    import_source(args)
