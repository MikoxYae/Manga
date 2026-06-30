# MikoReads UI v2

Premium clean manga, manhwa, manhua and webtoon website UI prototype.

## Run

```bash
python3 miko.py
```

Open:

```text
http://YOUR_SERVER_IP:8000
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

## Current scope

This is frontend/static UI only. No scraper, database, admin login, image hosting or backend APIs are connected yet.

## Next phase

- Python backend routes
- SQLite or MongoDB database
- Admin login
- Series and chapter CRUD
- Manga/manhwa source collector
- Adult-content filter
- SEO pages, sitemap and robots.txt
