import { useRef, useEffect, useState } from "react";

const API = "http://localhost:8000";

const BIAS_COLORS = {
  FOMO: "#D85A30", PRESENT_BIAS: "#534AB7",
  LOSS_AVERSION: "#185FA5", SOCIAL_PROOF: "#0F6E56",
  OVERCONFIDENCE: "#854F0B",
};
const BIAS_LABELS = {
  FOMO: "Fear of missing out", PRESENT_BIAS: "Present bias",
  LOSS_AVERSION: "Loss aversion", SOCIAL_PROOF: "Social proof",
  OVERCONFIDENCE: "Overconfidence",
};

const QUICK = {
  rajesh: ["My friend doubled money in crypto, should I try?", "Got loan app offer at 2% monthly, okay?", "How to save with irregular income?"],
  priya:  ["Bank advisor recommending ULIP, should I buy?", "How to plan daughter's education fund?", "What is Section 80C?"],
  kisan:  ["Sahukar wants 5% monthly interest, kya karu?", "PM-KISAN mein register kaise karein?", "Fasal bima kaise milega?"],
};

export default function Chat({ userProfile, onScoreChange, messages, onMessagesChange }) {
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    onMessagesChange(newMessages);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, user_profile: userProfile, conversation_history: history }),
      });
      const data = await res.json();
      if (data.score_change) onScoreChange(data.score_change);

      onMessagesChange([...newMessages, {
        role: "assistant",
        content: data.response || data.raw_response || "Please try again.",
        bias: data.bias_detected || null,
        bias_explanation: data.bias_explanation || null,
        agent: data.agent_used || "EDUCATION",
        score_change: data.score_change || 0,
        action_item: data.action_item || null,
      }]);
    } catch {
      onMessagesChange([...newMessages, {
        role: "assistant",
        content: "⚠️ Backend not running. Start uvicorn on port 8000.",
        bias: null,
      }]);
    }
    setLoading(false);
  };

  const quickList = QUICK[userProfile.persona] || QUICK.rajesh;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", background: "#ECE5DD", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.bias && (
              <div style={{ background: BIAS_COLORS[m.bias] || "#888", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, marginBottom: 3, fontWeight: 600 }}>
                ⚠️ {BIAS_LABELS[m.bias] || m.bias} detected
              </div>
            )}
            <div style={{ maxWidth: "80%", padding: "8px 12px", fontSize: 13, lineHeight: 1.5,
              borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: m.role === "user" ? "#DCF8C6" : "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
              {m.content}
            </div>
            {m.action_item && (
              <div style={{ marginTop: 4, background: "#E8F5E9", border: "1px solid #1D9E75", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#0F6E56", maxWidth: "80%" }}>
                ✅ <b>Action:</b> {m.action_item}
              </div>
            )}
            {m.score_change > 0 && (
              <div style={{ fontSize: 10, color: "#1D9E75", marginTop: 2 }}>+{m.score_change} health score</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ background: "#fff", padding: "8px 14px", borderRadius: "12px 12px 12px 4px", fontSize: 13, color: "#999" }}>
              ArthSaathi is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div style={{ display: "flex", gap: 5, padding: "5px 8px", background: "#f5f5f5", overflowX: "auto" }}>
        {quickList.map((q, i) => (
          <button key={i} onClick={() => send(q)}
            style={{ whiteSpace: "nowrap", padding: "4px 10px", borderRadius: 14, border: "1px solid #075E54",
              background: "none", color: "#075E54", fontSize: 11, cursor: "pointer" }}>
            {q.length > 32 ? q.slice(0, 32) + "…" : q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", padding: "8px", gap: 8, borderTop: "1px solid #e0e0e0", background: "#f9f9f9" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask ArthSaathi anything about money..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 24, border: "1px solid #ccc", fontSize: 13, outline: "none" }} />
        <button onClick={() => send()} disabled={loading}
          style={{ width: 42, height: 42, borderRadius: "50%", background: "#075E54", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>
          ➤
        </button>
      </div>
    </div>
  );
}