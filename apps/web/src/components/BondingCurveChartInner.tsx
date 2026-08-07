"use client";

import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { generateCurvePoints } from "@rank-and-bank/sdk";

type Props = {
  supply: number;
  priceSol: number;
};

export function BondingCurveChartInner({ supply, priceSol }: Props) {
  const data = useMemo(() => generateCurvePoints(1000), []);

  return (
    <div className="glass h-72 rounded-2xl p-4 sm:h-80">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-foam">
          Bonding curve
        </h3>
        <p className="font-mono text-xs text-mist">
          supply {supply.toFixed(0)} · {priceSol.toFixed(4)} SOL
        </p>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b8a9a" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#0b8a9a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="supply"
            tick={{ fill: "#b8dce4", fontSize: 10 }}
            stroke="#ffffff22"
          />
          <YAxis
            tick={{ fill: "#b8dce4", fontSize: 10 }}
            stroke="#ffffff22"
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "#051c2c",
              border: "1px solid #ffffff22",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#e6f3f6" }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="none"
            fill="url(#curveFill)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#0b8a9a"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={Math.min(1000, Math.max(0, Math.round(supply)))}
            y={priceSol}
            r={6}
            fill="#ff6b4a"
            stroke="#fff"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
