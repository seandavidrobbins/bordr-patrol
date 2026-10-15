import { PROGRAM_IDS, TOKEN_HOOK_FLAGS, feeAmount } from "@bordrless/shared";

/**
 * Rules of `programs/tax_hook/src/lib.rs` (`before_transfer`), read from
 * https://github.com/BordrlessDex/bordrless-programs/blob/main/programs/tax_hook/src/lib.rs
 * The fee uses `bordrless_core::fee_amount` via `@bordrless/shared`'s `feeAmount`:
 * ceil(amount * feeBps / 10_000), then never more than the amount.
 * The wallet cap uses truncating division, supply * maxWalletBps / 10_000.
 */

export const TAX_HOOK_PROGRAM_ID = PROGRAM_IDS.taxHook;
export const TAX_SEED = "tax";
export const MAX_FEE_BPS = 2_000;
export const MAX_WALLET_BPS = 10_000;
export const BPS = 10_000n;
/** Prefix of 5 accounts, then the tax config, then the collector holding. */
export const COLLECTOR_ACCOUNT_INDEX = 6;
export const TAX_HOOK_FLAGS =
  TOKEN_HOOK_FLAGS.BEFORE_TRANSFER | TOKEN_HOOK_FLAGS.TRANSFER_RETURNS_DELTA;

export type TaxHookConfig = {
  feeBps: number;
  maxWalletBps: number;
  collectorOwner: string;
};

export type TaxHookTransfer = {
  amount: bigint;
  supply: bigint;
  sourceOwner: string;
  destinationOwner: string;
  destinationBalance: bigint;
  collectorHoldingExists: boolean;
};

export type TaxHookRefusal = "bad-params" | "wallet-too-large";

export type TaxHookDelta = {
  amount: string;
  account: number;
};

export type TaxHookTransferResult = {
  cut: string;
  deltas: TaxHookDelta[];
  sourceDebit: string;
  destinationCredit: string;
  collectorCredit: string;
  refused: boolean;
  reason: TaxHookRefusal | null;
};

export function simulateTaxHookTransfer(
  config: TaxHookConfig,
  transfer: TaxHookTransfer,
): TaxHookTransferResult {
  if (!validParams(config) || !validAmounts(transfer)) {
    return settled("0", "0", true, "bad-params");
  }

  const exempt =
    transfer.sourceOwner === config.collectorOwner ||
    transfer.destinationOwner === config.collectorOwner;
  const rawCut =
    exempt || !transfer.collectorHoldingExists
      ? 0n
      : feeAmount(transfer.amount, config.feeBps);
  const cut = rawCut < transfer.amount ? rawCut : transfer.amount;
  const received = transfer.amount - cut;

  const capApplies =
    config.maxWalletBps > 0 &&
    config.maxWalletBps < MAX_WALLET_BPS &&
    transfer.destinationOwner !== config.collectorOwner;
  if (capApplies) {
    const cap = (transfer.supply * BigInt(config.maxWalletBps)) / BPS;
    const after = transfer.destinationBalance + received;
    if (after > cap) {
      return settled(cut.toString(), "0", true, "wallet-too-large");
    }
  }

  return settled(cut.toString(), transfer.amount.toString(), false, null);
}

function settled(
  cut: string,
  sourceDebit: string,
  refused: boolean,
  reason: TaxHookRefusal | null,
): TaxHookTransferResult {
  const moved = !refused && cut !== "0";
  const destinationCredit = refused ? "0" : (BigInt(sourceDebit) - BigInt(cut)).toString();
  return {
    cut,
    deltas: moved ? [{ amount: cut, account: COLLECTOR_ACCOUNT_INDEX }] : [],
    sourceDebit: refused ? "0" : sourceDebit,
    destinationCredit,
    collectorCredit: moved ? cut : "0",
    refused,
    reason,
  };
}

function validParams(config: TaxHookConfig): boolean {
  return (
    Number.isInteger(config.feeBps) &&
    Number.isInteger(config.maxWalletBps) &&
    config.feeBps >= 0 &&
    config.feeBps <= MAX_FEE_BPS &&
    config.maxWalletBps >= 0 &&
    config.maxWalletBps <= MAX_WALLET_BPS
  );
}

function validAmounts(transfer: TaxHookTransfer): boolean {
  return (
    transfer.amount >= 0n &&
    transfer.supply >= 0n &&
    transfer.destinationBalance >= 0n
  );
}
