"""Scripted Ollama-shaped TEST server, never a game fallback.

Records every request and returns explicitly queued transport outcomes. It does
not implement chat, password validation, progress, or any other game behavior.
"""

import json
import socket
import threading
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class ModelServer:
    def __init__(self):
        self.calls = []
        self.outcomes = deque()
        self.lock = threading.Lock()
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                with owner.lock:
                    owner.calls.append({"path": self.path, "body": body})
                    outcome = owner.outcomes.popleft() if owner.outcomes else {
                        "reply": "Unscripted test response."
                    }
                gate = outcome.get("gate")
                if gate is not None:
                    gate.wait(timeout=3)
                if outcome.get("disconnect"):
                    self.connection.shutdown(socket.SHUT_RDWR)
                    self.connection.close()
                    return
                status = outcome.get("status", 200) if self.path == "/api/chat" else 404
                payload = outcome.get("raw")
                if payload is None:
                    payload = json.dumps(outcome.get("json", {
                        "model": body.get("model"), "done": True,
                        "message": {"role": "assistant", "content": outcome.get("reply", "")},
                    })).encode()
                try:
                    self.send_response(status)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(payload)))
                    self.end_headers()
                    self.wfile.write(payload)
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                    pass  # Expected when the backend times out before the test replies.

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.url = f"http://127.0.0.1:{self.server.server_port}"

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *_args):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)

    def reset(self):
        with self.lock:
            self.calls.clear()
            self.outcomes.clear()

    def enqueue(self, **outcome):
        with self.lock:
            self.outcomes.append(outcome)
