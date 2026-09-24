import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  formatBalanceReply,
  mapIntentToAction,
  shouldSweep,
} from "./agent_logic.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 8787);

/** In-memory demo state until RPC + contract client are wired in a later increment. */
const demoState = {
  liquidBalance: 50_000_000,
  yieldBalance: 0,
  sweepThreshold: 50_000_000,
};

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "agent-yield-latam-ai-backend",
    network: process.env.STELLAR_NETWORK || "testnet",
  });
});

app.get("/status", (_req, res) => {
  res.json({
    liquidBalance: demoState.liquidBalance,
    yieldBalance: demoState.yieldBalance,
    sweepThreshold: demoState.sweepThreshold,
    shouldSweep: shouldSweep(demoState),
  });
});

app.post("/chat", (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const lower = message.toLowerCase();
  let intent = "unknown";
  if (lower.includes("balance") || lower.includes("saldo")) {
    intent = "check_balance";
  } else if (lower.includes("withdraw") || lower.includes("retir")) {
    intent = "withdraw";
  } else if (lower.includes("sweep") || lower.includes("invert")) {
    intent = "deposit_to_yield";
  }

  const action = mapIntentToAction(intent, { amount: req.body?.amount });

  if (action.action === "get_status") {
    return res.json({
      intent,
      action,
      reply: formatBalanceReply(
        demoState.liquidBalance,
        demoState.yieldBalance
      ),
    });
  }

  return res.json({
    intent,
    action,
    reply:
      "Checkpoint 1 backend: intent recognized. Connect Soroban RPC and contract ID to execute on-chain actions.",
  });
});

app.post("/agent/tick", (_req, res) => {
  if (!shouldSweep(demoState)) {
    return res.json({ swept: false, reason: "balance at or below threshold" });
  }
  const excess = demoState.liquidBalance - demoState.sweepThreshold;
  demoState.yieldBalance += excess;
  demoState.liquidBalance = demoState.sweepThreshold;
  res.json({
    swept: true,
    movedToYield: excess,
    liquidBalance: demoState.liquidBalance,
    yieldBalance: demoState.yieldBalance,
  });
});

app.listen(PORT, () => {
  console.log(`Agent Yield LatAm AI backend listening on http://localhost:${PORT}`);
});
