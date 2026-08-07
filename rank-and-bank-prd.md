# PRD: Rank & Bank — Miami Real Estate Conviction Market

## One-liner
Ryan ranks Miami's condos. You back the ones you believe in. 5 Miami properties from Ryan's Rankings, each with a bonding-curve token on Solana. Buy tokens to back the buildings you believe in. Price goes up as more people back it. Leaderboard ranks buildings by market cap. When a building hits a market cap threshold, it "graduates" to a Raydium AMM pool.

---

## The product

### What the user sees
A leaderboard of 5 Miami condo buildings. Each building card shows:
- Building name + photo
- Ryan's Rankings score (e.g., #7 overall, 8.2/10)
- Live token price (from the bonding curve)
- Market cap (token supply × current price)
- Community rank (determined by market cap, not Ryan's score)
- A "BACK THIS BUILDING" button

When you tap a building:
- Full Ryan's Rankings review (Ryan's real content)
- Score breakdown (location, amenities, views, value, noise)
- Live bonding curve chart (price vs. supply)
- Buy widget: enter SOL amount → see how many tokens you get → confirm
- Your token balance for this building
- "Holder chat" — a simple comment thread gated by token ownership (Arena.social mechanic)

### The two leaderboards
- **Ryan's Rank:** the expert ranking (static, from Ryan's Rankings site)
- **Community Rank:** live, determined by token market cap
- The gap between them is the story: "Ryan says #10, but the community says #2 — this building is controversial"

### The bonding curve
- Each building token starts at a low price (e.g., 0.001 SOL)
- Price increases along a curve as more tokens are bought
- Use Metaplex Genesis Bonding Curve or pump.fun's open-source curve contract
- When market cap hits a threshold (e.g., 10 SOL), the token "graduates"
- Graduation = migrate liquidity to Raydium AMM pool (can stub this for the demo)

### What's on-chain
- Token mint for each building (SPL token)
- Bonding curve contract (buy/sell function, price calculation)
- Transaction history (every buy/sell is on Solana)
- Token balances (who holds what)
- Graduation event (when a building hits the threshold)

---

## Team assignments

### Daniel — Solana Program (blockchain)
**Tasks:**
1. Set up Solana devnet wallet, airdrop SOL
2. Write the bonding curve program (Anchor framework)
   - `buy(building_id, sol_amount)` → mint tokens at curve price
   - `sell(building_id, token_amount)` → burn tokens, return SOL at curve price
   - `get_price(building_id)` → current price from curve
   - Use a simple linear or exponential curve formula
3. Create 5 SPL token mints (one per building)
4. Deploy to devnet
5. Write a simple SDK (TypeScript) for the frontend to call

**Deliverable:** Working bonding curve contract on devnet + TypeScript SDK

### Ryan — Content + Building Data
**Tasks:**
1. Pick 5 buildings from Ryan's Rankings (mix of high-ranked and low-ranked for drama)
2. Provide for each building:
   - Name, address, neighborhood
   - Photos (3-5 exterior/interior shots)
   - Ryan's score + ranking position
   - Short review excerpt (2-3 sentences)
   - Score breakdown: location, amenities, views, value, noise (or whatever Ryan uses)
3. Write 3-4 "seed comments" per building for the holder chat
4. Help write the demo script (you know the buildings, you know the story)

**Deliverable:** A JSON file with all 5 buildings' data + photos in the repo

