"""Launch the future backend as a real process, without choosing its framework."""

import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
from contextlib import contextmanager
from urllib.error import URLError

from tests.support.contract import LEVEL2_PASSWORD, LEVEL4_PASSWORD, MODEL_NAME, PASSWORD
from tests.support.http import API

ROOT = Path(__file__).resolve().parents[2]


@contextmanager
def running_backend(model_url, *, password=PASSWORD, level2_password=LEVEL2_PASSWORD, model_name=MODEL_NAME):
    raw = os.environ.get("ROBIN_TEST_BACKEND_COMMAND")
    if not raw:
        raise AssertionError(
            "Backend is not implemented/configured yet. Set ROBIN_TEST_BACKEND_COMMAND "
            "to a JSON argument array for the real backend. See tests/README.md. "
            "Do not add a mock game backend to make these tests pass."
        )
    command = json.loads(raw)
    if not isinstance(command, list) or not command or not all(
        isinstance(item, str) for item in command
    ):
        raise ValueError("ROBIN_TEST_BACKEND_COMMAND must be a nonempty JSON string array")
    with socket.socket() as port_socket:
        port_socket.bind(("127.0.0.1", 0))
        port = port_socket.getsockname()[1]
    command = [item.replace("{port}", str(port)) for item in command]
    env = {
        **os.environ,
        "ROBIN_HOST": "127.0.0.1", "ROBIN_PORT": str(port),
        "ROBIN_MODEL_BASE_URL": model_url, "ROBIN_MODEL_NAME": model_name,
        "ROBIN_LEVEL1_PASSWORD": password, "ROBIN_LEVEL2_PASSWORD": level2_password,
        "ROBIN_LEVEL4_PASSWORD": LEVEL4_PASSWORD,
        "ROBIN_MODEL_TIMEOUT_SECONDS": "0.3",
        "PYTHONUNBUFFERED": "1",
    }
    with tempfile.TemporaryFile(mode="w+b") as log:
        process = subprocess.Popen(
            command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        api = API(f"http://127.0.0.1:{port}")
        try:
            deadline = time.monotonic() + 15
            ready = False
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    break
                try:
                    # Any HTTP response proves that the server is accepting requests;
                    # the actual tests still verify /api/levels, including its status.
                    api.get("/api/levels")
                    ready = True
                    break
                except (URLError, TimeoutError, ConnectionError):
                    time.sleep(0.05)
            if not ready:
                log.seek(0)
                raise AssertionError("Backend did not start:\n" + log.read().decode(errors="replace"))
            yield api
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
