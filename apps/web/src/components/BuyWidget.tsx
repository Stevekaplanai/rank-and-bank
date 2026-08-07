"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSdk } from "@/lib/sdk";
import {
  pushTxFeed,
  useBuildingMarket,
  useInvalidateMarkets,
  useTokenBalance,
} from "@/lib/hooks";
import { explorerTxUrl, formatSol } from "@/lib/config";

type Props = {
  buildingId: string;
  buildingName: string;
};

export function BuyWidget({ buildingId, buildingName }: Props) {
  const { client } = useSdk();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { data: market } = useBuildingMarket(buildingId);
  const { data: balance = 0 } = useTokenBalance(buildingId);
  const invalidate = useInvalidateMarkets();

  const [solAmount, setSolAmount] = useState("0.1");
  const [busy, setBusy] = useState(false);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sol = Number(solAmount) || 0;
  const preview = useMemo(() => {
    if (!market) return null;
    return client.previewBuy(buildingId, sol, market.supply);
  }, [client, buildingId, sol, market]);

  async function onBuy() {
    setError(null);
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    if (!market || market.graduated) {
      setError("Building has graduated — curve is frozen.");
      return;
    }
    if (sol <= 0) {
      setError("Enter a SOL amount greater than 0.");
      return;
    }
    setBusy(true);
    try {
      const wallet = {
        publicKey,
        sendTransaction: (
          tx: Parameters<typeof sendTransaction>[0]
        ): Promise<string> => sendTransaction(tx, connection),
      };
      const sig = await client.buy(buildingId, sol, wallet);
      setLastSig(sig);
      pushTxFeed({
        signature: sig,
        buildingId,
        buildingName,
        solAmount: sol,
        type: "buy",
        time: Date.now(),
      });
      invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Buy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foam">
          Back this building
        </h3>
        <span className="text-xs text-mist">
          Balance: {balance.toFixed(2)} tokens
        </span>
      </div>

      {market?.graduated ? (
        <div className="rounded-xl bg-coral/20 p-4 text-center">
          <p className="font-display text-xl font-bold text-coral">GRADUATED</p>
          <p className="mt-1 text-sm text-mist">
            Bonding curve frozen. Liquidity migrates next (Raydium stub).
          </p>
        </div>
      ) : (
        <>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mist/70">
            SOL amount
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void onBuy();
            }}
            className="mb-3 w-full rounded-xl border border-white/15 bg-navy/60 px-4 py-3 font-mono text-foam outline-none ring-teal focus:ring-2"
          />
          {preview && (
            <p className="mb-4 text-sm text-mist">
              You&apos;ll get ~{" "}
              <span className="font-semibold text-sun">
                {preview.tokens.toFixed(1)} tokens
              </span>{" "}
              at avg {formatSol(preview.avgPriceSol)}. New price ≈{" "}
              {formatSol(preview.newPriceSol)}.
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onBuy()}
            className="w-full animate-pulseGlow rounded-full bg-coral px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-coral/90 disabled:opacity-50"
          >
            {busy
              ? "Confirming…"
              : connected
                ? "Buy tokens"
                : "Connect Phantom"}
          </button>
        </>
      )}

      {error && <p className="mt-3 text-sm text-coral">{error}</p>}
      {lastSig && (
        <a
          href={explorerTxUrl(lastSig)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-sm text-teal underline"
        >
          View tx on Solana Explorer →
        </a>
      )}
    </div>
  );
}
