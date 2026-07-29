from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any


def snake(value: str) -> str:
    value = re.sub(r"(?<!^)(?=[A-Z])", "_", value)
    value = re.sub(r"[^a-zA-Z0-9]+", "_", value)
    return value.strip("_").lower()


def kebab(value: str) -> str:
    return snake(value).replace("_", "-")


def plural(value: str) -> str:
    if value.endswith("y") and not value.endswith(("ay", "ey", "iy", "oy", "uy")):
        return value[:-1] + "ies"
    if value.endswith(("s", "x", "z", "ch", "sh")):
        return value + "es"
    return value + "s"


def stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)


def content_hash(value: Any) -> str:
    return hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_json(path: Path, content: Any) -> None:
    write_text(path, json.dumps(content, indent=2, ensure_ascii=False) + "\n")
