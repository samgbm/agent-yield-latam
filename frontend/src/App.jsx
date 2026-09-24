import { useState } from "react";
import ChatPanel from "./components/ChatPanel.jsx";
import WalletConnect from "./components/WalletConnect.jsx";

export default function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [threshold, setThreshold] = useState("50");

  return (
    <div className="app">
      <header>
        <h1>Agent Yield LatAm</h1>
        <p>
          Autonomous treasury agent for merchants — keep a liquid buffer, sweep
          the rest into yield on Stellar.
        </p>
      </header>

      <WalletConnect onConnectedChange={setWalletConnected} />

      <section className="card threshold-row">
        <h2>Sweep rule</h2>
        <label htmlFor="threshold">
          Keep this much USDC liquid; invest everything else
        </label>
        <input
          id="threshold"
          type="number"
          min="0"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          disabled={!walletConnected}
        />
      </section>

      <ChatPanel walletConnected={walletConnected} />
    </div>
  );
}
