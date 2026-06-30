# ArthSaathi 💰
### Your Behavioral Financial Guardian

---

## Table of Contents

1. [What is ArthSaathi](#what-is-arthsaathi)
2. [The Problem](#the-problem)
3. [Why Existing Solutions Fail](#why-existing-solutions-fail)
4. [Our Approach](#our-approach)
5. [Personas We Serve](#personas-we-serve)
6. [System Architecture](#system-architecture)
7. [The Agent — How It Actually Works](#the-agent--how-it-actually-works)
8. [The Five Tools](#the-five-tools)
9. [Feature Walkthrough](#feature-walkthrough)
10. [Accessibility — Built for Divya](#accessibility--built-for-divya)
11. [Multilingual Design](#multilingual-design)
12. [Data Model](#data-model)
13. [Tech Stack](#tech-stack)
14. [Project Structure](#project-structure)
15. [Setup & Installation](#setup--installation)
16. [Environment Variables](#environment-variables)
17. [Running the App](#running-the-app)
18. [API Reference](#api-reference)
19. [Observability — LangSmith](#observability--langsmith)
20. [Key Assumptions](#key-assumptions)
21. [Known Limitations of the Prototype](#known-limitations-of-the-prototype)
22. [Production Roadmap](#production-roadmap)
23. [Business Model](#business-model)
24. [Cost Reality](#cost-reality)
25. [References](#references)
26. [Team](#team)

---

## What is ArthSaathi

ArthSaathi (Hindi for "financial companion") is an agentic AI-powered financial literacy platform built for Nomura's Kakushin 10.0 hackathon. It does not behave like a typical financial chatbot that waits for users to ask questions. Instead, it runs as a **single autonomous AI agent with five specialist tools**, capable of detecting psychological financial biases, intercepting scams in real time, simulating future financial outcomes, tracking longitudinal behavioral health, and proactively reaching users before they make harmful financial decisions.

The core thesis behind ArthSaathi: **India's financial literacy problem is not an information problem — it is a behavioral problem.** People generally know that debt is bad and savings are good. What breaks down is the moment of decision, where psychological biases like FOMO, present bias, and loss aversion override better judgment. ArthSaathi is built to intervene at exactly that moment.

---

## The Problem

India has extensive financial access but weak financial behavior:

- **600M+** bank account holders *(RBI Annual Report 2023)*
- **14B+** UPI transactions processed monthly *(NPCI, 2024)*
- **73%** of Indians have no emergency fund *(SEBI Investor Survey, 2022)*
- **50M+** gig economy workers with irregular income *(NITI Aayog, 2022)*

Despite near-universal access to banking rails, millions of users — gig workers, farmers, salaried first-time investors, and persons with disabilities — remain highly vulnerable to:

- Investment scams promising unrealistic returns
- Predatory loan apps charging 30–40%+ APR
- Mis-sold financial products (ULIPs, unsuitable insurance)
- Poor or absent savings habits
- Informal moneylenders charging 36%+ interest
- Inaccessible financial interfaces that exclude persons with disabilities

---

## Why Existing Solutions Fail

| Approach | What it does | What it misses |
|---|---|---|
| Financial chatbots | Answer questions reactively | Biased users ask the wrong questions, or don't ask at all |
| Budgeting apps | Track spending after the fact | No intervention at the actual decision moment |
| Generic LLMs (ChatGPT, Gemini) | Answer anything | No behavioral context, no bias detection, no proactivity, no accessibility design |
| **ArthSaathi** | Detects bias, intervenes proactively, tracks behavioral change over time, accessible by design | — |

The fundamental gap: every competing approach is **reactive**. The user must already know something is wrong, open an app, and ask the right question. ArthSaathi is built to act *before* that point.

---

## Our Approach

ArthSaathi is architected as a **single agentic AI system**, not a multi-screen feature app pretending to be intelligent. A user simply talks to ArthSaathi in natural language — in chat, exactly the way they would message a knowledgeable friend on WhatsApp. Behind that single conversational interface, an LLM-driven agent autonomously decides which of its five tools to invoke, executes them, and composes one unified, language-appropriate response.

The user never needs to know that ArthSaathi has a "Scam Checker" or a "Time Machine" — they just describe their situation, and the right capability activates automatically.

---

## Personas We Serve

ArthSaathi is designed around four real-world personas drawn directly from the problem statement:

| Persona | Background | Core Vulnerability | Language |
|---|---|---|---|
| **Rajesh** | Gig worker, Mumbai, ₹25,000/month irregular income | FOMO-driven crypto decisions, predatory loan apps at 40%+ APR | Hindi / Hinglish |
| **Priya** | Salaried teacher, Thane, ₹35,000/month | Loss aversion blocking good investments, mis-sold ULIP policies | Marathi |
| **Suresh** | Farmer, Andhra Pradesh, ₹12,000/month seasonal income | Present bias preventing savings, informal moneylenders at 36%+ APR | Telugu |
| **Divya** | Content writer, Pune, ₹25,000/month, visually impaired | Inaccessible banking apps, dependency on family for financial tasks, loss of financial privacy | English / Hinglish |

Each persona has a distinct starting Financial Health Score, distinct quick-reply prompts in the demo, and distinct output language behavior tuned to their real-world context.

---

## System Architecture

```
USER CHANNELS
WhatsApp · SMS · Web App · Voice · LangSmith traces (observability)
        ↓
ORCHESTRATOR AGENT  (Llama 3.3 70B via Groq)
Reads message + user profile + conversation history
Autonomously selects and calls one or more tools
        ↓
┌────────────────┬─────────────────┬──────────────────────┬─────────────────┬───────────────────┐
│  detect_bias    │  analyze_scam   │   run_time_machine    │  generate_nudge │  get_health_score  │
│  FOMO, Present  │  5-point check, │   Buy now vs delay,   │  Trigger-based  │  4-dimension       │
│  Bias, Loss     │  risk score     │   future self message │  proactive push │  longitudinal      │
│  Aversion, etc. │  0–100          │                       │                 │  score             │
└────────────────┴─────────────────┴──────────────────────┴─────────────────┴───────────────────┘
        ↓
Tool results returned to agent → final unified response composed in user's language
        ↓
RAG Knowledge Base (RBI/SEBI/Govt Schemes) · User Profile Store · Multilingual Engine
        ↓
Financial Health Score Engine — longitudinal 0–100 tracking, behavioral change measurement
        ↓
Financial Time Machine — future self simulation, emotional commitment device
```

This is a deliberate shift from an earlier multi-agent design (separate hardcoded agents per feature) to a **single agent with tool-calling**, which is the architecturally correct and more honestly "agentic" implementation — the LLM itself is the router, not application code.

---

## The Agent — How It Actually Works

This is the technical core of ArthSaathi and the part most worth understanding deeply, since it directly answers the hackathon's call for genuine Agentic AI rather than a disguised chatbot.

### Step-by-step flow

**Step 1 — User sends a message in natural language**

Example: *"Mere dost ne WhatsApp pe bheja — Rs 10,000 lagao 30 din mein Rs 25,000 milega"*

No tab selection, no feature menu. Just a normal message.

**Step 2 — First LLM call: tool selection**

The backend sends a single request to Groq containing:
- A system prompt with the user's profile (name, persona, income, language, current health score)
- The last 6 turns of conversation history
- The new user message
- All five tool definitions, with `tool_choice="auto"`

The LLM reads everything and decides — entirely on its own — which tools (if any) are relevant. It might select zero, one, or multiple tools in a single turn.

**Step 3 — Tool execution**

Whichever tools the LLM requested are executed by the backend as real Python functions. For the example above, the agent would typically request both `detect_bias` (catching FOMO + social proof) and `analyze_scam` (catching the scam pattern itself). Each tool runs independently and returns structured JSON.

**Step 4 — Second LLM call: response composition**

The tool results are appended to the conversation and sent back to Groq in a second call. The LLM reads the actual tool outputs and composes one warm, unified, language-appropriate response — e.g., explaining both that this is a scam (risk score 95/100) and that the user's reaction is being driven by FOMO, in Hinglish, under 150 words.

**Step 5 — Response delivered**

The final response, along with bias metadata, score change, and a suggested action item, is returned to the frontend and rendered in the chat. For Divya's persona, this response is also automatically read aloud via text-to-speech.

### Why two LLM calls instead of one

The LLM cannot execute its own tool requests — it can only describe what it wants to call and with what arguments. The backend is responsible for actually running that logic and feeding real results back. This two-call pattern (request tools → execute → compose with real results) is the standard architecture for function-calling/tool-using LLM agents.

### What makes this genuinely agentic, not just an API with extra steps

1. **The LLM is the router.** No `if/else` logic in the codebase decides which tool fires — the model decides based on context.
2. **Multiple tools can fire in a single turn.** A single message can simultaneously trigger bias detection and scam analysis without any special-casing in the code.
3. **The agent can choose to call nothing.** If a user says "thank you," no tools fire and a direct response is returned — proving the agent isn't trigger-happy.
4. **The Nudge tool demonstrates true autonomy in production design** — it is intended to fire based on external behavioral triggers (payday, inactivity, low income week) with zero user message required at all.

---

## The Five Tools

### `detect_bias`
Classifies the psychological bias driving the user's financial thinking.

**Parameters:** `bias_type` (enum: `FOMO`, `PRESENT_BIAS`, `LOSS_AVERSION`, `SOCIAL_PROOF`, `OVERCONFIDENCE`, `NONE`), `bias_explanation` (string)

**Triggers on:** Almost any financially-loaded message — it is the agent's default first check.

**Theoretical basis:** Daniel Kahneman, *Thinking, Fast and Slow* (2011) — System 1/System 2 decision-making and the documented cognitive biases that distort financial judgment.

---

### `analyze_scam`
Runs five parallel checks against a suspicious message, offer, or scheme.

**Parameters:** `message_text` (string)

**The five checks:**
1. Urgency pressure ("act now," "today only")
2. Unrealistic returns (above ~12% annual is flagged, per RBI benchmark norms)
3. Unregulated entity (no SEBI/RBI/IRDAI registration mentioned)
4. Social proof manipulation ("50,000 members already joined")
5. Advance fee requests (pay upfront to "unlock" greater returns)

**Returns:** verdict (`SCAM` / `SUSPICIOUS` / `LEGITIMATE` / `UNCLEAR`), risk score (0–100), red flags array, the bias being exploited, a plain-language verdict, a recommended action, and a legitimate alternative — all rendered in the user's language.

**Grounded in:** SEBI's official Investor Alert List and RBI's "RBI Kehta Hai" public awareness campaign. These are not arbitrary heuristics — they mirror patterns Indian financial regulators have explicitly documented.

---

### `run_time_machine`
Generates two contrasting financial futures for a stated goal: acting now versus delaying 3–4 months.

**Parameters:** `goal` (string)

**Returns:** A goal summary, a "scenario now" object (monthly cost, savings after 6 months, debt risk, outcome), a "scenario delay" object (monthly savings, savings after 6 months, debt risk, outcome), a recommended choice, and a first-person emotional message written as the user's "future self" six months later.

**Theoretical basis:** Richard Thaler & Cass Sunstein, *Nudge* (2008) — commitment devices, where emotional pre-commitment to a future action significantly increases real-world follow-through.

---

### `generate_nudge`
Produces a short, proactive, WhatsApp-style behavioral message.

**Parameters:** `trigger` (string — e.g. `high_income`, `low_income`, `week_start`, `idle_7days`, `no_savings`, `overspent`, `debt_warning`, `good_income`)

**Returns:** A nudge message in the user's language, a nudge type (`SAVE` / `WARN` / `EDUCATE` / `CELEBRATE`), and a one-tap suggested action label.

**This is ArthSaathi's only proactive feature** — every other tool responds to something the user said. The nudge is designed to reach the user without them asking, at the exact behavioral moment guidance is most useful (e.g., immediately after a high-earning gig week, before the money gets spent).

---

### `get_health_score`
Retrieves the user's current Financial Health Score breakdown.

**Parameters:** `persona` (string: `rajesh` / `priya` / `suresh` / `divya`)

**Returns:** Overall score (0–100), four dimension scores (Emergency Fund, Debt Management, Savings Behavior, Scam Awareness — 25 points each), the dominant bias, the biggest current risk, and the next milestone to work toward.

---

## Feature Walkthrough

### 🧠 Bias Detection — from the user's perspective

Rajesh types: *"Mere dost ne crypto mein 3x return kamaya, kya main bhi karu?"*

ArthSaathi doesn't just answer the surface question. It identifies that Rajesh is asking *because of FOMO* — the fear of missing out on a peer's gain — names that bias explicitly, explains why it leads to bad decisions, and only then gives the actual financial guidance. The bias appears as a labeled badge in the chat UI so the user can literally see the psychological pattern being named.

### 🛡️ Scam Guardian — from the user's perspective

Rajesh receives a WhatsApp message: *"Invest ₹10,000 today → Get ₹25,000 in 30 days! 50,000 members already earning!"*

He forwards or pastes it into ArthSaathi. Five checks run in under two seconds. He receives back, in Hindi: a SCAM verdict, a risk score of ~95/100, the specific red flags found, the bias the scam is exploiting, and a legitimate alternative — all without needing any prior knowledge of SEBI regulations himself.

### ⏳ Financial Time Machine — from the user's perspective

Rajesh says: *"Main ek bike lena chahta hoon, ₹80,000 ki."*

ArthSaathi calculates two real scenarios using his actual stated income: buying now on EMI (high debt risk, zero savings buffer) versus waiting four months (smaller loan, ₹8,000+ emergency fund intact). He can then tap "Hear from Future Self" to receive an emotional, first-person message from his future self thanking him for the patience — a deliberate behavioral nudge toward the better-EV choice.

### 📊 Financial Health Score — from the user's perspective

Not a one-time quiz. Every conversation Rajesh has nudges this score up or down based on what it reveals about his financial thinking. Asking about emergency funds is rewarded; revealing interest in a 40% APR loan app is penalized. Over weeks, this score becomes a genuine longitudinal measure of behavioral change — directly answering the hackathon's hardest evaluation question: *how do you measure real impact?*

### 🔔 Proactive Nudges — from the user's perspective

This is the one feature where ArthSaathi reaches Rajesh first. After a strong gig-earning week, before he has a chance to spend it, ArthSaathi sends: *"Wah Rajesh bhai! Achhi kamai hui aaj. ₹500 abhi emergency fund mein daal do — kal ke liye."* with a single tap-to-save action. No app needs to be opened. With the agent architecture, this can now also fire automatically mid-conversation — if Rajesh casually mentions a good income week in chat, the `generate_nudge` tool fires in that same turn.

---

## Accessibility — Built for Divya

Divya's persona — a 28-year-old visually impaired content writer — was treated as a first-class design constraint rather than an afterthought, directly responding to the problem statement's explicit call for accessible financial interfaces.

**What was built:**

- **Automatic text-to-speech** — every ArthSaathi response is read aloud the moment it arrives when Divya's persona is active. No tap required.
- **Speech-to-text input** — a microphone button beside the chat input lets her speak her question naturally; it is transcribed and sent automatically.
- **Text-to-speech across every feature** — the Scam Guardian verdict, Nudge messages, and the Financial Time Machine's "future self" message all carry a 🔊 listen button, usable by any persona but essential for Divya.
- **Chart-free language design** — the agent's prompt explicitly instructs it to avoid referencing visual charts or graphs for Divya, describing financial comparisons in plain spoken-friendly language instead.
- **Browser-native implementation** — both STT and TTS use the Web Speech API (`SpeechRecognition` and `SpeechSynthesisUtterance`), requiring zero external dependencies or paid services. This works natively in Chrome.

---

## Multilingual Design

ArthSaathi uses two different language strategies depending on the feature:

**In Chat:** Users type in English or Hinglish regardless of persona — this avoids forcing users to type in regional scripts, which is slow and impractical for a demo. ArthSaathi's *responses*, however, come back in the persona's natural language style (Rajesh in Hinglish, Priya in Marathi, Suresh in transliterated Telugu, Divya in plain English).

**In all other features (Scam Guardian, Nudges, Time Machine):** Both the conceptual *output* is fully rendered in the persona's regional language — there is no English fallback — since these are presented as complete, standalone results rather than conversational turns.

| Persona | Input Language Accepted | Output Language |
|---|---|---|
| Rajesh | English / Hinglish | Hindi / Hinglish |
| Priya | English / Hinglish | Marathi |
| Suresh | English / Hinglish | Telugu |
| Divya | English / Hinglish | English |

---

## Data Model

ArthSaathi's data model (designed for production; the prototype uses in-memory React state rather than a live database) consists of seven core entities:

### UserProfile
| Field | Type | Description |
|---|---|---|
| user_id | UUID | Primary key |
| name | VARCHAR(100) | First name |
| phone_number | VARCHAR(15) | For WhatsApp nudges |
| persona_type | ENUM | rajesh / priya / suresh / divya |
| income_type | ENUM | gig / salaried / farmer / freelance |
| monthly_income | INTEGER | Self-reported ₹ |
| language | ENUM | hindi / marathi / telugu / english |
| financial_health_score | INTEGER | 0–100, running score |
| onboarded_at | TIMESTAMP | Registration date |
| last_active_at | TIMESTAMP | Drives idle_7days trigger |

### ConversationTurn
| Field | Type | Description |
|---|---|---|
| turn_id | UUID | Primary key |
| user_id | UUID | FK → UserProfile |
| role | ENUM | user / assistant |
| message_text | TEXT | Message content |
| tools_called | VARCHAR[] | Tools the agent invoked this turn |
| bias_detected | ENUM | Bias type or null |
| agent_response | TEXT | ArthSaathi's reply |
| score_delta | INTEGER | Health score change this turn |
| action_item | TEXT | Suggested action |
| created_at | TIMESTAMP | — |

### ScamReport
| Field | Type | Description |
|---|---|---|
| report_id | UUID | Primary key |
| user_id | UUID | FK → UserProfile |
| message_text | TEXT | Analyzed message |
| verdict | ENUM | SCAM / SUSPICIOUS / LEGITIMATE / UNCLEAR |
| risk_score | INTEGER | 0–100 |
| red_flags | VARCHAR[] | Flags triggered |
| bias_exploited | VARCHAR | Targeted bias |
| source | ENUM | chat_agent / scam_tab_direct |
| created_at | TIMESTAMP | — |

### FinancialGoal
| Field | Type | Description |
|---|---|---|
| goal_id | UUID | Primary key |
| user_id | UUID | FK → UserProfile |
| goal_text | TEXT | Stated goal |
| scenario_now_savings | INTEGER | 6-month savings if acting now |
| scenario_delay_savings | INTEGER | 6-month savings if delaying |
| recommended_choice | ENUM | now / delay |
| user_committed | BOOLEAN | Did they commit? |
| follow_up_date | DATE | When to check back |
| outcome_reported | ENUM | followed_through / did_not / null |

### NudgeLog
| Field | Type | Description |
|---|---|---|
| nudge_id | UUID | Primary key |
| user_id | UUID | FK → UserProfile |
| trigger_type | ENUM | See trigger list above |
| nudge_message | TEXT | Message sent |
| channel | ENUM | whatsapp / sms / in_app |
| action_taken | BOOLEAN | Did user act? |
| sent_at | TIMESTAMP | — |

### HealthScoreHistory
| Field | Type | Description |
|---|---|---|
| snapshot_id | UUID | Primary key |
| user_id | UUID | FK → UserProfile |
| overall_score | INTEGER | 0–100 |
| emergency_fund_score | INTEGER | 0–25 |
| debt_management_score | INTEGER | 0–25 |
| savings_behavior_score | INTEGER | 0–25 |
| scam_awareness_score | INTEGER | 0–25 |
| recorded_at | TIMESTAMP | — |

### AgentToolCallLog
| Field | Type | Description |
|---|---|---|
| log_id | UUID | Primary key |
| turn_id | UUID | FK → ConversationTurn |
| tools_called | VARCHAR[] | All tools fired |
| tool_arguments | JSONB | Arguments passed |
| tool_results | JSONB | Raw results |
| total_latency_ms | INTEGER | End-to-end time |
| groq_tokens_used | INTEGER | For cost tracking |

**Relationships:** `UserProfile (1) → ConversationTurn, ScamReport, FinancialGoal, NudgeLog, HealthScoreHistory (many each)`

> **Note on the prototype:** No live database is used in the current build. All user state — chat history, scores, persona switching — lives in React component state on the frontend, reset on page refresh. The schema above represents the intended production design.

---

## Tech Stack

| Layer | Tool | Version | Why |
|---|---|---|---|
| LLM + Agent | Llama 3.3 70B via Groq | `groq` 0.9.0 | Sub-second latency, generous free tier, native tool-calling support |
| Backend | FastAPI | 0.111.0 | Async-first, lightweight, ideal for an agent request/response loop |
| Backend runtime | Python | 3.11.9 | — |
| Validation | Pydantic | 2.7.4 | Request/response schema enforcement |
| Env management | python-dotenv | 1.0.1 | API key handling |
| Multipart support | python-multipart | 0.0.9 | FastAPI dependency |
| Frontend | React | 18.3.1 | Component-based, persona/state management |
| Frontend tooling | react-scripts | 5.0.1 | Build pipeline |
| Speech (TTS + STT) | Web Speech API | Browser-native | Zero cost, zero dependency, works in Chrome |
| Observability | LangSmith | `langsmith` 0.1.77 | Full agent trace — tool calls, latency, token usage |
| Runtime | Node.js | 20.x LTS | Frontend build/runtime |
| Package manager | npm | 10.x | — |
| OS (dev/prod) | Windows 11 / Ubuntu 22.04 LTS | — | — |

---

## Project Structure

```
ArthSaathi/
├── backend/
│   ├── venv/                      ← Python virtual environment
│   ├── main.py                    ← FastAPI app, agent loop, all 5 tool functions
│   ├── requirements.txt
│   └── .env                       ← GROQ_API_KEY, LANGCHAIN_API_KEY, etc.
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.jsx                ← Persona definitions, tab routing, persistent state
        └── components/
            ├── Chat.jsx            ← Main agent-driven chat interface, mic/STT, TTS
            ├── ScamChecker.jsx     ← Direct scam analysis tab
            ├── HealthScore.jsx     ← Health score dashboard
            ├── Nudges.jsx          ← Manual nudge trigger simulator
            ├── TimeMachine.jsx     ← Future-self goal planner
            └── useTTS.js           ← Shared TTS hook + TTSButton component
```

---

## Setup & Installation

### Prerequisites
- Python 3.11.9
- Node.js 20.x LTS and npm 10.x
- A free Groq API key — [console.groq.com](https://console.groq.com)
- (Optional but recommended) A free LangSmith API key — [smith.langchain.com](https://smith.langchain.com)
- Google Chrome (required for Web Speech API — STT/TTS will not work reliably in Firefox/Safari)

### Backend setup

```bash
mkdir -p ArthSaathi/backend
cd ArthSaathi/backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

`requirements.txt`:
```
fastapi==0.111.0
uvicorn==0.30.1
pydantic==2.7.4
python-multipart==0.0.9
groq==0.9.0
python-dotenv==1.0.1
langsmith==0.1.77
```

### Frontend setup

```bash
cd ArthSaathi/frontend
npm install react@18.3.1 react-dom@18.3.1 react-scripts@5.0.1
```

---

## Environment Variables

Create `backend/.env`:

```
GROQ_API_KEY=your_groq_api_key_here
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=arthsaathi
```

`LANGCHAIN_*` variables are optional — the app runs fine without them, simply without trace logging.

---

## Running the App

**Terminal 1 — backend:**
```bash
cd ArthSaathi/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — frontend:**
```bash
cd ArthSaathi/frontend
npm start
```

Open `http://localhost:3000`. The backend must be running on port 8000 for the frontend to function.

---

## API Reference

### `POST /chat`
The main agentic endpoint. Accepts a user message, profile, and conversation history; runs the full two-call agent loop; returns a composed response plus bias/score/tool metadata.

**Request:**
```json
{
  "message": "string",
  "user_profile": {
    "name": "string",
    "persona": "rajesh | priya | suresh | divya",
    "language": "hindi | marathi | telugu | english",
    "outputLanguage": "string",
    "income_type": "string",
    "monthly_income": 0,
    "financial_health_score": 0
  },
  "conversation_history": [{ "role": "user|assistant", "content": "string" }]
}
```

**Response:**
```json
{
  "response": "string",
  "bias_detected": "FOMO | PRESENT_BIAS | LOSS_AVERSION | SOCIAL_PROOF | OVERCONFIDENCE | null",
  "bias_explanation": "string | null",
  "tools_used": ["string"],
  "tool_results": {},
  "score_change": 0,
  "action_item": "string | null",
  "agent_used": "string"
}
```

### `POST /scam-check`
Direct invocation of the `analyze_scam` tool, bypassing the agent loop. Used by the Scam Checker tab.

### `POST /proactive-nudge`
Direct invocation of the `generate_nudge` tool. Used by the Nudges tab.

### `POST /time-machine`
Direct invocation of the `run_time_machine` tool. Used by the Time Machine tab.

### `GET /financial-health-breakdown/{persona}`
Direct invocation of the `get_health_score` tool. Used by the Health Score tab.

---

## Observability — LangSmith

Every call to the agent loop (`run_agent`) and every individual tool function is decorated with `@traceable`. This means each user interaction produces a full hierarchical trace visible in the LangSmith dashboard:

```
arthsaathi:agent_loop  [total latency]
  ├── tool:detect_bias       [latency]  → bias classification result
  ├── tool:analyze_scam      [latency]  → scam verdict + risk score
  └── (final composition call)          → unified response
```

This provides genuine production-grade observability — visibility into exactly which tools the agent chose, with what arguments, and what they returned — at zero additional application code beyond the decorator.

---

## Key Assumptions

1. **Connectivity** — users have basic smartphone internet access; offline/low-connectivity users would be served via SMS fallback in production.
2. **Language detection** — currently set explicitly per persona; in production, language would be detected from the user's first message and confirmed at onboarding.
3. **Income data** — self-reported in the prototype; production would integrate India's RBI-regulated Account Aggregator (AA) framework for consent-based, verified financial data instead of self-reported figures.
4. **Scam detection scope** — text-only in the current build; production would add image OCR to handle screenshot-forwarded scam messages, which is the more common real-world pattern.
5. **Health Score dimensions** — currently seeded per persona with static starting values; in production each of the four dimensions would recalculate continuously from actual conversation signals.
6. **WhatsApp delivery** — simulated via the in-app Nudges tab in the prototype; production would use the Twilio WhatsApp Business API for real message delivery.

---

## Known Limitations of the Prototype

- No persistent database — all state (chat history, scores) lives in React state and resets on refresh.
- The four Health Score sub-dimensions do not yet update dynamically from conversation content; only the overall score does.
- No RAG layer yet — government scheme and regulatory information comes from the LLM's training data, not a verified live document store.
- STT/TTS rely on Chrome's Web Speech API and will not function reliably in other browsers.
- WhatsApp integration is simulated, not live.
- No authentication or user account system — personas are hardcoded for demo purposes.

---

## Production Roadmap

| Phase | Timeline | Scope |
|---|---|---|
| **Phase 1 — Core** | Weeks 1–3 | Real user onboarding, Account Aggregator integration, PostgreSQL persistence, authentication |
| **Phase 2 — Channels** | Weeks 4–6 | Twilio WhatsApp Business API for live nudges, SMS fallback for low-connectivity users, Whisper-based voice input |
| **Phase 3 — Scale** | Weeks 7–10 | RAG knowledge base ingesting RBI/SEBI documents, image OCR for scam screenshot detection, an admin dashboard for NGO/educator partners |
| **Phase 4 — Measure** | Weeks 11–12 | A/B testing of bias interventions, longitudinal Health Score impact analysis, formal outcome reporting |


## References

1. SEBI Investor Survey, 2022 — financial literacy and emergency fund statistics
2. RBI Annual Report, 2023 — bank account penetration figures
3. NPCI Transaction Data, 2024 — UPI transaction volume
4. NITI Aayog Report, 2022 — gig economy workforce size
5. Daniel Kahneman, *Thinking, Fast and Slow* (2011) — behavioral bias framework
6. Richard Thaler & Cass Sunstein, *Nudge* (2008) — commitment devices and choice architecture
7. RBI "Kehta Hai" Campaign — official financial scam awareness patterns
8. SEBI Investor Alert List — documented scam red flags
9. Reserve Bank of India, Account Aggregator Framework (2021) — consent-based financial data sharing
10. PM-KISAN and Kisan Credit Card schemes — official government schemes referenced for the Suresh persona

---


*Every other solution gives people financial information. ArthSaathi gives people financial behavior.*
