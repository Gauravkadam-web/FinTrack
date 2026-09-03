import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.schemas.ai import AICategorizeResponse
from app.services.ai_service import AIService


def test_extract_json_direct():
    service = AIService()
    raw = '{"suggested_category": "Food", "confidence": 0.95}'
    data = service._extract_json(raw)
    assert data["suggested_category"] == "Food"
    assert data["confidence"] == 0.95


def test_extract_json_with_markdown_fence():
    service = AIService()
    raw = """Here is the result:
```json
{
  "title": "Uber Trip",
  "amount": 250.0,
  "category_name": "Transport"
}
```
Hope this helps!"""
    data = service._extract_json(raw)
    assert data["title"] == "Uber Trip"
    assert data["amount"] == 250.0
    assert data["category_name"] == "Transport"


def test_extract_json_invalid_raises_502():
    service = AIService()
    with pytest.raises(HTTPException) as exc:
        service._extract_json("not valid json at all")
    assert exc.value.status_code == 502


def test_ensure_configured_missing_key():
    service = AIService()
    service.provider = "gemini"
    service.api_key = ""
    with pytest.raises(HTTPException) as exc:
        service._ensure_configured()
    assert exc.value.status_code == 503
    assert "AI_API_KEY" in exc.value.detail


@pytest.mark.asyncio
async def test_suggest_category_existing_match():
    service = AIService()
    cat_id = uuid.uuid4()
    user_cats = [{"id": cat_id, "name": "Food & Dining"}, {"id": uuid.uuid4(), "name": "Travel"}]

    mock_llm_response = {
        "suggested_category": "Food & Dining",
        "is_existing": True,
        "confidence": 0.98,
        "reason": "Matched Starbucks to Food & Dining",
    }

    with patch.object(service, "_generate_json", new=AsyncMock(return_value=mock_llm_response)):
        res: AICategorizeResponse = await service.suggest_category(
            title="Starbucks Coffee", user_categories=user_cats
        )
        assert res.suggested_category == "Food & Dining"
        assert res.category_id == cat_id
        assert res.is_existing is True
        assert res.confidence == 0.98


@pytest.mark.asyncio
async def test_suggest_category_new_suggestion():
    service = AIService()
    user_cats = [{"id": uuid.uuid4(), "name": "Food"}, {"id": uuid.uuid4(), "name": "Rent"}]

    mock_llm_response = {
        "suggested_category": "Subscriptions",
        "is_existing": False,
        "confidence": 0.85,
        "reason": "Netflix fits Subscriptions",
    }

    with patch.object(service, "_generate_json", new=AsyncMock(return_value=mock_llm_response)):
        res = await service.suggest_category(title="Netflix Monthly", user_categories=user_cats)
        assert res.suggested_category == "Subscriptions"
        assert res.category_id is None
        assert res.is_existing is False


@pytest.mark.asyncio
async def test_parse_expense_text():
    service = AIService()
    user_cats = [{"id": uuid.uuid4(), "name": "Transport"}]

    mock_llm_response = {
        "title": "Uber to Airport",
        "amount": 450.0,
        "category_name": "Transport",
        "payment_mode": "cash",
        "expense_date": "2026-09-02",
        "notes": "Late night cab",
        "confidence": 0.96,
    }

    with patch.object(service, "_generate_json", new=AsyncMock(return_value=mock_llm_response)):
        res = await service.parse_expense_text("Uber to airport 450 cash yesterday", user_categories=user_cats)
        assert res.title == "Uber to Airport"
        assert res.amount == Decimal("450.0")
        assert res.category_name == "Transport"
        assert res.payment_mode == "cash"


@pytest.mark.asyncio
async def test_budget_forecast_math():
    service = AIService()
    with patch.object(service, "_generate_json", new=AsyncMock(return_value={"advice": "Pacing well!"})):
        # Spent 5,000 in 10 days out of 30. Daily burn = 500. Projected = 15,000. Budget = 20,000.
        res = await service.forecast_budget_pacing(
            spent=Decimal("5000.00"),
            budget_limit=Decimal("20000.00"),
            days_elapsed=10,
            total_days=30,
        )
        assert res.current_daily_burn == Decimal("500.00")
        assert res.projected_total_spent == Decimal("15000.00")
        assert res.status == "on_track"
        assert res.days_remaining == 20
        assert res.recommended_daily_limit == Decimal("750.00")  # (20,000 - 5,000) / 20 = 750
