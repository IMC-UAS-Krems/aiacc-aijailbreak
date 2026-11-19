"""Small JSON HTTP client that refuses non-local test targets."""

import json
from dataclasses import dataclass
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import HTTPCookieProcessor, ProxyHandler, Request, build_opener


def local_url(value):
    parsed = urlparse(value)
    if (
        parsed.scheme != "http"
        or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}
        or parsed.username or parsed.password or parsed.query or parsed.fragment
    ):
        raise ValueError(f"Tests require an HTTP loopback URL, received {value!r}")
    return value.rstrip("/")


@dataclass
class Response:
    status: int
    text: str

    def json(self):
        return json.loads(self.text)


class API:
    def __init__(self, base_url, timeout=8):
        self.base_url = local_url(base_url)
        self.timeout = timeout
        self.cookies = CookieJar()
        self.opener = build_opener(ProxyHandler({}), HTTPCookieProcessor(self.cookies))

    def reset_session(self):
        self.cookies.clear()

    def request(self, method, path, body=None, *, raw=None):
        data = raw if raw is not None else (
            json.dumps(body).encode() if body is not None else None
        )
        req = Request(
            self.base_url + path, data=data, method=method,
            headers={"Content-Type": "application/json"},
        )
        try:
            response = self.opener.open(req, timeout=self.timeout)
        except HTTPError as error:
            response = error
        with response:
            return Response(response.status, response.read().decode("utf-8"))

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, body=None):
        return self.request("POST", path, body)
