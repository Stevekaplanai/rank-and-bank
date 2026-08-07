# Bonding Curve Program (Daniel)

Linear bonding curve for Rank & Bank building tokens.

## Formula
```
price(supply) = 0.001 SOL + supply * 0.00001 SOL
graduation when market_cap = supply * price > 5 SOL
```

## Instructions
- `initialize_building(building_id)` — create building PDA + mint PDA + vault PDA
- `buy(sol_amount)` — mint tokens at curve price; may set `graduated`
- `sell(token_amount)` — burn tokens, return SOL from vault
- `get_price()` — current price in lamports (via return data / simulate)

## Account layout (`Building`)
After 8-byte Anchor discriminator:

| Field | Size |
|-------|------|
| authority | 32 |
| mint | 32 |
| building_id | 4 + len (max 32) |
| supply (raw, 6 decimals) | 8 |
| reserve_lamports | 8 |
| graduated | 1 |
| bump | 1 |
| vault_bump | 1 |

Trailing fields (from end of account): `vault_bump`, `bump`, `graduated`, `reserve`, `supply`.

## PDA seeds
- Building: `["building", building_id_bytes]`
- Mint: `["mint", building_id_bytes]`
- Vault: `["vault", building_id_bytes]` (program-owned SOL reserve; debit via lamports on sell)

`building_id` must match `data/buildings.json` `id` fields (≤32 chars, no leading space).

## Deploy (devnet)
Requires Solana CLI + Anchor 0.30.1 (not just rustc/cargo).

```powershell
cd C:\Users\User\OneDrive\Rank-and-Bank\programs\bonding_curve
solana-keygen new -o target\deploy\bonding_curve-keypair.json
# Update declare_id! + Anchor.toml [programs.*] to the new pubkey
solana config set --url devnet
solana airdrop 2
anchor build
anchor deploy --provider.cluster devnet
```

Then from repo root:
```powershell
cd C:\Users\User\OneDrive\Rank-and-Bank; $env:DEPLOYMENT_PROGRAM_ID="<program id>"; npm run seed
```

Update `deployments/devnet.json` and Vercel env `NEXT_PUBLIC_PROGRAM_ID`.

## Live client note
Until an Anchor IDL is generated (`anchor build` → `target/idl`), the TypeScript SDK stays in **mock mode** for demo buys. Wire full CPI (ATA create + mint/vault accounts) after deploy using the IDL coder.
