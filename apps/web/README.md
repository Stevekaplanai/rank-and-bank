# Rank & Bank — Web app

This package is the Next.js frontend (`apps/web`). Monorepo setup, local quick start, and Vercel deploy steps live in the [root README](../../README.md) — see **Quick start (frontend demo — mock mode)** and **Vercel (Jeremy + Steve — hour 0)**.

## Environment variables

Set these in Vercel (Production + Preview) or in `apps/web/.env.local` for local dev:

| Var | Meaning |
|---|---|
| `NEXT_PUBLIC_SOLANA_RPC` | Devnet RPC (prefer Helius/QuickNode for demo hour) |
| `NEXT_PUBLIC_PROGRAM_ID` | Anchor program id after deploy |
| `NEXT_PUBLIC_CLUSTER` | `devnet` |
| `NEXT_PUBLIC_USE_MOCK` | `true` forces SDK mock even with a real program id |
