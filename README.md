# Agent Yield LatAm

**Autonomous AI treasury agent for small merchants in Latin America** — keep a liquid USDC buffer, automatically sweep excess into Stellar DeFi yield, and manage everything through natural language (web chat; WhatsApp/Telegram planned).

> **Checkpoint 1 (this repo increment):** Monorepo scaffold aligned with the project blueprint — Soroban `yield_agent` contract (MVP bookkeeping + auth), React frontend shell, Node AI backend with rule-based intents, and Stellar testnet helper scripts. On-chain USDC transfers and Blend/yield pool integration are the next increments.

---

## Table of contents

- [Problem](#problem)
- [Solution](#solution)
- [Why Stellar](#why-stellar)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Soroban contract](#soroban-contract)
- [AI backend API](#ai-backend-api)
- [Frontend](#frontend)
- [Deploy to testnet](#deploy-to-testnet)
- [Demo script (hackathon video)](#demo-script-hackathon-video)
- [Roadmap](#roadmap)
- [Tracks & criteria](#tracks--criteria)
- [License](#license)

---

## Problem

Small merchants and independent professionals in Peru and wider LatAm (freelancers, artisans, corner stores) face **inflation** and **limited access to high-yield savings**. They often hold unstable local currency or cash. Even with digital payments, moving into **stable assets (USDC)** and **DeFi yield** (e.g. lending pools) is blocked by complex wallets, gas costs, and technical jargon.

## Solution

**Agent Yield LatAm** gives merchants a simple interface while an **autonomous agent**:

1. Monitors liquid USDC balance against a user-defined threshold (e.g. “keep $50 spendable”).
2. **Sweeps excess** into a Stellar yield strategy (Soroban + lending protocol integration).
3. Answers questions and withdrawal requests via **chat** (“What’s my balance?”, “Withdraw $20”).

Users deposit via local on-ramp or USDC; the agent executes sweeps without constant manual approval.

## Why Stellar

| Criterion | Role in this project |
|-----------|----------------------|
| **Micro-transactions** | Daily sweeps of $5–$10 must remain economical; Stellar’s sub-cent fees make small automated sweeps viable (unlike high-L1 gas). |
| **Native USDC** | Yield is denominated in a stable, globally recognized asset, hedging local currency risk. |
| **Soroban** | Smart contracts enforce merchant/agent auth, thresholds, and protocol interactions securely. |

## Architecture

```text
┌─────────────────┐     natural language      ┌──────────────────┐
│  Web / WhatsApp │ ────────────────────────► │   AI backend     │
│  (Frontend)     │ ◄──────────────────────── │   (LLM + rules)  │
└────────┬────────┘     intents / replies     └────────┬─────────┘
         │ wallet (Freighter / Wallets Kit)              │ signed txs
         ▼                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Stellar + Soroban (yield_agent contract)            │
│  deposit · auto_sweep · withdraw · get_status                    │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
                    Yield pool (e.g. Blend) — upcoming increment
```

**Three layers (blueprint):**

1. **Interface** — chat + wallet connection + sweep threshold UI.
2. **Brain** — LLM intent → `deposit_to_yield`, `withdraw`, `get_status` (Checkpoint 1: keyword/rules fallback).
3. **Execution** — Soroban contract holding policy and balances; agent key calls `auto_sweep`.

## Repository layout

```text
agent-yield-latam/
├── README.md
├── contracts/                 # Rust workspace (Soroban)
│   ├── Cargo.toml
│   └── yield_agent/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs         # initialize, deposit, auto_sweep, withdraw, get_status
│           └── test.rs
├── frontend/                  # Vite + React
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       └── components/        # ChatPanel, WalletConnect (demo)
├── ai_backend/                # Node.js API
│   ├── index.js
│   ├── agent_logic.js
│   └── .env.example
└── stellar_scripts/
    ├── deploy.sh
    └── fund_friendbot.sh
```

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Node.js 20+](https://nodejs.org/) | Frontend and AI backend |
| [Rust + wasm32 target](https://www.rust-lang.org/tools/install) | Build Soroban contract |
| [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools) | Deploy & invoke on testnet |
| Freighter or [Stellar Wallets Kit](https://github.com/analyticnetwork/stellar-wallets-kit) | Merchant wallet (later increment) |

Optional: `jq` for Friendbot script output formatting.

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/samgbm/agent-yield-latam.git
cd agent-yield-latam

cd ai_backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. AI backend

```bash
cd ai_backend
cp .env.example .env   # optional: LLM keys for a later increment
npm run dev
```

Health check: `http://localhost:8787/health`

### 3. Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` — connect the demo wallet, set a threshold, ask **“What’s my balance?”** (proxied to the backend at `/api/chat`).

### 4. Soroban contract tests

```bash
cd contracts/yield_agent
cargo test
```

## Soroban contract

**Crate:** `contracts/yield_agent`

| Function | Auth | Description |
|----------|------|-------------|
| `initialize(merchant, agent, sweep_threshold)` | Merchant | One-time setup; registers authorized agent and threshold. |
| `deposit(merchant, amount)` | Merchant | Increases liquid balance (MVP ledger; token transfer in next increment). |
| `auto_sweep(agent)` | Agent | If liquid > threshold, moves excess to internal yield balance. |
| `withdraw(merchant, amount)` | Merchant | Moves funds from yield balance back to liquid. |
| `get_status()` | — | Returns `(liquid_balance, yield_balance)`. |

**Checkpoint 1 note:** Yield is modeled as contract storage. Wiring to an external pool (e.g. **Blend on Stellar**) replaces the internal `YieldBalance` ledger in a follow-up PR.

## AI backend API

Base URL: `http://localhost:8787` (frontend dev proxy: `/api/*`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service status |
| `GET` | `/status` | Demo balances + `shouldSweep` |
| `POST` | `/chat` | Body: `{ "message": "What's my balance?" }` |
| `POST` | `/agent/tick` | Simulates one agent cron sweep (demo state) |

`agent_logic.js` holds pure functions: `shouldSweep`, `mapIntentToAction`, `formatBalanceReply`. Production: add Soroban RPC client + scheduled worker calling `auto_sweep` when `shouldSweep` is true.

Environment variables: see `ai_backend/.env.example`.

## Frontend

- **WalletConnect:** demo button; replace with Stellar Wallets Kit + Freighter.
- **Sweep rule:** UI for “keep $X liquid” (persistence on-chain in a later step).
- **ChatPanel:** talks to AI backend; supports English/Spanish keywords in Checkpoint 1.

## Deploy to testnet

1. Create/fund a testnet key:

   ```bash
   # After generating a keypair:
   bash stellar_scripts/fund_friendbot.sh GYOUR_PUBLIC_KEY
   ```

2. Build WASM:

   ```bash
   bash stellar_scripts/deploy.sh
   ```

3. Deploy with Stellar CLI (see script output), then set `YIELD_AGENT_CONTRACT_ID` in `ai_backend/.env`.

4. Invoke `initialize`, then exercise `deposit` / `auto_sweep` via CLI or backend integration.

## Demo script (hackathon video)

1. **Problem** — Maria (Lima freelancer) receives USDC; it sits idle; DeFi feels impossible.
2. **Onboarding** — Opens Agent Yield LatAm, connects wallet, sets “keep $50 liquid.”
3. **Action** — $100 payment → $150 total; agent wakes, calls `auto_sweep`; show tx on [Stellar Expert](https://stellar.expert/explorer/testnet).
4. **Result** — Chat: “What’s my balance?” → “$50 ready to spend, $100 earning ~5% APY.”

## Roadmap

- [ ] Stellar USDC token transfers in `deposit` / withdraw-to-wallet
- [ ] Blend (or chosen pool) integration for real yield
- [ ] Freighter + Wallets Kit in frontend
- [ ] LLM intent parsing (Claude/OpenAI) with structured actions
- [ ] Agent cron / queue on testnet main path
- [ ] WhatsApp or Telegram channel
- [ ] Passkey/email onboarding option

## Tracks & criteria

- **Primary:** Stellar Hackathon **Track 01 — AI Agents & Automated Workflows**
- **Secondary:** **Track 05** (real-time / continuous yield), **Track 06** (everyday usability)

## License

MIT — see repository license file if present; otherwise all contributions are under MIT for hackathon submission unless specified otherwise.

---

**Team / contact:** Update this section with your hackathon team details and support links before submission.
