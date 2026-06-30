#!/usr/bin/env python3
"""
Backward-compatible wrapper for importing AniList manga metadata.

Examples:
  python3 scripts/seed_anilist.py --limit 100
  python3 scripts/seed_anilist.py --search "solo leveling"
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.import_manga_sources import parse_args, import_source

if __name__ == "__main__":
    args = parse_args()
    args.source = "anilist"
    if args.mongo_uri:
        import os
        os.environ["MONGODB_URI"] = args.mongo_uri
    if args.db_name:
        import os
        os.environ["MONGO_DB_NAME"] = args.db_name
    import_source(args)
