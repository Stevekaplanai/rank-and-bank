# Jeremy + Steve — Vercel Hour-0 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a live Vercel URL for Rank & Bank in mock mode, with deploy config hardened and demo-facing polish so Jeremy/Steve hour-0 checklist can clear.

**Architecture:** Monorepo Next.js app at `apps/web` deploys via Vercel Root Directory `apps/web`. `vercel.json` runs root `npm install` + SDK build before `next build`. Default Production env uses `NEXT_PUBLIC_USE_MOCK=true` until Daniel ships a real program id.

**Tech Stack:** Next.js 14, Tailwind, npm workspaces, Vercel, `@rank-and-bank/sdk` mock client.

## Global Constraints

- Vercel **Root Directory** must be `apps/web`.
- Production + Preview env (mock-first):
  - `NEXT_PUBLIC_CLUSTER=devnet`
  - `NEXT_PUBLIC_USE_MOCK=true`
  - `NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com`
  - `NEXT_PUBLIC_PROGRAM_ID=BondCurvE11111111111111111111111111111111112`
- Node **20** on Vercel (match `.github/workflows/web-ci.yml`).
- Do **not** flip `NEXT_PUBLIC_USE_MOCK=false` until Daniel provides a real program id.
- Graduation threshold remains **5 SOL**; controversial building id is `the-crosby`.
- Stay in lane: Jeremy = Vercel/docs/styling polish; Steve = wallet/buy smoke + build verification. Do not rewrite bonding-curve program or SDK curve math.
- Prefer cheap/fast models for docs/config/UI polish; mid model only if build/deploy breaks.

**Parallel note:** Tasks 1 and 3 own disjoint files and may run in parallel. Task 2 waits on Task 1. Task 4 waits on Task 2. Task 5 waits on Task 4.

---

### Task 1: Harden Vercel monorepo config (Jeremy)

**Files:**
- Modify: `apps/web/vercel.json`
- Modify: `apps/web/README.md`
- Delete (if present): `apps/web/package-lock.json` (use root lockfile only)
- Optionally create: `apps/web/.nvmrc` with `20`

**Interfaces:**
- Produces: Vercel install/build that matches CI intent; Node 20 pinned; web README points at root README Vercel section

- [ ] **Step 1:** Update `apps/web/vercel.json` to pin Node 20 and align build with CI:
  ```json
  {
    "version": 2,
    "framework": "nextjs",
    "installCommand": "cd ../.. && npm install",
    "buildCommand": "cd ../.. && npm run build -w @rank-and-bank/sdk && npm run build -w @rank-and-bank/web",
    "engines": { "node": "20.x" }
  }
  ```
  If Vercel rejects `engines` in `vercel.json`, use `"buildCommand"` as above and add `apps/web/.nvmrc` containing `20` instead.
- [ ] **Step 2:** Replace `apps/web/README.md` create-next-app boilerplate with a short pointer to root `README.md` (Quick start + Vercel sections) and list the four env vars.
- [ ] **Step 3:** Delete nested `apps/web/package-lock.json` if it exists.
- [ ] **Step 4:** Commit `chore(web): harden Vercel monorepo config for hour-0`

---

### Task 2: Production build green under mock env (Steve)

**Files:**
- Touch only if build fails: `apps/web/**`, `packages/sdk/**` (minimal fixes)

**Interfaces:**
- Produces: clean `npm install` + `npm run build` with mock env; report any residual warnings

- [ ] **Step 1:** From repo root: `npm install`
- [ ] **Step 2:** Run build with mock env (PowerShell):
  ```powershell
  $env:NEXT_PUBLIC_CLUSTER="devnet"
  $env:NEXT_PUBLIC_USE_MOCK="true"
  $env:NEXT_PUBLIC_SOLANA_RPC="https://api.devnet.solana.com"
  $env:NEXT_PUBLIC_PROGRAM_ID="BondCurvE11111111111111111111111111111111112"
  npm run build
  ```
