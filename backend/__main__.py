"""Run with python -m backend; accepts the acceptance harness's --port."""
import argparse

from .app import create_app
from .config import Settings


def main():
    settings = Settings.from_env()
    parser = argparse.ArgumentParser(description="Robin Hoodie local game API")
    parser.add_argument("--host", default=settings.host)
    parser.add_argument("--port", type=int, default=settings.port)
    args = parser.parse_args()
    create_app(settings).run(host=args.host, port=args.port, debug=False, use_reloader=False, threaded=True)


if __name__ == "__main__":
    main()
