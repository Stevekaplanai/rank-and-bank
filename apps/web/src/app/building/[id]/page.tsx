"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBuilding } from "@/lib/buildings";
import { useBuildingMarket } from "@/lib/hooks";
import { formatMcap, formatSol } from "@/lib/config";
import { BuyWidget } from "@/components/BuyWidget";
import { HolderChat } from "@/components/HolderChat";
import { BondingCurveChart } from "@/components/BondingCurveChart";
import { GraduationBar } from "@/components/GraduationBar";

export default function BuildingPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const building = getBuilding(id);
  const { data: market, isLoading } = useBuildingMarket(id);

  if (!building) {
    return (
      <div className="py-20 text-center">
        <p className="text-mist">Building not found.</p>
        <Link href="/" className="mt-4 inline-block text-teal underline">
          Back to leaderboard
        </Link>
      </div>
    );
  }

  const scoreEntries = Object.entries(building.score_breakdown);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-teal hover:underline">
        ← Leaderboard
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10">
            <Image
              src={building.photos[0]}
              alt={building.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-mist">
                {building.neighborhood}
              </p>
              <h1 className="font-display text-3xl font-bold text-foam sm:text-4xl">
                {building.name}
              </h1>
              <p className="mt-1 text-sm text-mist">{building.address}</p>
            </div>
            {market?.graduated && (
              <span className="absolute right-4 top-4 rounded bg-coral px-3 py-1 text-xs font-bold uppercase text-white">
                Graduated
              </span>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex flex-wrap gap-4">
              <Stat
                label="Ryan's Rank"
                value={`#${building.ryans_rank}`}
              />
              <Stat
                label="Ryan's Score"
                value={`${building.ryans_score.toFixed(1)}/10`}
              />
              <Stat
                label="Community Rank"
                value={
                  isLoading ? "…" : `#${market?.communityRank ?? "—"}`
                }
                accent
              />
              <Stat
                label="Market Cap"
                value={
                  isLoading
                    ? "…"
                    : formatMcap(market?.marketCapSol ?? 0)
                }
              />
              <Stat
                label="Price"
                value={
                  isLoading ? "…" : formatSol(market?.priceSol ?? 0)
                }
              />
            </div>
            <p className="text-sm leading-relaxed text-mist">
              {building.review_excerpt}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {scoreEntries.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl bg-white/5 px-3 py-2 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wide text-mist/70">
                    {k}
                  </p>
                  <p className="font-display text-lg text-foam">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {market && (
            <>
              <BondingCurveChart
                supply={market.supply}
                priceSol={market.priceSol}
              />
              <GraduationBar
                marketCapSol={market.marketCapSol}
                graduated={market.graduated}
              />
            </>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <BuyWidget buildingId={building.id} buildingName={building.name} />
          <HolderChat
            buildingId={building.id}
            seedComments={building.seed_comments}
          />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-mist/60">
        {label}
      </p>
      <p
        className={`font-display text-xl font-semibold ${
          accent ? "text-teal" : "text-foam"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
