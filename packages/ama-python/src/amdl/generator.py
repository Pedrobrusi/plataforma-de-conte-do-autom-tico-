from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

from .graph import MetaGraph
from .models import AMDLDocument
from .registry import MetaRegistry


@dataclass(frozen=True)
class GeneratedArtifact:
    path: str
    kind: str
    source_ids: tuple[str, ...] = ()


@dataclass
class GenerationContext:
    document: AMDLDocument
    registry: MetaRegistry
    graph: MetaGraph
    output_dir: Path


class Generator(ABC):
    name: str
    description: str = ""

    @abstractmethod
    def generate(self, context: GenerationContext) -> Iterable[GeneratedArtifact]:
        raise NotImplementedError
