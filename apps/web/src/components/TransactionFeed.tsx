"use client";

import { useTransactionFeed } from "@/lib/hooks";
import { explorerTxUrl, shortAddress } from "@/lib/config";

export function TransactionFeed() {
  const { data: items = [] } = useTransactionFeed();

  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-2 font-display text-sm font-semibold text-foam">
          Live activity
        </h3>
        <p className="text-sm text-mist">
          Buys will stream here. Make the first back on a building.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-3 font-display text-sm font-semibold text-foam">
        Live activity
      </h3>
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {items.map((tx) => (
          <li
            key={`${tx.signature}-${tx.time}`}
            className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 text-sm last:border-0"
          >
            <div className="min-w-0">
              <p className="truncate text-foam">
                <span className="text-coral">{tx.type.toUpperCase()}</span>{" "}
                {tx.solAmount.toFixed(2)} SOL · {tx.buildingName}
              </p>
              <a
                href={explorerTxUrl(tx.signature)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-teal hover:underline"
              >
                {shortAddress(tx.signature, 6)}
              </a>
            </div>
            <span className="shrink-0 text-xs text-mist/70">
              {new Date(tx.time).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
