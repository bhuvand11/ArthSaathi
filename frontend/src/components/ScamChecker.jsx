import { useState } from "react";

const API = "http://localhost:8000";

const SAMPLE = `🔥 URGENT - Limited Time Only! 🔥
Invest Rs 10,000 today → Get Rs 25,000 in 30 days!
Our AI trading bot has 100% success rate.
50,000+ members already earning daily profits!
Only 50 slots left. Act NOW!
WhatsApp us: +91-XXXXXXXXXX
No risk. Guaranteed returns.`;

export default function ScamChecker({ userProfile }) {
  const [text, setText]       = useState(SAMPLE);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true); setResult(null);
    try {
      const res  = await fetch(`${API}/scam-check`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_text: text, user_profile: userProfile }),
      });
      setResult(await res.json());
    } catch { setResult({ error: "Backend not running." }); }
    setLoading(false);
  };

  const verdictColor = result?.verdict === "SCAM" ? "#C62828"
    : result?.verdict === "SUSPICIOUS" ? "#E65100" : "#2E7D32";
  const verdictBg = result?.verdict === "SCAM" ? "#FFEBEE"
    : result?.verdict === "SUSPICIOUS" ? "#FFF8E1" : "#E8F5E9";

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 10, padding: "10px 13px", fontSize: 12, color: "#E65100" }}>
        🛡️ <b>Scam Guardian</b> — Paste any suspicious message. AI checks it for 5 scam patterns instantly.
      </div>

      <textarea value={text} onChange={e => setText(e.target.value)} rows={7}
        placeholder="Paste the suspicious message here..."
        style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />

      <button onClick={check} disabled={loading}
        style={{ padding: "12px 0", background: "#D84315", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        {loading ? "Analyzing…" : "🔍 Analyze for Scam"}
      </button>

      {result?.error && <div style={{ color: "red", fontSize: 13 }}>⚠️ {result.error}</div>}

      {result && !result.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Verdict */}
          <div style={{ padding: "12px 16px", borderRadius: 10, background: verdictBg, border: `2px solid ${verdictColor}` }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: verdictColor }}>
              {result.verdict === "SCAM" ? "🚨 SCAM" : result.verdict === "SUSPICIOUS" ? "⚠️ SUSPICIOUS" : "✅ LOOKS OK"}
            </div>
            <div style={{ fontSize: 13, marginTop: 5, color: "#333" }}>{result.plain_language_verdict}</div>
          </div>

          {/* Risk bar */}
          <div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Risk Score: {result.risk_score}/100</div>
            <div style={{ height: 10, borderRadius: 5, background: "#eee" }}>
              <div style={{ width: `${result.risk_score}%`, height: "100%", borderRadius: 5, transition: "width 0.6s",
                background: result.risk_score > 70 ? "#E53935" : result.risk_score > 40 ? "#FFB300" : "#43A047" }} />
            </div>
          </div>

          {/* Red flags */}
          {result.red_flags?.length > 0 && (
            <div style={{ background: "#FFF3E0", borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: "#E65100" }}>🚩 Red flags:</div>
              {result.red_flags.map((f, i) => <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>• {f}</div>)}
            </div>
          )}

          {/* Bias */}
          {result.bias_exploited && (
            <div style={{ background: "#EDE7F6", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
              🧠 <b>Psychological trick used:</b> {result.bias_exploited}
            </div>
          )}

          {/* What to do */}
          <div style={{ background: "#E8F5E9", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#1B5E20", marginBottom: 4 }}>✅ What to do:</div>
            <div style={{ fontSize: 12, color: "#2E7D32" }}>{result.what_to_do}</div>
          </div>

          {/* Legit alternative */}
          {result.real_alternative && (
            <div style={{ background: "#E3F2FD", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#0D47A1" }}>
              💡 <b>Legit alternative:</b> {result.real_alternative}
            </div>
          )}
        </div>
      )}
    </div>
  );
}