import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
EXAMPLE = ROOT.parent.parent / "specifications" / "averro" / "system.amdl.yaml"


def run_cli(*args: str) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT / "src")
    return subprocess.run(
        [sys.executable, "-m", "amdl", *args],
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def test_validate_cli() -> None:
    result = run_cli("validate", str(EXAMPLE))
    assert result.returncode == 0, result.stderr
    assert "VALID" in result.stdout


def test_validate_json_cli() -> None:
    result = run_cli("validate", str(EXAMPLE), "--json")
    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert payload["valid"] is True
    assert payload["fingerprint"]


def test_impact_cli() -> None:
    result = run_cli("impact", str(EXAMPLE), "generate-ai-carousel")
    assert result.returncode == 0, result.stderr
    assert '"found": true' in result.stdout


def test_inspect_cli_filters_by_kind() -> None:
    result = run_cli("inspect", str(EXAMPLE), "--kind", "agent", "--json")
    assert result.returncode == 0, result.stderr
    agents = json.loads(result.stdout)
    assert {a["id"] for a in agents} >= {"mika", "lia", "iris"}


def test_diff_cli_reports_no_change_for_identical_source() -> None:
    result = run_cli("diff", str(EXAMPLE), str(EXAMPLE))
    assert result.returncode == 0, result.stderr
    assert "No differences" in result.stdout


def test_diff_cli_detects_changes(tmp_path: Path) -> None:
    base = (
        "amdl: '1.0'\nmetadata: {id: s, name: S}\ndomains:\n  - id: d\n    name: D\n    entities:\n"
    )
    a = tmp_path / "a.amdl.yaml"
    b = tmp_path / "b.amdl.yaml"
    a.write_text(base + "      - {id: thing, name: Thing}\n", encoding="utf-8")
    b.write_text(base + "      - {id: thing, name: Renamed}\n", encoding="utf-8")
    result = run_cli("diff", str(a), str(b), "--json")
    assert result.returncode == 1
    payload = json.loads(result.stdout)
    assert "entity:d.thing" in payload["changed"]


def test_doctor_cli_reports_health() -> None:
    result = run_cli("doctor", str(EXAMPLE), "--json")
    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert payload["ok"] is True
    names = {c["name"] for c in payload["checks"]}
    assert {"python", "pydantic", "compiler", "spec"} <= names
