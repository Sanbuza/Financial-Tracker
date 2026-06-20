from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins="*", allow_headers=["Content-Type", "Access-Control-Request-Private-Network"])

@app.after_request
def add_headers(response):
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

SHEETS_URL = os.getenv("SHEETS_API_URL")


def sheets_get(filters={}):
    r = requests.get(SHEETS_URL, params=filters)
    r.raise_for_status()
    body = r.json()
    if body.get("status") != "ok":
        raise ValueError(body.get("message", "Error from Sheets API"))
    return body["data"]


def sheets_post(payload):
    r = requests.post(SHEETS_URL, json=payload)
    r.raise_for_status()
    body = r.json()
    if body.get("status") != "ok":
        raise ValueError(body.get("message", "Error from Sheets API"))
    return body


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    filters = {k: v for k, v in request.args.items()}
    data = sheets_get(filters)
    return jsonify(data)


@app.route("/api/transactions", methods=["POST"])
def create_transaction():
    body = request.get_json()
    needs_review = "Yes" if body.get("category") == "Others" else "No"
    payload = {
        "action": "create",
        "data": {
            "Date": body.get("date"),
            "Account": body.get("account", ""),
            "Owner": body.get("owner"),
            "Merchant": body.get("merchant"),
            "Amount (CAD)": body.get("amount"),
            "Raw Category": body.get("category"),
            "App Category": body.get("category"),
            "App Subcategory": body.get("subcategory", ""),
            "Needs Review": needs_review,
        }
    }
    result = sheets_post(payload)
    return jsonify({"success": True, "transaction_id": result.get("transaction_id")})


@app.route("/api/transactions/<transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    body = request.get_json()
    payload = {
        "action": "update",
        "transaction_id": transaction_id,
        "data": body
    }
    result = sheets_post(payload)
    return jsonify({"success": True, "message": result.get("message")})


@app.route("/api/transactions/<transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    payload = {
        "action": "delete",
        "transaction_id": transaction_id
    }
    result = sheets_post(payload)
    return jsonify({"success": True, "message": result.get("message")})


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
