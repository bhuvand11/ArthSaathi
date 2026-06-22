import { useEffect, useState } from "react";
import { TTSButton, LANG_CODE } from "./useTTS";

const API = "http://localhost:8000";

const BIAS_LABELS = {
  FOMO: "Fear of missing out", PRESENT_BIAS: "Present bias",
  LOSS_AVERSION: "Loss aversion", SOCIAL_PROOF: "Social proof",
};
const STATUS_COLORS = { critical: "#E53935", poor: "#FF7043", moderate: "#FFB300", good: "#43A047" };

export default function HealthScore({ persona, scoreHistory }) {
  const [data, setData] = useState(null);
  const langCode = LANG_CODE[{ rajesh: "hindi", priya: "marathi", suresh: "telugu", divya: "english" }[persona]] || "en-IN";

  useEffect(() => {
    fetch(`${API}/financial-health-breakdown/${persona}`)
      .then(r => r.json()).then(setData).catch(() => {});
  }, [persona]);

  const currentScore = scoreHistory.slice(-1)[0];
  const scoreColor   = currentScore >= 70 ? "#1D9E75" : currentScore >= 45 ? "#BA7517" : "#D85A30";

  const ttsSummary = data
    ? `Financial health score: ${currentScore} out of 100. Main risk: ${data.biggest_risk}. Next goal: ${data.next_milestone}.`
    : "";

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

      <div style={{ textAlign: "center", padding: "18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{currentScore}</div>
          {ttsSummary && <TTSButton text={ttsSummary} lang={langCode} />}
        </div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Financial Health Score</div>
        <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 10 }}>
          {scoreHistory.map((s, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%",
              background: i === scoreHistory.length - 1 ? scoreColor : "#ddd" }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
          {scoreHistory.length > 1 ? `Changed ${scoreHistory.length - 1} times this session` : "Start chatting to improve your score"}
        </div>
      </div>

      {data?.dimensions?.map(d => (
        <div key={d.name}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{d.name}</span>
            <span style={{ color: STATUS_COLORS[d.status], fontWeight: 700 }}>{d.score}/{d.max} · {d.status}</span>
          </div>
          <div style={{ height: 11, borderRadius: 6, background: "#eee" }}>
            <div style={{ width: `${(d.score / d.max) * 100}%`, height: "100%", borderRadius: 6,
              background: STATUS_COLORS[d.status], transition: "width 0.5s" }} />
          </div>
        </div>
      ))}

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <div style={{ background: "#FFF3E0", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
            🧠 <b>Main behavioral bias:</b> {BIAS_LABELS[data.top_bias] || data.top_bias}
          </div>
          <div style={{ background: "#FFEBEE", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
            ⚠️ <b>Biggest risk right now:</b> {data.biggest_risk}
          </div>
          <div style={{ background: "#E8F5E9", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
            🎯 <b>Next milestone:</b> {data.next_milestone}
          </div>
        </div>
      )}
    </div>
  );
}