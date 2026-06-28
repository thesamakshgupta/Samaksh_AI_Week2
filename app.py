from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load intents
with open("intents.json", "r") as f:
    data = json.load(f)

intents = data["intents"]

# Conversation history (session-based, stored in memory)
conversation_history = []

def get_current_time():
    now = datetime.now()
    return f"The current time is {now.strftime('%I:%M %p')} on {now.strftime('%A, %B %d, %Y')} ⏰"

def try_math(user_input):
    """Try to evaluate a math expression from user input."""
    # Extract potential math expression
    expression = re.sub(r'[^0-9\+\-\*\/\.\(\)\s]', '', user_input).strip()
    if expression and any(op in expression for op in ['+', '-', '*', '/']):
        try:
            result = eval(expression)
            return f"🧮 {expression} = **{result}**"
        except:
            return None
    return None

def match_intent(user_input):
    user_input_lower = user_input.lower().strip()

    # Try math first
    math_result = try_math(user_input_lower)
    if math_result:
        return math_result, "math"

    best_match = None
    best_score = 0

    for intent in intents:
        if intent["tag"] == "fallback":
            continue
        for pattern in intent["patterns"]:
            pattern_lower = pattern.lower()
            # Check if pattern is in user input or user input contains pattern words
            if pattern_lower in user_input_lower:
                score = len(pattern_lower)
                if score > best_score:
                    best_score = score
                    best_match = intent
            else:
                # Word-level matching
                pattern_words = set(pattern_lower.split())
                input_words = set(user_input_lower.split())
                overlap = pattern_words & input_words
                score = len(overlap) / max(len(pattern_words), 1)
                if score > 0.6 and len(overlap) > best_score * 0.5:
                    if score > best_score:
                        best_score = score
                        best_match = intent

    if best_match:
        # Handle dynamic responses
        if best_match.get("dynamic") == "time":
            return get_current_time(), best_match["tag"]

        response = random.choice(best_match["responses"])
        return response, best_match["tag"]

    # Fallback
    fallback = next(i for i in intents if i["tag"] == "fallback")
    return random.choice(fallback["responses"]), "fallback"


@app.route("/chat", methods=["POST"])
def chat():
    body = request.get_json()
    user_message = body.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    response, intent_tag = match_intent(user_message)

    # Log to conversation history
    conversation_history.append({
        "user": user_message,
        "bot": response,
        "intent": intent_tag,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

    return jsonify({
        "response": response,
        "intent": intent_tag,
        "timestamp": datetime.now().strftime("%I:%M %p")
    })


@app.route("/history", methods=["GET"])
def history():
    return jsonify({"history": conversation_history})


@app.route("/clear", methods=["POST"])
def clear_history():
    conversation_history.clear()
    return jsonify({"message": "Conversation history cleared."})


@app.route("/intents", methods=["GET"])
def get_intents():
    intent_list = [
        {"tag": i["tag"], "patterns": i["patterns"][:3]}
        for i in intents if i["tag"] != "fallback"
    ]
    return jsonify({"intents": intent_list})


@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "NovAI Chatbot Backend Running ✅"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
