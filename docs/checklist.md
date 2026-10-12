# Bordr Patrol checklist

Knock these off in order. One item is one commit. Check the box in the same commit that finishes the item.

The product is both concepts. Sentinel is the intelligence: look up a token, its hook, liquidity, and wallet activity, and watch for a change. Flow is the action: when that condition hits, write a report, send a notification, or prepare a transaction the wallet still has to sign.

## 0. Direction

- [x] Product spec in `docs/product-spec.md`
- [x] Repository conventions and GitHub remote

## 1. API foundation

- [x] FastAPI starts and `GET /health` returns `{"status": "ok"}`, covered by a test
- [x] Settings load from the environment, with `.env` ignored

## 2. Web shell

- [x] Next.js app starts
- [x] A page calls `GET /health` and shows the result

## 3. Read a live mint

- [ ] TypeScript chain adapter depends on `@bordrless/sdk` and `@bordrless/shared`
- [ ] A mint address returns decoded fields, including the hook program, flags, and registry

## 4. Simulate a transfer

- [ ] `tax_hook` rules are encoded from `programs/tax_hook`, not from memory
- [ ] A transfer scenario returns the cut, the resulting amounts, and whether it would be refused
- [ ] Those tests run without an RPC

## 5. Explain the numbers

- [ ] The explanation is still useful with no model configured
- [ ] A test fails if an explanation contains an amount, address, or fee the simulation did not return

## 6. Sentinel

- [ ] A token view shows hook, liquidity, and recent wallet activity from decoded chain data
- [ ] A monitoring rule saves a condition and raises an alert when it matches

## 7. Flow

- [ ] A workflow runs one saved rule into a report, a notification, or an unsigned transaction
- [ ] The browser wallet is the only signer

## 8. Keep it operable

- [ ] PostgreSQL stores analyses and an audit trail
- [ ] Docker Compose runs the API and the database locally
- [ ] GitHub Actions runs the test suite
- [ ] OpenTelemetry and Cloud Run wait until a deploy needs them
