# 🤖 FinTrack AI Engine — Complete Feature & Setup Guide

> **Namaskar Gaurav Bhau!** Yeh document FinTrack me implement kiye gaye **100% Environment-Driven Multi-Provider AI Engine** aur sabhi **5 AI Features** ka complete, dedicated guide hai.

---

## 📑 Index
1. [AI Architecture Overview](#1-ai-architecture-overview)
2. [The 5 Smart AI Features](#2-the-5-smart-ai-features)
   - [Feature 1: Natural Language "Quick Add" (`Ctrl+J`)](#feature-1-natural-language-quick-add-ctrlj--cmdj)
   - [Feature 2: Smart Auto-Categorization](#feature-2-smart-auto-categorization)
   - [Feature 3: Multimodal Receipt & Bill Scanner](#feature-3-multimodal-receipt--bill-scanner)
   - [Feature 4: AI Financial Health Check Insights](#feature-4-ai-financial-health-check-insights)
   - [Feature 5: Smart Burn Rate & Budget Forecast](#feature-5-smart-burn-rate--budget-forecast)
3. [Multi-Provider Support & Zero Code Switching](#3-multi-provider-support--zero-code-switching)
4. [API Keys Kaise Le (Direct Links & Free Tiers)](#4-api-keys-kaise-le-step-by-step)
5. [Backend API Endpoints Reference](#5-backend-api-endpoints-reference)
6. [Security & Zero DB Pollution](#6-security--zero-db-pollution-guarantee)
7. [Production Deployment Guide (Render & Vercel)](#7-production-deployment-guide)

---

## 1. AI Architecture Overview

FinTrack ka AI system ek **Stateless, Universal Multi-Provider Engine** hai jo bina database schema alter kiye seedha REST API ke zariye execute hota hai.

```text
               ┌───────────────────────────────────────────────────┐
               │              Frontend UI (Next.js 14)             │
               │  QuickAddBar | ReceiptScanner | AiInsightsCard    │
               │  BurnRateBadge | In-Form Auto-Categorize          │
               └─────────────────────────┬─────────────────────────┘
                                         │ HTTPS / Bearer JWT
                                         ▼
               ┌───────────────────────────────────────────────────┐
               │             FastAPI Backend (/api/v1/ai)          │
               │  - Strict User JWT Scoping (get_current_user)     │
               │  - Universal Resilient JSON Extraction            │
               │  - Automatic Model Version Aliasing               │
               └─────────────────────────┬─────────────────────────┘
                                         │
        ┌────────────────────────────────┼───────────────────────────────┐
        ▼                                ▼                               ▼
┌──────────────────┐           ┌──────────────────┐            ┌──────────────────┐
│  Google Gemini   │           │    Groq Cloud    │            │ OpenAI / Claude  │
│ gemini-3.6-flash │           │ llama-3.3-70b    │            │ / Ollama Local   │
│  (100% Free)     │           │  (Ultra-Fast)    │            │  (Custom Base)   │
└──────────────────┘           └──────────────────┘            └──────────────────┘
```

---

## 2. The 5 Smart AI Features

### Feature 1: Natural Language "Quick Add" (`Ctrl+J` / `Cmd+J`)
- **Kahan Milega:** Dashboard (`/dashboard`) aur Expenses (`/expenses`) page ke top par command bar.
- **Shortcut:** `Ctrl+J` (Windows) ya `Cmd+J` (Mac) dabate hi input bar focus ho jata hai.
- **Example Inputs:**
  - *"Uber 240 cash yesterday"*
  - *"Dinner with friends 850 upi"*
  - *"Medicines 450 card at Apollo"*
- **Working:** AI model aam bolchal ko parse karke title, exact amount, date, payment mode, aur user ke categories me se best match select karta hai. 1-click **Log Expense** dabate hi expense real-time save ho jata hai aur charts update ho jate hain.

---

### Feature 2: Smart Auto-Categorization
- **Kahan Milega:** `ExpenseForm` modal me (Add Expense ya Edit Expense).
- **Working:** Jab user title type karta hai (e.g. *"Dominos Pizza"*, *"Indane Gas Cylinder"*, *"Airtel Fiber Bill"*):
  - Field blur hote hi AI user ke database categories me se matching category dhoondta hai.
  - UI me sleek badge display hota hai: `AI Suggestion: Food & Dining (Apply)`.
  - Single click par category dropdown auto-select ho jata hai.

---

### Feature 3: Multimodal Receipt & Bill Scanner
- **Kahan Milega:** `ExpenseForm` ke top-right par **"Scan Bill 📸"** button.
- **Supported Formats:** JPG, PNG, WEBP, Camera snapshots, UPI screenshot slips.
- **Working:**
  1. User bill photo drag-and-drop ya upload karta hai.
  2. Frontend image ko Base64 encode karke `/api/v1/ai/scan-receipt` ko bhejta hai.
  3. Multimodal Vision AI receipt se **Merchant Name**, **Total Amount**, **Date**, **Payment Mode** aur **Item Notes** extract karta hai.
  4. Form auto-fill ho jata hai aur user verify karke 1-click me save kar sakta hai.

---

### Feature 4: AI Financial Health Check Insights
- **Kahan Milega:** Dashboard (`/dashboard`) par primary metric cards ke upar.
- **Working:** Har month ke spend trend, category breakdown aur budget status ko analyze karke 3 color-coded cards display karta hai:
  - 🟢 **Highlight:** User ki positive spending habit (e.g. *"Great control on Food spend this week"*).
  - 🔴 **Watchout:** Overspending alert / high burn category (e.g. *"Shopping is 42% of total spend"*).
  - 💡 **Actionable Tip:** Practical saving advice.

---

### Feature 5: Smart Burn Rate & Budget Forecast
- **Kahan Milega:** Dashboard Header me Month Navigator Stepper ke right side par sleek status pill:
  - `[● Pace On Track ✨]` (Green)
  - `[● Pacing High ✨]` (Amber)
  - `[● Pacing Over Budget ✨]` (Rose)
- **Interactive Tooltip Drawer (Click on Badge):**
  - **Daily Burn Rate:** `₹450.00/day` (Current average)
  - **Projected Month-end Spend:** `₹13,500.00` (Predicted total)
  - **Safe Daily Limit:** `₹600.00/day` (Budget cross na hone ke liye kitna kharch kar sakte hain)
  - **AI Financial Advice:** Model ki personalized advice.

---

## 3. Multi-Provider Support & Zero Code Switching

Aap bina kisi code change ke sirf `.env` variables ke zariye AI provider change kar sakte hain:

```env
# ── Provider 1: Google Gemini (Recommended - 100% Free + Vision) ──
AI_PROVIDER=gemini
AI_MODEL=gemini-3.6-flash
AI_API_KEY=AIzaSy...

# ── Provider 2: Groq Cloud (Ultra-Fast 500+ Tokens/Sec - 100% Free) ──
# AI_PROVIDER=groq
# AI_MODEL=llama-3.3-70b-versatile
# AI_API_KEY=gsk_...

# ── Provider 3: OpenAI ──
# AI_PROVIDER=openai
# AI_MODEL=gpt-4o-mini
# AI_API_KEY=sk-proj-...

# ── Provider 4: Anthropic Claude ──
# AI_PROVIDER=claude
# AI_MODEL=claude-3-5-sonnet-20241022
# AI_API_KEY=sk-ant-...

# ── Provider 5: Local Ollama (100% Offline, Private, Zero Cost) ──
# AI_PROVIDER=custom
# AI_BASE_URL=http://localhost:11434/v1
# AI_MODEL=llama3.2
# AI_API_KEY=ollama
```

---

## 4. API Keys Kaise Le (Step-by-Step)

| Provider | Free Tier? | Key Generation Link | Steps |
|---|---|---|---|
| **Google Gemini (Best)** | ✅ **100% Free (15 RPM / 1M TPM)** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | 1. Google account se sign in karein.<br>2. **Create API Key** button dabayein.<br>3. Key copy karke `.env` me paste karein. |
| **Groq Cloud (Fastest)** | ✅ **100% Free (High Speed)** | [console.groq.com/keys](https://console.groq.com/keys) | 1. Free account banayein.<br>2. **API Keys** section me **Create Key** dabayein.<br>3. `gsk_...` key copy karein. |
| **Local Ollama** | ✅ **100% Free & Offline** | [ollama.ai](https://ollama.ai) | 1. `ollama run llama3.2` chalayein.<br>2. FinTrack local port `11434` se directly connect ho jayega. |

---

## 5. Backend API Endpoints Reference

All endpoints base URL: `/api/v1/ai` (Requires `Authorization: Bearer <access_token>`)

| Method | Endpoint | Description | Payload Example |
|---|---|---|---|
| `POST` | `/categorize` | Title auto-categorization | `{"title": "Starbucks", "amount": 350}` |
| `POST` | `/parse-expense` | Natural language Quick Add | `{"text": "Swiggy 420 yesterday upi"}` |
| `POST` | `/scan-receipt` | Receipt OCR extraction | `{"image_base64": "...", "mime_type": "image/jpeg"}` |
| `GET` | `/insights` | Financial health check | Query: `period=month` or `period=week` |
| `GET` | `/budget-forecast` | Burn rate & budget pacing | Query: None (scoped to user's month) |

---

## 6. Security & Zero DB Pollution Guarantee

1. **Stateless Processing:** AI engine koi bhi prompt ya image database me store nahi karta. Processing memory me hoti hai aur result aate hi discard ho jati hai.
2. **Strict User Scoping:** Har AI endpoint par `current_user: User = Depends(get_current_user)` enforced hai. Koi bhi unauthorized request execute nahi ho sakti.
3. **Graceful Failover:** Agar backend me `AI_API_KEY` configure nahi hai, toh system 503 error return karta hai aur frontend informative message dikhata hai bina kisi application crash ke.
4. **Resilient JSON Parser:** AI responses me markdown backticks (` ```json `), outer text ya raw JSON ko clean karke parse karta hai.

---

## 7. Production Deployment Guide

### Render (Backend):
Render Dashboard ➡️ FinTrack Backend ➡️ **Environment**:
Add variables:
- `AI_PROVIDER` = `gemini`
- `AI_MODEL` = `gemini-3.6-flash`
- `AI_API_KEY` = `<your-api-key>`

### Vercel (Frontend):
Frontend me koi nayi AI key add karne ki zarurat nahi hai — frontend Next.js backend ke `/api/v1/ai/*` endpoints se communicate karta hai.
