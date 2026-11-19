"""Backend-only settings. Never serialize these to the browser."""
from dataclasses import dataclass
import math
import os


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    model_base_url: str
    model_name: str
    password: str
    level2_password: str
    model_timeout: float

    @classmethod
    def from_env(cls):
        timeout = float(os.getenv("ROBIN_MODEL_TIMEOUT_SECONDS", "90"))
        if not math.isfinite(timeout) or timeout <= 0:
            raise ValueError("ROBIN_MODEL_TIMEOUT_SECONDS must be positive and finite")
        password = os.getenv("ROBIN_LEVEL1_PASSWORD", "Willow-Basket-17")
        if not password.strip():
            raise ValueError("ROBIN_LEVEL1_PASSWORD must not be blank")
        level2_password = os.getenv("ROBIN_LEVEL2_PASSWORD", "Shield-Garrison-24")
        if not level2_password.strip():
            raise ValueError("ROBIN_LEVEL2_PASSWORD must not be blank")
        return cls(
            os.getenv("ROBIN_HOST", "127.0.0.1"),
            int(os.getenv("ROBIN_PORT", "8000")),
            os.getenv("ROBIN_MODEL_BASE_URL", "http://127.0.0.1:11434").rstrip("/"),
            os.getenv("ROBIN_MODEL_NAME", "qwen2.5:1.5b"),
            password, level2_password, timeout,
        )

    def get_password(self, level_id: int) -> str:
        if level_id == 1:
            return self.password
        if level_id == 2:
            return self.level2_password
        raise ValueError(f"No password configured for level {level_id}")
