from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import Groq
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="ArthSaathi API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    name: str
    persona: str
    language: str
    outputLanguage: str
    income_type: str
    monthly_income: int
    financial_health_score: int = 50

class ChatRequest(BaseModel):
    message: str
    user_profile: UserProfile
    conversation_history: List[dict] = []

class ScamCheckRequest(BaseModel):
    message_text: str
    user_profile: UserProfile

class NudgeRequest(BaseModel):
    user_profile: UserProfile
    trigger: str

class TimeMachineRequest(BaseModel):
    user_goal: str
    user_profile: UserProfile

def ask_groq(prompt: str) -> dict:
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024,
        )
        raw = completion.choices[0].message.content.strip()
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except json.JSONDecodeError:
        return {"raw_response": raw, "parse_error": True}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def root():
    return {"status": "ArthSaathi API running"}

@app.post("/chat")
async def chat(req: ChatRequest):
    history_text = ""
    for turn in req.conversation_history[-6:]:
        role = "User" if turn["role"] == "user" else "ArthSaathi"
        history_text += f"{role}: {turn['content']}\n"

    # Chat feature: user types in English/Hinglish, output is warm conversational
    # but still in the persona's natural language mix
    prompt = f"""
You are ArthSaathi, a behavioral financial guardian for India. You speak warmly in simple language.

User profile:
- Name: {req.user_profile.name}
- Type: {req.user_profile.persona} ({req.user_profile.income_type})
- Language preference: {req.user_profile.language}
- Monthly income: Rs {req.user_profile.monthly_income}
- Financial health score: {req.user_profile.financial_health_score}/100

LANGUAGE RULE FOR CHAT:
- Rajesh: Respond in natural Hinglish (Hindi written in English script). Example: "Aapko yeh loan nahi lena chahiye kyunki interest bahut zyada hai."
- Priya: Respond in natural Marathi-English mix written in English script. Example: "Hya ULIP baddal jaast vichar kara, bank agents komishn sathi suggest kartaat."
- Suresh: Respond in natural Telugu written in English script (transliterated Telugu). Example: "Ee loan teesukoddam sari kaadu, vayaja chala ekkuva."
- Divya: Respond in clear simple English. Avoid charts or visual references. Describe everything in words.

Conversation so far:
{history_text}

User just said: "{req.message}"

Detect behavioral bias if present:
- FOMO, PRESENT_BIAS, LOSS_AVERSION, SOCIAL_PROOF, OVERCONFIDENCE

Respond ONLY with this exact JSON:
{{
  "bias_detected": "FOMO" or "PRESENT_BIAS" or "LOSS_AVERSION" or "SOCIAL_PROOF" or "OVERCONFIDENCE" or null,
  "bias_explanation": "one sentence" or null,
  "agent_used": "SCAM_CHECK" or "DEBT_TRAP" or "BUDGET" or "SCHEME_INFO" or "EDUCATION",
  "response": "your response in the correct language as described above",
  "score_change": a number between -5 and 10,
  "action_item": "one concrete thing they can do today" or null
}}
"""
    return ask_groq(prompt)


@app.post("/scam-check")
async def scam_check(req: ScamCheckRequest):
    lang_instruction = {
        "hindi":   "Respond entirely in Hindi (Devanagari script or Hinglish — your choice).",
        "marathi": "Respond entirely in Marathi (Devanagari script or Marathi written in English script).",
        "telugu":  "Respond entirely in Telugu (Telugu script or transliterated Telugu in English script).",
        "english": "Respond in clear simple English.",
    }.get(req.user_profile.language, "Respond in English.")

    prompt = f"""
You are ArthSaathi's Scam Guardian. Analyze this message for scam indicators.

Message to analyze:
---
{req.message_text}
---

User: {req.user_profile.name}, income Rs {req.user_profile.monthly_income}/month
{lang_instruction}

Check for these 5 red flags:
1. URGENCY PRESSURE
2. UNREALISTIC RETURNS (above 12% annual is suspicious per RBI standards)
3. UNREGULATED (no SEBI/RBI/IRDAI registration mentioned)
4. SOCIAL PROOF MANIPULATION
5. ADVANCE FEE

Respond ONLY with this exact JSON (all text fields must be in the language specified above):
{{
  "verdict": "SCAM" or "SUSPICIOUS" or "LEGITIMATE" or "UNCLEAR",
  "risk_score": number from 0 to 100,
  "red_flags": ["list", "of", "red flags found"],
  "bias_exploited": "which psychological bias this scam targets",
  "plain_language_verdict": "2-3 sentences in the user's language",
  "what_to_do": "concrete action in the user's language",
  "real_alternative": "a legitimate alternative in the user's language"
}}
"""
    return ask_groq(prompt)