### Steve — Frontend + Agent Integration
**Tasks:**
1. Scaffold Next.js app with Tailwind
2. Build the leaderboard page (rankings table with both Ryan's Rank and Community Rank)
3. Build the building detail page (photo, review, bonding curve chart, buy widget)
4. Integrate Daniel's Solana SDK (connect wallet, buy tokens, show balance)
5. Build the holder chat (simple comment thread, gated by token balance check)
6. Wallet integration: use @solana/wallet-adapter (Phantom)

**Deliverable:** Working Next.js app connected to devnet

### Carlos — Bonding Curve Chart + Live Data
**Tasks:**
1. Build the live bonding curve visualization (price vs. supply chart)
   - Use a charting library (recharts, chart.js, or lightweight-charts)
   - Show current price, curve shape, where the current supply sits
   - Update in real-time when someone buys (poll or websocket)
2. Build the live transaction feed (recent buys/sells streaming on the leaderboard)
3. Build the market cap calculation + community rank sorting
4. Build the "graduation progress bar" (how close a building is to hitting the threshold)

**Deliverable:** Live chart components + transaction feed + market cap logic

### Jeremy — Polish + Demo + Deployment
**Tasks:**
1. Style everything to look like a real product (Miami aesthetic: clean, beachy, luxury)
   - Hero section with Miami skyline
   - Building cards with photos + scores
   - Smooth animations on buy/drag interactions
2. Deploy the frontend (Vercel or Netlify — fast)
3. Write the 2-minute demo script (see below)
4. Record a backup demo video at hour 5
5. Test the full flow end-to-end: connect wallet → buy token → see price move → see rank change → post in holder chat

**Deliverable:** Deployed app + demo script + backup video

---

## Tech stack
- **Solana:** Anchor framework, devnet, @solana/web3.js, @solana/wallet-adapter
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Charts:** recharts or lightweight-charts
- **Bonding curve:** Metaplex Genesis Bonding Curve (if docs are clear enough) OR custom Anchor program with a simple linear curve: `price = base_price + (supply * slope)`
- **Wallet:** Phantom (Solana wallet adapter)
- **Deployment:** Vercel (frontend), Solana devnet (program)
- **Harness:** cursor-hackathon-harness repo (AGENTS.md, hooks, reviewer subagent)

---

## The 2-minute demo script

**0:00 — The hook**
"Miami has 100+ condo buildings. Ryan ranks them all. But what if the community could vote with their wallets? Welcome to Rank & Bank."

**0:10 — The leaderboard**
Show the leaderboard. 5 buildings. Two columns: Ryan's Rank vs. Community Rank.
"This building is #10 on Ryan's list but #2 on the community's. That gap is where the alpha is."

**0:25 — The building page**
Tap the controversial building. Show photos, Ryan's review, score breakdown.
"Ryan says the views are overrated. The community disagrees."

**0:40 — The buy**
Connect Phantom wallet. Enter 0.1 SOL. See the bonding curve: "You'll get 47 tokens at 0.0021 SOL each." Click BUY.
Show the Solana Explorer tx on your phone.
"Back the building. Price ticks up. Your tokens are in your wallet."

**0:55 — The rank moves**
Back to the leaderboard. The building you just backed moved from Community Rank #2 to #1.
"That's live. The market cap just crossed the #1 building."

**1:10 — The holder chat**
Open the building's holder chat. Post: "This building is underrated, the pool deck is insane."
"You need to hold tokens to post. Skin in the game."

**1:25 — The graduation**
Show a building that's about to graduate. Market cap is at 9.8 SOL, threshold is 10 SOL.
Buy 0.2 SOL of tokens. The building crosses the threshold.
"It graduated. Liquidity is now on Raydium. It's a real market."

**1:40 — The close**
"Rank & Bank. Ryan ranks them. The community backs them. The chain settles everything. On Solana."
Show the URL on screen.

---

## Hard-coded parts (save time)
- 5 buildings with pre-selected data (Ryan provides)
- Bonding curve starts with a small reserve (0.01 SOL) so prices move fast
- Graduation threshold is low (5 SOL) so it can happen during the demo
- Holder chat is a simple array in the frontend, not a real backend (poll every 5 seconds)
- Auth is just wallet connection (no login)
- No real Raydium integration — graduation just shows a "GRADUATED" badge and freezes the curve

---

## 5-hour clock

| Time | What happens |
|------|-------------|
| 0:00-0:15 | Everyone reads this PRD. Clone the harness repo. Create the project. |
| 0:15-0:30 | Ryan picks 5 buildings + provides data. Daniel creates devnet wallet + starts Anchor program. Steve scaffolds Next.js. |
| 0:30-2:30 | Parallel build. Daniel: bonding curve. Steve: leaderboard + building pages. Carlos: charts + tx feed. Jeremy: styling. Ryan: building data JSON + demo script draft. |
| 2:30-3:30 | Integration. Steve connects Daniel's SDK. Carlos's charts plug into building pages. Jeremy styles everything. |
| 3:30-4:30 | Testing. Buy tokens, see price move, see rank change, test holder chat. Fix bugs. |
| 4:30-5:00 | Demo hardening. Jeremy records backup video. Steve writes the demo script. Ryan does a dry run. |

---

## What makes this win

1. **Pump.fun mechanic is proven on Solana** — billions in volume, judges know it
2. **Ryan's Rankings is real** — Miami local brand, not a toy project
3. **The two-leaderboard story** — "expert vs community" is instant drama
4. **Bonding curves are visual** — the chart moving live is satisfying
5. **Skin in the game** — you buy tokens to post in the holder chat
6. **Graduation moment** — the "it graduated to Raydium" beat is a proven pump.fun narrative
7. **Miami aesthetic** — the host city is Miami, the buildings are Miami, the brand is Miami
8. **RWA angle** — real estate tokens on Solana is a Superteam category