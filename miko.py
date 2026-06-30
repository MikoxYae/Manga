#!/usr/bin/env python3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import socket
import urllib.request

PORT = int(os.environ.get("PORT", "5656"))
ROOT = Path(__file__).resolve().parent / "public"

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

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    public_ip = get_public_ip()
    local_ip = get_local_ip()

    print("MikoReads UI v2 running")
    print(f"Local URL:  http://127.0.0.1:{PORT}")
    print(f"VPS URL:    http://{public_ip}:{PORT}")
    print(f"Server IP:  {local_ip}")
    print("Press CTRL+C to stop")

    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    server.serve_forever()
