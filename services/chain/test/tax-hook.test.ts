import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROGRAM_IDS } from "@bordrless/shared";
import {
  COLLECTOR_ACCOUNT_INDEX,
  MAX_FEE_BPS,
  MAX_WALLET_BPS,
  TAX_HOOK_FLAGS,
  TAX_HOOK_PROGRAM_ID,
  simulateTaxHookTransfer,
  type TaxHookConfig,
  type TaxHookTransfer,
} from "../src/tax-hook.ts";

const collector = "Collector111111111111111111111111111111111";
const alice = "Alice1111111111111111111111111111111111111";
const bob = "Bob1111111111111111111111111111111111111111";

const config: TaxHookConfig = {
  feeBps: 100,
  maxWalletBps: 5_000,
  collectorOwner: collector,
};

function transfer(overrides: Partial<TaxHookTransfer> = {}): TaxHookTransfer {
  return {
    amount: 10_000n,
    supply: 1_000_000n,
    sourceOwner: alice,
    destinationOwner: bob,
    destinationBalance: 0n,
    collectorHoldingExists: true,
    ...overrides,
  };
}

describe("tax_hook rules from programs/tax_hook", () => {
  it("keeps the program id, fee bound, and flags from the source", () => {
    assert.equal(TAX_HOOK_PROGRAM_ID, PROGRAM_IDS.taxHook);
    assert.equal(TAX_HOOK_PROGRAM_ID, "8tjnVSreJGBRQFyDBf1SyyhBgLsdBxa2rHYh9sbxFyX7");
    assert.equal(MAX_FEE_BPS, 2_000);
    assert.equal(MAX_WALLET_BPS, 10_000);
    assert.equal(TAX_HOOK_FLAGS, 65);
    assert.equal(COLLECTOR_ACCOUNT_INDEX, 6);
  });

  it("rounds the cut up and pays it to the collector account", () => {
    const result = simulateTaxHookTransfer(config, transfer({ amount: 10_001n }));

    assert.equal(result.refused, false);
    assert.equal(result.reason, null);
    assert.equal(result.cut, "101");
    assert.equal(result.sourceDebit, "10001");
    assert.equal(result.destinationCredit, "9900");
    assert.equal(result.collectorCredit, "101");
    assert.deepEqual(result.deltas, [{ amount: "101", account: 6 }]);
  });

  it("takes no fee from the collector or before the collector holding exists", () => {
    const fromCollector = simulateTaxHookTransfer(
      config,
      transfer({ sourceOwner: collector }),
    );
    const toCollector = simulateTaxHookTransfer(
      config,
      transfer({ destinationOwner: collector, amount: 50_000n }),
    );
    const unprepared = simulateTaxHookTransfer(
      config,
      transfer({ collectorHoldingExists: false }),
    );

    assert.equal(fromCollector.cut, "0");
    assert.equal(fromCollector.destinationCredit, "10000");
    assert.equal(toCollector.cut, "0");
    assert.equal(toCollector.refused, false);
    assert.equal(unprepared.cut, "0");
    assert.deepEqual(unprepared.deltas, []);
  });

  it("refuses a destination that would finish above the cap, after the cut", () => {
    const refused = simulateTaxHookTransfer(
      config,
      transfer({
        amount: 200n,
        supply: 10_000n,
        destinationBalance: 4_900n,
      }),
    );
    const allowedBecauseOfTheCut = simulateTaxHookTransfer(
      { ...config, feeBps: 2_000 },
      transfer({
        amount: 625n,
        supply: 10_000n,
        destinationBalance: 4_500n,
      }),
    );
    const atTheCap = simulateTaxHookTransfer(
      { ...config, feeBps: 0 },
      transfer({
        amount: 100n,
        supply: 10_000n,
        destinationBalance: 4_900n,
      }),
    );

    assert.equal(refused.refused, true);
    assert.equal(refused.reason, "wallet-too-large");
    assert.equal(refused.cut, "2");
    assert.equal(refused.sourceDebit, "0");
    assert.equal(refused.destinationCredit, "0");
    assert.deepEqual(refused.deltas, []);

    assert.equal(allowedBecauseOfTheCut.refused, false);
    assert.equal(allowedBecauseOfTheCut.cut, "125");
    assert.equal(allowedBecauseOfTheCut.destinationCredit, "500");

    assert.equal(atTheCap.refused, false);
    assert.equal(atTheCap.destinationCredit, "100");
  });

  it("does not apply the cap at zero or at 100 percent, and rejects an illegal fee", () => {
    const uncapped = simulateTaxHookTransfer(
      { ...config, maxWalletBps: 0 },
      transfer({ amount: 9_000n, supply: 10_000n, destinationBalance: 9_000n }),
    );
    const wholeSupply = simulateTaxHookTransfer(
      { ...config, maxWalletBps: 10_000 },
      transfer({ amount: 9_000n, supply: 10_000n, destinationBalance: 9_000n }),
    );
    const illegal = simulateTaxHookTransfer(
      { ...config, feeBps: 2_001 },
      transfer(),
    );

    assert.equal(uncapped.refused, false);
    assert.equal(wholeSupply.refused, false);
    assert.equal(illegal.refused, true);
    assert.equal(illegal.reason, "bad-params");
    assert.equal(illegal.cut, "0");
  });
});
