from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from langsmith import traceable
from langsmith.wrappers import wrap_openai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

# ─── LangSmith setup ───────────────────────────────────────────────
os.environ["LANGCHAIN_TRACING_V2"]  = os.getenv("LANGCHAIN_TRACING_V2", "true")
os.environ["LANGCHAIN_API_KEY"]     = os.getenv("LANGCHAIN_API_KEY", "")
os.environ["LANGCHAIN_PROJECT"]     = os.getenv("LANGCHAIN_PROJECT", "arthsaathi")

# ─── Groq client ───────────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─── FastAPI ───────────────────────────────────────────────────────
app = FastAPI(title="ArthSaathi API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ────────────────────────────────────────────────────────
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

# ─── Tool Definitions for the Agent ────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "detect_bias",
            "description": (
                "Detects psychological/behavioral bias in the user's message. "
                "Call this when the user seems to be making a financial decision "
                "driven by emotion, peer pressure, fear, or urgency. "
                "Returns the bias type and a debiasing explanation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "bias_type": {
                        "type": "string",
                        "enum": ["FOMO", "PRESENT_BIAS", "LOSS_AVERSION", "SOCIAL_PROOF", "OVERCONFIDENCE", "NONE"],
                        "description": "The behavioral bias detected in the message"
                    },
                    "bias_explanation": {
                        "type": "string",
                        "description": "One sentence explaining why this bias applies"
                    }
                },
                "required": ["bias_type", "bias_explanation"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_scam",
            "description": (
                "Analyzes a message or investment offer for scam indicators. "
                "Call this when the user shares or describes a suspicious investment, "
                "loan offer, or money-making scheme. Checks for urgency pressure, "
                "unrealistic returns, unregulated entities, social proof manipulation, "
                "and advance fee fraud."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message_text": {
                        "type": "string",
                        "description": "The suspicious message or offer to analyze"
                    }
                },
                "required": ["message_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_time_machine",
            "description": (
                "Generates two financial future scenarios for a user's goal: "
                "buy/act now vs delay by 3-4 months. "
                "Call this when the user mentions wanting to buy something, "
                "make a large purchase, take a trip, or achieve a financial goal. "
                "Returns scenario comparison with rupee amounts and a future self message."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "goal": {
                        "type": "string",
                        "description": "The user's financial goal or purchase intent"
                    }
                },
                "required": ["goal"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_nudge",
            "description": (
                "Generates a proactive financial nudge or reminder. "
                "Call this when the user mentions a behavioral pattern that needs "
                "a gentle financial push — like admitting they haven't saved, "
                "saying they overspent, or mentioning a recurring bad habit."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "trigger": {
                        "type": "string",
                        "description": "The behavioral trigger — e.g. 'no_savings', 'overspent', 'debt_warning', 'good_income', 'idle'"
                    }
                },
                "required": ["trigger"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_health_score",
            "description": (
                "Retrieves the user's current financial health score breakdown "
                "across four dimensions: emergency fund, debt management, "
                "savings behavior, and scam awareness. "
                "Call this when the user asks about their financial health, "
                "their score, or wants to know where they stand financially."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "persona": {
                        "type": "string",
                        "description": "The user persona identifier: rajesh, priya, suresh, or divya"
                    }
                },
                "required": ["persona"]
            }
        }
    }
]

# ─── Tool Executor Functions ────────────────────────────────────────

def get_lang_instruction(language: str) -> str:
    return {
        "hindi":   "Respond in natural Hinglish (Hindi written in English script). Example: 'Yeh bahut risky hai, aapko nahi karna chahiye.'",
        "marathi": "Respond in natural Marathi written in English script. Example: 'He khup dhokadayak aahe, tumhi hे karu naye.'",
        "telugu":  "Respond in natural Telugu written in English script (transliterated). Example: 'Idi chala risk ga undi, meeru idi cheyyakudadu.'",
        "english": "Respond in clear simple English. Avoid references to visual charts or graphs.",
    }.get(language, "Respond in English.")

