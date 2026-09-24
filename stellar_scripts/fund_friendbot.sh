#!/usr/bin/env bash
set -euo pipefail

# Fund a testnet account via Friendbot.
# Usage: ./fund_friendbot.sh GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

PUBLIC_KEY="${1:-}"
if [[ -z "$PUBLIC_KEY" ]]; then
  echo "Usage: $0 <STELLAR_PUBLIC_KEY>"
  exit 1
fi

curl -s "https://friendbot.stellar.org?addr=${PUBLIC_KEY}" | jq .
