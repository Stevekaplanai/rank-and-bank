# Rank & Bank — Agent instructions

Authoritative product/architecture docs (read these first):

- [rank-and-bank-prd.md](./rank-and-bank-prd.md)
- [rank-and-bank-ard.md](./rank-and-bank-ard.md)

## Roles
- **Daniel** — `programs/bonding_curve`, `packages/sdk`, seed script
- **Ryan** — `data/buildings.json`, photos under `apps/web/public/images/buildings`
- **Steve** — `apps/web` pages, wallet, buy widget, holder chat
- **Carlos** — charts, tx feed, community rank, graduation bar
- **Jeremy** — styling, Vercel, demo script, E2E, backup video

## Hard rules
- Graduation threshold = **5 SOL** market cap
- Building `id` in JSON must match on-chain PDA seed
- Program deploy CI is **workflow_dispatch only**
- No Raydium integration for the hackathon — badge + freeze only
- Holder chat is client-side state gated by real (or mock) token balance

## Default demo path
Leaderboard → `brickell-flatiron` → buy 0.1 SOL → rank moves → holder chat → graduate.
