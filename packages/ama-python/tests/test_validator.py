from pathlib import Path

from amdl.models import AMDLDocument
from amdl.parser import AMDLParser
from amdl.validator import SemanticValidator

EXAMPLE = Path(__file__).resolve().parents[3] / "specifications" / "averro" / "system.amdl.yaml"


def test_averro_reference_model_has_no_semantic_errors() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    diagnostics = SemanticValidator().validate(document)
    assert diagnostics.errors == []


def test_unknown_entity_reference_is_error() -> None:
    document = AMDLDocument.model_validate(
        {
            "metadata": {"id": "test", "name": "Test"},
            "domains": [
                {
                    "id": "one",
                    "name": "One",
                    "entities": [
                        {
                            "id": "thing",
                            "name": "Thing",
                            "fields": [{"name": "missing", "type": "ref:not-real"}],
                        }
                    ],
                }
            ],
        }
    )
    diagnostics = SemanticValidator().validate(document)
    assert any(item.code == "SEM022" for item in diagnostics.errors)


def test_reference_modeling_requires_governance_policies() -> None:
    document = AMDLDocument.model_validate(
        {
            "metadata": {"id": "test", "name": "Test"},
            "domains": [
                {
                    "id": "modeling",
                    "name": "Modeling",
                    "capabilities": [
                        {
                            "id": "copy-reference",
                            "name": "Copy Reference",
                            "tags": ["reference-modeling"],
                        }
                    ],
                }
            ],
        }
    )
    diagnostics = SemanticValidator().validate(document)
    assert any(item.code == "GOV001" for item in diagnostics.errors)


def test_ambiguous_short_reference_is_rejected() -> None:
    document = AMDLDocument.model_validate(
        {
            "metadata": {"id": "test", "name": "Test"},
            "domains": [
                {"id": "a", "name": "A", "entities": [{"id": "item", "name": "A Item"}]},
                {"id": "b", "name": "B", "entities": [{"id": "item", "name": "B Item"}]},
                {
                    "id": "c",
                    "name": "C",
                    "entities": [
                        {
                            "id": "ref",
                            "name": "Ref",
                            "fields": [{"name": "item_id", "type": "ref:item"}],
                        }
                    ],
                },
            ],
        }
    )
    diagnostics = SemanticValidator().validate(document)
    assert any(item.code == "SEM022" for item in diagnostics.errors)
