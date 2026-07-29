#!/usr/bin/env python
"""Regenerate ``schemas/amdl.schema.json`` from the pydantic model.

Run with: ``python scripts/gen_schema.py``. Output is deterministic
(``sort_keys=True``) so it can be diffed in CI to detect drift between the
model and the published schema.
"""

from __future__ import annotations

import json
from pathlib import Path

from amdl.models import AMDLDocument

OUTPUT = Path(__file__).resolve().parents[1] / "schemas" / "amdl.schema.json"


def main() -> None:
    schema = AMDLDocument.model_json_schema()
    OUTPUT.write_text(
        json.dumps(schema, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
