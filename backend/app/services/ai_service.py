import base64
import json
import logging
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.ai import (
    AIBudgetForecastResponse,
    AICategorizeResponse,
    AIInsightBullet,
    AIInsightsResponse,
    AIParsedExpenseResponse,
    AIReceiptScanResponse,
)

logger = logging.getLogger(__name__)
settings = get_settings()


class AIService:
    """100% Environment-driven multi-provider AI engine supporting Gemini, Claude, OpenAI, Groq, OpenRouter, and Custom/Ollama."""

    def __init__(self):
        self.provider = (settings.AI_PROVIDER or "gemini").strip().lower()
        self.model = (settings.AI_MODEL or "gemini-1.5-flash").strip()
        self.api_key = (settings.AI_API_KEY or "").strip()
        self.base_url = (settings.AI_BASE_URL or "").strip()
        self.temperature = float(settings.AI_TEMPERATURE or 0.2)
        self.max_tokens = int(settings.AI_MAX_TOKENS or 1024)

    def _ensure_configured(self) -> None:
        """Check if AI provider is configured; raise friendly 503 if API key is missing (unless using local Ollama)."""
        if self.provider == "custom" and self.base_url:
            return  # Local models like Ollama might not require an API key
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI service is not configured. Please set AI_API_KEY for provider '{self.provider}' in your backend .env.",
            )

    @staticmethod
    def _extract_json(content: str) -> Dict[str, Any]:
        """Extract structured JSON dict from raw LLM output, resilient to markdown tags and preamble text."""
        cleaned = content.strip()
        # Look for ```json ... ``` blocks
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
        if match:
            cleaned = match.group(1).strip()
        else:
            # Look for outermost { ... }
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                cleaned = cleaned[start : end + 1]

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse JSON from AI response: {cleaned} | Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI model returned an unparseable response. Please try again.",
            )

    async def _call_gemini(
        self, prompt: str, image_bytes: Optional[bytes] = None, mime_type: Optional[str] = None
    ) -> str:
        """Call Google Gemini REST API."""
        model_name = self.model.strip()
        if model_name.startswith("models/"):
            model_name = model_name.replace("models/", "", 1)
        # Automatic compatibility alias for Google's latest Gemini Flash release
        if model_name in (
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.5",
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
        ):
            model_name = "gemini-3.6-flash"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"

        parts: List[Dict[str, Any]] = [{"text": prompt}]
        if image_bytes and mime_type:
            b64_data = base64.b64encode(image_bytes).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": b64_data,
                }
            })

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": self.temperature,
                "response_mime_type": "application/json",
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error(f"❌ Gemini API Error [HTTP {resp.status_code}]: {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Google Gemini error: {resp.text}",
                )
            data = resp.json()
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                logger.error(f"❌ Unexpected Gemini response structure: {data} | Error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Invalid response structure from Gemini API",
                )

    async def _call_claude(
        self, prompt: str, image_bytes: Optional[bytes] = None, mime_type: Optional[str] = None
    ) -> str:
        """Call Anthropic Claude REST API."""
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        if image_bytes and mime_type:
            b64_data = base64.b64encode(image_bytes).decode("utf-8")
            content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": b64_data,
                    },
                },
                {"type": "text", "text": prompt},
            ]
        else:
            content = prompt

        payload = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": [{"role": "user", "content": content}],
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"❌ Claude API Error [HTTP {resp.status_code}]: {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Anthropic Claude error: {resp.text}",
                )
            data = resp.json()
            try:
                return data["content"][0]["text"]
            except (KeyError, IndexError) as e:
                logger.error(f"❌ Unexpected Claude response structure: {data} | Error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Invalid response structure from Claude API",
                )

    async def _call_openai_compatible(
        self, prompt: str, image_bytes: Optional[bytes] = None, mime_type: Optional[str] = None
    ) -> str:
        """Call OpenAI, Groq, OpenRouter, or Custom/Ollama endpoint."""
        if self.provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
        elif self.provider == "openrouter":
            url = "https://openrouter.ai/api/v1/chat/completions"
        elif self.provider == "custom":
            base = self.base_url.rstrip("/") if self.base_url else "http://localhost:11434/v1"
            url = f"{base}/chat/completions"
        else:  # openai
            url = "https://api.openai.com/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key or 'custom-key'}",
            "Content-Type": "application/json",
        }

        if image_bytes and mime_type:
            b64_data = base64.b64encode(image_bytes).decode("utf-8")
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{b64_data}"},
                        },
                    ],
                }
            ]
        else:
            messages = [{"role": "user", "content": prompt}]

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        # Request JSON mode when supported (OpenAI / Groq / OpenRouter)
        if self.provider in ("openai", "groq", "openrouter"):
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"❌ OpenAI-compatible API Error [HTTP {resp.status_code}]: {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"AI API ({self.provider}) error: {resp.text}",
                )
            data = resp.json()
            try:
                return data["choices"][0]["message"]["content"]
            except (KeyError, IndexError) as e:
                logger.error(f"❌ Unexpected OpenAI-compatible response structure: {data} | Error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Invalid response structure from AI API",
                )

    async def _generate_json(
        self, prompt: str, image_bytes: Optional[bytes] = None, mime_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Dispatch generation to configured provider and parse JSON response."""
        self._ensure_configured()

        if self.provider == "gemini":
            raw_text = await self._call_gemini(prompt, image_bytes, mime_type)
        elif self.provider == "claude":
            raw_text = await self._call_claude(prompt, image_bytes, mime_type)
        else:
            raw_text = await self._call_openai_compatible(prompt, image_bytes, mime_type)

        return self._extract_json(raw_text)

    # ── Feature 1: Smart Auto-Categorization ──────────────────────────────────────────────
    async def suggest_category(
        self,
        title: str,
        user_categories: List[Dict[str, Any]],
        amount: Optional[Decimal] = None,
        notes: Optional[str] = None,
    ) -> AICategorizeResponse:
        """Match title against user categories or suggest a new title-cased category."""
        categories_list = [c["name"] for c in user_categories]
        prompt = (
            "You are a personal finance categorization engine for FinTrack.\n"
            f"User expense title: '{title}'\n"
            f"Amount: {amount if amount is not None else 'Not provided'}\n"
            f"Notes: {notes if notes else 'None'}\n"
            f"User's existing categories: {json.dumps(categories_list)}\n\n"
            "Analyze the expense title and determine the best category.\n"
            "Rules:\n"
            "1. If one of the user's existing categories fits well, select it (is_existing = true).\n"
            "2. If none fit well, propose a concise 1-2 word Title Case new category name (is_existing = false).\n"
            "3. Output MUST be valid JSON with this exact schema:\n"
            "{\n"
            '  "suggested_category": "Category Name",\n'
            '  "is_existing": true,\n'
            '  "confidence": 0.95,\n'
            '  "reason": "Short explanation"\n'
            "}"
        )

        result = await self._generate_json(prompt)
        suggested_name = result.get("suggested_category", "").strip()
        confidence = float(result.get("confidence", 0.9))
        reason = result.get("reason", "Matched based on expense title.")

        # Find category_id if matched in existing user categories (case-insensitive)
        matched_id = None
        is_existing = False
        for cat in user_categories:
            if cat["name"].lower() == suggested_name.lower():
                matched_id = cat["id"]
                is_existing = True
                suggested_name = cat["name"]
                break

        return AICategorizeResponse(
            suggested_category=suggested_name or "General",
            category_id=matched_id,
            is_existing=is_existing,
            confidence=min(max(confidence, 0.0), 1.0),
            reason=reason,
        )

    # ── Feature 2: Natural Language Quick Add ─────────────────────────────────────────────
    async def parse_expense_text(
        self, prompt_text: str, user_categories: List[Dict[str, Any]]
    ) -> AIParsedExpenseResponse:
        """Parse natural language statement (e.g. 'Coffee 150 cash yesterday') into structured expense."""
        today_str = date.today().isoformat()
        categories_list = [c["name"] for c in user_categories]

        prompt = (
            "You are a financial transaction extractor for FinTrack.\n"
            f"Today's date is: {today_str}\n"
            f"User's existing categories: {json.dumps(categories_list)}\n"
            f"Input text to parse: '{prompt_text}'\n\n"
            "Extract the following fields:\n"
            "- title: Short descriptive title (max 50 characters, e.g. 'Coffee at Starbucks')\n"
            "- amount: Positive number (e.g. 150.00)\n"
            "- category_name: Best match from existing categories, or propose a clean Title Case name\n"
            "- payment_mode: One of 'cash', 'card', 'upi', 'other' (or null if not mentioned)\n"
            "- expense_date: YYYY-MM-DD (resolve relative words like 'yesterday', 'today', 'kal', 'parso')\n"
            "- notes: Any optional details or null\n\n"
            "Return valid JSON only matching this schema:\n"
            "{\n"
            '  "title": "Expense Title",\n'
            '  "amount": 150.00,\n'
            '  "category_name": "Food & Dining",\n'
            '  "payment_mode": "cash",\n'
            '  "expense_date": "YYYY-MM-DD",\n'
            '  "notes": null,\n'
            '  "confidence": 0.95\n'
            "}"
        )

        result = await self._generate_json(prompt)
        title = str(result.get("title", "Expense")).strip()[:50]
        amount = Decimal(str(result.get("amount", 100)))
        if amount <= 0:
            amount = Decimal("100.00")

        cat_name = str(result.get("category_name", "General")).strip()
        matched_id = None
        for cat in user_categories:
            if cat["name"].lower() == cat_name.lower():
                matched_id = cat["id"]
                cat_name = cat["name"]
                break

        pay_mode = result.get("payment_mode")
        if pay_mode and str(pay_mode).lower() not in ("cash", "card", "upi", "other"):
            pay_mode = "other"
        elif pay_mode:
            pay_mode = str(pay_mode).lower()

        # Parse date
        exp_date = date.today()
        raw_date = result.get("expense_date")
        if raw_date and isinstance(raw_date, str):
            try:
                exp_date = datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
                if exp_date > date.today():
                    exp_date = date.today()  # prevent future dates per PRD rule
            except ValueError:
                exp_date = date.today()

        return AIParsedExpenseResponse(
            title=title or "Quick Expense",
            amount=amount,
            category_name=cat_name,
            category_id=matched_id,
            payment_mode=pay_mode,
            expense_date=exp_date,
            notes=result.get("notes"),
            confidence=float(result.get("confidence", 0.9)),
        )

    # ── Feature 3: Receipt / Bill Scanner (Multimodal Vision) ─────────────────────────────
    async def scan_receipt_image(
        self, image_bytes: bytes, mime_type: str, user_categories: List[Dict[str, Any]]
    ) -> AIReceiptScanResponse:
        """Extract merchant, total, date, and category from receipt/bill photo using vision model."""
        categories_list = [c["name"] for c in user_categories]
        today_str = date.today().isoformat()

        prompt = (
            "You are an expert receipt and invoice analyzer for FinTrack.\n"
            f"Today's date is: {today_str}\n"
            f"User categories: {json.dumps(categories_list)}\n"
            "Analyze the attached receipt image and extract:\n"
            "1. Merchant or Store name (max 50 chars)\n"
            "2. Total Grand Amount paid\n"
            "3. Date of transaction (YYYY-MM-DD, cannot be in future)\n"
            "4. Best matching category name\n"
            "5. Payment mode ('cash', 'card', 'upi', 'other' or null)\n"
            "6. Brief summary of purchased items\n\n"
            "Return valid JSON only matching this schema:\n"
            "{\n"
            '  "title": "Merchant Name",\n'
            '  "amount": 450.50,\n'
            '  "category_name": "Groceries",\n'
            '  "payment_mode": "upi",\n'
            '  "expense_date": "YYYY-MM-DD",\n'
            '  "notes": "Items: Milk, Bread, Eggs",\n'
            '  "confidence": 0.95\n'
            "}"
        )

        result = await self._generate_json(prompt, image_bytes=image_bytes, mime_type=mime_type)
        title = str(result.get("title", "Receipt Expense")).strip()[:50]
        try:
            amount = Decimal(str(result.get("amount", 100)))
            if amount <= 0:
                amount = Decimal("100.00")
        except Exception:
            amount = Decimal("100.00")

        cat_name = str(result.get("category_name", "General")).strip()
        matched_id = None
        for cat in user_categories:
            if cat["name"].lower() == cat_name.lower():
                matched_id = cat["id"]
                cat_name = cat["name"]
                break

        pay_mode = result.get("payment_mode")
        if pay_mode and str(pay_mode).lower() not in ("cash", "card", "upi", "other"):
            pay_mode = "other"
        elif pay_mode:
            pay_mode = str(pay_mode).lower()

        exp_date = date.today()
        raw_date = result.get("expense_date")
        if raw_date and isinstance(raw_date, str):
            try:
                exp_date = datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
                if exp_date > date.today():
                    exp_date = date.today()
            except ValueError:
                exp_date = date.today()

        return AIReceiptScanResponse(
            title=title or "Receipt Expense",
            amount=amount,
            category_name=cat_name,
            category_id=matched_id,
            payment_mode=pay_mode,
            expense_date=exp_date,
            notes=result.get("notes"),
            confidence=float(result.get("confidence", 0.9)),
        )

    # ── Feature 4: AI Spending Insights & Financial Health Check ──────────────────────────
    async def generate_insights(
        self,
        total_spend: Decimal,
        category_breakdown: List[Dict[str, Any]],
        mom_change_pct: Optional[float],
        budget_status: Dict[str, Any],
        period: str = "month",
    ) -> AIInsightsResponse:
        """Generate 3 personalized, motivating, actionable insights for the user's dashboard."""
        prompt = (
            "You are a friendly, encouraging personal finance AI advisor for FinTrack.\n"
            f"Period: {period}\n"
            f"Total Spend: ₹{float(total_spend):,.2f}\n"
            f"Top Categories: {json.dumps(category_breakdown[:5])}\n"
            f"Month-over-Month Change: {f'{mom_change_pct:+.1f}%' if mom_change_pct is not None else 'N/A (First month)'}\n"
            f"Budget Status: {json.dumps(budget_status)}\n\n"
            "Generate an insightful, encouraging financial health check for the user.\n"
            "Requirements:\n"
            "1. 'headline': A crisp 1-sentence summary of overall spending health.\n"
            "2. Exactly 3 insights in the 'insights' array:\n"
            "   - One 'highlight' (positive observation or smart habit noticed)\n"
            "   - One 'watchout' (highest spend area, rapid burn, or nearing limit)\n"
            "   - One 'tip' (actionable, realistic recommendation to save or stay on budget)\n"
            "Keep the language friendly, human, clear, and under 35 words per bullet.\n\n"
            "Return valid JSON only matching this schema:\n"
            "{\n"
            '  "headline": "You are on track with your budget this month!",\n'
            '  "insights": [\n'
            '    {"type": "highlight", "text": "Food spending decreased 12% compared to last week."},\n'
            '    {"type": "watchout", "text": "Shopping is currently at 78% of its category limit."},\n'
            '    {"type": "tip", "text": "Keeping daily discretionary spend under ₹500 will leave a ₹3,000 surplus."}\n'
            "  ]\n"
            "}"
        )

        result = await self._generate_json(prompt)
        headline = str(result.get("headline", "Financial Summary")).strip()
        raw_insights = result.get("insights", [])

        bullets: List[AIInsightBullet] = []
        for item in raw_insights:
            b_type = item.get("type", "tip")
            if b_type not in ("highlight", "watchout", "tip"):
                b_type = "tip"
            bullets.append(AIInsightBullet(type=b_type, text=str(item.get("text", "")).strip()))

        if not bullets:
            bullets = [
                AIInsightBullet(type="highlight", text="You are consistently tracking your expenses."),
                AIInsightBullet(type="watchout", text="Review your top spending category to stay ahead."),
                AIInsightBullet(type="tip", text="Aim to keep daily spend within your remaining budget."),
            ]

        return AIInsightsResponse(
            period=period,
            headline=headline or "Your Financial Health Check",
            insights=bullets,
            generated_at=datetime.utcnow(),
        )

    # ── Feature 5: Smart Burn Rate & Overspending Warning ─────────────────────────────────
    async def forecast_budget_pacing(
        self, spent: Decimal, budget_limit: Decimal, days_elapsed: int, total_days: int
    ) -> AIBudgetForecastResponse:
        """Deterministic budget pace calculations paired with friendly contextual AI advisory."""
        days_remaining = max(0, total_days - days_elapsed)
        safe_elapsed = max(1, days_elapsed)

        current_daily_burn = Decimal(str(round(float(spent) / safe_elapsed, 2)))
        projected_total = Decimal(str(round(float(current_daily_burn) * total_days, 2)))
        projected_variance = projected_total - budget_limit

        if days_remaining > 0 and budget_limit > spent:
            recommended_daily = Decimal(str(round(float(budget_limit - spent) / days_remaining, 2)))
        else:
            recommended_daily = Decimal("0.00")

        if projected_total <= budget_limit:
            forecast_status = "on_track"
        elif projected_total <= (budget_limit * Decimal("1.15")):
            forecast_status = "warning"
        else:
            forecast_status = "exceeded"

        prompt = (
            "You are a personal budgeting assistant for FinTrack.\n"
            f"Monthly Budget Goal: ₹{float(budget_limit):,.2f}\n"
            f"Spent so far: ₹{float(spent):,.2f} in {days_elapsed} of {total_days} days\n"
            f"Average Daily Burn: ₹{float(current_daily_burn):,.2f}\n"
            f"Projected Month-end Spend: ₹{float(projected_total):,.2f}\n"
            f"Projected Variance: ₹{float(projected_variance):+,.2f}\n"
            f"Safe Daily Limit for remaining {days_remaining} days: ₹{float(recommended_daily):,.2f}\n"
            f"Status: {forecast_status}\n\n"
            "Write a single friendly, supportive 2-sentence advice message for the user explaining their pace.\n"
            "Output JSON:\n"
            '{"advice": "Your 2-sentence friendly advice here."}'
        )

        try:
            result = await self._generate_json(prompt)
            ai_advice = str(result.get("advice", "")).strip()
        except Exception:
            if forecast_status == "on_track":
                ai_advice = f"Great pace! Spending ₹{current_daily_burn}/day will keep you comfortably within your budget."
            elif forecast_status == "warning":
                ai_advice = f"Pacing slightly high. Keeping daily spending below ₹{recommended_daily} will ensure you don't exceed your budget."
            else:
                ai_advice = f"Spending pace is high. We project exceeding the budget by ₹{projected_variance}. Consider pausing non-essential expenses."

        return AIBudgetForecastResponse(
            total_budget=budget_limit,
            total_spent=spent,
            days_elapsed=days_elapsed,
            days_in_month=total_days,
            days_remaining=days_remaining,
            current_daily_burn=current_daily_burn,
            projected_total_spent=projected_total,
            projected_variance=projected_variance,
            recommended_daily_limit=recommended_daily,
            status=forecast_status,
            ai_advice=ai_advice,
        )
