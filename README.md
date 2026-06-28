# NovAI Chatbot 🤖

A functional AI chatbot built with Flask (backend) and HTML/JS (frontend) featuring 15+ intents, multi-turn conversation support, and a clean dark UI.

---

## 📁 Project Structure

```
chatbot/
├── app.py           → Flask backend (intent matching + API routes)
├── intents.json     → All 15 intents with patterns and responses
├── index.html       → Chat frontend (HTML + CSS + JS)
├── requirements.txt → Python dependencies
└── README.md        → This file
```

---

## 🚀 How to Run

### Step 1 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 2 — Start the Flask backend
```bash
python app.py
```
Backend runs on: `http://localhost:5000`

### Step 3 — Open the frontend
Just open `index.html` in your browser (double-click or drag into Chrome).

---

## 💬 Supported Intents (15 Total)

| Intent | Example Triggers |
|---|---|
| greeting | hello, hi, hey, good morning |
| farewell | bye, goodbye, see you later |
| thanks | thanks, thank you, appreciate it |
| identity | who are you, are you a bot |
| help | what can you do, help, features |
| joke | tell me a joke, make me laugh |
| motivation | motivate me, i feel low, cheer me up |
| weather | what's the weather, is it raining |
| time | what time is it, current time |
| math | 5 + 3, calculate, what is 10 * 4 |
| fun_fact | fun fact, did you know, random fact |
| compliment | you're great, good bot, amazing |
| insult | you suck, worst bot, dumb |
| age | how old are you, what's your age |
| creator | who made you, who built you |
| fallback | (any unrecognized input) |

---

## 🔌 API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/chat` | Send a message, get a response |
| GET | `/history` | Get full conversation history |
| POST | `/clear` | Clear conversation history |
| GET | `/intents` | List all available intents |
| GET | `/` | Health check |

### Example Request:
```json
POST /chat
{ "message": "Tell me a joke" }
```

### Example Response:
```json
{
  "response": "Why don't scientists trust atoms? Because they make up everything! 😄",
  "intent": "joke",
  "timestamp": "11:23 AM"
}
```

---

## ✨ Features

- ✅ 15 distinct intents
- ✅ Natural language pattern matching
- ✅ Dynamic responses (time, math)
- ✅ Multi-turn conversation with history logging
- ✅ Fallback handler for unknown inputs
- ✅ Clean dark UI with typing indicator
- ✅ Quick-reply chips
- ✅ REST API backend

---

## 🛠️ Tech Stack

- **Backend:** Python 3.x, Flask, Flask-CORS
- **Frontend:** HTML5, CSS3, Vanilla JS
- **Data:** JSON-based intent dataset
- **Approach:** Rule-based NLP (keyword + pattern matching)

---

Built as part of **WeIntern Pvt Ltd — Week 2 AI Internship Assignment**
