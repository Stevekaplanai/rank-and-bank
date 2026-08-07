"use client";

import { useMarketBuildings } from "@/lib/hooks";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { TransactionFeed } from "@/components/TransactionFeed";
import { CONTROVERSIAL_BUILDING_ID } from "@/lib/buildings";
import Link from "next/link";

export default function HomePage() {
  const { data: rows, isLoading, isError, error } = useMarketBuildings();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-12 sm:px-10 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(11,138,154,0.5), transparent 45%), linear-gradient(200deg, rgba(255,107,74,0.25), transparent 40%), url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative animate-rise">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-teal">
            Miami · Solana conviction markets
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight text-foam sm:text-5xl md:text-6xl">
            Rank<span className="text-coral">&</span>Bank
          </h1>
          <p className="mt-4 max-w-xl text-base text-mist sm:text-lg">
            Ryan ranks Miami&apos;s condos. You back the ones you believe in.
            Prices move on a bonding curve. Community rank is live market
            cap — not an expert score.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/building/${CONTROVERSIAL_BUILDING_ID}`}
              className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white"
            >
              See the controversial pick
            </Link>
            <a
              href="#leaderboard"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-foam"
            >
              View leaderboard
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section id="leaderboard" className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="font-display text-lg font-semibold text-foam">
              Leaderboard
            </h2>
            <p className="text-xs text-mist">
              Ryan&apos;s Rank vs Community Rank · polls every 5s
            </p>
          </div>
          <div className="hidden border-b border-white/5 px-4 py-2 text-[10px] uppercase tracking-wide text-mist/50 sm:grid sm:grid-cols-[48px_1fr_100px_100px_120px_100px] sm:gap-4">
            <span>#</span>
            <span>Building</span>
            <span className="text-right">Ryan</span>
            <span className="text-right">Community</span>
            <span className="text-right">Mcap</span>
            <span className="text-right">Price</span>
          </div>
          {isLoading && (
            <p className="p-6 text-sm text-mist">Loading markets…</p>
          )}
          {isError && (
            <p className="p-6 text-sm text-coral">
              Failed to load markets:{" "}
              {error instanceof Error ? error.message : "unknown"}
            </p>
          )}
          {rows?.map((b, i) => (
            <LeaderboardRow key={b.id} building={b} index={i} />
          ))}
        </section>

        <aside className="space-y-4">
          <TransactionFeed />
          <div className="glass rounded-2xl p-4 text-sm text-mist">
            <p className="font-display text-foam">How ranking works</p>
            <p className="mt-2">
              <strong className="text-foam">Ryan&apos;s Rank</strong> is static
              expert score.{" "}
              <strong className="text-teal">Community Rank</strong> sorts by
              live token market cap. The gap is the story.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
