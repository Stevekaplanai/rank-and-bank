"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { USE_MOCK, CLUSTER } from "@/lib/config";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-foam sm:text-2xl">
            Rank<span className="text-coral">&</span>Bank
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-mist/70 sm:inline">
            Miami
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="hidden text-sm text-mist hover:text-foam sm:inline"
          >
            Leaderboard
          </Link>
          <Link
            href="/wallet"
            className="hidden text-sm text-mist hover:text-foam sm:inline"
          >
            Portfolio
          </Link>
          {USE_MOCK && (
            <span className="rounded-full bg-sun/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sun">
              Demo · {CLUSTER}
            </span>
          )}
          <WalletMultiButton className="!h-10 !rounded-full !bg-teal !px-4 !text-sm !font-semibold !text-navy hover:!bg-teal/90" />
        </nav>
      </div>
    </header>
  );
}