@traceable(name="tool:detect_bias")
def tool_detect_bias(bias_type: str, bias_explanation: str) -> dict:
    return {
        "bias_detected": bias_type if bias_type != "NONE" else None,
        "bias_explanation": bias_explanation if bias_type != "NONE" else None,
    }

@traceable(name="tool:analyze_scam")
def tool_analyze_scam(message_text: str, user_profile: UserProfile) -> dict:
    lang_instruction = get_lang_instruction(user_profile.language)
    prompt = f"""
You are ArthSaathi's Scam Guardian. Analyze this message for scam indicators.

Message to analyze:
---
{message_text}
---

User: {user_profile.name}, income Rs {user_profile.monthly_income}/month
{lang_instruction}

Check for these 5 red flags:
1. URGENCY PRESSURE — "act now", "limited time", "today only"
2. UNREALISTIC RETURNS — guaranteed returns above 12% annual (RBI benchmark)
3. UNREGULATED ENTITY — no SEBI/RBI/IRDAI registration mentioned
4. SOCIAL PROOF MANIPULATION — "thousands already joined"
5. ADVANCE FEE — pay upfront to receive more

Respond ONLY with this exact JSON (all text fields in the user's language as instructed):
{{
  "verdict": "SCAM" or "SUSPICIOUS" or "LEGITIMATE" or "UNCLEAR",
  "risk_score": number from 0 to 100,
  "red_flags": ["list of red flags found"],
  "bias_exploited": "which psychological bias this scam targets",
  "plain_language_verdict": "2-3 sentences in user's language",
  "what_to_do": "concrete action in user's language",
  "real_alternative": "legitimate alternative in user's language"
}}
"""
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
        )
        raw   = completion.choices[0].message.content.strip()
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except Exception as e:
        return {"error": str(e)}

@traceable(name="tool:run_time_machine")
def tool_run_time_machine(goal: str, user_profile: UserProfile) -> dict:
    lang_instruction = {
        "hindi":   "Write outcome and future_self_message in Hinglish (Hindi in English script).",
        "marathi": "Write outcome and future_self_message in Marathi (English script).",
        "telugu":  "Write outcome and future_self_message in Telugu (English script transliteration).",
        "english": "Write everything in clear simple English.",
    }.get(user_profile.language, "Write in English.")

    prompt = f"""
You are ArthSaathi's Financial Time Machine.

User: {user_profile.name}
Monthly income: Rs {user_profile.monthly_income}
Income type: {user_profile.income_type}
Financial health score: {user_profile.financial_health_score}/100
User goal: "{goal}"

{lang_instruction}

Create two realistic financial scenarios: buy/act now vs delay 3-4 months.
Use specific rupee amounts based on their income.

Respond ONLY with this exact JSON:
{{
  "goal_summary": "short summary in English",
  "scenario_now": {{
    "title": "If you do this now",
    "monthly_cost": number,
    "savings_after_6_months": number,
    "debt_risk": "High" or "Medium" or "Low",
    "outcome": "one sentence in user's language",
    "emoji": "one emoji"
  }},
  "scenario_delay": {{
    "title": "If you wait 4 months",
    "monthly_savings": number,
    "savings_after_6_months": number,
    "debt_risk": "High" or "Medium" or "Low",
    "outcome": "one sentence in user's language",
    "emoji": "one emoji"
  }},
  "recommended_choice": "now" or "delay",
  "future_self_message": "3-4 sentence emotional message from future self in user's language",
  "future_self_name": "{user_profile.name} (6 months from now)"
}}
"""
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )
        raw   = completion.choices[0].message.content.strip()
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except Exception as e:
        return {"error": str(e)}

