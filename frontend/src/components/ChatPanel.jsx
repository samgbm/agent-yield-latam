import { useState } from "react";

export default function ChatPanel({ walletConnected }) {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "Hola — ask me “What’s my balance?” once your wallet is connected (Checkpoint 1 demo uses the local AI backend).",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: data.reply || "No reply from backend." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Could not reach the AI backend. Start it with `npm run dev` in ai_backend/.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Treasury chat</h2>
      <div className="chat-log">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            walletConnected
              ? "What's my balance?"
              : "Connect wallet to continue…"
          }
          disabled={!walletConnected || loading}
        />
        <button type="submit" disabled={!walletConnected || loading}>
          Send
        </button>
      </form>
    </section>
  );
}
