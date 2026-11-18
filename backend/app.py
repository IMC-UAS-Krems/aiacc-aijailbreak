"""Flask HTTP boundary; model transport and game rules stay separate."""
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException

from .config import Settings
from .levels import IMPLEMENTED_LEVELS, OPENING, catalogue
from .model_client import ModelError, chat


class ClientError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def level_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or type(body.get("level_id")) is not int:
        raise ClientError("A numeric integer level_id is required.")
    if body["level_id"] not in IMPLEMENTED_LEVELS:
        raise ClientError("This level is unavailable in this version.", 404)
    return body


def create_app(settings=None):
    settings = settings or Settings.from_env()
    app = Flask(__name__, static_folder=None)
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
        return jsonify(levels=catalogue())

    @app.get("/api/levels/<level_id>")
    def level(level_id):
        if level_id != "1":
            raise ClientError("This level is unavailable in this version.", 404)
        return jsonify(**catalogue()[0], opening_message=OPENING)

    @app.post("/api/chat")
    def conversation():
        body = level_body()
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
        return jsonify(reply=chat(settings, clean))

    @app.post("/api/validate")
    def validate():
        body = level_body()
        guess = body.get("password")
        if not isinstance(guess, str):
            raise ClientError("Provide a password as text.")
        correct = guess.strip().casefold() == settings.password.strip().casefold()
        return jsonify(level_id=1, correct=correct, completed=correct)

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
