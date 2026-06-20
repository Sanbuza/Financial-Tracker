import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sheets_client import sheets_get, sheets_post

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

REVIEW_CATEGORY = "Others"
ALLOWED_FILTERS = {"owner", "needs_review", "transaction_id", "category", "from_date", "to_date"}


def format_amount(raw) -> str:
    s = str(raw).strip()
    if "(" in s and ")" in s:
        s = "-" + s.replace("(", "").replace(")", "")
    cleaned = s.replace("$", "").replace(",", "").strip()
    try:
        value = float(cleaned)
    except ValueError:
        value = 0.0
    return f"(${abs(value):.2f})" if value < 0 else f"${value:.2f}"


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/transactions", methods=["GET"])
def list_transactions():
    filters = {k: v for k, v in request.args.items() if k in ALLOWED_FILTERS}
    return jsonify(sheets_get(filters))


@app.route("/api/transactions", methods=["POST"])
def create_transaction():
    data = request.get_json(silent=True) or {}
    category = data.get("category", "")
    needs_review = "Yes" if category == REVIEW_CATEGORY else "No"
    merchant = data.get("merchant") or data.get("description", "")

    sheet_row = {
        "Date": data.get("date", ""),
        "Account": data.get("account", ""),
        "Owner": data.get("owner", ""),
        "Merchant": merchant,
        "Amount (CAD)": format_amount(data.get("amount", 0)),
        "Raw Category": category,
        "App Category": category,
        "App Subcategory": data.get("subcategory", ""),
        "Needs Review": needs_review,
    }

    result = sheets_post({"action": "create", "data": sheet_row})
    if result.get("status") == "ok":
        return jsonify({"success": True, "transaction_id": result.get("transaction_id")})
    return jsonify({"success": False, "error": result.get("message")}), 502


@app.route("/api/transactions/<transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    data = request.get_json(silent=True) or {}
    result = sheets_post({"action": "update", "transaction_id": transaction_id, "data": data})
    if result.get("status") == "ok":
        return jsonify({"success": True, "message": result.get("message")})
    return jsonify({"success": False, "error": result.get("message")}), 502


@app.route("/api/transactions/<transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    result = sheets_post({"action": "delete", "transaction_id": transaction_id})
    if result.get("status") == "ok":
        return jsonify({"success": True, "message": result.get("message")})
    return jsonify({"success": False, "error": result.get("message")}), 502


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
