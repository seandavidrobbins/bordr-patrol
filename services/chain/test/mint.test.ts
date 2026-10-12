import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CODERS, encodeHookAccountList } from "@bordrless/sdk";
import { PROGRAM_IDS } from "@bordrless/shared";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { readMintAccount } from "../src/mint.ts";

const creator = new PublicKey("11111111111111111111111111111111");
const hookProgram = new PublicKey(PROGRAM_IDS.taxHook);
const mintAddress = "PatrolMint111111111111111111111111111111111";

async function mintBytes(hook: PublicKey | null, flags: number): Promise<Buffer> {
  return CODERS.token.accounts.encode("mint", {
    version: 1,
    decimals: 6,
    supply: new BN(1000),
    maxSupply: new BN(2000),
    mintAuthority: null,
    freezeAuthority: null,
    hookAuthority: null,
    metadataAuthority: null,
    hookProgram: hook,
    hookFlags: flags,
    name: "Patrol",
    symbol: "PTRL",
    uri: "https://example.invalid/patrol",
    createdAt: new BN(1),
    creator,
    hookSignerBump: hook === null ? 0 : 255,
  });
}

describe("readMintAccount", () => {
  it("returns the hook program, flags, and registry", async () => {
    const data = await mintBytes(hookProgram, 193);
    const registry = encodeHookAccountList({
      version: 1,
      accounts: [
        { writable: false, source: { kind: "key", key: creator } },
        {
          writable: true,
          source: {
            kind: "pda",
            program: hookProgram,
            seeds: [
              { kind: "literal", bytes: Buffer.from("fee") },
              { kind: "account", index: 1 },
            ],
          },
        },
      ],
    });

    const snapshot = readMintAccount(mintAddress, data, registry);

    assert.equal(snapshot.address, mintAddress);
    assert.equal(snapshot.name, "Patrol");
    assert.equal(snapshot.symbol, "PTRL");
    assert.equal(snapshot.decimals, 6);
    assert.equal(snapshot.supply, "1000");
    assert.equal(snapshot.hookProgram, PROGRAM_IDS.taxHook);
    assert.equal(snapshot.hookFlags, 193);
    assert.deepEqual(snapshot.hookFlagNames, [
      "before transfer",
      "transfer returns delta",
      "writes hook data",
    ]);
    assert.deepEqual(snapshot.registry, {
      version: 1,
      accounts: [
        { writable: false, kind: "key", key: creator.toBase58() },
        {
          writable: true,
          kind: "pda",
          program: PROGRAM_IDS.taxHook,
          seeds: [
            { kind: "literal", bytes: Buffer.from("fee").toString("hex") },
            { kind: "account", index: 1 },
          ],
        },
      ],
    });
  });

  it("returns no registry when the mint has no hook", async () => {
    const data = await mintBytes(null, 0);

    const snapshot = readMintAccount(mintAddress, data, null);

    assert.equal(snapshot.hookProgram, null);
    assert.equal(snapshot.hookFlags, 0);
    assert.deepEqual(snapshot.hookFlagNames, []);
    assert.equal(snapshot.registry, null);
  });
});
