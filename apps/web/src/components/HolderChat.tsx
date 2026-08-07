"use client";

import { useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { SeedComment } from "@/lib/types";
import { useTokenBalance } from "@/lib/hooks";
import { shortAddress } from "@/lib/config";

type Props = {
  buildingId: string;
  seedComments: SeedComment[];
};

type Comment = {
  user: string;
  text: string;
  tokens: number;
};

export function HolderChat({ buildingId, seedComments }: Props) {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: balance = 0, isLoading } = useTokenBalance(buildingId);
  const [comments, setComments] = useState<Comment[]>(seedComments);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canPost = connected && balance > 0;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    if (balance <= 0) {
      setError("You need tokens in this building to post.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    setComments((prev) => [
      {
        user: shortAddress(publicKey.toBase58(), 4),
        text: trimmed,
        tokens: Math.round(balance),
      },
      ...prev,
    ]);
    setText("");
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-1 font-display text-lg font-semibold text-foam">
        Holder chat
      </h3>
      <p className="mb-4 text-xs text-mist">
        Skin in the game — token holders only.{" "}
        {isLoading
          ? "Checking balance…"
          : canPost
            ? `You're in (${balance.toFixed(1)} tokens).`
            : "Buy tokens to unlock posting."}
      </p>

      <form onSubmit={onSubmit} className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            canPost ? "Say something holders will see…" : "Holders only"
          }
          disabled={!canPost}
          className="flex-1 rounded-xl border border-white/15 bg-navy/60 px-3 py-2 text-sm text-foam outline-none ring-teal focus:ring-2 disabled:opacity-50"
        />
        <button
          type="submit"
          className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50"
          disabled={!canPost && connected}
        >
          {connected ? "Post" : "Connect"}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-coral">{error}</p>}

      <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {comments.map((c, i) => (
          <li
            key={`${c.user}-${i}`}
            className="rounded-xl border border-white/5 bg-white/5 px-3 py-2"
          >
            <div className="mb-1 flex items-center justify-between text-xs text-mist">
              <span className="font-mono">{c.user}</span>
              <span>{c.tokens} tokens</span>
            </div>
            <p className="text-sm text-foam">{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
