# Bordr Patrol

A developer console for Bordrless hooks. It shows what a hook will do to an amount, explains that result from the actual numbers, and leaves signing to the wallet.

The product scope, architecture, and contest demo are in [docs/product-spec.md](docs/product-spec.md).

Nothing in this repository runs yet. Application directories show up in the commit that adds them.

## Configuration

When a later commit needs a Solana RPC endpoint, copy `.env.example` to `.env`. Do not commit `.env`. Do not put a wallet key in it. The server never signs transactions.
