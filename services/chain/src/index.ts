import { SWAP_PROGRAM, TOKEN_PROGRAM } from "@bordrless/sdk";
import { PROGRAM_IDS } from "@bordrless/shared";

export { PROGRAM_IDS };

const programs = {
  token: TOKEN_PROGRAM,
  swap: SWAP_PROGRAM,
} as const;

export type ProgramName = keyof typeof programs;

export function programId(name: ProgramName): string {
  return programs[name].toBase58();
}

export { fetchMint, readMintAccount } from "./mint.ts";
export type { MintSnapshot, RegistryAccount, RegistrySeed } from "./mint.ts";
