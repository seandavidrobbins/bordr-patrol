from pathlib import Path

from app.main import create_app
from app.settings import REPO_ROOT, Settings, get_settings


def test_solana_rpc_url_defaults_to_empty(monkeypatch) -> None:
    monkeypatch.delenv("SOLANA_RPC_URL", raising=False)

    settings = Settings(_env_file=None)

    assert settings.solana_rpc_url == ""


def test_settings_read_a_dotenv_file(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.delenv("SOLANA_RPC_URL", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text("SOLANA_RPC_URL=https://example.invalid\n")

    settings = Settings(_env_file=env_file)

    assert settings.solana_rpc_url == "https://example.invalid"


def test_environment_variable_overrides_dotenv(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("SOLANA_RPC_URL", "https://from-env.invalid")
    env_file = tmp_path / ".env"
    env_file.write_text("SOLANA_RPC_URL=https://from-file.invalid\n")

    settings = Settings(_env_file=env_file)

    assert settings.solana_rpc_url == "https://from-env.invalid"


def test_repo_ignores_dotenv_but_keeps_the_example() -> None:
    lines = (REPO_ROOT / ".gitignore").read_text().splitlines()

    assert ".env" in lines
    assert "!.env.example" in lines


def test_app_loads_settings_at_startup(monkeypatch) -> None:
    monkeypatch.setenv("SOLANA_RPC_URL", "https://example.invalid")
    get_settings.cache_clear()

    application = create_app()

    assert application.state.settings.solana_rpc_url == "https://example.invalid"
