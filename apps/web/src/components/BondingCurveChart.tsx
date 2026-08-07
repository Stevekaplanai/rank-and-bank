"use client";

import dynamic from "next/dynamic";

/** Client-only chart wrapper — recharts must not SSR (ARD-010). */
export const BondingCurveChart = dynamic(
  () =>
    import("./BondingCurveChartInner").then((m) => m.BondingCurveChartInner),
  {
    ssr: false,
    loading: () => (
      <div className="glass flex h-72 items-center justify-center rounded-2xl p-4 sm:h-80">
        <p className="text-sm text-mist">Loading bonding curve…</p>
      </div>
    ),
  }
);
