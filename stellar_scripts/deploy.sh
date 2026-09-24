#!/usr/bin/env bash
set -euo pipefail

# Build and deploy yield_agent to Stellar testnet (requires stellar-cli / soroban CLI).
# Install: https://developers.stellar.org/docs/tools/developer-tools

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="${ROOT}/contracts/yield_agent"

echo "Building yield_agent WASM..."
(cd "${ROOT}/contracts" && cargo build --target wasm32-unknown-unknown --release -p yield_agent)

echo "Deploy with your configured identity, for example:"
echo "  stellar contract deploy \\"
echo "    --wasm ${CONTRACT_DIR}/target/wasm32-unknown-unknown/release/yield_agent.wasm \\"
echo "    --source <YOUR_SECRET_KEY> \\"
echo "    --network testnet"
