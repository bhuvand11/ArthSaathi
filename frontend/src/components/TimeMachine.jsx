import { useState } from "react";
import { TTSButton, LANG_CODE } from "./useTTS";

const API = "http://localhost:8000";

const SAMPLE_GOALS = {
  rajesh: ["I want to buy a new bike worth Rs 80,000", "I want to go on a trip to Goa with friends"],
  priya:  ["Mulisathi laptop ghyaycha ahe Rs 60,000 cha", "Ghari renovation karaychi ahe"],
  suresh: ["Kొత్త tractor కోసం Rs 2,00,000 కావాలి", "Intiki solar panels pettukovalani undi"],
  divya:  ["I want to buy a screen reader software worth Rs 15,000", "I want to build an emergency fund of Rs 50,000"],
};

export default function TimeMachine({ userProfile }) {
  const [goal, setGoal]         = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [showFuture, setShowFuture] = useState(false);
  const langCode                = LANG_CODE[userProfile.language] || "en-IN";

  const analyze = async () => {
    if (!goal.trim()) return;
    setLoading(true); setResult(null); setShowFuture(false);
    try {
      const res = await fetch(`${API}/time-machine`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_goal: goal, user_profile: userProfile }),
      });
      setResult(await res.json());
    } catch { setResult({ error: "Backend not running." }); }
    setLoading(false);
  };

  const futureTTS = result
    ? `${result.goal_summary}. ${result.recommended_choice === "delay" ? "Recommendation: Wait and save." : "Recommendation: Proceed now."} ${result.future_self_message}`
    : "";

  const samples = SAMPLE_GOALS[userProfile.persona] || SAMPLE_GOALS.rajesh;

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>

      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: 12, padding: "16px 14px", color: "#fff", textAlign: "center" }}>
        <div style={{ fontSize: 28 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>Financial Time Machine</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>See two futures. Hear from your future self. Choose wisely.</div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 6 }}>What do you want to buy or do?</div>
        <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3}
          placeholder='Describe your financial goal...'
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid #ccc", fontSize: 13, fontFamily: "inherit", resize: "none" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 11, color: "#888" }}>Or try an example:</div>
        {samples.map((g, i) => (
          <button key={i} onClick={() => setGoal(g)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f9f9f9",
              textAlign: "left", fontSize: 12, cursor: "pointer", color: "#333" }}>
            {g}
          </button>
        ))}
      </div>

      <button onClick={analyze} disabled={loading || !goal.trim()}
        style={{ padding: "13px 0", background: "linear-gradient(135deg, #1a1a2e, #075E54)",
          color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14,
          cursor: goal.trim() ? "pointer" : "not-allowed", opacity: goal.trim() ? 1 : 0.6 }}>
        {loading ? "Traveling through time…" : "⏳ Show My Two Futures"}
      </button>

      {result?.error && <div style={{ color: "red", fontSize: 13 }}>⚠️ {result.error}</div>}

      {result && !result.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <div style={{ background: "#f0f0f0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#555", textAlign: "center" }}>
            📌 {result.goal_summary}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "#FFF3E0", borderRadius: 12, padding: 12, border: `2px solid ${result.recommended_choice === "now" ? "#43A047" : "#FF7043"}` }}>
              <div style={{ fontSize: 20, textAlign: "center" }}>{result.scenario_now?.emoji || "⚡"}</div>
              <div style={{ fontWeight: 700, fontSize: 12, textAlign: "center", marginTop: 4 }}>{result.scenario_now?.title}</div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#555", lineHeight: 1.6 }}>
                <div>💸 Cost/month: <b>Rs {result.scenario_now?.monthly_cost?.toLocaleString()}</b></div>
                <div>💰 Savings 6mo: <b style={{ color: (result.scenario_now?.savings_after_6_months || 0) > 0 ? "#1D9E75" : "#D32F2F" }}>Rs {result.scenario_now?.savings_after_6_months?.toLocaleString()}</b></div>
                <div>⚠️ Debt risk: <b style={{ color: result.scenario_now?.debt_risk === "High" ? "#D32F2F" : result.scenario_now?.debt_risk === "Medium" ? "#E65100" : "#1D9E75" }}>{result.scenario_now?.debt_risk}</b></div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontStyle: "italic" }}>{result.scenario_now?.outcome}</div>
              {result.recommended_choice === "now" && (
                <div style={{ marginTop: 6, background: "#43A047", color: "#fff", borderRadius: 6, padding: "3px 6px", fontSize: 10, textAlign: "center", fontWeight: 700 }}>✅ RECOMMENDED</div>
              )}
            </div>

            <div style={{ background: "#E8F5E9", borderRadius: 12, padding: 12, border: `2px solid ${result.recommended_choice === "delay" ? "#43A047" : "#ddd"}` }}>
              <div style={{ fontSize: 20, textAlign: "center" }}>{result.scenario_delay?.emoji || "⏳"}</div>
              <div style={{ fontWeight: 700, fontSize: 12, textAlign: "center", marginTop: 4 }}>{result.scenario_delay?.title}</div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#555", lineHeight: 1.6 }}>
                <div>💰 Save/month: <b>Rs {result.scenario_delay?.monthly_savings?.toLocaleString()}</b></div>
                <div>🏦 Savings 6mo: <b style={{ color: "#1D9E75" }}>Rs {result.scenario_delay?.savings_after_6_months?.toLocaleString()}</b></div>
                <div>⚠️ Debt risk: <b style={{ color: result.scenario_delay?.debt_risk === "High" ? "#D32F2F" : result.scenario_delay?.debt_risk === "Medium" ? "#E65100" : "#1D9E75" }}>{result.scenario_delay?.debt_risk}</b></div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontStyle: "italic" }}>{result.scenario_delay?.outcome}</div>
              {result.recommended_choice === "delay" && (
                <div style={{ marginTop: 6, background: "#43A047", color: "#fff", borderRadius: 6, padding: "3px 6px", fontSize: 10, textAlign: "center", fontWeight: 700 }}>✅ RECOMMENDED</div>
              )}
            </div>
          </div>

          {!showFuture && (
            <button onClick={() => setShowFuture(true)}
              style={{ padding: "13px 0", background: "linear-gradient(135deg, #4A148C, #1a237e)",
                color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              🔮 Hear from your Future Self
            </button>
          )}

          {showFuture && (
            <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: 16, padding: 18, color: "#fff" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)",
                  margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, border: "3px solid rgba(255,255,255,0.3)", boxShadow: "0 0 20px rgba(102,126,234,0.5)" }}>
                  🧑
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#e0d7ff" }}>{result.future_self_name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>A message from 6 months in the future</div>
              </div>

              <div style={{ fontSize: 40, color: "rgba(255,255,255,0.15)", lineHeight: 0.5, marginBottom: 8 }}>"</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "#e0d7ff", fontStyle: "italic" }}>{result.future_self_message}</div>
              <div style={{ fontSize: 40, color: "rgba(255,255,255,0.15)", textAlign: "right", lineHeight: 0.5, marginTop: 8 }}>"</div>

              {/* TTS for future self message */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                <TTSButton text={futureTTS} lang={langCode} />
              </div>

              <div style={{ marginTop: 12, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#a0f0b0", fontWeight: 600 }}>💚 Your future self is counting on you.</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Start your savings plan today in the Chat tab.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}