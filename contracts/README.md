# Soroban contracts

## Build (WASM)

Install the `wasm32-unknown-unknown` target, then from the repo root:

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release -p yield_agent
```

Artifact: `target/wasm32-unknown-unknown/release/yield_agent.wasm`

## Unit tests

The crate includes `src/test.rs` with Soroban SDK testutils. If `cargo test` fails on your machine with an `ed25519-dalek` / `CryptoRng` error, use the [Stellar CLI contract test flow](https://developers.stellar.org/docs/build/smart-contracts/overview) or run tests inside the official Soroban dev container.

To enable tests locally, temporarily add to `lib.rs`:

```rust
#[cfg(test)]
mod test;
```

Then: `cd contracts/yield_agent && cargo test`.
