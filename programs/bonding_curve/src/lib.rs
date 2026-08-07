use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount};

declare_id!("4xq72pkH2qLYe3SiiFsrNB7iHbnARe1BWMPA66QX62a9");

/// Linear curve: price(supply) = BASE + supply * SLOPE (in lamports)
pub const BASE_PRICE_LAMPORTS: u64 = 1_000_000; // 0.001 SOL
pub const SLOPE_LAMPORTS: u64 = 10_000; // 0.00001 SOL per whole token
pub const TOKEN_DECIMALS: u8 = 6;
pub const GRADUATION_THRESHOLD_LAMPORTS: u64 = 5_000_000_000; // 5 SOL mcap
pub const ONE_TOKEN: u64 = 1_000_000; // 10^decimals
pub const MAX_BUILDING_ID_LEN: usize = 32;

#[program]
pub mod bonding_curve {
    use super::*;

    pub fn initialize_building(
        ctx: Context<InitializeBuilding>,
        building_id: String,
    ) -> Result<()> {
        require!(
            !building_id.is_empty() && building_id.len() <= MAX_BUILDING_ID_LEN,
            ErrorCode::InvalidBuildingId
        );
        let building = &mut ctx.accounts.building;
        building.authority = ctx.accounts.authority.key();
        building.mint = ctx.accounts.mint.key();
        building.building_id = building_id;
        building.supply = 0;
        building.reserve_lamports = 0;
        building.graduated = false;
        building.bump = ctx.bumps.building;
        building.vault_bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, sol_amount: u64) -> Result<()> {
        let building = &mut ctx.accounts.building;
        require!(!building.graduated, ErrorCode::Graduated);
        require!(sol_amount > 0, ErrorCode::InvalidAmount);

        let tokens_raw = tokens_from_sol(sol_amount, building.supply)?;
        require!(tokens_raw > 0, ErrorCode::ZeroTokens);

        // Transfer SOL into vault PDA
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            sol_amount,
        )?;

        // Mint tokens to buyer — building PDA is mint authority
        let building_id = building.building_id.as_bytes();
        let seeds = &[b"building", building_id, &[building.bump]];
        let signer = &[&seeds[..]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: building.to_account_info(),
                },
                signer,
            ),
            tokens_raw,
        )?;

        building.supply = building
            .supply
            .checked_add(tokens_raw)
            .ok_or(ErrorCode::MathOverflow)?;
        building.reserve_lamports = building
            .reserve_lamports
            .checked_add(sol_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        // Market cap = whole_supply * current_price; graduate when > 5 SOL
        let supply_whole = building.supply / ONE_TOKEN;
        let price = price_at_supply(supply_whole);
        let mcap = supply_whole
            .checked_mul(price)
            .ok_or(ErrorCode::MathOverflow)?;
        if mcap > GRADUATION_THRESHOLD_LAMPORTS {
            building.graduated = true;
            msg!("Building {} graduated", building.building_id);
        }

        Ok(())
    }

    pub fn sell(ctx: Context<Sell>, token_amount: u64) -> Result<()> {
        let building = &mut ctx.accounts.building;
        require!(!building.graduated, ErrorCode::Graduated);
        require!(token_amount > 0, ErrorCode::InvalidAmount);
        require!(token_amount <= building.supply, ErrorCode::InsufficientSupply);

        let sol_out = sol_from_tokens(token_amount, building.supply)?;
        require!(sol_out > 0, ErrorCode::ZeroSol);
        require!(
            sol_out <= building.reserve_lamports,
            ErrorCode::InsufficientReserve
        );

        // Burn tokens from seller
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.seller_token_account.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            token_amount,
        )?;

        // Debit program-owned vault + credit seller (SystemProgram::transfer
        // cannot take from a non-system-owned account).
        let vault_info = ctx.accounts.vault.to_account_info();
        let seller_info = ctx.accounts.seller.to_account_info();
        let vault_lamports = vault_info.lamports();
        let seller_lamports = seller_info.lamports();
        require!(
            vault_lamports >= sol_out,
            ErrorCode::InsufficientReserve
        );
        **vault_info.try_borrow_mut_lamports()? = vault_lamports
            .checked_sub(sol_out)
            .ok_or(ErrorCode::MathOverflow)?;
        **seller_info.try_borrow_mut_lamports()? = seller_lamports
            .checked_add(sol_out)
            .ok_or(ErrorCode::MathOverflow)?;

        building.supply = building
            .supply
            .checked_sub(token_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        building.reserve_lamports = building
            .reserve_lamports
            .checked_sub(sol_out)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

    /// View helper — returns current price in lamports for 1 whole token.
    pub fn get_price(ctx: Context<GetPrice>) -> Result<u64> {
        let supply_whole = ctx.accounts.building.supply / ONE_TOKEN;
        Ok(price_at_supply(supply_whole))
    }
}

