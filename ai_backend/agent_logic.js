/**
 * Pure decision helpers for the treasury agent (no chain I/O).
 * Amounts are in Stellar/USDC stroops (7 decimals on Stellar USDC — use 6 for EVM-style in UI).
 */

/** USDC uses 6 decimals in product UI; on-chain units must match token config at integration time. */
export const USDC_DECIMALS = 6;

export function toStroops(usdcAmount) {
  return Math.round(Number(usdcAmount) * 10 ** USDC_DECIMALS);
}

export function fromStroops(stroops) {
  return Number(stroops) / 10 ** USDC_DECIMALS;
}

/**
 * Whether the agent should invoke auto_sweep on-chain.
 */
export function shouldSweep({ liquidBalance, sweepThreshold }) {
  return liquidBalance > sweepThreshold;
}

/**
 * Map a natural-language style intent (from LLM or rules) to an action payload.
 */
export function mapIntentToAction(intent, params = {}) {
  const normalized = String(intent || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  switch (normalized) {
    case "check_balance":
    case "balance":
      return { action: "get_status" };
    case "deposit_to_yield":
    case "sweep":
      return { action: "auto_sweep" };
    case "withdraw":
    case "withdraw_from_yield":
      return {
        action: "withdraw",
        amount: params.amount != null ? toStroops(params.amount) : null,
      };
    default:
      return { action: "unknown", rawIntent: intent };
  }
}

/**
 * Demo reply when LLM keys are not configured (Checkpoint 1 / local dev).
 */
export function formatBalanceReply(liquidStroops, yieldStroops, apyPercent = 5) {
  const liquid = fromStroops(liquidStroops);
  const yieldBal = fromStroops(yieldStroops);
  return (
    `You have $${liquid.toFixed(2)} ready to spend, and $${yieldBal.toFixed(2)} ` +
    `earning ~${apyPercent}% APY in the yield pool.`
  );
}
