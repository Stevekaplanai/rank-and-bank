"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQueries } from "@tanstack/react-query";
import { useSdk } from "@/lib/sdk";
import { buildings } from "@/lib/buildings";
import { useMarketBuildings } from "@/lib/hooks";
import { formatSol, shortAddress } from "@/lib/config";

export default function WalletPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { client } = useSdk();
  const { data: markets } = useMarketBuildings();

  const balances = useQueries({
    queries: buildings.map((b) => ({
      queryKey: ["balance", b.id, publicKey?.toBase58()],
      enabled: !!publicKey,
      queryFn: () => {
        if (!publicKey) return 0;
        return client.getTokenBalance(b.id, publicKey);
      },
      refetchInterval: 5_000,
    })),
  });

  const rows = buildings
    .map((b, i) => {
      const bal = balances[i]?.data ?? 0;
      const m = markets?.find((x) => x.id === b.id);
      const value = bal * (m?.priceSol ?? 0);
      return { building: b, bal, value, price: m?.priceSol ?? 0 };
    })
    .filter((r) => r.bal > 0);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-foam">Portfolio</h1>
      {!connected || !publicKey ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="mb-4 text-mist">Connect Phantom to see your holdings.</p>
          <button
            type="button"
            onClick={() => setVisible(true)}
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-navy"
          >
            Connect Phantom
          </button>
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-mist/70">
              Wallet
            </p>
            <p className="font-mono text-sm text-foam">
              {shortAddress(publicKey.toBase58(), 6)}
            </p>
            <p className="mt-4 text-xs uppercase tracking-wide text-mist/70">
              Estimated value
            </p>
            <p className="font-display text-3xl font-bold text-sun">
              {formatSol(totalValue, 3)}
            </p>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-mist">
              No tokens yet.{" "}
              <Link href="/" className="text-teal underline">
                Back a building
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map(({ building, bal, value, price }) => (
                <li key={building.id}>
                  <Link
                    href={`/building/${building.id}`}
                    className="glass flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/10"
                  >
                    <div>
                      <p className="font-display font-semibold text-foam">
                        {building.name}
                      </p>
                      <p className="text-xs text-mist">
                        {bal.toFixed(2)} tokens · {formatSol(price)} each
                      </p>
                    </div>
                    <p className="font-mono text-sm text-sun">
                      {formatSol(value, 3)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
