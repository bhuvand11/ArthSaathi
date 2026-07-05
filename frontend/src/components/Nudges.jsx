import { useState } from "react";
import { TTSButton, LANG_CODE } from "./useTTS";
import API from "../config";

const TRIGGERS = [
  { id: "high_income", label: "💰 High income week",  desc: "Simulate payday or good gig week" },
  { id: "low_income",  label: "📉 Low income period", desc: "Simulate slow income week" },
  { id: "week_start",  label: "📅 Week start",        desc: "Monday morning nudge" },
  { id: "idle_7days",  label: "😴 Inactive 7 days",   desc: "Re-engagement nudge" },
];

const TYPE_COLORS = { SAVE: "#1D9E75", WARN: "#D84315", EDUCATE: "#075E54", CELEBRATE: "#7B1FA2" };

export default function Nudges({ userProfile }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState(null);
  const langCode              = LANG_CODE[userProfile.language] || "en-IN";

  const fetchNudge = async (trigger) => {
    setLoading(true); setActive(trigger); setResult(null);
    try {
      const res = await fetch(`${API}/proactive-nudge`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger, user_profile: userProfile }),
      });
      setResult(await res.json());
    } catch { setResult({ error: "Backend not running." }); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, background: "#f0f8ff", borderRadius: 8, padding: "10px 12px" }}>
        🔔 <b>Proactive Nudges</b> — ArthSaathi reaches you at the right moment. Simulate a trigger:
      </div>

      {TRIGGERS.map(t => (
        <button key={t.id} onClick={() => fetchNudge(t.id)} disabled={loading}
          style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${active === t.id ? "#075E54" : "#ddd"}`,
            background: active === t.id ? "#f0fff8" : "#fafafa", textAlign: "left", cursor: "pointer" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{t.desc}</div>
        </button>
      ))}

      {loading && <div style={{ textAlign: "center", color: "#999", fontSize: 13 }}>Generating nudge…</div>}
      {result?.error && <div style={{ color: "red", fontSize: 13 }}>⚠️ {result.error}</div>}

      {result && !result.error && (
        <div style={{ background: "#075E54", color: "#fff", borderRadius: 14, padding: 16, marginTop: 4 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
            📱 WhatsApp from ArthSaathi → {userProfile.name}:
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{result.nudge_message}</div>
            <TTSButton text={result.nudge_message} lang={langCode} />
          </div>
          {result.suggested_action && (
            <button style={{ marginTop: 12, padding: "8px 16px", background: "#25D366", border: "none",
              borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {result.suggested_action}
            </button>
          )}
          <div style={{ marginTop: 8, fontSize: 10, opacity: 0.6 }}>
            Type: <span style={{ fontWeight: 700 }}>{result.nudge_type}</span>
          </div>
        </div>
      )}
    </div>
  );
}