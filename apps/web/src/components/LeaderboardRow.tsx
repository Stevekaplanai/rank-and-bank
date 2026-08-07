import Link from "next/link";
import type { BuildingWithMarket } from "@/lib/types";
import { formatMcap, formatSol } from "@/lib/config";

type Props = {
  building: BuildingWithMarket;
  index: number;
};

export function LeaderboardRow({ building, index }: Props) {
  const delta = building.ryans_rank - building.communityRank;
  const drama = Math.abs(delta) >= 5;

  return (
    <Link
      href={`/building/${building.id}`}
      className="group grid animate-rise grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 px-3 py-4 transition hover:bg-white/5 sm:grid-cols-[48px_1fr_100px_100px_120px_100px] sm:gap-4 sm:px-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/20 font-display text-lg font-bold text-teal">
        {building.communityRank}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-display text-base font-semibold text-foam group-hover:text-sun sm:text-lg">
            {building.name}
          </h2>
          {building.graduated && (
            <span className="rounded bg-coral px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Graduated
            </span>
          )}
          {drama && !building.graduated && (
            <span className="rounded bg-sun/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sun">
              Controversial
            </span>
          )}
        </div>
        <p className="truncate text-xs text-mist/80">
          {building.neighborhood} · Ryan #{building.ryans_rank} ·{" "}
          {building.ryans_score.toFixed(1)}/10
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[10px] uppercase tracking-wide text-mist/60">
          Ryan
        </p>
        <p className="font-display text-lg font-semibold text-foam">
          #{building.ryans_rank}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[10px] uppercase tracking-wide text-mist/60">
          Community
        </p>
        <p className="font-display text-lg font-semibold text-teal">
          #{building.communityRank}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[10px] uppercase tracking-wide text-mist/60">
          Market cap
        </p>
        <p className="font-mono text-sm text-foam">
          {formatMcap(building.marketCapSol)}
        </p>
      </div>

      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wide text-mist/60">
          Price
        </p>
        <p className="font-mono text-sm text-sun">
          {formatSol(building.priceSol)}
        </p>
        <span className="mt-1 inline-block text-xs font-semibold text-coral opacity-0 transition group-hover:opacity-100">
          Back →
        </span>
      </div>
    </Link>
  );
}
