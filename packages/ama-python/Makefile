PYTHON ?= python
SOURCE ?= examples/averro/system.amdl.yaml
OUTPUT ?= generated/averro
export PYTHONPATH := src

.PHONY: help bootstrap format lint typecheck test validate compile schema \
        determinism doctor verify explorer clean

help:
	@echo "Targets:"
	@echo "  bootstrap    Create .venv and editable install with dev extras"
	@echo "  format       Apply ruff formatting"
	@echo "  lint         Ruff lint + format check"
	@echo "  typecheck    Run mypy over src"
	@echo "  test         Run the pytest suite"
	@echo "  validate     Validate the Averro example spec"
	@echo "  compile      Compile the Averro example spec to $(OUTPUT)"
	@echo "  schema       Regenerate schemas/amdl.schema.json from the model"
	@echo "  determinism  Compile twice and assert byte-identical output"
	@echo "  doctor       Environment and project health check"
	@echo "  verify       Run the full local quality gate"
	@echo "  clean        Remove generated artifacts and caches"

bootstrap:
	$(PYTHON) -m venv .venv
	./.venv/bin/pip install --upgrade pip
	./.venv/bin/pip install -e ".[dev]"

format:
	$(PYTHON) -m ruff format src tests scripts

lint:
	$(PYTHON) -m ruff check src tests scripts
	$(PYTHON) -m ruff format --check src tests scripts

typecheck:
	$(PYTHON) -m mypy src

test:
	$(PYTHON) -m pytest

validate:
	$(PYTHON) -m amdl validate $(SOURCE)

compile:
	$(PYTHON) -m amdl compile $(SOURCE) -o $(OUTPUT)

schema:
	$(PYTHON) scripts/gen_schema.py

doctor:
	$(PYTHON) -m amdl doctor $(SOURCE)

determinism:
	@rm -rf .determinism/a .determinism/b
	@SOURCE_DATE_EPOCH=1700000000 $(PYTHON) -m amdl compile $(SOURCE) -o .determinism/a >/dev/null
	@SOURCE_DATE_EPOCH=1700000000 $(PYTHON) -m amdl compile $(SOURCE) -o .determinism/b >/dev/null
	@diff -r .determinism/a .determinism/b && echo "Determinism OK: byte-identical output"
	@rm -rf .determinism

verify: lint typecheck test validate compile determinism
	@echo "AMA/AMDL verification complete"

explorer:
	$(PYTHON) -m http.server 8080 --directory $(OUTPUT)/explorer

clean:
	rm -rf .determinism .pytest_cache .coverage htmlcov
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
