# Rank & Bank

Zillow meets pump.fun. Five Miami condos from Ryan's Rankings, each with a Solana bonding-curve token. Community rank = live market cap.

**Law:** [rank-and-bank-ard.md](./rank-and-bank-ard.md) · [rank-and-bank-prd.md](./rank-and-bank-prd.md)

## Monorepo

| Path | Owner | What |
|---|---|---|
| `apps/web` | Steve / Carlos / Jeremy | Next.js 14 frontend |
| `packages/sdk` | Daniel → Steve | TypeScript client (`buy` / `sell` / `getPrice` / …) |
| `programs/bonding_curve` | Daniel | Anchor linear bonding curve |
| `data/buildings.json` | Ryan | Building content + seed chat |
| `scripts/seed-devnet.ts` | Daniel | Init / write `deployments/devnet.json` |
| `.github/workflows` | Steve / Daniel | Web CI + manual program deploy |

## Quick start (frontend demo — mock mode)

```powershell
cd C:\Users\User\OneDrive\Rank-and-Bank
npm install
npm run build -w @rank-and-bank/sdk
copy apps\web\.env.example apps\web\.env.local
npm run dev
```

Open http://localhost:3000 — Phantom optional in mock mode; buys update local state + sessionStorage balances.

Controversial demo building: **Brickell Flatiron** (`brickell-flatiron`) — Ryan #10, staged near 4.8 SOL mcap.

## Env vars (`apps/web`)

| Var | Meaning |
|---|---|
| `NEXT_PUBLIC_SOLANA_RPC` | Devnet RPC (prefer Helius/QuickNode for demo hour) |
| `NEXT_PUBLIC_PROGRAM_ID` | Anchor program id after deploy |
| `NEXT_PUBLIC_CLUSTER` | `devnet` |
| `NEXT_PUBLIC_USE_MOCK` | `true` forces SDK mock even with a real program id |

## Vercel (Jeremy + Steve — hour 0)

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. **Root Directory:** `apps/web`
4. Framework: Next.js (auto).
5. Environment variables (Production + Preview):

```
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=BondCurvE11111111111111111111111111111111112
```

6. After Daniel deploys: flip `NEXT_PUBLIC_USE_MOCK=false`, set real `NEXT_PUBLIC_PROGRAM_ID` + RPC, redeploy.
7. Every push to `main` auto-deploys the frontend.

### Optional `vercel.json` note

Root Directory in the Vercel project UI is enough — no monorepo rewrite required if Root = `apps/web`. Install command can stay default; if workspaces fail on Vercel, set Install Command to:

```
cd ../.. && npm install && npm run build -w @rank-and-bank/sdk
```

…and keep Root Directory `apps/web`.

## CI/CD

### Web — auto on push/PR
`.github/workflows/web-ci.yml` → install, build SDK, typecheck, `next build` with mock env. Also runnable via **Actions → Web CI → Run workflow**.

### Program — **manual only** (`workflow_dispatch`)
`.github/workflows/deploy-program.yml` is **not** triggered by push or PR. Auto-deploying the Anchor program on every commit is intentionally **disabled** — it burns SOL and can break a live demo mid-day.

Trigger only from **Actions → Deploy Anchor Program (devnet) → Run workflow** (optional seed + pregraduate Flatiron to ~4.8 SOL).

GitHub Secrets (Daniel / repo admin):

| Secret | Value |
|---|---|
| `DEVNET_DEPLOYER_KEYPAIR` | Keypair JSON byte array (required for live deploy) |
| `DEVNET_SOLANA_DEPLOY_URL` | Paid/devnet RPC URL (falls back to public devnet if empty) |
| `PROGRAM_ID` | Deployed program pubkey (used by seed step) |

Without `DEVNET_DEPLOYER_KEYPAIR`, the workflow soft-skips deploy steps (documents the required secret instead of failing on missing Actions expression hacks).

## Anchor deploy (local)

See [programs/bonding_curve/README.md](./programs/bonding_curve/README.md).

```powershell
cd C:\Users\User\OneDrive\Rank-and-Bank
npm run seed -- --pregraduate brickell-flatiron 4.8
```

## Demo script

See [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md) (2 minutes, **5 SOL** graduation).

## Team checklist

- [ ] Ryan: replace placeholder photos with real shots if available
- [ ] Daniel: `anchor deploy` → update `deployments/devnet.json` + Vercel env
- [ ] Steve: wallet + buy path verified in mock, then against devnet
- [ ] Carlos: chart / feed / graduation bar on detail + home
- [ ] Jeremy: Vercel URL live + backup video at hour 4

Tagline: **Ryan ranks them. The community backs them. The chain settles everything.**
