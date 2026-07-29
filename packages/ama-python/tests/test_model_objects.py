from pathlib import Path

import yaml

from amdl.models import AMDLDocument
from amdl.parser import AMDLParser
from amdl.registry import COLLECTION_KIND, MetaRegistry
from amdl.validator import SemanticValidator

ROOT = Path(__file__).parents[1]
EXAMPLE = ROOT.parent.parent / "specifications" / "averro" / "system.amdl.yaml"

REQUIRED_KINDS = {
    "domain",
    "capability",
    "entity",
    "value_object",
    "field",
    "event",
    "policy",
    "use_case",
    "workflow",
    "agent",
    "tool",
    "integration",
    "api_resource",
    "ui_surface",
    "metric",
    "role",
    "permission",
    "feature_flag",
    "deployment_target",
    "evaluation",
    "test_spec",
}


def test_new_object_kinds_are_registered() -> None:
    for kind in (
        "role",
        "permission",
        "feature_flag",
        "deployment_target",
        "evaluation",
        "test_spec",
    ):
        assert kind in COLLECTION_KIND.values()


def test_averro_registry_covers_all_required_kinds() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    present = {entry.kind for entry in MetaRegistry(document).all()}
    # ``field`` is a sub-object of entities; ``value_object`` is representable
    # (see below) but not instantiated in the current Averro example.
    assert (REQUIRED_KINDS - {"field", "value_object"}) <= present


def test_model_can_represent_value_objects_and_commands() -> None:
    # ``value_object`` and the command/query distinction are part of the
    # language even where the Averro example does not yet exercise them.
    assert "value_object" in COLLECTION_KIND.values()
    document = AMDLDocument.model_validate(
        {
            "metadata": {"id": "t", "name": "T"},
            "domains": [
                {
                    "id": "d",
                    "name": "D",
                    "value_objects": [{"id": "money", "name": "Money"}],
                }
            ],
        }
    )
    assert document.domains[0].value_objects[0].id == "money"


def test_every_object_carries_audit_metadata() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    registry = MetaRegistry(document)
    for entry in registry.all():
        if entry.kind == "domain":
            continue
        value = entry.value.model_dump(mode="json")
        assert "version" in value and "status" in value, entry.fqid


def test_averro_spec_exercises_governance_objects() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    registry = MetaRegistry(document)
    assert registry.resolve("owner", {"role"}) is not None
    assert registry.resolve("workspace-admin", {"permission"}) is not None
    assert registry.resolve("supabase-prod", {"deployment_target"}) is not None


def test_role_inherits_unknown_role_is_error() -> None:
    document = AMDLDocument.model_validate(
        {
            "metadata": {"id": "t", "name": "T"},
            "domains": [
                {
                    "id": "d",
                    "name": "D",
                    "roles": [{"id": "admin", "name": "Admin", "inherits": ["ghost"]}],
                }
            ],
        }
    )
    diagnostics = SemanticValidator().validate(document)
    assert any(item.code == "SEM081" for item in diagnostics.errors)


def test_use_case_kind_defaults_and_query_is_representable() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    registry = MetaRegistry(document)
    entry = registry.resolve("search-offer-swipe", {"use_case"})
    assert entry is not None
    assert entry.value.kind == "query"


def test_video_evidence_references_resolve() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    registry = MetaRegistry(document)
    kind_map = {
        "capability": "capability",
        "entity": "entity",
        "surface": "ui_surface",
        "metric": "metric",
        "policy": "policy",
        "workflow": "workflow",
        "event": "event",
        "agent": "agent",
    }
    evidence = yaml.safe_load((ROOT / "evidence" / "video-feature-map.yaml").read_text("utf-8"))
    for source in evidence["sources"]:
        for observation in source.get("observations", []):
            for mapping in observation.get("maps_to", []):
                for key, reference in mapping.items():
                    kinds = {kind_map[key]} if key in kind_map else None
                    assert registry.resolve(reference, kinds), f"{source['id']}: {reference}"
