import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Keypair,
  LAMPORTS_PER_SOL,
  type ConfirmOptions,
} from "@solana/web3.js";
import {
  marketCapSol,
  priceSolAtSupply,
  tokensFromSol,
  solFromTokens,
  GRADUATION_THRESHOLD_SOL,
} from "./curve";
import type { BuildingOnChain, DeploymentConfig } from "./types";

export type WalletLike = {
  publicKey: PublicKey;
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    options?: ConfirmOptions
  ) => Promise<string>;
};

const BUILDING_SEED = Buffer.from("building");
const MINT_SEED = Buffer.from("mint");
const VAULT_SEED = Buffer.from("vault");

function buildingSeed(buildingId: string): Buffer {
  return Buffer.from(buildingId, "utf8");
}

export function deriveBuildingPda(
  programId: PublicKey,
  buildingId: string
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [BUILDING_SEED, buildingSeed(buildingId)],
    programId
  );
  return pda;
}

export function deriveMintPda(
  programId: PublicKey,
  buildingId: string
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [MINT_SEED, buildingSeed(buildingId)],
    programId
  );
  return pda;
}

export function deriveVaultPda(
  programId: PublicKey,
  buildingId: string
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, buildingSeed(buildingId)],
    programId
  );
  return pda;
}

export function isPlaceholderDeploy(d: DeploymentConfig): boolean {
  return (
    d.programId.includes("BondCuRve") ||
    d.programId.includes("BondCurvE") ||
    d.programId.includes("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS") ||
    d.programId.includes("11111111111111111111111111111") ||
    Object.values(d.buildings).some((b) => b.mint.startsWith("Mint")) ||
    process.env.NEXT_PUBLIC_USE_MOCK === "true"
  );
}

/**
 * Client for the Rank & Bank bonding curve.
 * Uses in-memory mock state when deployment addresses are placeholders,
 * so the frontend can be demo'd before Daniel deploys to devnet.
 */
export class RankAndBankClient {
  readonly connection: Connection;
  readonly programId: PublicKey;
  readonly deployment: DeploymentConfig;
  private mockState: Map<
    string,
    { supply: number; reserveLamports: number; graduated: boolean }
  >;
  readonly useMock: boolean;

  constructor(opts: {
    connection: Connection;
    deployment: DeploymentConfig;
    useMock?: boolean;
  }) {
    this.connection = opts.connection;
    this.deployment = opts.deployment;
    this.useMock = opts.useMock ?? isPlaceholderDeploy(opts.deployment);
    this.programId = safePublicKey(opts.deployment.programId);
    this.mockState = new Map();
    this.seedMockState();
  }

  private seedMockState() {
    for (const id of Object.keys(this.deployment.buildings)) {
      let supply = 40;
      if (id === "one-thousand-museum") supply = 120;
      if (id === "900-biscayne") supply = 90;
      if (id === "paramount-mwc") supply = 55;
      if (id === "icon-brickell") supply = 25;
      // Controversial building near graduation (~4.8 SOL mcap) for demo
      if (id === "the-crosby") {
        supply = 650;
        while (marketCapSol(supply) < 4.8 && supply < 5000) supply += 10;
        while (marketCapSol(supply) > 4.85 && supply > 100) supply -= 5;
      }
      this.mockState.set(id, {
        supply,
        reserveLamports: Math.floor(marketCapSol(supply) * LAMPORTS_PER_SOL * 0.5),
        graduated: false,
      });
    }
  }

  async getPrice(buildingId: string): Promise<number> {
    return (await this.getBuilding(buildingId)).priceSol;
  }

  async getSupply(buildingId: string): Promise<number> {
    return (await this.getBuilding(buildingId)).supply;
  }

  async getMarketCap(buildingId: string): Promise<number> {
    return (await this.getBuilding(buildingId)).marketCapSol;
  }

  async isGraduated(buildingId: string): Promise<boolean> {
    return (await this.getBuilding(buildingId)).graduated;
  }

