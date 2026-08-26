from datetime import date

import pytest


@pytest.mark.asyncio
async def test_dashboard_endpoints(client):
    # Get a category
    cats_res = await client.get("/api/v1/categories")
    cat_id = cats_res.json()[0]["id"]

    # Add sample expense in current month
    await client.post(
        "/api/v1/expenses",
        json={
            "title": "Dashboard Test Item",
            "category_id": cat_id,
            "amount": 500.00,
            "expense_date": str(date.today()),
            "payment_mode": "upi",
        },
    )

    current_month_str = date.today().strftime("%Y-%m")

    # 1. Summary
    summary_res = await client.get(
        f"/api/v1/dashboard/summary?month={current_month_str}"
    )
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["month"] == current_month_str
    assert float(summary_data["total_spent"]) >= 500.00
    assert len(summary_data["category_breakdown"]) >= 1

    # 2. Trend
    trend_res = await client.get("/api/v1/dashboard/trend?granularity=daily")
    assert trend_res.status_code == 200
    trend_data = trend_res.json()
    assert trend_data["granularity"] == "daily"
    assert len(trend_data["items"]) >= 1

    trend_weekly = await client.get("/api/v1/dashboard/trend?granularity=weekly")
    assert trend_weekly.status_code == 200
    assert len(trend_weekly.json()["items"]) == 12

    trend_monthly = await client.get("/api/v1/dashboard/trend?granularity=monthly")
    assert trend_monthly.status_code == 200
    assert len(trend_monthly.json()["items"]) == 12

    # 3. Comparison
    comp_res = await client.get(
        f"/api/v1/dashboard/comparison?month={current_month_str}"
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["current_month"] == current_month_str

    # 4. Top categories
    top_res = await client.get(
        f"/api/v1/dashboard/top-categories?month={current_month_str}&limit=5"
    )
    assert top_res.status_code == 200
    top_data = top_res.json()
    assert len(top_data["items"]) >= 1

    # 5. Average spend
    avg_res = await client.get("/api/v1/dashboard/average-spend?period=daily")
    assert avg_res.status_code == 200
    avg_data = avg_res.json()
    assert avg_data["period"] == "daily"
    assert avg_data["units_count"] == 30
