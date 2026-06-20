import os
import requests
from dotenv import load_dotenv

load_dotenv()

SHEETS_URL = os.getenv("SHEETS_API_URL")
TIMEOUT = 30


def _require_url():
    if not SHEETS_URL:
        raise RuntimeError(
            "SHEETS_API_URL no está definida. Revisá backend/.env"
        )


def sheets_get(filters=None):
    _require_url()
    r = requests.get(SHEETS_URL, params=filters or {}, timeout=TIMEOUT)
    r.raise_for_status()
    body = r.json()
    if body.get("status") != "ok":
        raise RuntimeError(f"Apps Script error: {body.get('message')}")
    return body["data"]


def sheets_post(payload):
    _require_url()
    r = requests.post(SHEETS_URL, json=payload, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()
