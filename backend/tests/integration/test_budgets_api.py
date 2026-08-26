import uuid

import pytest


@pytest.mark.asyncio
async def test_budgets_api_flow(client):
    # 1. Create a distinct test category
    cat_res = await client.post(
        "/api/v1/categories",
        json={"name": f"BudgetTestCat_{uuid.uuid4().hex[:6]}"},
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 2. Create budget for category
    budget_res = await client.post(
        "/api/v1/budgets",
        json={
            "category_id": cat_id,
            "period_month": "2026-11-01",
            "limit_amount": 10000.00,
        },
    )
    assert budget_res.status_code == 201
    budget_data = budget_res.json()
    budget_id = budget_data["id"]
    assert (
        budget_data["limit_amount"] == "10000.00"
        or budget_data["limit_amount"] == 10000.0
    )
    assert budget_data["status"] == "on_track"

    # 3. Update budget limit
    put_res = await client.put(
        f"/api/v1/budgets/{budget_id}",
        json={"limit_amount": 12000.00},
    )
    assert put_res.status_code == 200
    assert (
        put_res.json()["limit_amount"] == "12000.00"
        or put_res.json()["limit_amount"] == 12000.0
    )

    # 4. List budgets for month
    list_res = await client.get("/api/v1/budgets?month=2026-11")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert any(b["id"] == budget_id for b in list_data["categories"])

    # 5. Delete budget
    del_res = await client.delete(f"/api/v1/budgets/{budget_id}")
    assert del_res.status_code == 204