@app.post("/proactive-nudge")
async def proactive_nudge(req: NudgeRequest):
    trigger_map = {
        "high_income": "User just had a high income week.",
        "low_income":  "User had a low income period.",
        "week_start":  "It is Monday morning.",
        "idle_7days":  "User has not opened ArthSaathi in 7 days.",
    }

    lang_instruction = {
        "hindi":   "Write the nudge entirely in Hinglish (Hindi in English script).",
        "marathi": "Write the nudge entirely in Marathi (written in English script or Devanagari).",
        "telugu":  "Write the nudge entirely in Telugu (Telugu script or transliterated English script).",
        "english": "Write the nudge in clear simple English.",
    }.get(req.user_profile.language, "Write in English.")

    prompt = f"""
You are ArthSaathi sending a proactive WhatsApp nudge.

User: {req.user_profile.name}
Income type: {req.user_profile.income_type}
Monthly income: Rs {req.user_profile.monthly_income}
Financial health score: {req.user_profile.financial_health_score}/100
Trigger event: {trigger_map.get(req.trigger, req.trigger)}
{lang_instruction}

Write a short friendly nudge (max 2 sentences). Be specific with rupee amounts. Start with a relevant emoji.

Respond ONLY with this exact JSON:
{{
  "nudge_message": "the nudge in the correct language",
  "nudge_type": "SAVE" or "WARN" or "EDUCATE" or "CELEBRATE",
  "suggested_action": "one tap action label in the user's language"
}}
"""
    return ask_groq(prompt)


@app.post("/time-machine")
async def time_machine(req: TimeMachineRequest):
    lang_instruction = {
        "hindi":   "Write future_self_message and outcome fields in Hinglish (Hindi in English script).",
        "marathi": "Write future_self_message and outcome fields in Marathi (English script).",
        "telugu":  "Write future_self_message and outcome fields in Telugu (English script transliteration).",
        "english": "Write everything in clear simple English.",
    }.get(req.user_profile.language, "Write in English.")

    prompt = f"""
You are ArthSaathi's Financial Time Machine.

User: {req.user_profile.name}
Monthly income: Rs {req.user_profile.monthly_income}
Income type: {req.user_profile.income_type}
Financial health score: {req.user_profile.financial_health_score}/100
User's goal: "{req.user_goal}"

{lang_instruction}

Create two realistic financial scenarios comparing buying now vs delaying by 3-4 months.
Be specific with rupee amounts based on their income.

Respond ONLY with this exact JSON:
{{
  "goal_summary": "short summary in English",
  "scenario_now": {{
    "title": "If you do this now",
    "monthly_cost": number,
    "savings_after_6_months": number,
    "debt_risk": "High" or "Medium" or "Low",
    "outcome": "one sentence outcome in the user's language",
    "emoji": "one emoji"
  }},
  "scenario_delay": {{
    "title": "If you wait 4 months",
    "monthly_savings": number,
    "savings_after_6_months": number,
    "debt_risk": "High" or "Medium" or "Low",
    "outcome": "one sentence outcome in the user's language",
    "emoji": "one emoji"
  }},
  "recommended_choice": "now" or "delay",
  "future_self_message": "3-4 sentence emotional message from future self in the user's language",
  "future_self_name": "{req.user_profile.name} (6 months from now)"
}}
"""
    return ask_groq(prompt)


@app.get("/financial-health-breakdown/{persona}")
def health_breakdown(persona: str):
    data = {
        "rajesh": {
            "overall_score": 38,
            "dimensions": [
                {"name": "Emergency fund",   "score": 10, "max": 25, "status": "critical"},
                {"name": "Debt management",  "score": 12, "max": 25, "status": "poor"},
                {"name": "Savings behavior", "score": 8,  "max": 25, "status": "poor"},
                {"name": "Scam awareness",   "score": 8,  "max": 25, "status": "poor"},
            ],
            "top_bias": "FOMO",
            "biggest_risk": "Instant loan apps with 40%+ APR",
            "next_milestone": "Save Rs 2,000 emergency buffer",
        },
        "priya": {
            "overall_score": 55,
            "dimensions": [
                {"name": "Emergency fund",   "score": 14, "max": 25, "status": "moderate"},
                {"name": "Debt management",  "score": 18, "max": 25, "status": "good"},
                {"name": "Savings behavior", "score": 12, "max": 25, "status": "moderate"},
                {"name": "Scam awareness",   "score": 11, "max": 25, "status": "moderate"},
            ],
            "top_bias": "LOSS_AVERSION",
            "biggest_risk": "Missing employer EPF match and tax savings",
            "next_milestone": "Activate Section 80C investments",
        },
        "suresh": {
            "overall_score": 29,
            "dimensions": [
                {"name": "Emergency fund",   "score": 5,  "max": 25, "status": "critical"},
                {"name": "Debt management",  "score": 8,  "max": 25, "status": "poor"},
                {"name": "Savings behavior", "score": 9,  "max": 25, "status": "poor"},
                {"name": "Scam awareness",   "score": 7,  "max": 25, "status": "poor"},
            ],
            "top_bias": "PRESENT_BIAS",
            "biggest_risk": "Informal moneylenders at 36%+ APR",
            "next_milestone": "Apply for Kisan Credit Card",
        },
        "divya": {
            "overall_score": 47,
            "dimensions": [
                {"name": "Emergency fund",   "score": 12, "max": 25, "status": "moderate"},
                {"name": "Debt management",  "score": 15, "max": 25, "status": "moderate"},
                {"name": "Savings behavior", "score": 11, "max": 25, "status": "moderate"},
                {"name": "Scam awareness",   "score": 9,  "max": 25, "status": "poor"},
            ],
            "top_bias": "LOSS_AVERSION",
            "biggest_risk": "Missing disability scheme benefits and EPF misunderstanding",
            "next_milestone": "Apply for DISHA scheme and check EPF balance",
        },
    }
    return data.get(persona, data["rajesh"])