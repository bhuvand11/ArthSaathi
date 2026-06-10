import { useState } from "react";
import Chat from "./components/Chat";
import ScamChecker from "./components/ScamChecker";
import HealthScore from "./components/HealthScore";
import Nudges from "./components/Nudges";
import TimeMachine from "./components/TimeMachine";

const PERSONAS = {
  rajesh: {
    name: "Rajesh", label: "Gig worker · Mumbai",
    income: 25000, income_type: "gig", language: "hindi",
    color: "#1D9E75", avatar: "R", score: 38,
  },
  priya: {
    name: "Priya", label: "Teacher · Thane",
    income: 35000, income_type: "salaried", language: "english",
    color: "#534AB7", avatar: "P", score: 55,
  },
  kisan: {
    name: "Kisan", label: "Farmer · Karnataka",
    income: 12000, income_type: "farmer", language: "kannada",
    color: "#BA7517", avatar: "K", score: 29,
  },
};

const TABS = [
  { id: "chat",    label: "💬 Chat"        },
  { id: "scam",    label: "🛡️ Scam Check"  },
  { id: "health",  label: "📊 Health"      },
  { id: "nudge",   label: "🔔 Nudges"      },
  { id: "time",    label: "⏳ Time Machine" },
];

export default function App() {
  const [activePersona, setActivePersona] = useState("rajesh");
  const [activeTab, setActiveTab]         = useState("chat");
  const [scoreHistory, setScoreHistory]   = useState({ rajesh: [38], priya: [55], kisan: [29] });

  const persona = PERSONAS[activePersona];
  const currentScore = scoreHistory[activePersona].slice(-1)[0];

  const addScore = (delta) => {
    setScoreHistory(prev => ({
      ...prev,
      [activePersona]: [...prev[activePersona], Math.min(100, Math.max(0, prev[activePersona].slice(-1)[0] + delta))]
    }));
  };

  const userProfile = {
    name: persona.name,
    persona: activePersona,
    language: persona.language,
    income_type: persona.income_type,
    monthly_income: persona.income,
    financial_health_score: currentScore,
  };

  const scoreColor = currentScore >= 70 ? "#1D9E75" : currentScore >= 45 ? "#BA7517" : "#D85A30";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: "#075E54", padding: "12px 16px", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: persona.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17 }}>
          {persona.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>ArthSaathi 💰</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Behavioral Financial Guardian · {persona.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, opacity: 0.7 }}>Health Score</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor === "#1D9E75" ? "#90EBC8" : scoreColor === "#BA7517" ? "#FAC775" : "#F09595" }}>
            {currentScore}/100
          </div>
        </div>
      </div>

      {/* Persona switcher */}
      <div style={{ display: "flex", background: "#f0f0f0", padding: "6px 8px", gap: 6 }}>
        {Object.entries(PERSONAS).map(([key, p]) => (
          <button key={key} onClick={() => setActivePersona(key)}
            style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: "none",
              background: activePersona === key ? p.color : "transparent",
              color: activePersona === key ? "#fff" : "#333",
              fontSize: 11, fontWeight: activePersona === key ? 700 : 400, cursor: "pointer" }}>
            {p.name}<br />
            <span style={{ fontSize: 9, opacity: 0.8 }}>{p.label.split("·")[0].trim()}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: "9px 2px", border: "none", background: "none", minWidth: 70,
              borderBottom: activeTab === t.id ? "2px solid #075E54" : "2px solid transparent",
              color: activeTab === t.id ? "#075E54" : "#666",
              fontSize: 11, fontWeight: activeTab === t.id ? 700 : 400, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1 }}>
        {activeTab === "chat"   && <Chat userProfile={userProfile} onScoreChange={addScore} />}
        {activeTab === "scam"   && <ScamChecker userProfile={userProfile} />}
        {activeTab === "health" && <HealthScore persona={activePersona} scoreHistory={scoreHistory[activePersona]} />}
        {activeTab === "nudge"  && <Nudges userProfile={userProfile} />}
        {activeTab === "time"   && <TimeMachine userProfile={userProfile} />}
      </div>
    </div>
  );
}