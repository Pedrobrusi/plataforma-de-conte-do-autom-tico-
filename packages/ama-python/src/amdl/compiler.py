from __future__ import annotations

import os
import shutil
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

from . import __version__
from .builtin_generators import BUILTIN_GENERATORS
from .diagnostics import Diagnostic
from .generator import GeneratedArtifact, GenerationContext
from .graph import MetaGraph
from .models import AMDLDocument
from .parser import AMDLParser, ParseFailure
from .plugins import PluginRegistry
from .registry import MetaRegistry
from .utils import content_hash, write_json, write_text
from .validator import SemanticValidator

COMPILER_ID = f"averro-ama-amdl/{__version__}"


def _portable_source(source: str | Path) -> str:
    """Return a machine-independent representation of the source path.

    Absolute paths leak the build machine's layout and break cross-machine
    determinism, so we express the source relative to the working directory
    when possible and fall back to the bare file name otherwise.
    """
    resolved = Path(source).resolve()
    try:
        return resolved.relative_to(Path.cwd()).as_posix()
    except ValueError:
        return resolved.name


def _generated_at() -> str:
    """Timestamp for the manifest, honouring ``SOURCE_DATE_EPOCH``.

    ``SOURCE_DATE_EPOCH`` is the reproducible-builds convention; when set the
    timestamp becomes deterministic, otherwise the wall clock is used and the
    field is documented as volatile.
    """
    epoch = os.environ.get("SOURCE_DATE_EPOCH", "")
    if epoch.isdigit():
        return datetime.fromtimestamp(int(epoch), tz=UTC).isoformat()
    return datetime.now(UTC).isoformat()


@dataclass
class CompileResult:
    success: bool
    document: AMDLDocument | None
    diagnostics: list[Diagnostic]
    artifacts: list[GeneratedArtifact]
    output_dir: Path
    fingerprint: str | None = None


class Compiler:
    def __init__(self, load_external_plugins: bool = False) -> None:
        self.parser = AMDLParser()
        self.validator = SemanticValidator()
        self.plugins = PluginRegistry()
        for generator in BUILTIN_GENERATORS:
            self.plugins.register(generator)
        if load_external_plugins:
            self.plugins.load_entry_points()

    def validate(self, source: str | Path) -> CompileResult:
        source_path = Path(source).resolve()
        try:
            document = self.parser.parse_file(source_path)
        except ParseFailure as exc:
            return CompileResult(False, None, exc.diagnostics.items, [], source_path.parent)
        diagnostics = self.validator.validate(document)
        return CompileResult(
            diagnostics.ok,
            document,
            diagnostics.items,
            [],
            source_path.parent,
            content_hash(document.model_dump(mode="json")),
        )

    def compile(
        self,
        source: str | Path,
        output_dir: str | Path,
        generators: list[str] | None = None,
        clean: bool = True,
    ) -> CompileResult:
        validation = self.validate(source)
        out = Path(output_dir).resolve()
        validation.output_dir = out
        if not validation.success or not validation.document:
            return validation
        if clean and out.exists():
            shutil.rmtree(out)
        out.mkdir(parents=True, exist_ok=True)
        registry = MetaRegistry(validation.document)
        graph = MetaGraph(validation.document)
        context = GenerationContext(validation.document, registry, graph, out)
        selected = set(generators or [generator.name for generator in self.plugins.all()])
        artifacts: list[GeneratedArtifact] = []
        for generator in self.plugins.all():
            if generator.name in selected:
                artifacts.extend(generator.generate(context))
        manifest = {
            "compiler": COMPILER_ID,
            "generated_at": _generated_at(),
            "source": _portable_source(source),
            "system": validation.document.metadata.model_dump(mode="json"),
            "fingerprint": validation.fingerprint,
            "generators": sorted(selected),
            "artifacts": [asdict(artifact) for artifact in artifacts],
            "diagnostics": [asdict(diagnostic) for diagnostic in validation.diagnostics],
        }
        write_json(out / "ama-manifest.json", manifest)
        artifacts.append(GeneratedArtifact("ama-manifest.json", "manifest"))
        self._write_compile_report(out, registry, validation, artifacts)
        artifacts.append(GeneratedArtifact("report/compile-report.json", "report"))
        artifacts.append(GeneratedArtifact("report/compile-report.md", "report"))
        return CompileResult(
            True,
            validation.document,
            validation.diagnostics,
            artifacts,
            out,
            validation.fingerprint,
        )

    @staticmethod
    def _write_compile_report(
        out: Path,
        registry: MetaRegistry,
        validation: CompileResult,
        artifacts: list[GeneratedArtifact],
    ) -> None:
        object_counts = Counter(entry.kind for entry in registry.all())
        artifact_counts = Counter(artifact.kind for artifact in artifacts)
        severity_counts = Counter(str(d.severity) for d in validation.diagnostics)
        report = {
            "compiler": COMPILER_ID,
            "fingerprint": validation.fingerprint,
            "success": validation.success,
            "objects": {
                "total": sum(object_counts.values()),
                "by_kind": dict(sorted(object_counts.items())),
            },
            "artifacts": {
                "total": len(artifacts),
                "by_kind": dict(sorted(artifact_counts.items())),
            },
            "diagnostics": {
                "total": len(validation.diagnostics),
                "by_severity": dict(sorted(severity_counts.items())),
            },
            "volatile_fields": ["ama-manifest.json:generated_at"],
        }
        write_json(out / "report" / "compile-report.json", report)
        lines = [
            "<!-- Generated by AMA/AMDL. Edit the AMDL source, not this artifact. -->",
            "",
            f"# Compile Report — {validation.document.metadata.name if validation.document else ''}",
            "",
            f"- Compiler: `{COMPILER_ID}`",
            f"- Fingerprint: `{validation.fingerprint}`",
            f"- Objects compiled: **{sum(object_counts.values())}**",
            f"- Artifacts generated: **{len(artifacts)}**",
            f"- Diagnostics: **{len(validation.diagnostics)}** "
            f"({dict(sorted(severity_counts.items())) or 'none'})",
            "",
            "## Objects by kind",
            "",
            "| Kind | Count |",
            "| --- | ---: |",
        ]
        lines.extend(f"| {kind} | {count} |" for kind, count in sorted(object_counts.items()))
        lines.extend(
            [
                "",
                "## Artifacts by kind",
                "",
                "| Kind | Count |",
                "| --- | ---: |",
            ]
        )
        lines.extend(f"| {kind} | {count} |" for kind, count in sorted(artifact_counts.items()))
        lines.append("")
        lines.append(
            "> `ama-manifest.json:generated_at` is the only volatile field and is excluded "
            "from the determinism fingerprint."
        )
        lines.append("")
        write_text(out / "report" / "compile-report.md", "\n".join(lines))
