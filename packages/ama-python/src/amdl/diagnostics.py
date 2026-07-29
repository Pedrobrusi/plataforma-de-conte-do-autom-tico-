from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum


class Severity(StrEnum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass(frozen=True)
class Diagnostic:
    code: str
    message: str
    severity: Severity = Severity.ERROR
    path: str | None = None
    hint: str | None = None

    def format(self) -> str:
        location = f" [{self.path}]" if self.path else ""
        hint = f"\n  hint: {self.hint}" if self.hint else ""
        return f"{self.severity.upper()} {self.code}{location}: {self.message}{hint}"


@dataclass
class DiagnosticBag:
    items: list[Diagnostic] = field(default_factory=list)

    def add(
        self,
        code: str,
        message: str,
        severity: Severity = Severity.ERROR,
        path: str | None = None,
        hint: str | None = None,
    ) -> None:
        self.items.append(Diagnostic(code, message, severity, path, hint))

    @property
    def errors(self) -> list[Diagnostic]:
        return [item for item in self.items if item.severity == Severity.ERROR]

    @property
    def warnings(self) -> list[Diagnostic]:
        return [item for item in self.items if item.severity == Severity.WARNING]

    @property
    def ok(self) -> bool:
        return not self.errors
