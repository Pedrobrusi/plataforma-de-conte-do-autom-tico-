from pathlib import Path

from amdl.compiler import Compiler
from amdl.security import scan_secrets, scan_sql

EXAMPLE = Path(__file__).resolve().parents[3] / "specifications" / "averro" / "system.amdl.yaml"


def test_scan_sql_flags_destructive_statements() -> None:
    findings = scan_sql(
        "drop table users;\ntruncate orders;\nalter table x disable row level security;"
    )
    codes = {f.code for f in findings}
    assert {"SQL-DROP-TABLE", "SQL-TRUNCATE", "SQL-RLS-DISABLE"} <= codes
    assert all(f.requires_approval for f in findings)


def test_scan_sql_ignores_comments() -> None:
    assert (
        scan_sql("-- drop table users is not allowed\ncreate table if not exists x (id uuid);")
        == []
    )


def test_scan_secrets_detects_service_role() -> None:
    findings = scan_secrets('service_role = "super-secret-value"')
    assert any(f.code == "SECRET-SERVICE-ROLE" for f in findings)


def test_generated_sql_has_no_destructive_operations(tmp_path: Path) -> None:
    output = tmp_path / "generated"
    Compiler().compile(EXAMPLE, output)
    sql = (output / "schema" / "supabase-migration.sql").read_text(encoding="utf-8")
    assert scan_sql(sql) == []


def test_governance_report_is_clean(tmp_path: Path) -> None:
    import json

    output = tmp_path / "generated"
    Compiler().compile(EXAMPLE, output)
    report = json.loads((output / "governance" / "governance-report.json").read_text("utf-8"))
    assert report["overall_risk"] == "info"
    assert report["requires_human_approval"] is False
    assert report["migration_strategy"].startswith("additive")
