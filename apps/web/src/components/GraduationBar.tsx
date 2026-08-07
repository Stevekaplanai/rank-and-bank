"use client";

import { GRADUATION_THRESHOLD_SOL } from "@rank-and-bank/sdk";

type Props = {
  marketCapSol: number;
  graduated: boolean;
};

export function GraduationBar({ marketCapSol, graduated }: Props) {
  const pct = Math.min(
    100,
    (marketCapSol / GRADUATION_THRESHOLD_SOL) * 100
  );

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foam">
          Graduation progress
        </h3>
        <span className="font-mono text-xs text-mist">
          {marketCapSol.toFixed(2)} / {GRADUATION_THRESHOLD_SOL} SOL
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-navy/80">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            graduated ? "bg-coral" : "bg-gradient-to-r from-teal to-sun"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-mist">
        {graduated
          ? "GRADUATED — curve frozen. Raydium pool coming soon."
          : `${(GRADUATION_THRESHOLD_SOL - marketCapSol).toFixed(2)} SOL to graduation.`}
      </p>
    </div>
  );
}