@traceable(name="tool:generate_nudge")
def tool_generate_nudge(trigger: str, user_profile: UserProfile) -> dict:
    lang_instruction = {
        "hindi":   "Write nudge in Hinglish (Hindi in English script).",
        "marathi": "Write nudge in Marathi (English script).",
        "telugu":  "Write nudge in Telugu (English script transliteration).",
        "english": "Write nudge in clear simple English.",
    }.get(user_profile.language, "Write in English.")

    trigger_context = {
        "high_income":  "User just had a high income week — good moment to save.",
        "low_income":   "User had a low income period — gentle reminder about emergency funds.",
        "week_start":   "Monday morning — spending awareness nudge.",
        "idle_7days":   "User hasn't engaged in 7 days — re-engagement nudge.",
        "no_savings":   "User admitted they haven't saved anything recently.",
        "overspent":    "User mentioned they overspent this week.",
        "debt_warning": "User is considering or has taken a high-interest debt.",
        "good_income":  "User mentioned they earned well recently.",
    }.get(trigger, trigger)

    prompt = f"""
You are ArthSaathi sending a proactive WhatsApp nudge.

User: {user_profile.name}
Income type: {user_profile.income_type}
Monthly income: Rs {user_profile.monthly_income}
Financial health score: {user_profile.financial_health_score}/100
Trigger: {trigger_context}
{lang_instruction}

Write a short friendly nudge (max 2 sentences). Start with an emoji. Be specific with rupee amounts.

Respond ONLY with this exact JSON:
{{
  "nudge_message": "the nudge in user's language",
  "nudge_type": "SAVE" or "WARN" or "EDUCATE" or "CELEBRATE",
  "suggested_action": "one tap action label in user's language"
}}
"""
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=300,
        )
        raw   = completion.choices[0].message.content.strip()
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except Exception as e:
        return {"error": str(e)}

def tool_get_health_score(persona: str) -> dict:
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

# ─── Tool dispatcher ───────────────────────────────────────────────
def execute_tool(tool_name: str, tool_args: dict, user_profile: UserProfile) -> dict:
    if tool_name == "detect_bias":
        return tool_detect_bias(
            bias_type=tool_args.get("bias_type", "NONE"),
            bias_explanation=tool_args.get("bias_explanation", "")
        )
    elif tool_name == "analyze_scam":
        return tool_analyze_scam(
            message_text=tool_args.get("message_text", ""),
            user_profile=user_profile
        )
    elif tool_name == "run_time_machine":
        return tool_run_time_machine(
            goal=tool_args.get("goal", ""),
            user_profile=user_profile
        )
    elif tool_name == "generate_nudge":
        return tool_generate_nudge(
            trigger=tool_args.get("trigger", "general"),
            user_profile=user_profile
        )
    elif tool_name == "get_health_score":
        return tool_get_health_score(
            persona=tool_args.get("persona", user_profile.persona)
        )
    return {"error": f"Unknown tool: {tool_name}"}

