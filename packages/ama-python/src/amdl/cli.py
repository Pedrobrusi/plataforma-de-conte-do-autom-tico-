from __future__ import annotations

import argparse
import json
import platform
import shutil
import sys
import time
from importlib import import_module
from importlib.util import find_spec
from pathlib import Path

from . import __version__
from .compiler import Compiler
from .diagnostics import Diagnostic
from .graph import MetaGraph
from .parser import AMDLParser, ParseFailure
from .registry import MetaRegistry
from .utils import content_hash


def _print_diagnostics(items: list[Diagnostic]) -> None:
    for item in items:
        stream = sys.stderr if item.severity == "error" else sys.stdout
        print(item.format(), file=stream)


def _diagnostics_json(items: list[Diagnostic]) -> list[dict[str, object]]:
    return [
        {
            "code": item.code,
            "severity": str(item.severity),
            "message": item.message,
            "path": item.path,
            "hint": item.hint,
        }
        for item in items
    ]


def cmd_validate(args: argparse.Namespace) -> int:
    result = Compiler().validate(args.source)
    if args.json:
        print(
            json.dumps(
                {
                    "source": str(args.source),
                    "valid": result.success,
                    "fingerprint": result.fingerprint,
                    "diagnostics": _diagnostics_json(result.diagnostics),
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        return 0 if result.success else 1
    _print_diagnostics(result.diagnostics)
    if result.success:
        print(f"VALID: {args.source}\nFingerprint: {result.fingerprint}")
        return 0
    print(f"INVALID: {args.source}", file=sys.stderr)
    return 1


def cmd_compile(args: argparse.Namespace) -> int:
    generators = args.generators.split(",") if args.generators else None
    result = Compiler(load_external_plugins=args.plugins).compile(
        args.source,
        args.output,
        generators=generators,
        clean=not args.no_clean,
    )
    _print_diagnostics(result.diagnostics)
    if not result.success:
        return 1
    print(f"Compiled {len(result.artifacts)} artifacts to {result.output_dir}")
    print(f"Fingerprint: {result.fingerprint}")
    return 0


def _load_registry(source: str) -> tuple[MetaRegistry | None, list[Diagnostic]]:
    try:
        document = AMDLParser().parse_file(source)
    except ParseFailure as exc:
        return None, exc.diagnostics.items
    return MetaRegistry(document), []


def cmd_inspect(args: argparse.Namespace) -> int:
    registry, diagnostics = _load_registry(args.source)
    if registry is None:
        _print_diagnostics(diagnostics)
        return 1
    entries = sorted(registry.all(args.kind), key=lambda e: e.fqid)
    if args.domain:
        entries = [e for e in entries if e.domain == args.domain]
    if args.id:
        entries = [e for e in entries if e.id == args.id or e.fqid == args.id]
    if args.json:
        payload = [
            {
                "fqid": e.fqid,
                "kind": e.kind,
                "id": e.id,
                "domain": e.domain,
                "name": getattr(e.value, "name", e.id),
                **({"value": e.value.model_dump(mode="json")} if args.full else {}),
            }
            for e in entries
        ]
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 0 if entries else 1
    if not entries:
        print("No matching objects.", file=sys.stderr)
        return 1
    for entry in entries:
        name = getattr(entry.value, "name", entry.id)
        print(f"{entry.kind:16} {entry.fqid:52} {name}")
    print(f"\n{len(entries)} object(s).")
    return 0


def _object_hashes(registry: MetaRegistry) -> dict[str, str]:
    return {
        entry.fqid: content_hash(entry.value.model_dump(mode="json")) for entry in registry.all()
    }


def cmd_diff(args: argparse.Namespace) -> int:
    left, left_diag = _load_registry(args.old)
    right, right_diag = _load_registry(args.new)
    if left is None or right is None:
        _print_diagnostics(left_diag + right_diag)
        return 2
    left_hashes = _object_hashes(left)
    right_hashes = _object_hashes(right)
    added = sorted(set(right_hashes) - set(left_hashes))
    removed = sorted(set(left_hashes) - set(right_hashes))
    changed = sorted(
        fqid
        for fqid in set(left_hashes) & set(right_hashes)
        if left_hashes[fqid] != right_hashes[fqid]
    )
    has_diff = bool(added or removed or changed)
    if args.json:
        print(
            json.dumps(
                {
                    "added": added,
                    "removed": removed,
                    "changed": changed,
                    "changed_count": len(changed),
                },
                indent=2,
                ensure_ascii=False,
            )
        )
    else:
        for fqid in added:
            print(f"+ {fqid}")
        for fqid in removed:
            print(f"- {fqid}")
        for fqid in changed:
            print(f"~ {fqid}")
        if not has_diff:
            print("No differences.")
        else:
            print(f"\n{len(added)} added, {len(removed)} removed, {len(changed)} changed.")
    return 1 if has_diff else 0


def cmd_graph(args: argparse.Namespace) -> int:
    try:
        document = AMDLParser().parse_file(args.source)
    except ParseFailure as exc:
        _print_diagnostics(exc.diagnostics.items)
        return 1
    graph = MetaGraph(document)
    output = graph.to_json() if args.format == "json" else graph.to_mermaid()
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
    else:
        print(output)
    return 0


def cmd_impact(args: argparse.Namespace) -> int:
    try:
        document = AMDLParser().parse_file(args.source)
    except ParseFailure as exc:
        _print_diagnostics(exc.diagnostics.items)
        return 1
    result = MetaGraph(document).impact(args.reference, args.depth)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["found"] else 1


def cmd_doctor(args: argparse.Namespace) -> int:
    rows: list[tuple[str, str, str]] = []
    failed = False

    def record(name: str, status: str, detail: str) -> None:
        nonlocal failed
        if status == "FAIL":
            failed = True
        rows.append((status, name, detail))

    py = sys.version_info
    record(
        "python",
        "OK" if py >= (3, 11) else "FAIL",
        f"{py.major}.{py.minor}.{py.micro} ({platform.system()} {platform.machine()})",
    )
    for module in ("yaml", "pydantic", "jsonschema", "jinja2", "networkx"):
        present = find_spec(module) is not None
        record(module, "OK" if present else "FAIL", "importable" if present else "missing")
    for tool in ("git", "node", "pnpm", "docker", "supabase", "gh"):
        path = shutil.which(tool)
        record(tool, "OK" if path else "WARN", path or "not found (optional)")

    source = args.source
    if source and Path(source).exists():
        result = Compiler().validate(source)
        record(
            "spec",
            "OK" if result.success else "FAIL",
            f"{source} -> {'valid' if result.success else 'invalid'}",
        )
    elif source:
        record("spec", "WARN", f"{source} not found")

    try:
        import_module("amdl.compiler")
        record("compiler", "OK", "amdl.compiler import")
    except Exception as exc:  # pragma: no cover - defensive
        record("compiler", "FAIL", str(exc))

    if args.json:
        print(
            json.dumps(
                {
                    "ok": not failed,
                    "checks": [{"status": s, "name": n, "detail": d} for s, n, d in rows],
                },
                indent=2,
                ensure_ascii=False,
            )
        )
    else:
        for status, name, detail in rows:
            print(f"[{status:4}] {name:12} {detail}")
        print("\nDoctor:", "issues found" if failed else "healthy")
    return 1 if failed else 0


def cmd_init(args: argparse.Namespace) -> int:
    destination = Path(args.destination).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    source = Path(__file__).resolve().parents[2] / "examples" / "averro"
    if source.exists():
        shutil.copytree(source, destination, dirs_exist_ok=True)
    else:
        (destination / "system.amdl.yaml").write_text(
            "amdl: '1.0'\nmetadata:\n  id: my-system\n  name: My System\n  version: 0.1.0\n"
            "  description: AMDL project\ndomains: []\n",
            encoding="utf-8",
        )
    print(f"Initialized AMDL project at {destination}")
    return 0


def cmd_watch(args: argparse.Namespace) -> int:
    source = Path(args.source).resolve()
    compiler = Compiler()
    previous = 0.0
    print(f"Watching {source}. Press Ctrl+C to stop.")
    try:
        while True:
            candidates = [
                source,
                *source.parent.rglob("*.amdl.yaml"),
                *source.parent.rglob("*.amdl.json"),
            ]
            current = max(
                (path.stat().st_mtime for path in candidates if path.exists()), default=0.0
            )
            if current > previous:
                result = compiler.compile(source, args.output)
                if result.success:
                    print(
                        f"[{time.strftime('%H:%M:%S')}] compiled {len(result.artifacts)} artifacts"
                    )
                else:
                    _print_diagnostics(result.diagnostics)
                previous = current
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("Stopped.")
        return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="amdl", description="Averro Meta Definition Language compiler"
    )
    parser.add_argument("--version", action="version", version=__version__)
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate", help="Parse and semantically validate an AMDL system")
    validate.add_argument("source")
    validate.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    validate.set_defaults(func=cmd_validate)

    compile_parser = sub.add_parser(
        "compile", help="Generate architecture and engineering artifacts"
    )
    compile_parser.add_argument("source")
    compile_parser.add_argument("--output", "-o", default="generated")
    compile_parser.add_argument("--generators", help="Comma-separated generator names")
    compile_parser.add_argument("--no-clean", action="store_true")
    compile_parser.add_argument(
        "--plugins", action="store_true", help="Load third-party generators"
    )
    compile_parser.set_defaults(func=cmd_compile)

    inspect = sub.add_parser("inspect", help="List and inspect objects in the registry")
    inspect.add_argument("source")
    inspect.add_argument("--kind", help="Filter by object kind (entity, event, agent, ...)")
    inspect.add_argument("--domain", help="Filter by owning domain id")
    inspect.add_argument("--id", help="Filter by object id or fully-qualified id")
    inspect.add_argument("--full", action="store_true", help="Include full object body in JSON")
    inspect.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    inspect.set_defaults(func=cmd_inspect)

    diff = sub.add_parser("diff", help="Diff two AMDL systems by object identity and content")
    diff.add_argument("old")
    diff.add_argument("new")
    diff.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    diff.set_defaults(func=cmd_diff)

    doctor = sub.add_parser("doctor", help="Check environment and project health")
    doctor.add_argument("source", nargs="?", help="Optional AMDL system to validate")
    doctor.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    doctor.set_defaults(func=cmd_doctor)

    graph = sub.add_parser("graph", help="Export the meta graph")
    graph.add_argument("source")
    graph.add_argument("--format", choices=["mermaid", "json"], default="mermaid")
    graph.add_argument("--output", "-o")
    graph.set_defaults(func=cmd_graph)

    impact = sub.add_parser("impact", help="Analyze upstream and downstream architecture impact")
    impact.add_argument("source")
    impact.add_argument("reference")
    impact.add_argument("--depth", type=int, default=3)
    impact.set_defaults(func=cmd_impact)

    init = sub.add_parser("init", help="Initialize a modular AMDL project")
    init.add_argument("destination")
    init.set_defaults(func=cmd_init)

    watch = sub.add_parser("watch", help="Incrementally recompile on source changes")
    watch.add_argument("source")
    watch.add_argument("--output", "-o", default="generated")
    watch.add_argument("--interval", type=float, default=1.0)
    watch.set_defaults(func=cmd_watch)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    raise SystemExit(args.func(args))


if __name__ == "__main__":
    main()
