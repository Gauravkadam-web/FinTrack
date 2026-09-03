import base64
import uuid
from datetime import date, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.main import app
from app.models.user import User
from app.schemas.ai import (
    AIBudgetForecastResponse,
    AICategorizeResponse,
    AIInsightBullet,
    AIInsightsResponse,
    AIParsedExpenseResponse,
    AIReceiptScanResponse,
)


@pytest_asyncio.fixture
async def unauth_client():
    app.dependency_overrides.clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client():
    mock_user = User(
        id=uuid.uuid4(),
        email="ai_tester@example.com",
        display_name="AI Tester",
        email_verified=True,
        is_active=True,
    )
    mock_session = AsyncMock(spec=AsyncSession)
    app.dependency_overrides[get_db] = lambda: mock_session
    app.dependency_overrides[get_current_user] = lambda: mock_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_endpoints_require_auth(unauth_client: AsyncClient):
    """Ensure all AI endpoints enforce JWT authentication."""
    r1 = await unauth_client.post("/api/v1/ai/categorize", json={"title": "Test"})
    assert r1.status_code == 401

    r2 = await unauth_client.post("/api/v1/ai/parse-expense", json={"prompt": "Test"})
    assert r2.status_code == 401

    r3 = await unauth_client.get("/api/v1/ai/insights")
    assert r3.status_code == 401

    r4 = await unauth_client.get("/api/v1/ai/budget-forecast")
    assert r4.status_code == 401


@pytest.mark.asyncio
async def test_ai_categorize_endpoint(auth_client: AsyncClient):
    mock_res = AICategorizeResponse(
        suggested_category="Food & Dining",
        category_id=None,
        is_existing=False,
        confidence=0.95,
        reason="Coffee belongs to Food & Dining",
    )

    with patch("app.api.v1.ai.category_service.list_categories", new=AsyncMock(return_value=[])):
        with patch("app.api.v1.ai.ai_service.suggest_category", new=AsyncMock(return_value=mock_res)):
            resp = await auth_client.post(
                "/api/v1/ai/categorize",
                json={"title": "Cappuccino", "amount": 220.0},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["suggested_category"] == "Food & Dining"
            assert data["confidence"] == 0.95


@pytest.mark.asyncio
async def test_ai_parse_expense_endpoint(auth_client: AsyncClient):
    mock_res = AIParsedExpenseResponse(
        title="Swiggy Dinner",
        amount=Decimal("540.00"),
        category_name="Food",
        category_id=None,
        payment_mode="upi",
        expense_date=date.today(),
        notes="Biryani order",
        confidence=0.98,
    )

    with patch("app.api.v1.ai.category_service.list_categories", new=AsyncMock(return_value=[])):
        with patch("app.api.v1.ai.ai_service.parse_expense_text", new=AsyncMock(return_value=mock_res)):
            resp = await auth_client.post(
                "/api/v1/ai/parse-expense",
                json={"prompt": "Swiggy dinner 540 upi biryani"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["title"] == "Swiggy Dinner"
            assert float(data["amount"]) == 540.0
            assert data["payment_mode"] == "upi"


@pytest.mark.asyncio
async def test_ai_scan_receipt_endpoint(auth_client: AsyncClient):
    mock_res = AIReceiptScanResponse(
        title="D-Mart Supermarket",
        amount=Decimal("1850.50"),
        category_name="Groceries",
        category_id=None,
        payment_mode="card",
        expense_date=date.today(),
        notes="Monthly ration items",
        confidence=0.96,
    )

    # Test invalid base64 rejection
    resp_invalid = await auth_client.post(
        "/api/v1/ai/scan-receipt",
        json={"image_base64": "invalid_base64!@#", "mime_type": "image/png"},
    )
    assert resp_invalid.status_code in (400, 422)

    # Test valid image
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    valid_b64 = base64.b64encode(fake_png).decode("utf-8")

    with patch("app.api.v1.ai.category_service.list_categories", new=AsyncMock(return_value=[])):
        with patch("app.api.v1.ai.ai_service.scan_receipt_image", new=AsyncMock(return_value=mock_res)):
            resp = await auth_client.post(
                "/api/v1/ai/scan-receipt",
                json={"image_base64": valid_b64, "mime_type": "image/png"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["title"] == "D-Mart Supermarket"
            assert float(data["amount"]) == 1850.5


@pytest.mark.asyncio
async def test_ai_insights_endpoint(auth_client: AsyncClient):
    from unittest.mock import MagicMock
    mock_summary = MagicMock()
    mock_summary.total_spent_month = Decimal("5000.00")
    mock_summary.category_breakdown = []
    mock_summary.budget_status = None

    mock_comparison = MagicMock()
    mock_comparison.percentage_change = -12.5

    mock_res = AIInsightsResponse(
        period="month",
        headline="Budget on track with high savings potential.",
        insights=[
            AIInsightBullet(type="highlight", text="Dining spend decreased by 15%."),
            AIInsightBullet(type="watchout", text="Fuel expenses higher than usual."),
            AIInsightBullet(type="tip", text="Keep daily spend below 600 to save 4k."),
        ],
        generated_at=datetime.utcnow(),
    )

    with patch("app.api.v1.ai.dashboard_service.get_summary", new=AsyncMock(return_value=mock_summary)):
        with patch("app.api.v1.ai.dashboard_service.get_comparison", new=AsyncMock(return_value=mock_comparison)):
            with patch("app.api.v1.ai.ai_service.generate_insights", new=AsyncMock(return_value=mock_res)):
                resp = await auth_client.get("/api/v1/ai/insights?period=month")
                assert resp.status_code == 200
                data = resp.json()
                assert len(data["insights"]) == 3
                assert data["insights"][0]["type"] == "highlight"


@pytest.mark.asyncio
async def test_ai_budget_forecast_endpoint(auth_client: AsyncClient):
    from unittest.mock import MagicMock
    mock_summary = MagicMock()
    mock_summary.total_spent_month = Decimal("8000.00")
    mock_summary.budget_status = None

    mock_res = AIBudgetForecastResponse(
        total_budget=Decimal("25000.00"),
        total_spent=Decimal("8000.00"),
        days_elapsed=10,
        days_in_month=30,
        days_remaining=20,
        current_daily_burn=Decimal("800.00"),
        projected_total_spent=Decimal("24000.00"),
        projected_variance=Decimal("-1000.00"),
        recommended_daily_limit=Decimal("850.00"),
        status="on_track",
        ai_advice="You are pacing under your monthly target. Keep it up!",
    )

    with patch("app.api.v1.ai.dashboard_service.get_summary", new=AsyncMock(return_value=mock_summary)):
        with patch("app.api.v1.ai.ai_service.forecast_budget_pacing", new=AsyncMock(return_value=mock_res)):
            resp = await auth_client.get("/api/v1/ai/budget-forecast")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "on_track"
            assert float(data["projected_total_spent"]) == 24000.0
