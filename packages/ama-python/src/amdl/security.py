"""Security and governance scanners for generated artifacts.

These helpers enforce the AMA guarantee that a specification can never
*silently* generate a destructive or unsafe change. They are deliberately
free of side effects so they can be reused by the governance generator and by
the automated test-suite.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

Risk = str  # one of: "info", "low", "medium", "high", "critical"


@dataclass(frozen=True)
class SecurityFinding:
    code: str
    risk: Risk
    message: str
    location: str = ""
    requires_approval: bool = False

    def to_dict(self) -> dict[str, object]:
        return {
            "code": self.code,
            "risk": self.risk,
            "message": self.message,
            "location": self.location,
            "requires_approval": self.requires_approval,
        }


# (regex, code, risk, human message, requires_explicit_human_approval)
_DESTRUCTIVE_SQL_RULES: tuple[tuple[re.Pattern[str], str, Risk, str, bool], ...] = (
    (
        re.compile(r"\bdrop\s+table\b", re.I),
        "SQL-DROP-TABLE",
        "critical",
        "DROP TABLE is destructive",
        True,
    ),
    (
        re.compile(r"\btruncate\b", re.I),
        "SQL-TRUNCATE",
        "critical",
        "TRUNCATE erases all rows",
        True,
    ),
    (
        re.compile(r"\bdrop\s+column\b", re.I),
        "SQL-DROP-COLUMN",
        "high",
        "Dropping a column loses data",
        True,
    ),
    (
        re.compile(r"\bdrop\s+schema\b", re.I),
        "SQL-DROP-SCHEMA",
        "critical",
        "DROP SCHEMA is destructive",
        True,
    ),
    (
        re.compile(r"\bdisable\s+row\s+level\s+security\b", re.I),
        "SQL-RLS-DISABLE",
        "critical",
        "Disabling RLS removes tenant isolation",
        True,
    ),
    (
        re.compile(r"\bno\s+force\s+row\s+level\s+security\b", re.I),
        "SQL-RLS-WEAKEN",
        "high",
        "Weakening RLS enforcement",
        True,
    ),
    (
        re.compile(r"\bgrant\b[^;]*\bto\s+public\b", re.I),
        "SQL-GRANT-PUBLIC",
        "high",
        "GRANT ... TO public exposes data broadly",
        True,
    ),
    (
        re.compile(r"\busing\s*\(\s*true\s*\)", re.I),
        "SQL-POLICY-PUBLIC",
        "high",
        "An RLS policy of USING (true) is unrestricted",
        True,
    ),
    (
        re.compile(r"\bdelete\s+from\b", re.I),
        "SQL-DELETE",
        "medium",
        "Unscoped DELETE can remove rows",
        True,
    ),
)

# Patterns that must never appear verbatim in generated artifacts.
_SECRET_RULES: tuple[tuple[re.Pattern[str], str, str], ...] = (
    (
        re.compile(r"eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{10,}"),
        "SECRET-JWT",
        "A JWT-shaped token is embedded",
    ),
    (re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"), "SECRET-API-KEY", "An sk- style API key is embedded"),
    (
        re.compile(r"\bservice_role\s*[:=]\s*['\"][^'\"]+['\"]"),
        "SECRET-SERVICE-ROLE",
        "A service-role secret value is embedded",
    ),
    (
        re.compile(r"(?i)\b(password|passwd|secret)\s*[:=]\s*['\"][^'\"]{6,}['\"]"),
        "SECRET-INLINE",
        "An inline credential value is embedded",
    ),
)


def scan_sql(sql: str) -> list[SecurityFinding]:
    """Return destructive-statement findings for a SQL migration string."""
    findings: list[SecurityFinding] = []
    for line_no, line in enumerate(sql.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        for pattern, code, risk, message, approval in _DESTRUCTIVE_SQL_RULES:
            if pattern.search(line):
                findings.append(SecurityFinding(code, risk, message, f"line {line_no}", approval))
    return findings


def scan_secrets(text: str, location: str = "") -> list[SecurityFinding]:
    """Return findings for secret-looking material embedded in ``text``."""
    findings: list[SecurityFinding] = []
    for pattern, code, message in _SECRET_RULES:
        if pattern.search(text):
            findings.append(SecurityFinding(code, "critical", message, location, True))
    return findings


def highest_risk(findings: list[SecurityFinding]) -> Risk:
    order = ["info", "low", "medium", "high", "critical"]
    worst = "info"
    for finding in findings:
        if order.index(finding.risk) > order.index(worst):
            worst = finding.risk
    return worst
