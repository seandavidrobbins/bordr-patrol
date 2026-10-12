import {
  decodeHookAccountList,
  decodeMint,
  fetchHookAccountList,
  type HookAccountList,
  type Seed,
} from "@bordrless/sdk";
import { describeHookFlags, TOKEN_HOOK_FLAGS } from "@bordrless/shared";
import { Connection, PublicKey } from "@solana/web3.js";

export type RegistrySeed =
  | { kind: "literal"; bytes: string }
  | { kind: "account"; index: number }
  | { kind: "sourceOwner" }
  | { kind: "destinationOwner" };

export type RegistryAccount =
  | { writable: boolean; kind: "key"; key: string }
  | { writable: boolean; kind: "pda"; program: string; seeds: RegistrySeed[] };

export type MintSnapshot = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  hookProgram: string | null;
  hookFlags: number;
  hookFlagNames: string[];
  registry: { version: number; accounts: RegistryAccount[] } | null;
};

export function readMintAccount(
  address: string,
  data: Uint8Array,
  registryData: Uint8Array | null,
): MintSnapshot {
  const mint = decodeMint(Buffer.from(data));
  const hookProgram = mint.hookProgram?.toBase58() ?? null;
  const registry =
    hookProgram === null || registryData === null
      ? null
      : registrySnapshot(decodeHookAccountList(Buffer.from(registryData)));

  return {
    address,
    name: mint.name,
    symbol: mint.symbol,
    decimals: mint.decimals,
    supply: mint.supply.toString(),
    hookProgram,
    hookFlags: mint.hookFlags,
    hookFlagNames: describeHookFlags(mint.hookFlags, TOKEN_HOOK_FLAGS),
    registry,
  };
}

export async function fetchMint(
  rpcUrl: string,
  address: string,
): Promise<MintSnapshot | null> {
  const connection = new Connection(rpcUrl, "confirmed");
  const mintKey = new PublicKey(address);
  const info = await connection.getAccountInfo(mintKey);
  if (info === null) {
    return null;
  }

  const mint = decodeMint(info.data);
  const registry = mint.hookProgram
    ? await fetchHookAccountList(connection, mint.hookProgram, mintKey)
    : null;

  return {
    address,
    name: mint.name,
    symbol: mint.symbol,
    decimals: mint.decimals,
    supply: mint.supply.toString(),
    hookProgram: mint.hookProgram?.toBase58() ?? null,
    hookFlags: mint.hookFlags,
    hookFlagNames: describeHookFlags(mint.hookFlags, TOKEN_HOOK_FLAGS),
    registry: registrySnapshot(registry),
  };
}

function registrySnapshot(list: HookAccountList | null): MintSnapshot["registry"] {
  if (list === null) {
    return null;
  }
  return {
    version: list.version,
    accounts: list.accounts.map(registryAccount),
  };
}

function registryAccount(account: HookAccountList["accounts"][number]): RegistryAccount {
  const source = account.source;
  if (source.kind === "key") {
    return { writable: account.writable, kind: "key", key: source.key.toBase58() };
  }
  return {
    writable: account.writable,
    kind: "pda",
    program: source.program.toBase58(),
    seeds: source.seeds.map(registrySeed),
  };
}

function registrySeed(seed: Seed): RegistrySeed {
  switch (seed.kind) {
    case "literal":
      return { kind: "literal", bytes: Buffer.from(seed.bytes).toString("hex") };
    case "account":
      return { kind: "account", index: seed.index };
    case "sourceOwner":
      return { kind: "sourceOwner" };
    case "destinationOwner":
      return { kind: "destinationOwner" };
  }
}
