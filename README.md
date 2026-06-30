# MikoReads

Clean manga, manhwa, manhua and webtoon website with Flask backend and MongoDB metadata storage.

## Run

Install requirements:

```bash
pip3 install -r requirements.txt
```

Set MongoDB connection:

```bash
export MONGODB_URI='your_mongodb_connection_string'
export MONGO_DB_NAME='mikoreads'
```

Start:

```bash
python3 miko.py
```

Default port:

```text
5656
```

Open:

```text
http://YOUR_SERVER_IP:5656
```

Custom port:

```bash
PORT=4330 python3 miko.py
```

## Pages

- `/index.html` - Premium home page
- `/browse.html` - Browse library with search/filter UI
- `/latest.html` - Latest chapter update feed
- `/ranking.html` - Weekly ranking page
- `/detail.html` - Series detail page
- `/reader.html` - Chapter reader page with controls
- `/login.html` - Login mockup
- `/admin.html` - Admin dashboard and source mockup

## Backend API

- `GET /api/health`
- `GET /api/series/`
- `GET /api/series/trending`
- `GET /api/series/latest-updated`
- `GET /api/series/ranking`
- `GET /api/series/<id>`
- `POST /api/series/`
- `GET /api/chapters/latest`
- `GET /api/chapters/series/<series_id>`
- `POST /api/chapters/`
- `GET /api/search/?q=title`

## MongoDB import

The importer stores clean manga, manhwa, manhua and webtoon metadata in MongoDB.

It imports metadata only:
- title
- alternative title
- type
- status
- genres
- description
- author/artist when available
- rating/popularity when available
- cover URL when available
- source URL
- optional placeholder chapter metadata

It does not scrape or upload chapter images.

### Import from AniList and MangaDex

You can also pass Mongo URI directly, but environment variables or VPS/Replit secrets are cleaner:

```bash
python3 scripts/import_manga_sources.py --mongo-uri 'your_mongodb_connection_string' --db-name mikoreads --source all --limit 60 --placeholder-chapters 3
```

```bash
export MONGODB_URI='your_mongodb_connection_string'
export MONGO_DB_NAME='mikoreads'

python3 scripts/import_manga_sources.py --source all --limit 60 --placeholder-chapters 3
```

### Import only AniList

```bash
python3 scripts/import_manga_sources.py --source anilist --limit 100 --anilist-sort POPULARITY_DESC --placeholder-chapters 3
```

### Import only MangaDex safe metadata

```bash
python3 scripts/import_manga_sources.py --source mangadex --limit 100 --mangadex-order followedCount --placeholder-chapters 3
```

### Search import

```bash
python3 scripts/import_manga_sources.py --source anilist --search "solo leveling" --limit 10
python3 scripts/import_manga_sources.py --source mangadex --search "one piece" --limit 10
```

### Reset and reimport

```bash
python3 scripts/import_manga_sources.py --source all --limit 100 --reset --placeholder-chapters 3
```

### Dry run

```bash
python3 scripts/import_manga_sources.py --source all --limit 10 --dry-run
```

## Environment file

You can also create `.env` in repo root:

```text
MONGODB_URI=your_mongodb_connection_string
MONGO_DB_NAME=mikoreads
PORT=5656
```

The real MongoDB password should be stored only on VPS/Replit secrets or local `.env`, not committed into GitHub.
