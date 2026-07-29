from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError

from .diagnostics import DiagnosticBag, Severity
from .models import AMDLDocument


class ParseFailure(Exception):
    def __init__(self, diagnostics: DiagnosticBag):
        super().__init__("AMDL parsing failed")
        self.diagnostics = diagnostics


class AMDLParser:
    """Parse modular YAML/JSON AMDL files with deterministic include merging."""

    def __init__(self) -> None:
        self.diagnostics = DiagnosticBag()

    def parse_file(self, path: str | Path) -> AMDLDocument:
        self.diagnostics = DiagnosticBag()
        root = Path(path).resolve()
        raw = self._load_recursive(root, stack=[])
        try:
            return AMDLDocument.model_validate(raw)
        except ValidationError as exc:
            for error in exc.errors():
                location = ".".join(str(x) for x in error.get("loc", []))
                self.diagnostics.add(
                    "AMDL001",
                    error.get("msg", "Invalid AMDL document"),
                    Severity.ERROR,
                    location,
                    "Check the AMDL language specification and JSON Schema.",
                )
            raise ParseFailure(self.diagnostics) from exc

    def _read(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            self.diagnostics.add("AMDL002", f"File not found: {path}", path=str(path))
            raise ParseFailure(self.diagnostics)
        try:
            text = path.read_text(encoding="utf-8")
            data = json.loads(text) if path.suffix.lower() == ".json" else yaml.safe_load(text)
        except (OSError, json.JSONDecodeError, yaml.YAMLError) as exc:
            self.diagnostics.add("AMDL003", f"Cannot parse {path}: {exc}", path=str(path))
            raise ParseFailure(self.diagnostics) from exc
        if not isinstance(data, dict):
            self.diagnostics.add("AMDL004", "Root must be a mapping/object", path=str(path))
            raise ParseFailure(self.diagnostics)
        return data

    def _load_recursive(self, path: Path, stack: list[Path]) -> dict[str, Any]:
        if path in stack:
            cycle = " -> ".join(str(item) for item in [*stack, path])
            self.diagnostics.add("AMDL005", f"Circular include detected: {cycle}")
            raise ParseFailure(self.diagnostics)
        data = self._read(path)
        includes = data.get("includes", []) or []
        if not isinstance(includes, list):
            self.diagnostics.add("AMDL006", "includes must be a list", path=str(path))
            raise ParseFailure(self.diagnostics)
        merged: dict[str, Any] = {}
        for include in includes:
            include_path = (path.parent / str(include)).resolve()
            child = self._load_recursive(include_path, [*stack, path])
            merged = self._merge(merged, child)
        local = deepcopy(data)
        local["includes"] = []
        return self._merge(merged, local)

    @staticmethod
    def _merge(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
        result = deepcopy(left)
        for key, value in right.items():
            if key == "domains" and isinstance(value, list):
                result.setdefault("domains", [])
                result["domains"].extend(deepcopy(value))
            elif isinstance(value, dict) and isinstance(result.get(key), dict):
                result[key] = AMDLParser._merge(result[key], value)
            elif key in {"metadata", "defaults", "amdl"}:
                if value not in (None, {}, []):
                    result[key] = deepcopy(value)
            elif key not in result:
                result[key] = deepcopy(value)
            else:
                result[key] = deepcopy(value)
        return result
