from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from .models import AMDLDocument, DomainSpec


@dataclass(frozen=True)
class RegistryEntry:
    kind: str
    id: str
    fqid: str
    domain: str | None
    value: Any


# Single source of truth mapping a domain collection attribute to its object
# kind. Shared by the registry and the graph builder so the two never drift.
COLLECTION_KIND: dict[str, str] = {
    "capabilities": "capability",
    "entities": "entity",
    "value_objects": "value_object",
    "events": "event",
    "policies": "policy",
    "use_cases": "use_case",
    "workflows": "workflow",
    "agents": "agent",
    "tools": "tool",
    "integrations": "integration",
    "api_resources": "api_resource",
    "ui_surfaces": "ui_surface",
    "metrics": "metric",
    "roles": "role",
    "permissions": "permission",
    "feature_flags": "feature_flag",
    "deployment_targets": "deployment_target",
    "evaluations": "evaluation",
    "test_specs": "test_spec",
}


class MetaRegistry:
    COLLECTIONS = tuple(COLLECTION_KIND)

    def __init__(self, document: AMDLDocument):
        self.document = document
        self._entries: dict[str, RegistryEntry] = {}
        self._short: dict[str, list[RegistryEntry]] = {}
        self._build()

    def _add(self, entry: RegistryEntry) -> None:
        self._entries[entry.fqid] = entry
        self._short.setdefault(entry.id, []).append(entry)

    def _build(self) -> None:
        for domain in self.document.domains:
            self._add(RegistryEntry("domain", domain.id, f"domain:{domain.id}", None, domain))
            for collection in self.COLLECTIONS:
                for item in getattr(domain, collection):
                    kind = COLLECTION_KIND[collection]
                    fqid = f"{kind}:{domain.id}.{item.id}"
                    self._add(RegistryEntry(kind, item.id, fqid, domain.id, item))

    def all(self, kind: str | None = None) -> Iterable[RegistryEntry]:
        values = self._entries.values()
        return (entry for entry in values if kind is None or entry.kind == kind)

    def resolve(self, reference: str, kinds: set[str] | None = None) -> RegistryEntry | None:
        if reference in self._entries:
            entry = self._entries[reference]
            return entry if kinds is None or entry.kind in kinds else None
        if ":" not in reference and "." in reference:
            domain, item = reference.split(".", 1)
            candidates = [e for e in self._short.get(item, []) if e.domain == domain]
        else:
            candidates = self._short.get(reference, [])
        if kinds:
            candidates = [entry for entry in candidates if entry.kind in kinds]
        return candidates[0] if len(candidates) == 1 else None

    def domain(self, domain_id: str) -> DomainSpec | None:
        entry = self._entries.get(f"domain:{domain_id}")
        return entry.value if entry else None

    def to_dict(self) -> dict[str, Any]:
        return {
            "system": self.document.metadata.model_dump(mode="json"),
            "objects": [
                {
                    "kind": entry.kind,
                    "id": entry.id,
                    "fqid": entry.fqid,
                    "domain": entry.domain,
                    "value": entry.value.model_dump(mode="json"),
                }
                for entry in sorted(self._entries.values(), key=lambda x: x.fqid)
            ],
        }
