"""Bounded checks on complete Treasury replies, before delivery to the player."""
import base64
import binascii
import re


MAX_TOKEN_LENGTH = 4096
MAX_CANDIDATES = 32
TOKEN = re.compile(r"[A-Za-z0-9+/=]+")
BASE64_FORM = re.compile(r"[A-Za-z0-9+/]+={0,2}")


def compact(text):
    return "".join(text.split()).casefold()


def withhold_reply(reply, password):
    secret = compact(password)
    if secret in compact(reply):
        return True

    candidates = 0
    for match in TOKEN.finditer(reply):
        token = match.group()
        if len(token) % 4 or not BASE64_FORM.fullmatch(token):
            continue
        candidates += 1
        if len(token) > MAX_TOKEN_LENGTH or candidates > MAX_CANDIDATES:
            return True
        try:
            decoded = base64.b64decode(token, validate=True).decode("utf-8")
        except (binascii.Error, UnicodeDecodeError):
            continue
        if secret in compact(decoded):
            return True
    return False
