from datetime import date, timedelta

import pytest


@pytest.mark.asyncio
async def test_expenses_api_crud_flow(client, auth_headers):
    # Get a category
    cats_res = await client.get("/api/v1/categories", headers=auth_headers)
    assert cats_res.status_code == 200
    category = cats_res.json()[0]

    # 1. Create expense
    payload = {
        "title": "Dinner with team",
        "category_id": category["id"],
        "amount": 1250.50,
        "expense_date": str(date.today()),
        "notes": "Project celebration at Bistro",
        "payment_mode": "upi",
    }
    create_res = await client.post("/api/v1/expenses", headers=auth_headers, json=payload)
    assert create_res.status_code == 201
    expense = create_res.json()
    expense_id = expense["id"]
    assert expense["title"] == "Dinner with team"
    assert expense["amount"] == "1250.50" or expense["amount"] == 1250.5
    assert expense["category_name"] == category["name"]

    # 2. Get single expense
    get_res = await client.get(f"/api/v1/expenses/{expense_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == expense_id

    # 3. Update expense
    update_payload = {
        "title": "Dinner with team (Updated)",
        "category_id": category["id"],
        "amount": 1500.00,
        "expense_date": str(date.today()),
        "notes": "Updated note",
        "payment_mode": "card",
    }
    put_res = await client.put(f"/api/v1/expenses/{expense_id}", headers=auth_headers, json=update_payload)
    assert put_res.status_code == 200
    assert put_res.json()["title"] == "Dinner with team (Updated)"
    assert put_res.json()["payment_mode"] == "card"

    # 4. Search and pagination
    list_res = await client.get("/api/v1/expenses?search=celebration", headers=auth_headers)
    assert list_res.status_code == 200

    list_res_title = await client.get("/api/v1/expenses?search=Dinner", headers=auth_headers)
    assert list_res_title.status_code == 200
    assert list_res_title.json()["total_count"] >= 1

    # 5. Delete expense
    del_res = await client.delete(f"/api/v1/expenses/{expense_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Verify not found
    get_after_del = await client.get(f"/api/v1/expenses/{expense_id}", headers=auth_headers)
    assert get_after_del.status_code == 404


@pytest.mark.asyncio
async def test_expense_validations(client, auth_headers):
    cats_res = await client.get("/api/v1/categories", headers=auth_headers)
    cat_id = cats_res.json()[0]["id"]

    # Negative amount
    res = await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "title": "Invalid",
            "category_id": cat_id,
            "amount": -50.0,
            "expense_date": str(date.today()),
        },
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"

    # Future date
    future_date = date.today() + timedelta(days=5)
    res_future = await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "title": "Invalid Future",
            "category_id": cat_id,
            "amount": 100.0,
            "expense_date": str(future_date),
        },
    )
    assert res_future.status_code == 400
    assert res_future.json()["error"]["code"] == "VALIDATION_ERROR"
