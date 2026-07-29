import json
from pathlib import Path

from amdl.compiler import Compiler

EXAMPLE = Path(__file__).resolve().parents[3] / "specifications" / "averro" / "system.amdl.yaml"

# Fields that are explicitly documented as volatile and excluded from the
# determinism guarantee.
VOLATILE = {"ama-manifest.json": {"generated_at"}}


def _read(path: Path) -> bytes:
    return path.read_bytes()


def test_compilation_is_deterministic_except_volatile_metadata(tmp_path: Path) -> None:
    first = tmp_path / "first"
    second = tmp_path / "second"
    Compiler().compile(EXAMPLE, first)
    Compiler().compile(EXAMPLE, second)

    files_a = {p.relative_to(first).as_posix() for p in first.rglob("*") if p.is_file()}
    files_b = {p.relative_to(second).as_posix() for p in second.rglob("*") if p.is_file()}
    assert files_a == files_b

    for rel in sorted(files_a):
        a = first / rel
        b = second / rel
        volatile = VOLATILE.get(Path(rel).name)
        if volatile:
            da = json.loads(a.read_text("utf-8"))
            db = json.loads(b.read_text("utf-8"))
            for key in volatile:
                da.pop(key, None)
                db.pop(key, None)
            assert da == db, rel
        else:
            assert _read(a) == _read(b), rel


def test_source_date_epoch_makes_output_byte_identical(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("SOURCE_DATE_EPOCH", "1700000000")
    first = tmp_path / "a"
    second = tmp_path / "b"
    Compiler().compile(EXAMPLE, first)
    Compiler().compile(EXAMPLE, second)
    for rel in {p.relative_to(first).as_posix() for p in first.rglob("*") if p.is_file()}:
        assert _read(first / rel) == _read(second / rel), rel


def test_manifest_source_is_relative(tmp_path: Path) -> None:
    output = tmp_path / "generated"
    Compiler().compile(EXAMPLE, output)
    manifest = json.loads((output / "ama-manifest.json").read_text("utf-8"))
    assert not Path(manifest["source"]).is_absolute()
