from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


ObjectStatus = Literal["draft", "active", "deprecated", "retired"]


class MetaObject(StrictModel):
    """Base contract for every addressable AMDL architecture object.

    Guarantees a stable identifier, human-readable name, semantic version,
    lifecycle status, owning parties, tags and a description so that every
    object is auditable and governable by construction. The owning *domain*
    is derived from the object's position in the document and exposed through
    the registry, so it is not repeated on each object.
    """

    id: str
    name: str
    description: str = ""
    version: str = "0.1.0"
    status: ObjectStatus = "active"
    owners: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class Metadata(StrictModel):
    id: str
    name: str
    version: str = "0.1.0"
    status: ObjectStatus = "active"
    description: str = ""
    owners: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class Defaults(StrictModel):
    workspace_scoped: bool = True
    audited: bool = True
    versioned: bool = False
    soft_delete: bool = True
    approval_for_external_writes: bool = True


class TypeSpec(StrictModel):
    kind: Literal[
        "string",
        "text",
        "integer",
        "number",
        "boolean",
        "uuid",
        "date",
        "datetime",
        "money",
        "url",
        "email",
        "json",
        "enum",
        "array",
        "reference",
        "vector",
    ]
    values: list[str] = Field(default_factory=list)
    items: str | None = None
    target: str | None = None
    dimensions: int | None = None


class FieldSpec(StrictModel):
    name: str
    type: TypeSpec
    required: bool = False
    unique: bool = False
    indexed: bool = False
    sensitive: bool = False
    immutable: bool = False
    default: Any = None
    description: str = ""

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value: Any) -> Any:
        if isinstance(value, str):
            if value.startswith("ref:"):
                return {"kind": "reference", "target": value[4:]}
            if value.startswith("enum:"):
                return {"kind": "enum", "values": [x.strip() for x in value[5:].split("|")]}
            if value.startswith("array:"):
                return {"kind": "array", "items": value[6:]}
            return {"kind": value}
        return value


class IndexSpec(StrictModel):
    name: str
    fields: list[str]
    unique: bool = False
    method: Literal["btree", "gin", "gist", "hnsw", "ivfflat"] = "btree"


class EntitySpec(MetaObject):
    aggregate: str | None = None
    table: str | None = None
    fields: list[FieldSpec] = Field(default_factory=list)
    states: list[str] = Field(default_factory=list)
    indexes: list[IndexSpec] = Field(default_factory=list)
    versioned: bool | None = None
    audited: bool | None = None
    workspace_scoped: bool | None = None
    soft_delete: bool | None = None
    ownership: Literal["domain", "workspace", "system"] = "workspace"


class ValueObjectSpec(MetaObject):
    fields: list[FieldSpec] = Field(default_factory=list)


class CapabilitySpec(MetaObject):
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    depends_on: list[str] = Field(default_factory=list)
    quality_gates: list[str] = Field(default_factory=list)


class EventSpec(MetaObject):
    aggregate: str | None = None
    payload: list[FieldSpec] = Field(default_factory=list)
    producers: list[str] = Field(default_factory=list)
    consumers: list[str] = Field(default_factory=list)
    schema_version: int = 1


class PolicySpec(MetaObject):
    effect: Literal["allow", "deny", "require", "transform", "audit"] = "require"
    condition: str = ""
    enforcement: Literal["compile", "runtime", "both"] = "both"
    severity: Literal["low", "medium", "high", "critical"] = "medium"


class UseCaseSpec(MetaObject):
    capability: str
    actor: str
    kind: Literal["command", "query"] = "command"
    input: list[str] = Field(default_factory=list)
    output: list[str] = Field(default_factory=list)
    emits: list[str] = Field(default_factory=list)
    policies: list[str] = Field(default_factory=list)
    approval: Literal["none", "optional", "required"] = "none"


class WorkflowStepSpec(StrictModel):
    id: str
    name: str
    uses: str
    agent: str | None = None
    on_success: str | None = None
    on_failure: str | None = None
    approval: Literal["none", "optional", "required"] = "none"
    retry: int = 0
    timeout_seconds: int = 300
    condition: str | None = None


class WorkflowSpec(MetaObject):
    trigger: str
    steps: list[WorkflowStepSpec]
    emits: list[str] = Field(default_factory=list)
    schedule: str | None = None


class ToolSpec(MetaObject):
    kind: Literal["api", "browser", "database", "storage", "model", "worker", "internal"]
    permissions: list[str] = Field(default_factory=list)
    external_writes: bool = False


