import { useRef, useEffect, useState, useCallback } from "react";
import { useTTS, LANG_CODE, TTSButton } from "./useTTS";

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
  rajesh: ["Mere dost ne crypto mein 3x kamaya, kya main bhi karu?", "2% monthly loan app offer mila, theek hai?", "Irregular income mein saving kaise karoon?"],
  priya:  ["Bank advisor ULIP recommend kar raha hai, kharidun?", "Mulichi education fund kaśī plan karu?", "Section 80C mhanje kay?"],
  suresh: ["Sahukar 5% monthly interest mangutunnadu, cheyyanaa?", "PM-KISAN lo register ela cheyyali?", "Panta bhima ela padataadi?"],
  divya:  ["How do I read my EPF statement?", "What government schemes exist for persons with disabilities?", "Explain Section 80C in simple terms"],
};

export default function Chat({ userProfile, onScoreChange, messages, onMessagesChange }) {
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef               = useRef(null);
  const recognitionRef          = useRef(null);
  const { speak }               = useTTS();
  const langCode                = LANG_CODE[userProfile.language] || "en-IN";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // STT setup
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported in this browser. Use Chrome."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult  = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    recognition.onerror   = ()  => setListening(false);
    recognition.onend     = ()  => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [langCode]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, user_profile: userProfile, conversation_history: history }),
      });
      const data = await res.json();
      if (data.score_change) onScoreChange(data.score_change);
      const assistantMsg = {
        role: "assistant",
        content: data.response || data.raw_response || "Please try again.",
        bias: data.bias_detected || null,
        bias_explanation: data.bias_explanation || null,
        agent: data.agent_used || "EDUCATION",
        score_change: data.score_change || 0,
        action_item: data.action_item || null,
      };
      onMessagesChange([...newMessages, assistantMsg]);
      // Auto-speak for Divya
      if (userProfile.persona === "divya" && assistantMsg.content) {
        speak(assistantMsg.content, langCode);
      }
    } catch {
      onMessagesChange([...newMessages, { role: "assistant", content: "⚠️ Backend not running. Start uvicorn on port 8000.", bias: null }]);
    }
    setLoading(false);
  };

  const quickList = QUICK[userProfile.persona] || QUICK.rajesh;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 195px)" }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", background: "#ECE5DD", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.bias && (
              <div style={{ background: BIAS_COLORS[m.bias] || "#888", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, marginBottom: 3, fontWeight: 600 }}>
                ⚠️ {BIAS_LABELS[m.bias] || m.bias} detected
              </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, maxWidth: "85%", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              <div style={{
                padding: "8px 12px", fontSize: 13, lineHeight: 1.5,
                borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                background: m.role === "user" ? "#DCF8C6" : "#fff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
              }}>
                {m.content}
              </div>
              {m.role === "assistant" && (
                <TTSButton text={m.content} lang={langCode} small />
              )}
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
            {q.length > 35 ? q.slice(0, 35) + "…" : q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={{ display: "flex", padding: "8px", gap: 6, borderTop: "1px solid #e0e0e0", background: "#f9f9f9", alignItems: "center" }}>
        {/* Mic button */}
        <button
          onClick={listening ? stopListening : startListening}
          title={listening ? "Stop listening" : "Speak"}
          style={{
            width: 38, height: 38, borderRadius: "50%", border: "none", flexShrink: 0,
            background: listening ? "#D32F2F" : "#e0e0e0", color: listening ? "#fff" : "#444",
            fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          {listening ? "⏹" : "🎤"}
        </button>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={userProfile.persona === "divya" ? "Type or use mic above..." : "Ask ArthSaathi anything..."}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 24, border: "1px solid #ccc", fontSize: 13, outline: "none" }}
        />

        <button onClick={() => send()} disabled={loading}
          style={{ width: 38, height: 38, borderRadius: "50%", background: "#075E54", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>
          ➤
        </button>
      </div>

      {listening && (
        <div style={{ textAlign: "center", fontSize: 11, color: "#D32F2F", padding: "3px 0", background: "#fff3f3" }}>
          🎤 Listening... tap ⏹ to stop
        </div>
      )}
    </div>
  );
}