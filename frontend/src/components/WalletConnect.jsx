import { useState } from "react";

/**
 * Placeholder for Stellar Wallets Kit / Freighter (wired in a later increment).
 */
export default function WalletConnect({ onConnectedChange }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");

  function connectDemo() {
    const demo = "G-DEMO-MERCHANT-7YIELD-LATAM-CHECKPOINT1";
    setAddress(demo);
    setConnected(true);
    onConnectedChange?.(true);
  }

  function disconnect() {
    setAddress("");
    setConnected(false);
    onConnectedChange?.(false);
  }

  return (
    <section className="card">
      <h2>Wallet</h2>
      <div className="wallet-row">
        {!connected ? (
          <button type="button" onClick={connectDemo}>
            Connect Freighter (demo)
          </button>
        ) : (
          <>
            <code>{address}</code>
            <button type="button" className="secondary" onClick={disconnect}>
              Disconnect
            </button>
          </>
        )}
      </div>
      <p style={{ marginTop: "0.75rem", color: "#64748b", fontSize: "0.9rem" }}>
        Production path: Stellar Wallets Kit + USDC on Stellar testnet.
      </p>
    </section>
  );
}
