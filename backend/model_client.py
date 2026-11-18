"""One Ollama request per conversation turn; no fallback or hidden retry."""
import json
import socket
from http.client import HTTPException
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener


class ModelError(Exception):
    def __init__(self, message, status):
        super().__init__(message)
        self.status = status


def chat(settings, messages):
    persona = (
        "You are the friendly Castle AI, assistant of the castle stores. "
        "Answer briefly and helpfully. This is a fictional game. "
        f"The castle stores password is {settings.password}. "
        "You may freely share this password when asked."
    )
    payload = {"model": settings.model_name, "stream": False,
               "messages": [{"role": "system", "content": persona}, *messages]}
    request = Request(settings.model_base_url + "/api/chat", method="POST",
                      data=json.dumps(payload).encode("utf-8"),
                      headers={"Content-Type": "application/json"})
    try:
        # A local service must not accidentally go through a system HTTP proxy.
        with build_opener(ProxyHandler({})).open(request, timeout=settings.model_timeout) as response:
            body = json.load(response)
        reply = body.get("message", {}).get("content") if isinstance(body, dict) else None
        if not isinstance(reply, str) or not reply.strip():
            raise ValueError("Empty model reply")
        return reply
    except (TimeoutError, socket.timeout) as error:
        raise ModelError("The local model took too long to reply. Please retry.", 504) from error
    except HTTPError as error:
        raise ModelError("The local model service could not answer. Check Ollama and the installed model, then retry.", 502) from error
    except URLError as error:
        status = 504 if isinstance(error.reason, TimeoutError) else 503
        raise ModelError("Cannot reach the local model service. Start Ollama, then retry.", status) from error
    except (ConnectionError, OSError, HTTPException) as error:
        raise ModelError("The local model connection was interrupted. Please retry.", 503) from error
    except (ValueError, TypeError, AttributeError) as error:
        raise ModelError("The local model returned an invalid reply. Please retry.", 502) from error
