from __future__ import annotations

import json
from typing import Any

import networkx as nx

from .models import AMDLDocument
from .registry import COLLECTION_KIND, MetaRegistry


class MetaGraph:
    def __init__(self, document: AMDLDocument):
        self.document = document
        self.registry = MetaRegistry(document)
        self.graph = nx.DiGraph()
        self._build()

    def _node(self, fqid: str, kind: str, label: str, domain: str | None = None) -> None:
        self.graph.add_node(fqid, kind=kind, label=label, domain=domain)

    def _edge(self, source: str | None, target: str | None, relation: str) -> None:
        if source and target and source in self.graph and target in self.graph:
            self.graph.add_edge(source, target, relation=relation)

    def _resolve(self, reference: str, kinds: set[str] | None = None) -> str | None:
        entry = self.registry.resolve(reference, kinds)
        return entry.fqid if entry else None

    def _build(self) -> None:
        for entry in self.registry.all():
            name = getattr(entry.value, "name", entry.id)
            self._node(entry.fqid, entry.kind, name, entry.domain)
        for domain in self.document.domains:
            d = f"domain:{domain.id}"
            for dep in domain.depends_on:
                self._edge(d, f"domain:{dep}", "depends_on")
            for collection in MetaRegistry.COLLECTIONS:
                for item in getattr(domain, collection):
                    child = f"{COLLECTION_KIND[collection]}:{domain.id}.{item.id}"
                    self._edge(d, child, "contains")
            for capability in domain.capabilities:
                c = f"capability:{domain.id}.{capability.id}"
                for dep in capability.depends_on:
                    self._edge(c, self._resolve(dep, {"capability"}), "depends_on")
            for event in domain.events:
                e = f"event:{domain.id}.{event.id}"
                self._edge(
                    e,
                    self._resolve(event.aggregate, {"entity"}) if event.aggregate else None,
                    "about",
                )
                for producer in event.producers:
                    self._edge(self._resolve(producer), e, "emits")
                for consumer in event.consumers:
                    self._edge(e, self._resolve(consumer), "consumed_by")
            for use_case in domain.use_cases:
                u = f"use_case:{domain.id}.{use_case.id}"
                self._edge(u, self._resolve(use_case.capability, {"capability"}), "implements")
                for emitted in use_case.emits:
                    self._edge(u, self._resolve(emitted, {"event"}), "emits")
                for policy in use_case.policies:
                    self._edge(u, self._resolve(policy, {"policy"}), "governed_by")
            for workflow in domain.workflows:
                w = f"workflow:{domain.id}.{workflow.id}"
                for step in workflow.steps:
                    self._edge(
                        w, self._resolve(step.uses, {"use_case", "capability"}), "orchestrates"
                    )
                    if step.agent:
                        self._edge(w, self._resolve(step.agent, {"agent"}), "assigns")
            for agent in domain.agents:
                a = f"agent:{domain.id}.{agent.id}"
                for capability_ref in agent.capabilities:
                    self._edge(a, self._resolve(capability_ref, {"capability"}), "can_execute")
                for tool_ref in agent.tools:
                    self._edge(a, self._resolve(tool_ref, {"tool"}), "uses")
            for role in domain.roles:
                r = f"role:{domain.id}.{role.id}"
                for permission_ref in role.permissions:
                    self._edge(r, self._resolve(permission_ref, {"permission"}), "grants")
                for parent in role.inherits:
                    self._edge(r, self._resolve(parent, {"role"}), "inherits")
            for flag in domain.feature_flags:
                if flag.capability:
                    f = f"feature_flag:{domain.id}.{flag.id}"
                    self._edge(f, self._resolve(flag.capability, {"capability"}), "guards")
            for evaluation in domain.evaluations:
                ev = f"evaluation:{domain.id}.{evaluation.id}"
                self._edge(
                    ev, self._resolve(evaluation.target, {"agent", "capability"}), "evaluates"
                )
            for test_spec in domain.test_specs:
                t = f"test_spec:{domain.id}.{test_spec.id}"
                if test_spec.target:
                    self._edge(t, self._resolve(test_spec.target), "verifies")
                for covered in test_spec.covers:
                    self._edge(t, self._resolve(covered), "verifies")

    def impact(self, reference: str, depth: int = 3) -> dict[str, Any]:
        entry = self.registry.resolve(reference)
        if not entry:
            return {"reference": reference, "found": False, "upstream": [], "downstream": []}
        node = entry.fqid
        upstream: set[str] = set()
        downstream: set[str] = set()
        frontier = {node}
        for _ in range(depth):
            previous = set(frontier)
            frontier = {p for n in previous for p in self.graph.predecessors(n)} - upstream
            upstream |= frontier
        frontier = {node}
        for _ in range(depth):
            previous = set(frontier)
            frontier = {p for n in previous for p in self.graph.successors(n)} - downstream
            downstream |= frontier
        return {
            "reference": entry.fqid,
            "found": True,
            "upstream": sorted(upstream),
            "downstream": sorted(downstream),
        }

    def to_json(self) -> str:
        data = {
            "nodes": [{"id": n, **attrs} for n, attrs in self.graph.nodes(data=True)],
            "edges": [
                {"source": s, "target": t, **attrs} for s, t, attrs in self.graph.edges(data=True)
            ],
        }
        return json.dumps(data, indent=2, ensure_ascii=False)

    def to_mermaid(self) -> str:
        lines = ["flowchart LR"]
        for node, attrs in sorted(self.graph.nodes(data=True)):
            safe = node.replace(":", "_").replace(".", "_").replace("-", "_")
            label = str(attrs.get("label", node)).replace('"', "'")
            lines.append(f'  {safe}["{label}"]')
        for source, target, attrs in sorted(self.graph.edges(data=True)):
            s = source.replace(":", "_").replace(".", "_").replace("-", "_")
            t = target.replace(":", "_").replace(".", "_").replace("-", "_")
            lines.append(f"  {s} -->|{attrs.get('relation', '')}| {t}")
        return "\n".join(lines) + "\n"