# ─── Main Agent Loop ───────────────────────────────────────────────
@traceable(name="arthsaathi:agent_loop")
def run_agent(message: str, user_profile: UserProfile, conversation_history: List[dict]) -> dict:

    lang_instruction = get_lang_instruction(user_profile.language)

    system_prompt = f"""You are ArthSaathi, a proactive behavioral financial guardian for India.

User profile:
- Name: {user_profile.name}
- Persona: {user_profile.persona} ({user_profile.income_type})
- Monthly income: Rs {user_profile.monthly_income}
- Financial health score: {user_profile.financial_health_score}/100
- Language: {user_profile.language}

LANGUAGE RULE: {lang_instruction}

You have 5 tools available. Use them proactively:
- detect_bias: ALWAYS call this first to check for psychological bias in the user message
- analyze_scam: call when user shares or describes any suspicious offer, investment, or loan
- run_time_machine: call when user mentions a purchase goal or large financial decision
- generate_nudge: call when user reveals a bad financial pattern or habit
- get_health_score: call when user asks about their financial standing or score

You may call MULTIPLE tools in one turn if relevant.
After getting tool results, compose ONE warm, helpful response in the correct language.
Keep response under 150 words. Be like a caring friend, not a bank."""

    # Build message history for the agent
    messages = [{"role": "system", "content": system_prompt}]

    for turn in conversation_history[-6:]:
        messages.append({"role": turn["role"], "content": turn["content"]})

    messages.append({"role": "user", "content": message})

    # ── Step 1: First LLM call — agent decides which tools to use ──
    first_response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
        temperature=0.7,
        max_tokens=1024,
    )

    response_message = first_response.choices[0].message
    tool_calls       = getattr(response_message, "tool_calls", None)

    # Track what tools were used and their results
    tools_used    = []
    tool_results  = {}
    bias_detected = None
    bias_explanation = None
    score_change  = 0

    # ── Step 2: Execute each tool the agent requested ──
    if tool_calls:
        # Add agent's tool-call message to history
        messages.append({
            "role": "assistant",
            "content": getattr(response_message, "content", "") or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in tool_calls
            ]
        })

        for tc in tool_calls:
            tool_name = tc.function.name
            try:
                tool_args = json.loads(tc.function.arguments)
            except Exception:
                tool_args = {}

            tools_used.append(tool_name)
            result = execute_tool(tool_name, tool_args, user_profile)
            tool_results[tool_name] = result

            # Extract bias from detect_bias tool
            if tool_name == "detect_bias":
                bias_detected    = result.get("bias_detected")
                bias_explanation = result.get("bias_explanation")
                if bias_detected:
                    score_change -= 2  # showing bias = slight score dip

            # Score changes from other tools
            if tool_name == "analyze_scam":
                risk = result.get("risk_score", 0)
                if risk > 70:
                    score_change += 5   # user was protected from scam = positive
            if tool_name == "run_time_machine":
                score_change += 4       # engaging with future planning = positive
            if tool_name == "get_health_score":
                score_change += 2       # self-awareness = positive

            # Add tool result to message history
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result)
            })

        # ── Step 3: Second LLM call — agent composes final response ──
        final_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=512,
        )
        final_text = final_response.choices[0].message.content.strip()

    else:
        # Agent decided no tools needed — direct response
        final_text = getattr(response_message, "content", "") or "Please try again."

    # ── Determine action item from tool results ──
    action_item = None
    if "generate_nudge" in tool_results:
        action_item = tool_results["generate_nudge"].get("suggested_action")
    elif "analyze_scam" in tool_results:
        action_item = tool_results["analyze_scam"].get("what_to_do")
    elif "run_time_machine" in tool_results:
        rec = tool_results["run_time_machine"].get("recommended_choice", "")
        action_item = f"Recommended: {rec} — check Time Machine tab for full breakdown"

    return {
        "response":          final_text,
        "bias_detected":     bias_detected,
        "bias_explanation":  bias_explanation,
        "tools_used":        tools_used,
        "tool_results":      tool_results,
        "score_change":      score_change,
        "action_item":       action_item,
        "agent_used":        ", ".join(tools_used) if tools_used else "DIRECT",
    }

# ─── Routes ────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ArthSaathi Agent v2.0 running"}

@app.post("/chat")
async def chat(req: ChatRequest):
    return run_agent(req.message, req.user_profile, req.conversation_history)

# Keep all other endpoints working for direct tab access
@app.post("/scam-check")
async def scam_check(req: ScamCheckRequest):
    return tool_analyze_scam(req.message_text, req.user_profile)

@app.post("/proactive-nudge")
async def proactive_nudge(req: NudgeRequest):
    return tool_generate_nudge(req.trigger, req.user_profile)

@app.post("/time-machine")
async def time_machine(req: TimeMachineRequest):
    return tool_run_time_machine(req.user_goal, req.user_profile)

@app.get("/financial-health-breakdown/{persona}")
def health_breakdown(persona: str):
    return tool_get_health_score(persona)