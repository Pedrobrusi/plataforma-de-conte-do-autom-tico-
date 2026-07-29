FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
COPY schemas ./schemas
COPY examples ./examples
RUN pip install --no-cache-dir .
ENTRYPOINT ["amdl"]
CMD ["--help"]
