#!/usr/bin/env npx tsx
/**
 * Seed Rank & Bank buildings on Solana DEVNET.
 *
 * Prerequisites:
 *   - Anchor program deployed (programs/bonding_curve)
 *   - SOLANA_KEYPAIR or ~/.config/solana/id.json funded on devnet
 *   - DEPLOYMENT_PROGRAM_ID / NEXT_PUBLIC_PROGRAM_ID set to deployed program id
 *
 * Usage:
 *   cd C:\Users\User\OneDrive\Rank-and-Bank
 *   npm run seed
 *   npx tsx scripts/seed-devnet.ts --pregraduate brickell-flatiron 4.8
 *
 * Writes deployments/devnet.json with mint + PDA addresses.
 *
 * Until Anchor + Solana CLI are installed and the program is deployed,
 * this derives deterministic PDA placeholders from the program id and
 * exits 0 so CI/web can proceed in mock mode.
 */

import fs from "fs";
import path from "path";
import { PublicKey } from "@solana/web3.js";
import buildings from "../data/buildings.json";
import {
  deriveBuildingPda,
  deriveMintPda,
  isPlaceholderDeploy,
} from "../packages/sdk/src/client";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "deployments", "devnet.json");

const PLACEHOLDER_PROGRAM_ID =
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";

type Args = {
  pregraduateId?: string;
  pregraduateMcap?: number;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--pregraduate" && argv[i + 1]) {
      out.pregraduateId = argv[++i];
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        out.pregraduateMcap = Number(argv[++i]);
      }
    }
  }
  return out;
}

function isPlaceholderProgramId(programId: string): boolean {
  return isPlaceholderDeploy({
    cluster: "devnet",
    programId,
    rpcUrl: "",
    graduationThresholdSol: 5,
    curve: { basePriceLamports: 1_000_000, slopeLamports: 10_000 },
    buildings: {},
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const programId =
    process.env.DEPLOYMENT_PROGRAM_ID ||
    process.env.NEXT_PUBLIC_PROGRAM_ID ||
    PLACEHOLDER_PROGRAM_ID;

  const rpc =
    process.env.SOLANA_RPC ||
    process.env.NEXT_PUBLIC_SOLANA_RPC ||
    "https://api.devnet.solana.com";

  const placeholder = isPlaceholderProgramId(programId);

  // Trim check — PDA seeds must match JSON ids exactly (ADR-006)
  for (const b of buildings) {
    if (b.id !== b.id.trim()) {
      throw new Error(
        `Building id has leading/trailing whitespace: "${b.id}"`
      );
    }
    if (!b.id || b.id.length > 32) {
      throw new Error(`Invalid building id length: "${b.id}"`);
    }
    for (const photo of b.photos) {
      const rel = photo.replace(/^\//, "");
      const abs = path.join(ROOT, "apps", "web", "public", rel);
      if (!fs.existsSync(abs)) {
        throw new Error(`Missing photo for ${b.id}: ${abs}`);
      }
    }
  }

  console.log("Rank & Bank seed");
  console.log(`  RPC: ${rpc}`);
  console.log(`  Program: ${programId}`);
  console.log(`  Buildings: ${buildings.length}`);

  if (placeholder) {
    console.log(
      "\n⚠️  Placeholder program ID — writing PDA map for mock mode.\n" +
        "    After `anchor deploy`, set DEPLOYMENT_PROGRAM_ID and re-run.\n" +
        "    Frontend stays in mock mode until a real program id is set.\n"
    );
  } else {
    console.log(
      "\n✅ Real program ID detected.\n" +
        "   PDA/mint addresses below are derived; call initialize_building\n" +
        "   on-chain (Anchor TS + IDL) for each building before live buys.\n"
    );
  }

  let programPk: PublicKey;
  try {
    programPk = new PublicKey(programId);
  } catch {
    throw new Error(`Invalid program id (not base58 pubkey): ${programId}`);
  }

  const buildingMap: Record<string, { mint: string; buildingPda: string }> =
    {};

  for (const b of buildings) {
    buildingMap[b.id] = {
      mint: deriveMintPda(programPk, b.id).toBase58(),
      buildingPda: deriveBuildingPda(programPk, b.id).toBase58(),
    };
  }

  const payload = {
    cluster: "devnet",
    programId,
    rpcUrl: rpc,
    graduationThresholdSol: 5,
    curve: {
      basePriceLamports: 1_000_000,
      slopeLamports: 10_000,
    },
    buildings: buildingMap,
    seededAt: new Date().toISOString(),
    pregraduate: {
      buildingId: args.pregraduateId ?? "brickell-flatiron",
      targetMcapSol: args.pregraduateMcap ?? 4.8,
    },
    notes: placeholder
      ? "Placeholder program - SDK mock mode. Ryan controversial = brickell-flatiron (#10) staged ~4.8 SOL mcap."
      : "Real program id - run initialize_building for each id before live buys. Pregraduate brickell-flatiron @ ~4.8 SOL.",
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${OUT}`);
  console.log(
    `Demo staging target: ${payload.pregraduate.buildingId} @ ~${payload.pregraduate.targetMcapSol} SOL mcap`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