  async getBuilding(buildingId: string): Promise<BuildingOnChain> {
    if (this.useMock) {
      const m = this.mockState.get(buildingId) ?? {
        supply: 0,
        reserveLamports: 0,
        graduated: false,
      };
      const priceSol = priceSolAtSupply(m.supply);
      return {
        buildingId,
        mint: this.deployment.buildings[buildingId]?.mint ?? "",
        supply: m.supply,
        reserveLamports: m.reserveLamports,
        graduated: m.graduated,
        priceSol,
        marketCapSol: m.supply * priceSol,
      };
    }

    const pda = deriveBuildingPda(this.programId, buildingId);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) {
      throw new Error(`Building account not found: ${buildingId}`);
    }
    // Layout trailing fields (see program README):
    // … supply(8) reserve(8) graduated(1) bump(1) vault_bump(1)
    const len = info.data.length;
    const supply = Number(info.data.readBigUInt64LE(len - 19));
    const reserveLamports = Number(info.data.readBigUInt64LE(len - 11));
    const graduated = info.data[len - 3] === 1;
    const supplyWhole = supply / 1_000_000;
    const priceSol = priceSolAtSupply(supplyWhole);
    return {
      buildingId,
      mint: this.deployment.buildings[buildingId]?.mint ?? "",
      supply: supplyWhole,
      reserveLamports,
      graduated,
      priceSol,
      marketCapSol: supplyWhole * priceSol,
    };
  }

  async getAllBuildings(buildingIds: string[]): Promise<BuildingOnChain[]> {
    return Promise.all(buildingIds.map((id) => this.getBuilding(id)));
  }

  async getTokenBalance(
    buildingId: string,
    owner: PublicKey
  ): Promise<number> {
    if (this.useMock) {
      if (typeof window !== "undefined") {
        const key = `rnb:bal:${buildingId}:${owner.toBase58()}`;
        return Number(window.sessionStorage.getItem(key) ?? "0");
      }
      return 0;
    }
    const mintStr = this.deployment.buildings[buildingId]?.mint;
    if (!mintStr || mintStr.includes("Mint")) return 0;
    const mint = new PublicKey(mintStr);
    const accounts = await this.connection.getParsedTokenAccountsByOwner(
      owner,
      { mint }
    );
    let total = 0;
    for (const a of accounts.value) {
      const amt = a.account.data.parsed.info.tokenAmount.uiAmount;
      total += amt ?? 0;
    }
    return total;
  }

  previewBuy(_buildingId: string, solAmount: number, currentSupply: number) {
    const tokens = tokensFromSol(solAmount, currentSupply);
    const newSupply = currentSupply + tokens;
    return {
      tokens,
      avgPriceSol: tokens > 0 ? solAmount / tokens : 0,
      newPriceSol: priceSolAtSupply(newSupply),
      newMarketCapSol: marketCapSol(newSupply),
    };
  }

  previewSell(_buildingId: string, tokenAmount: number, currentSupply: number) {
    const solOut = solFromTokens(tokenAmount, currentSupply);
    const newSupply = currentSupply - tokenAmount;
    return {
      solOut,
      newPriceSol: priceSolAtSupply(Math.max(0, newSupply)),
      newMarketCapSol: marketCapSol(Math.max(0, newSupply)),
    };
  }

  async buy(
    buildingId: string,
    solAmount: number,
    wallet: WalletLike
  ): Promise<string> {
    if (solAmount <= 0) throw new Error("SOL amount must be positive");
    const state = await this.getBuilding(buildingId);
    if (state.graduated) throw new Error("Building has graduated");

    if (this.useMock) {
      const preview = this.previewBuy(buildingId, solAmount, state.supply);
      const newSupply = state.supply + preview.tokens;
      const mcap = marketCapSol(newSupply);
      this.mockState.set(buildingId, {
        supply: newSupply,
        reserveLamports:
          state.reserveLamports + Math.floor(solAmount * LAMPORTS_PER_SOL),
        graduated: mcap > GRADUATION_THRESHOLD_SOL,
      });
      if (typeof window !== "undefined") {
        const key = `rnb:bal:${buildingId}:${wallet.publicKey.toBase58()}`;
        const prev = Number(window.sessionStorage.getItem(key) ?? "0");
        window.sessionStorage.setItem(key, String(prev + preview.tokens));
      }
      return `mock${Keypair.generate().publicKey.toBase58().slice(0, 44)}`;
    }

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        {
          pubkey: deriveBuildingPda(this.programId, buildingId),
          isSigner: false,
          isWritable: true,
        },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeBuyIx(solAmount),
    });
    const tx = new Transaction().add(ix);
    const sig = await wallet.sendTransaction(tx, this.connection);
    await this.connection.confirmTransaction(sig, "confirmed");
    return sig;
  }

  async sell(
    buildingId: string,
    tokenAmount: number,
    wallet: WalletLike
  ): Promise<string> {
    if (tokenAmount <= 0) throw new Error("Token amount must be positive");
    const state = await this.getBuilding(buildingId);
    if (state.graduated) throw new Error("Building has graduated");

    if (this.useMock) {
      if (typeof window !== "undefined") {
        const key = `rnb:bal:${buildingId}:${wallet.publicKey.toBase58()}`;
        const prev = Number(window.sessionStorage.getItem(key) ?? "0");
        if (prev < tokenAmount) throw new Error("Insufficient token balance");
        window.sessionStorage.setItem(key, String(prev - tokenAmount));
      }
      const preview = this.previewSell(buildingId, tokenAmount, state.supply);
      this.mockState.set(buildingId, {
        supply: Math.max(0, state.supply - tokenAmount),
        reserveLamports: Math.max(
          0,
          state.reserveLamports - Math.floor(preview.solOut * LAMPORTS_PER_SOL)
        ),
        graduated: false,
      });
      return `mock${Keypair.generate().publicKey.toBase58().slice(0, 40)}`;
    }

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        {
          pubkey: deriveBuildingPda(this.programId, buildingId),
          isSigner: false,
          isWritable: true,
        },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeSellIx(tokenAmount),
    });
    const tx = new Transaction().add(ix);
    const sig = await wallet.sendTransaction(tx, this.connection);
    await this.connection.confirmTransaction(sig, "confirmed");
    return sig;
  }
}

function safePublicKey(value: string): PublicKey {
  try {
    return new PublicKey(value);
  } catch {
    return Keypair.generate().publicKey;
  }
}

function encodeBuyIx(solAmount: number): Buffer {
  const disc = Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]);
  const lamports = Buffer.alloc(8);
  lamports.writeBigUInt64LE(BigInt(Math.floor(solAmount * LAMPORTS_PER_SOL)));
  return Buffer.concat([disc, lamports]);
}

function encodeSellIx(tokenAmount: number): Buffer {
  const disc = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]);
  const amt = Buffer.alloc(8);
  amt.writeBigUInt64LE(BigInt(Math.floor(tokenAmount * 1_000_000)));
  return Buffer.concat([disc, amt]);
}

export * from "./curve";
export * from "./types";
