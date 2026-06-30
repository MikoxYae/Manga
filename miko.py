#!/usr/bin/env python3
import os
import socket
import urllib.request
from pathlib import Path
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from backend.routes.series import series_bp
from backend.routes.chapters import chapters_bp
from backend.routes.search import search_bp
from backend.database import init_db

PORT = int(os.environ.get("PORT", "5656"))
ROOT = Path(__file__).resolve().parent / "public"

app = Flask(__name__, static_folder=str(ROOT))
CORS(app)

app.register_blueprint(series_bp,   url_prefix="/api/series")
app.register_blueprint(chapters_bp, url_prefix="/api/chapters")
app.register_blueprint(search_bp,   url_prefix="/api/search")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "version": "2.0"})

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def static_files(path):
    file_path = ROOT / path
    if file_path.is_file():
        return send_from_directory(str(ROOT), path)
    return send_from_directory(str(ROOT), "index.html")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_public_ip():
    try:
        return urllib.request.urlopen("https://api.ipify.org", timeout=3).read().decode().strip()
    except Exception:
        return get_local_ip()

if __name__ == "__main__":
    init_db()
    public_ip = get_public_ip()
    local_ip = get_local_ip()
    print("MikoReads v3 - Flask + MongoDB")
    print(f"Local URL:  http://127.0.0.1:{PORT}")
    print(f"VPS URL:    http://{public_ip}:{PORT}")
    print(f"Server IP:  {local_ip}")
    print("Press CTRL+C to stop")
    app.run(host="0.0.0.0", port=PORT, debug=False)
