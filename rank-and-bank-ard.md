# Architecture Decision Record — Rank & Bank

## Status
Proposed — 2026-08-06

## Context
5-person team, 5-hour build window, Solana hackathon (Superteam USA, Miami). Product: bonding-curve token market for Miami real estate rankings. Must demo in 2 minutes on Solana devnet with a live buy flow, rank changes, and a graduation event.

---

## ADR-001: Bonding Curve Implementation

**Decision:** Custom Anchor program with a linear bonding curve.

**Rationale:**
- Metaplex Genesis Bonding Curve has docs but the setup time (registration, co-signer config, fee structure) is risky for a 5-hour window.
- pump.fun's curve contract is open but tightly coupled to their platform.
- A custom linear curve (`price = base_price + (supply * slope)`) is ~50 lines of Anchor code, fully controllable, and demo-safe.

**Curve formula:**
```
price(supply) = BASE_PRICE + (supply * SLOPE)

BASE_PRICE = 0.001 SOL (1,000,000 lamports)
SLOPE = 0.00001 SOL per token (10,000 lamports per token)
```

**Example:**
- Token 1: 0.001 SOL
- Token 100: 0.002 SOL
- Token 1,000: 0.011 SOL
- Token 5,000: 0.051 SOL

This means a 0.1 SOL buy at token #100 gets ~33 tokens. Price moves visibly on each buy. Good for demo.

**Buy function:**
```
buy(building_id, sol_amount):
  current_supply = get_supply(building_id)
  tokens_to_mint = calculate_tokens_from_sol(sol_amount, current_supply)
  mint_tokens(building_id, user, tokens_to_mint)
  add_to_reserve(building_id, sol_amount)
```

**Sell function:**
```
sell(building_id, token_amount):
  current_supply = get_supply(building_id)
  sol_to_return = calculate_sol_from_tokens(token_amount, current_supply)
  burn_tokens(building_id, user, token_amount)
  withdraw_from_reserve(building_id, user, sol_to_return)
```

**Consequences:**
- Simple math, easy to test, easy to demo.
- No external dependency on Metaplex or pump.fun.
- Curve shape is linear (not exponential) so prices don't explode too fast for a demo.
- Daniel owns this fully — no integration risk.

**Rejected alternatives:**
- Metaplex Genesis Bonding Curve: too much setup overhead
- pump.fun contract: too coupled, hard to fork cleanly in 5 hours
- Exponential curve: prices spike too fast, hard to demo gradual rank changes

---

## ADR-002: Token Standard

**Decision:** SPL tokens (Solana Program Library) via Anchor's `token` module.

**Rationale:**
- SPL is the native Solana token standard. Every wallet, explorer, and tool supports it.
- Anchor has built-in SPL token helpers (`anchor-spl` crate).
- Phantom wallet natively supports SPL transfers and balances.
- 5 token mints (one per building) is trivial to create on devnet.

**Implementation:**
- Each building gets its own mint account (PDA derived from building ID)
- Token decimals: 6 (enough granularity for small purchases)
- Mint authority: the bonding curve program (so it can mint on buy, burn on sell)
- Freeze authority: none (tokens are freely transferable)

**Consequences:**
- Standard tooling works out of the box (Phantom, Solscan, Solana Explorer)
- No custom token standard to explain to judges
- Transferable tokens enable a secondary market (stretch goal)

---

## ADR-003: Frontend Stack

**Decision:** Next.js 14 (App Router) + Tailwind CSS + TypeScript.

**Rationale:**
- Fastest scaffold-to-deploy path for a team that knows React.
- Vercel deploy in 2 minutes (connect repo, done).
- App Router gives server components if we need them (we probably won't, but they're there).
- Tailwind for rapid styling — Miami aesthetic needs custom colors but no custom CSS files.

