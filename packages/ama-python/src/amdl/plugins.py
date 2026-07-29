from __future__ import annotations

from collections.abc import Iterable
from importlib.metadata import entry_points

from .generator import Generator


class PluginRegistry:
    def __init__(self) -> None:
        self._generators: dict[str, Generator] = {}

    def register(self, generator: Generator) -> None:
        if generator.name in self._generators:
            raise ValueError(f"Generator already registered: {generator.name}")
        self._generators[generator.name] = generator

    def load_entry_points(self, group: str = "amdl.generators") -> None:
        for entry in entry_points(group=group):
            loaded = entry.load()
            generator = loaded() if isinstance(loaded, type) else loaded
            self.register(generator)

    def all(self) -> Iterable[Generator]:
        return self._generators.values()

    def get(self, name: str) -> Generator:
        return self._generators[name]
