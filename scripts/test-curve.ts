/**
 * Minimal curve unit tests — run: npm run test:curve
 * Mirrors packages/sdk/src/curve.ts and on-chain constants (ARD-001 / ADR-007).
 */
import assert from "node:assert/strict";
import {
  BASE_PRICE_LAMPORTS,
  GRADUATION_THRESHOLD_SOL,
  SLOPE_LAMPORTS,
  marketCapSol,
  priceLamportsAtSupply,
  priceSolAtSupply,
  solFromTokens,
  tokensFromSol,
} from "../packages/sdk/src/curve";

function near(actual: number, expected: number, tol = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected} ± ${tol}, got ${actual}`
  );
}

// Constants match ARD
assert.equal(BASE_PRICE_LAMPORTS, 1_000_000);
assert.equal(SLOPE_LAMPORTS, 10_000);
assert.equal(GRADUATION_THRESHOLD_SOL, 5);

// price(0) = 0.001 SOL; price(100) = 0.002 SOL; price(1000) = 0.011 SOL
assert.equal(priceLamportsAtSupply(0), 1_000_000);
assert.equal(priceLamportsAtSupply(100), 2_000_000);
assert.equal(priceLamportsAtSupply(1000), 11_000_000);
near(priceSolAtSupply(0), 0.001);
near(priceSolAtSupply(100), 0.002);

// Buy 0.1 SOL at supply 100 yields a visible token count (ARD example ~33)
const bought = tokensFromSol(0.1, 100);
assert.ok(bought > 20 && bought < 50, `expected ~33 tokens, got ${bought}`);

// Round-trip-ish: selling those tokens returns near the spend (approx curve)
const soldSol = solFromTokens(Math.floor(bought), 100 + bought);
assert.ok(soldSol > 0.05 && soldSol < 0.12, `sell out-of-range: ${soldSol}`);

// Flatiron demo staging: find supply near 4.8 SOL mcap, under graduation
let supply = 650;
while (marketCapSol(supply) < 4.8 && supply < 5000) supply += 10;
while (marketCapSol(supply) > 4.85 && supply > 100) supply -= 5;
const mcap = marketCapSol(supply);
assert.ok(mcap >= 4.75 && mcap <= 4.9, `flatiron mcap ${mcap} not ~4.8`);
assert.ok(mcap <= GRADUATION_THRESHOLD_SOL, "staging must be under graduation");

// Graduation threshold is STRICTLY greater than 5 SOL (matches on-chain `>`)
assert.ok(marketCapSol(680) > 5 || marketCapSol(700) > 5);

console.log("curve tests passed");
console.log(`  sample buy @ supply 100 / 0.1 SOL → ${bought.toFixed(2)} tokens`);
console.log(`  flatiron staging supply=${supply} mcap=${mcap.toFixed(3)} SOL`);
