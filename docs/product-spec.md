# Bordr Patrol

A developer console for the Bordrless token standard. It shows what a hook will do to an amount, explains that result from the actual numbers, and leaves every on-chain write unsigned until a person approves it.

## Problem

Bordrless is a Solana token standard of its own. It is not Token-2022 and it is not SPL. Tokens live in the Bordrless token program, which calls a mint's hook before and after every transfer, mint, and burn, then applies what the hook answers.

A hook does not only approve or reject. Its answer can take up to three cuts from the amount, keep 64 bytes of state on each holding, and, for a pool hook, burn part of a swap or set that swap's fee. The hook never receives the user's signature. The token program or the DEX checks the answer and applies it, never for more than the amount being moved.

Launch rules are fixed at launch. A custom hook is labeled unverified. A builder needs to see the answer before a transfer, and before a launch config locks the rules. Bordr Patrol is that view.

## Why this shape

The contest needs one real integration with the Bordrless programs. The EVERSANA inTouch interview needs a system where a model explains and orchestrates, deterministic code checks the data, and a person approves anything irreversible. Both are the same product rule.

## Contest demo

The builder race posted by @bordrlessdex awards $2,500, $1,500, and $1,000 to the top three projects after 72 hours. The post was about a day old on the evening of October 11, 2026, so the window closes the evening of October 13. The demo is one working path, not the full platform.

1. Read a live Bordrless mint through `@bordrless/sdk` and show its hook program, flags, and account registry.
2. Simulate a transfer against the published `tax_hook` shape: one cut to a collector, a wallet cap, the collector exempt, and a fee of zero until the collector's holding exists.
3. Return an explanation whose amounts come only from that simulation or from decoded accounts.
4. When a later step needs a write, build an unsigned instruction. The browser wallet signs it.

## After the race

These wait until the demo above runs.

- A hook described in the app, simulated before any program is deployed.
- Agent orchestration around the same tools.
- PostgreSQL for saved analyses and an audit trail. pgvector only when retrieval needs it.
- Docker, then Google Cloud Run, CI, and OpenTelemetry.
- A custom Rust hook, made immutable, and a launch config. Only after its rules match `programs/tax_hook` in tests.

Kubernetes and connectors for Veeva, Salesforce Marketing Cloud, or SharePoint are outside this repository. The engineering pattern those systems need is already the product rule: validate, record, and require approval.

## System

```text
Browser (Next.js, TypeScript)
  dashboard, wallet, explanation
        |
        | HTTP
        v
API (Python, FastAPI)
  simulation, validation, audit, and later the agent
        |
        v
Chain adapter (TypeScript, @bordrless/sdk)
  decode accounts, resolve hook registries, build unsigned transactions
        |
        v
Bordrless programs on Solana mainnet
```

The chain adapter exists because the maintained client is TypeScript and the IDLs ship inside `@bordrless/sdk`. Python will not reimplement account layouts.

The programs are live on mainnet. The same program ids are used on every cluster.

| Program | Id |
| --- | --- |
| Token | `2XoEWp8cF3kRXg74eVwPAyTFhVCAztn3V88komxAvr22` |
| DEX | `GyzKSnnEu2uN5bBRecE4XYY2enbfR2D2MtxnbJPGy7hk` |
| Bridge | `CtLkuFVitoXHTa86Hfp8KmfSDfqJaMYFWr6EGmQVsKb7` |
| Launchpad | `1jcBymHxBjniZDhNPy51Vgm5Nz7pLUdxa9UBHc4TavC` |
| Kit | `14RJQXPdJfkehit6ezktjd3xujamf8nVSKw2shKamaEH` |

Read these before adding a chain call:

- [SDK](https://bordrless.app/sdk)
- [Write a hook](https://bordrless.app/sdk/hooks)
- [Build on Bordrless](https://bordrless.app/docs/build)
- [bordrless-sdk](https://github.com/BordrlessDex/bordrless-sdk)
- [bordrless-programs](https://github.com/BordrlessDex/bordrless-programs)

`@bordrless/sdk` and `@bordrless/shared` 0.5.0 are the versions this spec was written against.

## Decisions

1. The contest demo reads mainnet and simulates locally. It does not deploy a program in the first milestone.
2. Chain access goes through `@bordrless/sdk`. No account layout is written by hand.
3. The first hook model is `tax_hook`, the worked example in `programs/tax_hook`. Its rules get encoded only after that source is read.
4. The explanation must still be useful with no model configured. The deterministic result is the product. A model, preferably Gemini or Vertex to match the EVERSANA stack, may only narrate that result.
5. Wallet approval stays in the browser. The server may build a transaction. It may not sign one.

## Safety

- No private keys, seed phrases, or keypair files in the repo, the API, or logs.
- An explanation cannot introduce an amount, address, or fee that the simulation or a decoded account did not return.
- Simulation tests run without an RPC.

## Done when

- A mint address returns decoded fields from the SDK, including the hook program.
- A transfer scenario against the tax-hook model returns the cut, the resulting amounts, and whether the transfer would be refused.
- A test fails if an explanation invents a figure.
- The README states how to run the web app and the API locally.
- Each commit does one thing, and its message says why.

## Layout

Directories appear in the commit that introduces them.

```text
apps/web          Next.js
apps/api          FastAPI
services/chain    TypeScript wrapper around @bordrless/sdk
docs/
```

## Stack

Next.js, TypeScript, Python, FastAPI, PostgreSQL, and Docker. LangGraph, Google Cloud, and OpenTelemetry arrive in the commit that first needs them.
