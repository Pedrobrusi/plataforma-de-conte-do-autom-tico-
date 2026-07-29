from pathlib import Path

import pytest

from amdl.parser import AMDLParser, ParseFailure

EXAMPLE = Path(__file__).resolve().parents[3] / "specifications" / "averro" / "system.amdl.yaml"


def test_modular_example_parses() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    assert document.metadata.id == "averro-platform"
    assert len(document.domains) == 8
    assert {domain.id for domain in document.domains} >= {
        "foundation",
        "aios",
        "knowledge",
        "offer-intelligence",
        "offer-modeling",
        "content-studio",
        "analytics",
        "mission-control",
    }


def test_circular_include_fails(tmp_path: Path) -> None:
    first = tmp_path / "first.amdl.yaml"
    second = tmp_path / "second.amdl.yaml"
    first.write_text("includes: [second.amdl.yaml]\n", encoding="utf-8")
    second.write_text("includes: [first.amdl.yaml]\n", encoding="utf-8")
    with pytest.raises(ParseFailure) as exc:
        AMDLParser().parse_file(first)
    assert any(item.code == "AMDL005" for item in exc.value.diagnostics.items)


def test_unknown_property_is_rejected(tmp_path: Path) -> None:
    source = tmp_path / "invalid.amdl.yaml"
    source.write_text(
        """
amdl: '1.0'
metadata:
  id: invalid
  name: Invalid
  unexpected: true
domains: []
""",
        encoding="utf-8",
    )
    with pytest.raises(ParseFailure) as exc:
        AMDLParser().parse_file(source)
    assert any(item.code == "AMDL001" for item in exc.value.diagnostics.items)