class AgentSpec(MetaObject):
    role: str
    mission: str
    capabilities: list[str]
    tools: list[str] = Field(default_factory=list)
    consumes: list[str] = Field(default_factory=list)
    produces: list[str] = Field(default_factory=list)
    policies: list[str] = Field(default_factory=list)
    memory: list[Literal["permanent", "operational", "episodic", "shared"]] = Field(
        default_factory=list
    )
    max_cost_per_run: float | None = None
    approval_boundary: str = "External writes require human approval"


class IntegrationSpec(MetaObject):
    kind: Literal["source", "destination", "bidirectional", "infrastructure"]
    auth: Literal["oauth", "api_key", "service_account", "none", "custom"] = "oauth"
    capabilities: list[str] = Field(default_factory=list)
    rate_limit: str | None = None
    respect_robots: bool = True
    permission_mode: Literal["owner_only", "authorized", "public_reference", "not_applicable"] = (
        "authorized"
    )
    data_classification: Literal["public", "internal", "confidential", "restricted"] = "internal"


class ApiResourceSpec(MetaObject):
    entity: str | None = None
    path: str
    operations: list[Literal["list", "get", "create", "update", "archive", "execute"]]
    auth: bool = True
    # API surface version (e.g. ``v1``); distinct from the object semantic version.
    version: str = "v1"


class UISurfaceSpec(MetaObject):
    kind: Literal["dashboard", "list", "detail", "editor", "wizard", "timeline", "settings"]
    entity: str | None = None
    route: str
    capabilities: list[str] = Field(default_factory=list)
    components: list[str] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)


class MetricSpec(MetaObject):
    unit: str = "count"
    source: str
    aggregation: Literal["sum", "avg", "min", "max", "count", "latest", "ratio"] = "count"


class PermissionSpec(MetaObject):
    """A discrete, checkable authorization (an action on a resource)."""

    action: str
    resource: str = ""


class RoleSpec(MetaObject):
    """A named bundle of permissions assignable to members or agents."""

    permissions: list[str] = Field(default_factory=list)
    inherits: list[str] = Field(default_factory=list)


class FeatureFlagSpec(MetaObject):
    """A governed rollout toggle for a capability or surface."""

    default_enabled: bool = False
    rollout: Literal["off", "internal", "beta", "ga"] = "off"
    capability: str | None = None


class DeploymentTargetSpec(MetaObject):
    """A concrete environment the system is deployed to."""

    platform: Literal["supabase", "vercel", "cloudflare", "docker", "kubernetes", "other"]
    environment: Literal["development", "staging", "production"]
    region: str | None = None


class EvaluationSpec(MetaObject):
    """A measurable quality/eval gate bound to an agent or capability."""

    target: str
    metric: str
    threshold: float | None = None
    dataset: str | None = None


class TestSpec(MetaObject):
    """A declared verification bound to one or more architecture objects."""

    target: str | None = None
    level: Literal["unit", "integration", "e2e", "contract", "governance"] = "unit"
    covers: list[str] = Field(default_factory=list)


class DomainSpec(StrictModel):
    id: str
    name: str
    description: str = ""
    owner: str | None = None
    version: str = "0.1.0"
    status: ObjectStatus = "active"
    depends_on: list[str] = Field(default_factory=list)
    capabilities: list[CapabilitySpec] = Field(default_factory=list)
    entities: list[EntitySpec] = Field(default_factory=list)
    value_objects: list[ValueObjectSpec] = Field(default_factory=list)
    events: list[EventSpec] = Field(default_factory=list)
    policies: list[PolicySpec] = Field(default_factory=list)
    use_cases: list[UseCaseSpec] = Field(default_factory=list)
    workflows: list[WorkflowSpec] = Field(default_factory=list)
    agents: list[AgentSpec] = Field(default_factory=list)
    tools: list[ToolSpec] = Field(default_factory=list)
    integrations: list[IntegrationSpec] = Field(default_factory=list)
    api_resources: list[ApiResourceSpec] = Field(default_factory=list)
    ui_surfaces: list[UISurfaceSpec] = Field(default_factory=list)
    metrics: list[MetricSpec] = Field(default_factory=list)
    roles: list[RoleSpec] = Field(default_factory=list)
    permissions: list[PermissionSpec] = Field(default_factory=list)
    feature_flags: list[FeatureFlagSpec] = Field(default_factory=list)
    deployment_targets: list[DeploymentTargetSpec] = Field(default_factory=list)
    evaluations: list[EvaluationSpec] = Field(default_factory=list)
    test_specs: list[TestSpec] = Field(default_factory=list)


class AMDLDocument(StrictModel):
    amdl: str = "1.0"
    metadata: Metadata
    defaults: Defaults = Field(default_factory=Defaults)
    includes: list[str] = Field(default_factory=list)
    domains: list[DomainSpec] = Field(default_factory=list)
