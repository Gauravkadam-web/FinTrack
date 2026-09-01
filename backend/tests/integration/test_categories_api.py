import uuid

import pytest


@pytest.mark.asyncio
async def test_categories_api_crud_flow(client, auth_headers):
    # 1. List categories (seeded categories should be present for user)
    res = await client.get("/api/v1/categories", headers=auth_headers)
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) >= 1
    assert any(c["name"] == "Uncategorized" for c in categories)

    # 2. Create custom category
    cat_name = f"Test_{uuid.uuid4().hex[:6]}"
    create_res = await client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": cat_name},
    )
    assert create_res.status_code == 201
    created_data = create_res.json()
    cat_id = created_data["id"]
    assert created_data["name"] == cat_name
    assert created_data["is_system"] is False

    # 3. Rename category
    renamed = f"Renamed_{uuid.uuid4().hex[:6]}"
    patch_res = await client.patch(
        f"/api/v1/categories/{cat_id}",
        headers=auth_headers,
        json={"name": renamed},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == renamed

    # 4. Check expense count
    count_res = await client.get(
        f"/api/v1/categories/{cat_id}/expense-count",
        headers=auth_headers,
    )
    assert count_res.status_code == 200
    assert count_res.json()["expense_count"] == 0

    # 5. Delete category
    delete_res = await client.delete(f"/api/v1/categories/{cat_id}", headers=auth_headers)
    assert delete_res.status_code == 204


@pytest.mark.asyncio
async def test_categories_validation_and_errors(client, auth_headers):
    # Empty name validation error
    res = await client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": "   "},
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"

    # Block delete Uncategorized
    list_res = await client.get("/api/v1/categories", headers=auth_headers)
    uncat = next(c for c in list_res.json() if c["name"] == "Uncategorized")
    del_res = await client.delete(f"/api/v1/categories/{uncat['id']}", headers=auth_headers)
    assert del_res.status_code == 409
