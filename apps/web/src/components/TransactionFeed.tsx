"use client";

import { useTransactionFeed, type TxFeedItem } from "@/lib/hooks";
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
      {items.length >= 2 ? (
        <div className="overflow-hidden">
          <div className="flex w-max animate-ticker">
            {[...items, ...items].map((tx, index) => (
              <TickerItem
                key={`${tx.signature}-${tx.time}-${index}`}
                tx={tx}
              />
            ))}
          </div>
        </div>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {items.map((tx) => (
            <FeedListItem
              key={`${tx.signature}-${tx.time}`}
              tx={tx}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TickerItem({ tx }: { tx: TxFeedItem }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-r border-white/10 px-4 py-1 text-sm last:border-r-0">
      <p className="whitespace-nowrap text-foam">
        <span className="text-coral">{tx.type.toUpperCase()}</span>{" "}
        {tx.solAmount.toFixed(2)} SOL · {tx.buildingName}
      </p>
      <a
        href={explorerTxUrl(tx.signature)}
        target="_blank"
        rel="noreferrer"
        className="whitespace-nowrap font-mono text-xs text-teal hover:underline"
      >
        {shortAddress(tx.signature, 6)}
      </a>
      <span className="whitespace-nowrap text-xs text-mist/70">
        {new Date(tx.time).toLocaleTimeString()}
      </span>
    </div>
  );
}

function FeedListItem({ tx }: { tx: TxFeedItem }) {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 text-sm last:border-0">
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
  );
}