**Pages:**
- `/` — Leaderboard (5 buildings, Ryan's Rank vs. Community Rank, market cap, live tx feed)
- `/building/[id]` — Building detail (photos, review, bonding curve chart, buy widget, holder chat)
- `/wallet` — Portfolio (your token balances across all buildings, total spent, current value)

**Components:**
- `<LeaderboardRow>` — one building in the leaderboard
- `<BondingCurveChart>` — price vs. supply chart (Carlos)
- `<BuyWidget>` — SOL input, token output preview, buy button
- `<TransactionFeed>` — live stream of recent buys/sells
- `<HolderChat>` — comment thread, gated by token balance
- `<GraduationBar>` — progress to graduation threshold

**State management:**
- React Query (TanStack Query) for polling on-chain data every 5 seconds
- No Redux, no Zustand — keep it simple, use hooks + server state

**Consequences:**
- Vercel deployment is trivial
- Hot reload during development
- TypeScript catches errors before runtime
- React Query polling is the simplest live-data approach (no websockets needed)

**Rejected alternatives:**
- Vite + React: fine, but Next.js gives free routing and Vercel deploy
- SvelteKit: smaller bundle but team knows React
- Plain HTML: too manual for 5 interactive pages

---

## ADR-004: Wallet Integration

**Decision:** @solana/wallet-adapter with Phantom as the primary wallet.

**Rationale:**
- Phantom is the dominant Solana wallet (mobile + desktop extension)
- @solana/wallet-adapter-react gives a `<WalletProvider>` that handles connection state
- Standard across all Solana dApps — judges will have Phantom installed

**Implementation:**
- Wrap app in `<ConnectionProvider>` + `<WalletProvider>` + `<ThemeProvider>`
- Use `useWallet()` hook for: connect, disconnect, publicKey, signTransaction
- Buy flow: user clicks BUY → build transaction → `wallet.sendTransaction(tx, connection)` → confirm
- Token balance check: `connection.getParsedTokenAccountsByOwner(publicKey, {mint: buildingMint})`

**Consequences:**
- Works on desktop (Phantom extension) and mobile (Phantom mobile via deep link)
- No custom wallet UI needed — Phantom handles the popup
- Judges with Phantom installed can interact live

---

## ADR-005: Live Data Strategy

**Decision:** Poll Solana RPC every 5 seconds via React Query. No websockets.

**Rationale:**
- Solana devnet RPC supports `getProgramAccounts` and `getTokenSupply` — enough for our data.
- Websocket subscriptions add complexity (connection management, reconnection, cleanup).
- 5-second polling is fast enough for a demo (prices move when someone buys, not every millisecond).
- React Query handles caching, deduplication, and background refetch automatically.

**What we poll:**
- Token supply for each building (for bonding curve price calculation)
- Recent transaction signatures for the program (for the tx feed)
- User's token balances (for portfolio + chat gating)

**Consequences:**
- Slight delay (up to 5 seconds) between buy and price update on screen
- Simpler code, fewer bugs, no websocket cleanup
- Good enough for demo — the buy confirmation itself is instant (wallet popup), the chart updates on next poll

**Rejected alternatives:**
- Solana account websockets (`accountSubscribe`): works but adds reconnection logic
- Custom event emitter from the program: requires program-side event logs, more Anchor complexity
- Manual `setInterval` fetching: React Query is cleaner

---

## ADR-006: Building Data

**Decision:** Static JSON file in the repo. No backend, no database.

**Rationale:**
- 5 buildings, fixed data. No need for a database.
- Ryan provides the data as a JSON file committed to the repo.
- Frontend imports it directly (`import buildings from './data/buildings.json'`).
- Photos go in `/public/images/buildings/`.

**JSON schema:**
```json
[
  {
    "id": "aria-on-the-bay",
    "name": "Aria on the Bay",
    "address": "690 NE 18th St, Miami, FL 33132",
    "neighborhood": "Edgewater",
    "ryans_rank": 7,
    "ryans_score": 8.2,
    "score_breakdown": {
      "location": 8.5,
      "amenities": 9.0,
      "views": 8.0,
      "value": 7.5,
      "noise": 8.0
    },
    "review_excerpt": "Great views of the bay, solid amenities, but the location is still developing.",
    "photos": ["/images/buildings/aria-1.jpg", "/images/buildings/aria-2.jpg"],
    "seed_comments": [
      { "user": "0xabc...def", "text": "The pool deck is insane", "tokens": 47 },
      { "user": "0x123...456", "text": "Ryan is wrong about the views", "tokens": 22 }
    ]
  }
]
```

**Consequences:**
- Zero backend infrastructure
- Data is type-safe (TypeScript imports the JSON with types)
- Ryan edits one file to update all building content
- Photos are served from Next.js `/public` — no CDN needed

---

## ADR-007: Graduation Mechanism

**Decision:** When a building's market cap (token supply × current price) exceeds 5 SOL, mark it as "graduated" on-chain. Freeze the bonding curve. Show a "GRADUATED" badge.

**Rationale:**
- pump.fun's graduation (migrate to Raydium) is a proven narrative, but actually integrating Raydium in 5 hours is too risky.
- The "graduation moment" is the story, not the actual AMM migration.
- Freezing the curve + showing a badge is 10 lines of Anchor code.
- For the demo, we buy enough tokens to push a building over the threshold live.

**Implementation:**
- Add `graduated: bool` field to the building's on-chain account
- In `buy()`, after minting, check if market cap > 5 SOL. If yes, set `graduated = true`.
- When `graduated == true`, `buy()` and `sell()` return an error ("Building has graduated").
- Frontend shows "GRADUATED" badge and disables the buy button.
- Stretch: show a "Raydium pool coming soon" placeholder.

**Consequences:**
- The graduation moment is real (on-chain state change) but the Raydium integration is faked.
- Judges see the concept without us building a full AMM.
- If we have time, we can add a "migrate to Raydium" function that creates a simple constant-product pool. If not, the badge is enough.

---

## ADR-008: Holder Chat

**Decision:** Client-side comment thread gated by token balance. No backend, no on-chain storage for comments.

**Rationale:**
- Real on-chain chat (storing messages in Solana accounts) is expensive and slow for a demo.
- A simple React state array with seeded comments is enough to show the concept.
- Gating: check `connection.getTokenAccountsByOwner(user, {mint: buildingMint})` — if balance > 0, user can post.
- Comments live in React state (lost on refresh, but fine for demo).

**Implementation:**
- `<HolderChat>` component holds a `comments` array in `useState`
- On mount, load seed comments from the building's JSON data
- User types a message → check token balance → if balance > 0, append to comments array → show immediately
- Each comment shows: wallet address (truncated), message text, their token balance
- No persistence. On page refresh, comments reset to seed data. Acceptable for demo.

**Consequences:**
- Comments don't survive a page refresh. Fine for demo.
- Gating works (real on-chain balance check).
- Zero backend infrastructure.
- If a judge asks "where are comments stored," the honest answer is "in demo state — production would store them on-chain or in IPFS." That's a fair answer for a hackathon.

---

## ADR-009: Deployment

**Decision:** Frontend on Vercel. Solana program on devnet. No backend.

**Rationale:**
- Vercel: `vercel deploy` from the repo. 2 minutes. Custom domain optional.
- Devnet: free, instant, Phantom supports it. Airdrop SOL for demo.
- No backend server needed (all data is on-chain or in the static JSON file).

**Pre-demo setup:**
1. Deploy Anchor program to devnet
2. Create 5 building token mints on devnet
3. Fund the bonding curve reserve for each building (0.01 SOL each)
4. Fund a demo wallet with 5 SOL (devnet airdrop) for live buying during the demo
5. Deploy frontend to Vercel
6. Test the full flow: connect Phantom (devnet) → buy tokens → see price move → see rank change → post in chat → push to graduation

**Consequences:**
- Everything is live on devnet — judges can interact if they have Phantom
- Vercel auto-deploys on git push (if we set it up early, updates are instant)
- No server costs, no infrastructure to manage

---

## ADR-010: Charting Library

**Decision:** Recharts for the bonding curve visualization.

**Rationale:**
- React-native charting library, works with Next.js without SSR issues.
- Simple API: `<LineChart><Line data={curveData} /></LineChart>`
- We need exactly one chart type: a line showing price vs. supply.
- Bundle size is acceptable (~100KB gzipped).

**Implementation:**
- Calculate the full curve: `Array.from({length: 1000}, (_, i) => ({ supply: i, price: BASE_PRICE + i * SLOPE }))`
- Plot the full curve as a faded line
- Plot the current position (current supply) as a dot on the curve
- Animate the dot moving right when someone buys (update on poll)
- Color the area under the curve up to the current supply (filled area chart)

**Consequences:**
- One dependency, one chart component
- The visual is clean: curve + current position dot + filled area
- No real-time websocket needed — poll updates the dot position

**Rejected alternatives:**
- D3.js: too low-level for a 5-hour build
- Chart.js: not React-native, needs wrapper
- TradingView lightweight-charts: overkill for a single static curve

---

## Architecture diagram

```
┌─────────────────────────────────────────┐
│           User (Phantom Wallet)           │
│              devnet wallet                │
└──────────────┬──────────────────────────┘
               │ connect + sign transactions
               ▼
┌─────────────────────────────────────────┐
│         Next.js Frontend (Vercel)         │
│                                          │
│  ┌──────────┐  ┌────────────────────┐   │
│  │ Leaderboard│  │ Building Detail   │   │
│  │ (5 rows)  │  │ - Photos          │   │
│  │           │  │ - Ryan's review   │   │
│  │ Ryan Rank │  │ - Bonding curve   │   │
│  │ Community │  │   chart (Recharts)│   │
│  │ Rank      │  │ - Buy widget      │   │
│  │           │  │ - Holder chat     │   │
│  └──────────┘  └────────────────────┘   │
│                                          │
│  Data sources:                           │
│  1. buildings.json (static, in repo)     │
│  2. Solana RPC (polled every 5s)         │
│  3. @solana/wallet-adapter (Phantom)      │
└──────────────┬──────────────────────────┘
               │ RPC calls (getTokenSupply, 
               │ getProgramAccounts, sendTransaction)
               ▼
┌─────────────────────────────────────────┐
│      Solana Devnet (Anchor Program)     │
│                                          │
│  BondingCurveProgram                     │
│  ├── Building 1: mint + curve + reserve  │
│  ├── Building 2: mint + curve + reserve  │
│  ├── Building 3: mint + curve + reserve  │
│  ├── Building 4: mint + curve + reserve  │
│  └── Building 5: mint + curve + reserve  │
│                                          │
│  Functions:                              │
│  - buy(building_id, sol_amount)          │
│  - sell(building_id, token_amount)       │
│  - get_price(building_id) → f64          │
│  - check_graduation(building_id) → bool  │
└─────────────────────────────────────────┘
```

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bonding curve math is wrong | Medium | High | Daniel writes unit tests for buy/sell before integrating |
| Devnet RPC is slow during demo | Low | Medium | Pre-load data, use React Query caching, accept 5s delay |
| Phantom doesn't connect on stage | Low | High | Pre-connect before demo starts. Keep wallet connected. |
| Building data not ready in time | Medium | Medium | Ryan delivers JSON by hour 1. Steve stubs with placeholder data first. |
| Graduation doesn't trigger during demo | Medium | High | Pre-buy tokens so building is at 4.8/5 SOL. One small buy pushes it over. |
| Chart library SSR issues | Low | Low | Use `dynamic(import, {ssr: false})` for chart component |
| Time runs out | Medium | High | Demo path first. Hard-code everything off-path. If holder chat doesn't work, cut it. |

---

## Definition of done

The project is demo-ready when:
1. 5 buildings are on the leaderboard with real data and photos
2. Bonding curve contract is deployed on devnet
3. A user can connect Phantom, buy tokens, and see the price move on the chart
4. The community rank updates after a buy (poll-driven, within 5 seconds)
5. At least one building can be pushed to graduation during the demo
6. Holder chat shows seeded comments and accepts new posts from token holders
7. The app is deployed to Vercel and accessible via URL
8. The 2-minute demo script has been rehearsed at least once