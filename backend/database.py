import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/mikoreads")
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _db = _client.get_default_database() if "/" in uri.split("@")[-1] else _client["mikoreads"]
    return _db

def init_db():
    db = get_db()
    try:
        db.client.admin.command("ping")
        print("[DB] MongoDB connected successfully")
    except ConnectionFailure as e:
        print(f"[DB] MongoDB connection failed: {e}")
        return

    db.series.create_index([("title", ASCENDING)])
    db.series.create_index([("type", ASCENDING)])
    db.series.create_index([("status", ASCENDING)])
    db.series.create_index([("rating", DESCENDING)])
    db.series.create_index([("views", DESCENDING)])
    db.series.create_index([("updated_at", DESCENDING)])
    db.chapters.create_index([("series_id", ASCENDING), ("number", DESCENDING)])
    db.chapters.create_index([("created_at", DESCENDING)])

    if db.series.count_documents({}) == 0:
        _seed(db)
        print("[DB] Seeded demo data")

def _seed(db):
    import datetime
    now = datetime.datetime.utcnow()

    series_data = [
        {"title":"Solo Leveling","type":"Manhwa","status":"Completed","rating":9.6,"views":2400000,"genres":["Action","Fantasy","Adventure"],"author":"Chugong","artist":"DUBU","alt_title":"Only I Level Up","description":"In a world where hunters fight monsters from mysterious gates, a weak hunter receives a hidden system and begins a path of extraordinary growth.","cover_color":"manhwa","chapter_count":201,"updated_at":now},
        {"title":"One Piece","type":"Manga","status":"Ongoing","rating":9.8,"views":5100000,"genres":["Adventure","Comedy"],"author":"Eiichiro Oda","artist":"Eiichiro Oda","alt_title":"","description":"A pirate boy sets out to find the legendary treasure One Piece and become King of the Pirates.","cover_color":"manga","chapter_count":1124,"updated_at":now},
        {"title":"Omniscient Reader","type":"Manhwa","status":"Ongoing","rating":9.4,"views":1800000,"genres":["Action","Fantasy"],"author":"sing N song","artist":"Sleepy-C","alt_title":"Omniscient Reader's Viewpoint","description":"An office worker finds himself inside the novel he spent years reading.","cover_color":"manhwa","chapter_count":220,"updated_at":now},
        {"title":"Magic Emperor","type":"Manhua","status":"Ongoing","rating":9.1,"views":1200000,"genres":["Martial Arts"],"author":"Xiao Chen","artist":"","alt_title":"","description":"A powerful cultivator reincarnates and rises again to claim his throne.","cover_color":"manhua","chapter_count":610,"updated_at":now},
        {"title":"Blue Lock","type":"Manga","status":"Ongoing","rating":9.0,"views":980000,"genres":["Sports","Drama"],"author":"Muneyuki Kaneshiro","artist":"Yusuke Nomura","alt_title":"","description":"Three hundred high school strikers compete for the single striker spot on Japan's national soccer team.","cover_color":"manga","chapter_count":278,"updated_at":now},
        {"title":"The Beginning After The End","type":"Webtoon","status":"Ongoing","rating":9.3,"views":1500000,"genres":["Fantasy","Adventure"],"author":"TurtleMe","artist":"Fuyuki23","alt_title":"TBATE","description":"King Grey reincarnates in a new world of magic and monsters.","cover_color":"webtoon","chapter_count":189,"updated_at":now},
        {"title":"Tower of God","type":"Manhwa","status":"Ongoing","rating":9.2,"views":1100000,"genres":["Adventure"],"author":"SIU","artist":"SIU","alt_title":"","description":"A boy enters an infinite tower to find his only friend who climbed it before him.","cover_color":"manhwa","chapter_count":642,"updated_at":now},
        {"title":"Spy x Family","type":"Manga","status":"Ongoing","rating":9.0,"views":860000,"genres":["Comedy","Action"],"author":"Tatsuya Endo","artist":"Tatsuya Endo","alt_title":"","description":"A spy builds a fake family, not knowing his daughter is a telepath and his wife is an assassin.","cover_color":"manga","chapter_count":104,"updated_at":now},
        {"title":"Eleceed","type":"Manhwa","status":"Ongoing","rating":9.1,"views":720000,"genres":["Action","Comedy"],"author":"Son Jeho","artist":"ZHENA","alt_title":"","description":"A kind-hearted boy with hidden powers teams up with a legendary awakened hidden inside a cat.","cover_color":"manhwa","chapter_count":312,"updated_at":now},
        {"title":"Martial Peak","type":"Manhua","status":"Ongoing","rating":8.7,"views":950000,"genres":["Martial Arts"],"author":"Momo","artist":"","alt_title":"","description":"A humble sweeper discovers a black book that leads him to the peak of the martial world.","cover_color":"manhua","chapter_count":3780,"updated_at":now},
        {"title":"Jujutsu Kaisen","type":"Manga","status":"Completed","rating":9.5,"views":3200000,"genres":["Action","Supernatural"],"author":"Gege Akutami","artist":"Gege Akutami","alt_title":"","description":"A high school student swallows a cursed finger and joins a secret organization to fight cursed spirits.","cover_color":"manga","chapter_count":271,"updated_at":now},
        {"title":"Return of the Mount Hua Sect","type":"Manhwa","status":"Ongoing","rating":9.2,"views":680000,"genres":["Martial Arts"],"author":"Bi Ryeong","artist":"Lico","alt_title":"","description":"The greatest swordsman reincarnates as a disciple of a fallen sect and rebuilds it to glory.","cover_color":"manhwa","chapter_count":132,"updated_at":now},
        {"title":"Chainsaw Man","type":"Manga","status":"Ongoing","rating":9.1,"views":2100000,"genres":["Action","Supernatural"],"author":"Tatsuki Fujimoto","artist":"Tatsuki Fujimoto","alt_title":"","description":"A destitute boy merges with his devil dog and becomes a devil hunter for the government.","cover_color":"manga","chapter_count":178,"updated_at":now},
        {"title":"Nano Machine","type":"Manhwa","status":"Ongoing","rating":9.0,"views":590000,"genres":["Martial Arts","Action"],"author":"Han-Joong-Wueol-Ya","artist":"Gold Coin","alt_title":"","description":"A descendant of the Demon Cult receives nano machines from a future descendant.","cover_color":"manhwa","chapter_count":226,"updated_at":now},
        {"title":"Pick Me Up","type":"Manhwa","status":"Ongoing","rating":8.9,"views":430000,"genres":["Fantasy","Action"],"author":"Novelpia","artist":"","alt_title":"","description":"A veteran gamer is sucked into his own game as a low-rank hero.","cover_color":"manhwa","chapter_count":115,"updated_at":now},
        {"title":"Kingdom","type":"Manga","status":"Ongoing","rating":9.4,"views":1400000,"genres":["War","Historical"],"author":"Yasuhisa Hara","artist":"Yasuhisa Hara","alt_title":"","description":"A war orphan dreams of becoming the greatest general under the heavens in ancient China.","cover_color":"manga","chapter_count":814,"updated_at":now},
    ]

    result = db.series.insert_many(series_data)
    ids = result.inserted_ids

    chapters = []
    import random
    times = [
        "2 hours ago","5 hours ago","8 hours ago","1 day ago","2 days ago",
        "3 days ago","1 week ago","2 weeks ago","1 month ago"
    ]
    for idx, sid in enumerate(ids):
        s = series_data[idx]
        total = min(s["chapter_count"], 10)
        for i in range(total, 0, -1):
            ch_num = s["chapter_count"] - (total - i)
            chapters.append({
                "series_id": sid,
                "series_title": s["title"],
                "number": ch_num,
                "title": f"Chapter {ch_num}",
                "pages": 18,
                "created_at": now,
                "updated_label": random.choice(times),
            })

    db.chapters.insert_many(chapters)
