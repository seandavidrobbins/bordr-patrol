# Bordr Patrol

A developer console for Bordrless hooks. It shows what a hook will do to an amount, explains that result from the actual numbers, and leaves signing to the wallet.

The product scope, architecture, and contest demo are in [docs/product-spec.md](docs/product-spec.md). The working order is in [docs/checklist.md](docs/checklist.md).

## API

From `apps/api`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
uvicorn app.main:app --reload
```

`GET http://127.0.0.1:8000/health` returns `{"status": "ok"}`.

## Configuration

Copy `.env.example` to `.env` in the repository root when you have a Solana RPC endpoint. The API reads `SOLANA_RPC_URL` from the environment, and from that file when the variable is unset. Do not commit `.env`. Do not put a wallet key in it. The server never signs transactions.
