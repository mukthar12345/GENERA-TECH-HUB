"""Public hardware assistant API."""

from flask import Blueprint, jsonify, request

from middleware.rate_limit import public_rate_limit
from services.hardware_ai import answer_hardware_question
from services.supabe_service import get_supabase

ai_bp = Blueprint("ai", __name__)
supabase = get_supabase()


@ai_bp.route("/hardware", methods=["POST"])
@public_rate_limit
def hardware_assistant():
    """Answer hardware questions and optionally use matching catalogue items."""
    payload = request.get_json(silent=True) or {}
    message = payload.get("message")
    if not isinstance(message, str) or not message.strip():
        return jsonify({"success": False, "error": "A non-empty message is required"}), 400
    if len(message) > 2000:
        return jsonify({"success": False, "error": "Message must be 2,000 characters or fewer"}), 400

    products: list[dict] = []
    if any(word in message.lower() for word in ("buy", "best", "price", "recommend", "stock", "available", "compare")):
        result = supabase.get_products({"is_available": True, "search": message[:80]})
        if result.get("success"):
            products = result.get("data", [])

    result = answer_hardware_question(message, products)
    return jsonify({"success": True, **result}), 200