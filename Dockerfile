FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.7.1 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1 \
    PYSETUP_PATH="/app" \
    VENV_PATH="/app/.venv"

ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        gcc \
        g++ \
        libpq-dev \
        python3-dev \
    && curl -sSL https://install.python-poetry.org | python3 - \
    && apt-get purge -y --auto-remove curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock* ./

RUN poetry install --no-root --only main

COPY ./app ./app

RUN addgroup --gid 1000 appuser && \
    adduser --uid 1000 --gid 1000 --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]