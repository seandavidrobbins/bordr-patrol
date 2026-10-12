import { fetchMint } from "../src/mint.ts";

const address = process.argv[2];
const rpcUrl = process.env.SOLANA_RPC_URL;

if (!address || !rpcUrl) {
  console.error("Usage: SOLANA_RPC_URL=https://... npm run read-mint -- <mint>");
  process.exit(1);
}

const snapshot = await fetchMint(rpcUrl, address);
console.log(JSON.stringify(snapshot, null, 2));
