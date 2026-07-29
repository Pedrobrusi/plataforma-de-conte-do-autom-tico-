from __future__ import annotations

from collections import Counter

from .diagnostics import DiagnosticBag, Severity
from .models import AMDLDocument, FieldSpec
from .registry import MetaRegistry


class SemanticValidator:
    """Cross-reference, architecture, safety and governance validation."""

    def validate(self, document: AMDLDocument) -> DiagnosticBag:
        bag = DiagnosticBag()
        registry = MetaRegistry(document)
        self._unique_ids(document, bag)
        self._domain_dependencies(document, registry, bag)
        self._entity_fields(document, registry, bag)
        self._capabilities(document, registry, bag)
        self._events(document, registry, bag)
        self._use_cases(document, registry, bag)
        self._workflows(document, registry, bag)
        self._agents(document, registry, bag)
        self._integrations(document, bag)
        self._access_control(document, registry, bag)
        self._quality_objects(document, registry, bag)
        self._governance(document, bag)
        return bag

    def _unique_ids(self, document: AMDLDocument, bag: DiagnosticBag) -> None:
        domain_counts = Counter(domain.id for domain in document.domains)
        for item, count in domain_counts.items():
            if count > 1:
                bag.add("SEM001", f"Duplicate domain id '{item}'", path="domains")
        for domain in document.domains:
            for collection in MetaRegistry.COLLECTIONS:
                ids = [x.id for x in getattr(domain, collection)]
                for item, count in Counter(ids).items():
                    if count > 1:
                        bag.add(
                            "SEM002",
                            f"Duplicate {collection} id '{item}' in domain '{domain.id}'",
                            path=f"domains.{domain.id}.{collection}",
                        )

    def _domain_dependencies(
        self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag
    ) -> None:
        for domain in document.domains:
            for dep in domain.depends_on:
                if not registry.domain(dep):
                    bag.add(
                        "SEM010",
                        f"Unknown domain dependency '{dep}'",
                        path=f"domains.{domain.id}.depends_on",
                    )
                if dep == domain.id:
                    bag.add(
                        "SEM011",
                        "A domain cannot depend on itself",
                        path=f"domains.{domain.id}.depends_on",
                    )

    def _entity_fields(
        self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag
    ) -> None:
        for domain in document.domains:
            for entity in domain.entities:
                names = [f.name for f in entity.fields]
                for name, count in Counter(names).items():
                    if count > 1:
                        bag.add(
                            "SEM020",
                            f"Duplicate field '{name}'",
                            path=f"{domain.id}.{entity.id}.fields",
                        )
                for field in entity.fields:
                    self._validate_field(field, domain.id, entity.id, registry, bag)
                for index in entity.indexes:
                    missing = [
                        name
                        for name in index.fields
                        if name not in names and name not in self._base_fields(document, entity)
                    ]
                    if missing:
                        bag.add(
                            "SEM021",
                            f"Index '{index.name}' references missing fields: {missing}",
                            path=f"{domain.id}.{entity.id}.indexes",
                        )

    @staticmethod
    def _base_fields(document: AMDLDocument, entity) -> set[str]:
        result = {"id", "created_at", "updated_at", "metadata", "version"}
        workspace = (
            document.defaults.workspace_scoped
            if entity.workspace_scoped is None
            else entity.workspace_scoped
        )
        if workspace:
            result.add("workspace_id")
        if document.defaults.soft_delete if entity.soft_delete is None else entity.soft_delete:
            result.add("deleted_at")
        return result

    def _validate_field(
        self,
        field: FieldSpec,
        domain_id: str,
        entity_id: str,
        registry: MetaRegistry,
        bag: DiagnosticBag,
    ) -> None:
        if field.type.kind == "reference" and (
            not field.type.target or not registry.resolve(field.type.target, {"entity"})
        ):
            bag.add(
                "SEM022",
                f"Unknown entity reference '{field.type.target}'",
                path=f"{domain_id}.{entity_id}.{field.name}",
            )
        if field.type.kind == "enum" and not field.type.values:
            bag.add(
                "SEM023", "Enum field requires values", path=f"{domain_id}.{entity_id}.{field.name}"
            )
        if field.type.kind == "vector" and not field.type.dimensions:
            bag.add(
                "SEM024",
                "Vector field requires dimensions",
                path=f"{domain_id}.{entity_id}.{field.name}",
            )
        secret_names = {
            "password",
            "secret",
            "token",
            "api_key",
            "private_key",
            "access_token",
            "refresh_token",
        }
        normalized_name = field.name.lower()
        looks_secret = normalized_name in secret_names or normalized_name.endswith(
            ("_secret", "_api_key", "_private_key", "_access_token", "_refresh_token")
        )
        if looks_secret and not field.sensitive:
            bag.add(
                "SEC001",
                f"Potential secret field '{field.name}' must be marked sensitive",
                Severity.WARNING,
                f"{domain_id}.{entity_id}.{field.name}",
            )

    def _capabilities(
        self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag
    ) -> None:
        for domain in document.domains:
            for capability in domain.capabilities:
                for dep in capability.depends_on:
                    if not registry.resolve(dep, {"capability"}):
                        bag.add(
                            "SEM030",
                            f"Unknown capability dependency '{dep}'",
                            path=f"{domain.id}.{capability.id}",
                        )

    def _events(self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag) -> None:
        for domain in document.domains:
            for event in domain.events:
                if event.aggregate and not registry.resolve(event.aggregate, {"entity"}):
                    bag.add(
                        "SEM040",
                        f"Unknown event aggregate '{event.aggregate}'",
                        path=f"{domain.id}.{event.id}",
                    )
                for ref in [*event.producers, *event.consumers]:
                    if not registry.resolve(
                        ref, {"capability", "use_case", "workflow", "agent", "domain"}
                    ):
                        bag.add(
                            "SEM041",
                            f"Unknown event participant '{ref}'",
                            path=f"{domain.id}.{event.id}",
                        )

    def _use_cases(
        self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag
    ) -> None:
        for domain in document.domains:
            for use_case in domain.use_cases:
                if not registry.resolve(use_case.capability, {"capability"}):
                    bag.add(
                        "SEM050",
                        f"Unknown capability '{use_case.capability}'",
                        path=f"{domain.id}.{use_case.id}",
                    )
                for ref in use_case.emits:
                    if not registry.resolve(ref, {"event"}):
                        bag.add(
                            "SEM051",
                            f"Unknown emitted event '{ref}'",
                            path=f"{domain.id}.{use_case.id}",
                        )
                for ref in use_case.policies:
                    if not registry.resolve(ref, {"policy"}):
                        bag.add(
                            "SEM052", f"Unknown policy '{ref}'", path=f"{domain.id}.{use_case.id}"
                        )

    def _workflows(
        self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag
    ) -> None:
        for domain in document.domains:
            for workflow in domain.workflows:
                step_ids = {step.id for step in workflow.steps}
                for step in workflow.steps:
                    if not registry.resolve(step.uses, {"use_case", "capability"}):
                        bag.add(
                            "SEM060",
                            f"Unknown workflow operation '{step.uses}'",
                            path=f"{domain.id}.{workflow.id}.{step.id}",
                        )
                    if step.agent and not registry.resolve(step.agent, {"agent"}):
                        bag.add(
                            "SEM061",
                            f"Unknown workflow agent '{step.agent}'",
                            path=f"{domain.id}.{workflow.id}.{step.id}",
                        )
                    for edge in [step.on_success, step.on_failure]:
                        if (
                            edge
                            and edge not in step_ids
                            and edge not in {"finish", "fail", "escalate"}
                        ):
                            bag.add(
                                "SEM062",
                                f"Unknown workflow step target '{edge}'",
                                path=f"{domain.id}.{workflow.id}.{step.id}",
                            )
                for ref in workflow.emits:
                    if not registry.resolve(ref, {"event"}):
                        bag.add(
                            "SEM063",
                            f"Unknown workflow event '{ref}'",
                            path=f"{domain.id}.{workflow.id}",
                        )

    def _agents(self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag) -> None:
        for domain in document.domains:
            for agent in domain.agents:
                for capability in agent.capabilities:
                    if not registry.resolve(capability, {"capability"}):
                        bag.add(
                            "SEM070",
                            f"Unknown agent capability '{capability}'",
                            path=f"{domain.id}.{agent.id}",
                        )
                for tool in agent.tools:
                    if not registry.resolve(tool, {"tool"}):
                        bag.add("SEM071", f"Unknown tool '{tool}'", path=f"{domain.id}.{agent.id}")
                for policy in agent.policies:
                    if not registry.resolve(policy, {"policy"}):
                        bag.add(
                            "SEM072", f"Unknown policy '{policy}'", path=f"{domain.id}.{agent.id}"
                        )

    def _integrations(self, document: AMDLDocument, bag: DiagnosticBag) -> None:
        for domain in document.domains:
            for integration in domain.integrations:
                if (
                    integration.permission_mode == "public_reference"
                    and not integration.respect_robots
                ):
                    bag.add(
                        "SEC010",
                        f"Public-reference integration '{integration.id}' must respect robots and rate limits",
                        path=f"{domain.id}.{integration.id}",
                    )
                if (
                    integration.kind in {"source", "bidirectional"}
                    and integration.permission_mode != "not_applicable"
                    and not integration.rate_limit
                ):
                    bag.add(
                        "SEC011",
                        f"Integration '{integration.id}' should declare a rate limit",
                        Severity.WARNING,
                        f"{domain.id}.{integration.id}",
                    )
                if integration.auth == "none" and integration.data_classification in {
                    "confidential",
                    "restricted",
                }:
                    bag.add(
                        "SEC012",
                        "Confidential integrations cannot use auth=none",
                        path=f"{domain.id}.{integration.id}",
                    )

    def _access_control(
        self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag
    ) -> None:
        for domain in document.domains:
            for role in domain.roles:
                for permission in role.permissions:
                    if not registry.resolve(permission, {"permission"}):
                        bag.add(
                            "SEM080",
                            f"Role '{role.id}' grants unknown permission '{permission}'",
                            path=f"{domain.id}.{role.id}",
                        )
                for parent in role.inherits:
                    if not registry.resolve(parent, {"role"}):
                        bag.add(
                            "SEM081",
                            f"Role '{role.id}' inherits unknown role '{parent}'",
                            path=f"{domain.id}.{role.id}",
                        )
                    if parent == role.id:
                        bag.add(
                            "SEM082",
                            f"Role '{role.id}' cannot inherit itself",
                            path=f"{domain.id}.{role.id}",
                        )
            for flag in domain.feature_flags:
                if flag.capability and not registry.resolve(flag.capability, {"capability"}):
                    bag.add(
                        "SEM083",
                        f"Feature flag '{flag.id}' guards unknown capability '{flag.capability}'",
                        path=f"{domain.id}.{flag.id}",
                    )

    def _quality_objects(
        self, document: AMDLDocument, registry: MetaRegistry, bag: DiagnosticBag
    ) -> None:
        for domain in document.domains:
            for evaluation in domain.evaluations:
                if not registry.resolve(evaluation.target, {"agent", "capability"}):
                    bag.add(
                        "SEM090",
                        f"Evaluation '{evaluation.id}' targets unknown agent/capability "
                        f"'{evaluation.target}'",
                        path=f"{domain.id}.{evaluation.id}",
                    )
            for test_spec in domain.test_specs:
                references = [*([test_spec.target] if test_spec.target else []), *test_spec.covers]
                for ref in references:
                    if not registry.resolve(ref):
                        bag.add(
                            "SEM091",
                            f"Test spec '{test_spec.id}' references unknown object '{ref}'",
                            path=f"{domain.id}.{test_spec.id}",
                        )

    def _governance(self, document: AMDLDocument, bag: DiagnosticBag) -> None:
        for domain in document.domains:
            has_originality = any(policy.id == "originality-guard" for policy in domain.policies)
            has_permission = any(policy.id == "authorized-source-use" for policy in domain.policies)
            for capability in domain.capabilities:
                tags = set(capability.tags)
                if "reference-modeling" in tags and not (has_originality and has_permission):
                    bag.add(
                        "GOV001",
                        f"Reference-modeling capability '{capability.id}' requires originality-guard and authorized-source-use policies",
                        path=f"{domain.id}.{capability.id}",
                    )
                if "external-write" in tags and not capability.quality_gates:
                    bag.add(
                        "GOV002",
                        f"External-write capability '{capability.id}' must declare quality gates",
                        path=f"{domain.id}.{capability.id}",
                    )
