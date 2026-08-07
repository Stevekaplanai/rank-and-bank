# Daniel track — WSL pick-up (Steve operating tonight)

**Goal:** Live bonding curve on Solana **devnet**, 5 buildings initialized, frontend off mock mode.

**Controversial demo building:** `the-crosby` (Ryan #79), stage ~4.8 SOL mcap, graduate at **> 5 SOL**.

**Repo (Windows path):** `C:\Users\User\OneDrive\Rank-and-Bank`  
**Same folder in WSL:** `/mnt/c/Users/User/OneDrive/Rank-and-Bank`

---

## Status (2026-08-06 evening wrap)

| Piece | Status |
|-------|--------|
| Anchor program source | Done — `programs/bonding_curve` |
| TS SDK (mock mode) | Done — frontend demo works offline (**stay on mock**) |
| Buildings JSON (Ryan) | Done — 5 featured buildings |
| Solana CLI + Anchor 0.30.1 in WSL | Installed (use clean PATH; Windows PATH leaks break shells) |
| Workspace layout | `Anchor.toml` + workspace `Cargo.toml` at **repo root** |
| Program id reserved | `4xq72pkH2qLYe3SiiFsrNB7iHbnARe1BWMPA66QX62a9` (keypair under gitignored `target/deploy/`) |
| Deployer wallet | `6FqQqDa6W7VDBfsFWCKG7NsiL8RCfm5P6vvcxEyC9128` — **0 SOL** (devnet faucet failed tonight) |
| `anchor build` / deploy | **Blocked** — platform-tools cache incomplete + no SOL for deploy |
| Frontend live buy via IDL | Not started |

**Demo path for tomorrow:** keep `NEXT_PUBLIC_USE_MOCK=true`. Fund deployer (or new wallet) → fix platform-tools → `anchor build` → `anchor deploy` → init 5 buildings → flip mock off.

Always set in WSL sessions (Windows leaks a bad `HOME`):

```bash
export HOME=/home/sk777
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

---

## Steps

### 1. System deps in WSL (needs your password once)
```bash
sudo apt update
sudo apt install -y build-essential pkg-config libudev-dev llvm libclang-dev protobuf-compiler curl
```

### 2. Solana CLI (user install — no sudo)
```bash
curl --proto '=https' --tlsv1.2 -sSfL https://release.anza.xyz/stable/install | sh
# then PATH line above + add to ~/.bashrc
```

### 3. Anchor 0.30.1 via AVM
```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 avm --locked --force
avm install 0.30.1
avm use 0.30.1
anchor --version
```

### 4. Deployer wallet + airdrop
```bash
solana-keygen new -o "$HOME/.config/solana/id.json"  # if missing
solana config set --url devnet
solana airdrop 2
# If airdrop fails: https://faucet.solana.com (paste pubkey)
solana balance
```

### 5. Program keypair + wire IDs
```bash
cd /mnt/c/Users/User/OneDrive/Rank-and-Bank/programs/bonding_curve
solana-keygen new -o target/deploy/bonding_curve-keypair.json --no-bip39-passphrase --force
solana-keygen pubkey target/deploy/bonding_curve-keypair.json
```
Put that pubkey into:
- `src/lib.rs` → `declare_id!("...")`
- `Anchor.toml` → `[programs.devnet]` and `[programs.localnet]`

### 6. Build + deploy
```bash
cd /mnt/c/Users/User/OneDrive/Rank-and-Bank/programs/bonding_curve
anchor build
anchor deploy --provider.cluster devnet
```
Copy IDL from `target/idl/bonding_curve.json` into something the SDK can import (e.g. `packages/sdk/src/idl/`).

### 7. Initialize 5 buildings + stage Crosby
Building ids (must match exactly):
`900-biscayne`, `one-thousand-museum`, `paramount-mwc`, `icon-brickell`, `the-crosby`

Then update `deployments/devnet.json` and:

```bash
cd /mnt/c/Users/User/OneDrive/Rank-and-Bank
export DEPLOYMENT_PROGRAM_ID="<real program id>"
npx tsx scripts/seed-devnet.ts --pregraduate the-crosby 4.8
```
(Extend seed to call `initialize_building` once IDL exists.)

### 8. Flip frontend off mock
`apps/web/.env.local` + Vercel:
```
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_PROGRAM_ID=<real program id>
NEXT_PUBLIC_SOLANA_RPC=<prefer Helius/QuickNode free for demo hour>
```

### 9. Smoke test
Phantom → **Devnet** → buy The Crosby → Explorer → rank move → holder chat → graduate.

---

## Steve’s hands only
1. `sudo apt install …` (password)
2. Faucet in browser if CLI airdrop rate-limits
3. Phantom set to Devnet for the final click-test
4. Approve Vercel env change when live

Everything else can be agent-driven in WSL once Solana + Anchor are on PATH.
