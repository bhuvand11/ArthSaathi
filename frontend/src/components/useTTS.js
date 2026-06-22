import { useCallback } from "react";

export function useTTS() {
  const speak = useCallback((text, lang = "en-US") => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, stop };
}

// Map our language keys to BCP-47 codes for best TTS voice matching
export const LANG_CODE = {
  hindi:   "hi-IN",
  marathi: "mr-IN",
  telugu:  "te-IN",
  english: "en-IN",
};

// TTS Button component — reuse everywhere
export function TTSButton({ text, lang = "en-IN", small = false }) {
  const { speak, stop } = useTTS();
  const size = small ? 22 : 28;
  return (
    <button
      title="Listen"
      onClick={() => speak(text, lang)}
      style={{
        background: "none", border: "1px solid #ccc", borderRadius: "50%",
        width: size, height: size, cursor: "pointer", fontSize: small ? 10 : 13,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "#075E54", flexShrink: 0,
      }}>
      🔊
    </button>
  );
}