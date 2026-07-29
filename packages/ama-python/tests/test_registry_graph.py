from pathlib import Path

from amdl.graph import MetaGraph
from amdl.parser import AMDLParser
from amdl.registry import MetaRegistry

EXAMPLE = Path(__file__).resolve().parents[3] / "specifications" / "averro" / "system.amdl.yaml"


def test_registry_resolves_short_and_qualified_references() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    registry = MetaRegistry(document)
    assert registry.resolve("generate-ai-carousel", {"capability"}) is not None
    assert registry.resolve("content-studio.design-document", {"entity"}) is not None
    assert registry.resolve("entity:content-studio.design-document", {"entity"}) is not None


def test_graph_contains_agent_capability_and_event_edges() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    graph = MetaGraph(document).graph
    assert graph.has_edge(
        "agent:content-studio.lia",
        "capability:content-studio.generate-ai-carousel",
    )
    assert graph.has_edge(
        "use_case:content-studio.generate-carousel-draft",
        "event:content-studio.carousel-generated",
    )


def test_impact_analysis_finds_downstream_objects() -> None:
    document = AMDLParser().parse_file(EXAMPLE)
    result = MetaGraph(document).impact("offer-snapshot-captured", depth=3)
    assert result["found"] is True
    assert any("analytics" in item or "mission-control" in item for item in result["downstream"])
