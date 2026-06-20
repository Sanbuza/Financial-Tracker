import requests
import os
from dotenv import load_dotenv

load_dotenv()

SHEETS_URL = os.getenv("SHEETS_API_URL")

def test():
    print(f"Conectando a Apps Script...")
    r = requests.get(SHEETS_URL)
    r.raise_for_status()
    body = r.json()
    if body.get("status") == "ok":
        print(f"Connection OK — {body.get('count', 0)} transacciones encontradas")
    else:
        print(f"Error: {body.get('message')}")

if __name__ == "__main__":
    test()
