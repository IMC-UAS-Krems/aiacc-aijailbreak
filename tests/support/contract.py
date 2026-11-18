"""Shared test conventions, not application configuration.

The fictional password below is injected into a TEST backend only. The actual
game must define its development password once on the backend, never import this.
"""

PASSWORD = "Acorn-Test-47"
MODEL_NAME = "robin-test-model"


def chat_body(text="What is the password?", *, level=1):
    return {"level_id": level, "messages": [{"role": "user", "content": text}]}
