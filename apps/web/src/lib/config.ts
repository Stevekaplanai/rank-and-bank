import type { DeploymentConfig } from "@rank-and-bank/sdk";
import deploymentJson from "../../../../deployments/devnet.json";

export const deployment = deploymentJson as DeploymentConfig;

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC ??
  deployment.rpcUrl ??
  "https://api.devnet.solana.com";

export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? deployment.programId;

export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";

export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  PROGRAM_ID.includes("BondCu") ||
  PROGRAM_ID.includes("BondCur");

export function explorerTxUrl(signature: string): string {
  if (signature.startsWith("mock")) {
    return `https://explorer.solana.com/?cluster=devnet`;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function shortAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatSol(n: number, digits = 4): string {
  return `${n.toFixed(digits)} SOL`;
}

export function formatMcap(n: number): string {
  return `${n.toFixed(2)} SOL`;
}