pub fn price_at_supply(supply_whole: u64) -> u64 {
    BASE_PRICE_LAMPORTS.saturating_add(supply_whole.saturating_mul(SLOPE_LAMPORTS))
}

/// Approximate tokens (raw, 6 decimals) for sol_amount lamports spent.
pub fn tokens_from_sol(sol_amount: u64, current_supply_raw: u64) -> Result<u64> {
    let supply_whole = current_supply_raw / ONE_TOKEN;
    let p0 = price_at_supply(supply_whole) as u128;
    let slope = SLOPE_LAMPORTS as u128;
    let lamports = sol_amount as u128;
    // (slope/2) n^2 + p0 n - lamports = 0
    let a = slope / 2;
    if a == 0 {
        let n = lamports / p0.max(1);
        return Ok((n as u64).saturating_mul(ONE_TOKEN));
    }
    let disc = p0
        .saturating_mul(p0)
        .saturating_add(4u128.saturating_mul(a).saturating_mul(lamports));
    let sqrt_disc = isqrt(disc);
    let n = sqrt_disc.saturating_sub(p0) / (2 * a);
    Ok((n as u64).saturating_mul(ONE_TOKEN))
}

pub fn sol_from_tokens(token_amount_raw: u64, current_supply_raw: u64) -> Result<u64> {
    let n = token_amount_raw / ONE_TOKEN;
    let supply_whole = current_supply_raw / ONE_TOKEN;
    if n == 0 || n > supply_whole {
        return Ok(0);
    }
    let start = supply_whole - n;
    let p_start = price_at_supply(start) as u128;
    let p_end = price_at_supply(supply_whole.saturating_sub(1)) as u128;
    let avg = (p_start + p_end) / 2;
    Ok((avg.saturating_mul(n as u128)) as u64)
}

fn isqrt(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[account]
#[derive(InitSpace)]
pub struct Building {
    pub authority: Pubkey,
    pub mint: Pubkey,
    #[max_len(32)]
    pub building_id: String,
    pub supply: u64,
    pub reserve_lamports: u64,
    pub graduated: bool,
    pub bump: u8,
    pub vault_bump: u8,
}

#[derive(Accounts)]
#[instruction(building_id: String)]
pub struct InitializeBuilding<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Building::INIT_SPACE,
        seeds = [b"building", building_id.as_bytes()],
        bump
    )]
    pub building: Account<'info, Building>,
    #[account(
        init,
        payer = authority,
        seeds = [b"mint", building_id.as_bytes()],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = building,
    )]
    pub mint: Account<'info, Mint>,
    /// CHECK: Program-owned SOL vault PDA (0 data). Funded on buy; debit on sell.
    #[account(
        init,
        payer = authority,
        space = 0,
        seeds = [b"vault", building_id.as_bytes()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"building", building.building_id.as_bytes()],
        bump = building.bump
    )]
    pub building: Account<'info, Building>,
    #[account(
        mut,
        address = building.mint,
        seeds = [b"mint", building.building_id.as_bytes()],
        bump
    )]
    pub mint: Account<'info, Mint>,
    /// CHECK: vault PDA holds SOL reserve
    #[account(
        mut,
        seeds = [b"vault", building.building_id.as_bytes()],
        bump = building.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = buyer_token_account.mint == mint.key() @ ErrorCode::InvalidTokenAccount,
        constraint = buyer_token_account.owner == buyer.key() @ ErrorCode::InvalidTokenAccount
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [b"building", building.building_id.as_bytes()],
        bump = building.bump
    )]
    pub building: Account<'info, Building>,
    #[account(
        mut,
        address = building.mint,
        seeds = [b"mint", building.building_id.as_bytes()],
        bump
    )]
    pub mint: Account<'info, Mint>,
    /// CHECK: vault PDA
    #[account(
        mut,
        seeds = [b"vault", building.building_id.as_bytes()],
        bump = building.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = seller_token_account.mint == mint.key() @ ErrorCode::InvalidTokenAccount,
        constraint = seller_token_account.owner == seller.key() @ ErrorCode::InvalidTokenAccount
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetPrice<'info> {
    pub building: Account<'info, Building>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Building has graduated")]
    Graduated,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid building id")]
    InvalidBuildingId,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Zero tokens out")]
    ZeroTokens,
    #[msg("Zero SOL out")]
    ZeroSol,
    #[msg("Insufficient supply")]
    InsufficientSupply,
    #[msg("Insufficient reserve")]
    InsufficientReserve,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
}
