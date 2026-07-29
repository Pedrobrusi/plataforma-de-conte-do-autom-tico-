import json
from pathlib import Path

from amdl.compiler import Compiler

EXAMPLE = Path(__file__).resolve().parents[3] / "specifications" / "averro" / "system.amdl.yaml"


def test_compile_generates_expected_artifacts(tmp_path: Path) -> None:
    output = tmp_path / "generated"
    result = Compiler().compile(EXAMPLE, output)
    assert result.success
    assert (output / "ama-manifest.json").exists()
    assert (output / "registry" / "meta-registry.json").exists()
    assert (output / "graph" / "meta-graph.mmd").exists()
    assert (output / "schema" / "supabase-migration.sql").exists()
    assert (output / "api" / "openapi.json").exists()
    assert (output / "contracts" / "domain.ts").exists()
    assert (output / "explorer" / "index.html").exists()
    assert (output / "agents" / "mika.json").exists()
    assert (output / "workflows" / "ai-carousel-production.json").exists()


def test_generated_sql_is_additive_and_workspace_scoped(tmp_path: Path) -> None:
    output = tmp_path / "generated"
    Compiler().compile(EXAMPLE, output)
    sql = (output / "schema" / "supabase-migration.sql").read_text(encoding="utf-8").lower()
    assert "create table if not exists public.offer_watches" in sql
    assert "enable row level security" in sql
    assert "is_workspace_member" in sql
    assert "drop table" not in sql
    assert "truncate " not in sql


def test_generated_openapi_contains_video_derived_resources(tmp_path: Path) -> None:
    output = tmp_path / "generated"
    Compiler().compile(EXAMPLE, output)
    spec = json.loads((output / "api" / "openapi.json").read_text(encoding="utf-8"))
    assert "/api/v1/offer-intelligence/watches" in spec["paths"]
    assert "/api/v1/offer-intelligence/crawls" in spec["paths"]
    assert "/api/v1/content/design-documents" in spec["paths"]


def test_fingerprint_is_deterministic(tmp_path: Path) -> None:
    first = Compiler().compile(EXAMPLE, tmp_path / "first")
    second = Compiler().compile(EXAMPLE, tmp_path / "second")
    assert first.fingerprint == second.fingerprint
