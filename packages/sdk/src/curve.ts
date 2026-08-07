/** Shared curve constants (must match on-chain program). */
export const BASE_PRICE_LAMPORTS = 1_000_000; // 0.001 SOL
export const SLOPE_LAMPORTS = 10_000; // 0.00001 SOL per token
export const TOKEN_DECIMALS = 6;
export const GRADUATION_THRESHOLD_SOL = 5;
export const GRADUATION_THRESHOLD_LAMPORTS = GRADUATION_THRESHOLD_SOL * 1_000_000_000;

export function priceLamportsAtSupply(supplyWholeTokens: number): number {
  return BASE_PRICE_LAMPORTS + supplyWholeTokens * SLOPE_LAMPORTS;
}

export function priceSolAtSupply(supplyWholeTokens: number): number {
  return priceLamportsAtSupply(supplyWholeTokens) / 1_000_000_000;
}

/**
 * Approximate tokens received for a SOL spend on a linear curve.
 * Uses average price between current and resulting supply.
 */
export function tokensFromSol(
  solAmount: number,
  currentSupplyWhole: number
): number {
  if (solAmount <= 0) return 0;
  const lamportsIn = solAmount * 1_000_000_000;
  // Solve: lamportsIn ≈ n * (p0 + (n-1)/2 * slope) ≈ n*p0 + n²*slope/2
  // Quadratic: (slope/2) n² + p0 n - lamportsIn = 0
  const a = SLOPE_LAMPORTS / 2;
  const b = priceLamportsAtSupply(currentSupplyWhole);
  const c = -lamportsIn;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return 0;
  const n = (-b + Math.sqrt(disc)) / (2 * a);
  return Math.max(0, n);
}

export function solFromTokens(
  tokenAmount: number,
  currentSupplyWhole: number
): number {
  if (tokenAmount <= 0 || tokenAmount > currentSupplyWhole) return 0;
  const start = currentSupplyWhole - tokenAmount;
  // Average price over the sold range
  const avgLamports =
    (priceLamportsAtSupply(start) + priceLamportsAtSupply(currentSupplyWhole - 1)) / 2;
  return (avgLamports * tokenAmount) / 1_000_000_000;
}

export function marketCapSol(supplyWhole: number): number {
  return supplyWhole * priceSolAtSupply(supplyWhole);
}

export function generateCurvePoints(maxSupply = 1000): Array<{ supply: number; price: number }> {
  return Array.from({ length: maxSupply + 1 }, (_, i) => ({
    supply: i,
    price: priceSolAtSupply(i),
  }));
}