- [ ] **Step 3:** If build fails, fix the smallest set of errors; re-run until green.
- [ ] **Step 4:** Run `npm run typecheck`.
- [ ] **Step 5:** Commit only if code fixes were required: `fix(web): unblock mock production build for Vercel`

---

### Task 3: Demo UI polish — ticker + photo angles (Jeremy)

**Files:**
- Modify: `apps/web/src/components/TransactionFeed.tsx`
- Modify: `apps/web/src/app/building/[id]/page.tsx`
- Do **not** change `tailwind.config.ts` keyframes (ticker already defined)

**Interfaces:**
- Produces: live activity uses `animate-ticker` when ≥2 items; building page can show second photo when `photos[1]` exists

- [ ] **Step 1:** In `TransactionFeed.tsx`, when `items.length >= 2`, render a horizontal marquee row (duplicate the list for seamless loop) using Tailwind `animate-ticker`. Keep the existing scrollable list as fallback for `<2` items or empty state unchanged.
- [ ] **Step 2:** On building detail hero, if `building.photos.length > 1`, add a simple prev/next or thumbnail control to switch between `photos[0]` and `photos[1]` (no new dependencies). Keep graduated badge + name overlay.
- [ ] **Step 3:** Manually sanity-check in browser or via `npm run build -w @rank-and-bank/web` after changes.
- [ ] **Step 4:** Commit `feat(web): ticker feed and second photo for demo polish`

---

### Task 4: Deploy to Vercel (Jeremy + Steve)

**Files:**
- No required code changes; may update `docs/DEMO_SCRIPT.md` only after URL known (prefer Task 5)

**Interfaces:**
- Produces: production deployment URL with mock env

- [ ] **Step 1:** Ensure branch commits from Tasks 1–3 are on the worktree branch; push `feature/jeremy-steve-vercel` to origin if credentials allow.
- [ ] **Step 2:** Deploy with Vercel CLI from repo (or document UI steps if CLI auth missing):
  ```powershell
  npx vercel link --yes
  npx vercel env pull  # optional
  # Set env vars for production+preview to mock values from Global Constraints
  npx vercel --prod --yes
  ```
  Project settings: Root Directory `apps/web`, Node 20.
- [ ] **Step 3:** If CLI is not authenticated, stop with **BLOCKED** and paste the exact UI checklist from root `README.md` Vercel section for the human.
- [ ] **Step 4:** Record the production URL in the implementer report (Task 5 writes it into `docs/DEMO_SCRIPT.md`).

---

### Task 5: Deployed smoke + demo script URL (Steve)

**Files:**
- Modify: `docs/DEMO_SCRIPT.md` (check the Vercel URL line / add production URL)
- Modify: root `README.md` team checklist boxes for Jeremy/Steve if verified

**Interfaces:**
- Produces: verified mock buy path on live URL; demo script references that URL

- [ ] **Step 1:** Open production URL. Confirm header shows mock mode / app loads leaderboard with 5 buildings.
- [ ] **Step 2:** Navigate to `/building/the-crosby`. Confirm buy widget, graduation bar near 4.8 SOL, chart, holder chat render.
- [ ] **Step 3:** In mock mode, complete a 0.1 SOL buy (Phantom optional per README mock path). Confirm market data updates after poll.
- [ ] **Step 4:** Update `docs/DEMO_SCRIPT.md` pre-demo checklist with the production URL (replace “App open on Vercel production URL” with the concrete URL).
- [ ] **Step 5:** Check off Jeremy/Steve lines in root `README.md` team checklist if smoke passed.
- [ ] **Step 6:** Commit `docs: record Vercel production URL for demo`

---

## Execution order

1. **Parallel:** Task 1 + Task 3  
2. Task 2  
3. Task 4  
4. Task 5  
5. Whole-branch review + finishing-a-development-branch
