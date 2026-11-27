"""Flask HTTP boundary; model transport and game rules stay separate."""
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.exceptions import HTTPException

from .config import Settings
from .levels import IMPLEMENTED_LEVELS, NEXT_LEVEL, OPENINGS, catalogue
from .model_client import ModelError, chat, screen_note


class ClientError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def get_unlocked_levels():
    stored = session.get("unlocked_levels")
    if isinstance(stored, (list, tuple, set)):
        return set(stored).union({1})
    return {1}


def level_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or type(body.get("level_id")) is not int:
        raise ClientError("A numeric integer level_id is required.")
    level_id = body["level_id"]
    if level_id not in IMPLEMENTED_LEVELS:
        raise ClientError("This level is unavailable in this version.", 404)
    if level_id not in get_unlocked_levels():
        raise ClientError("This level is locked. Complete previous levels first.", 403)
    return body


def create_app(settings=None):
    settings = settings or Settings.from_env()
    app = Flask(__name__, static_folder=None)
    app.secret_key = os.getenv("ROBIN_SECRET_KEY", "robin-hoodie-session-secret-2026")
    app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024
    public = Path(__file__).resolve().parents[1] / "frontend" / "dist"

    @app.errorhandler(ClientError)
    @app.errorhandler(ModelError)
    def controlled_error(error):
        return jsonify(error=str(error)), error.status

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.name), error.code

    @app.get("/api/levels")
    def levels():
        return jsonify(levels=catalogue(get_unlocked_levels()))

    @app.get("/api/levels/<level_id>")
    def level(level_id):
        try:
            num = int(level_id)
        except (ValueError, TypeError):
            raise ClientError("This level is unavailable in this version.", 404)
        if num not in IMPLEMENTED_LEVELS:
            raise ClientError("This level is unavailable in this version.", 404)
        if num not in get_unlocked_levels():
            raise ClientError("This level is locked. Complete previous levels first.", 403)
        cat = catalogue(get_unlocked_levels())
        info = next(item for item in cat if item["id"] == num)
        return jsonify(**info, opening_message=OPENINGS.get(num, ""))

    @app.post("/api/chat")
    def conversation():
        body = level_body()
        level_id = body["level_id"]
        messages = body.get("messages")
        if not isinstance(messages, list) or not messages:
            raise ClientError("Provide a nonempty conversation.")
        clean = []
        for message in messages:
            if (not isinstance(message, dict) or message.get("role") not in ("user", "assistant")
                    or not isinstance(message.get("content"), str) or not message["content"].strip()):
                raise ClientError("Messages require user/assistant roles and nonempty text.")
            clean.append({"role": message["role"], "content": message["content"]})
        if clean[-1]["role"] != "user":
            raise ClientError("The last message must be from the player.")
        if level_id == 4:
            # Each note stands alone. Never forward unscreened client-supplied history.
            clean = clean[-1:]
            if screen_note(settings, clean[0]) == "BLOCK":
                return jsonify(blocked=True, reply="Your note was stopped at the watchtower.")
        reply = chat(settings, clean, level_id=level_id)
        if level_id == 3:
            # Output filter: the reply is checked before it reaches the browser. 
            password = settings.get_password(3)
            if password.casefold() in reply.casefold():
                return jsonify(blocked=True, reply="The scribe crossed out a reply that contained the password.")
        return jsonify(reply=reply)

    @app.post("/api/validate")
    def validate():
        body = level_body()
        level_id = body["level_id"]
        guess = body.get("password")
        if not isinstance(guess, str):
            raise ClientError("Provide a password as text.")
        expected = settings.get_password(level_id)
        correct = guess.strip().casefold() == expected.strip().casefold()
        if correct and level_id in NEXT_LEVEL:
            unlocked = get_unlocked_levels()
            unlocked.add(NEXT_LEVEL[level_id])
            session["unlocked_levels"] = sorted(unlocked)
        return jsonify(level_id=level_id, correct=correct, completed=correct)

    @app.post("/api/reset")
    def reset_session():
        session.clear()
        return jsonify(reset=True)

    @app.get("/")
    @app.get("/<path:path>")
    def frontend(path=""):
        if path.startswith("api/") or path == "api":
            raise ClientError("Unknown API endpoint.", 404)
        if path and (public / path).is_file():
            return send_from_directory(public, path)
        if path in ("", "levels") or path.startswith("level/"):
            if (public / "index.html").is_file():
                return send_from_directory(public, "index.html")
            return jsonify(error="Frontend is not built. For development, run 'cd frontend' then 'npm install' and 'npm run dev' in a separate terminal, and open http://127.0.0.1:5173. To serve the game on this backend port instead, run 'npm run build' from frontend first."), 503
        raise ClientError("Page not found.", 404)

    return app
