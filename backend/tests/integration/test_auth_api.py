import uuid

import pytest
from httpx import AsyncClient

from app.models.user import User


@pytest.mark.asyncio
async def test_register_flow(client: AsyncClient):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "email": f"newuser_{suffix}@example.com",
        "password": "StrongPassword123!",
        "display_name": "New Test User",
    }

    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == payload["email"].lower()
    assert data["user"]["display_name"] == payload["display_name"]
    assert "refresh_token" in res.cookies

    # Duplicate registration should return 409 CONFLICT
    res_dup = await client.post("/api/v1/auth/register", json=payload)
    assert res_dup.status_code == 409
    assert res_dup.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_login_flow(client: AsyncClient, test_user: User):
    # Valid login
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "Password123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["id"] == str(test_user.id)
    assert "refresh_token" in res.cookies

    # Invalid password
    res_bad = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "WrongPassword123!"},
    )
    assert res_bad.status_code == 401
    assert res_bad.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient, test_user: User):
    # 1. Login to get initial refresh cookie
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    initial_cookie = login_res.cookies.get("refresh_token")

    # 2. Call refresh
    client.cookies.set("refresh_token", initial_cookie)
    refresh_res = await client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 200
    new_token_data = refresh_res.json()
    assert "access_token" in new_token_data
    new_cookie = refresh_res.cookies.get("refresh_token")
    assert new_cookie != initial_cookie

    # 3. Attempt reuse of old initial_cookie -> should trigger revocation & fail
    client.cookies.set("refresh_token", initial_cookie)
    reuse_res = await client.post("/api/v1/auth/refresh")
    assert reuse_res.status_code == 401


@pytest.mark.asyncio
async def test_get_me_endpoint(client: AsyncClient, test_user: User, auth_headers: dict):
    # Without auth
    unauth_res = await client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # With auth
    res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(test_user.id)
    assert data["email"] == test_user.email


@pytest.mark.asyncio
async def test_change_password_flow(client: AsyncClient, test_user: User, auth_headers: dict):
    change_res = await client.put(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={
            "current_password": "Password123!",
            "new_password": "BrandNewPassword123!",
        },
    )
    assert change_res.status_code == 200

    # Login with new password
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "BrandNewPassword123!"},
    )
    assert login_res.status_code == 200


@pytest.mark.asyncio
async def test_user_data_isolation(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict,
    second_user: User,
    second_auth_headers: dict,
):
    """Verify that User A cannot see, update, or delete User B's expenses (FR-42)."""
    # 1. User A creates a category and an expense
    cat_res = await client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": f"User A Cat {uuid.uuid4().hex[:6]}"},
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    exp_res = await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "title": "User A Private Expense",
            "category_id": cat_id,
            "amount": 250.00,
            "expense_date": "2026-08-30",
        },
    )
    assert exp_res.status_code == 201
    expense_id = exp_res.json()["id"]

    # 2. User B tries to fetch User A's expense by ID -> MUST return 404 NOT_FOUND
    get_res = await client.get(f"/api/v1/expenses/{expense_id}", headers=second_auth_headers)
    assert get_res.status_code == 404

    # 3. User B lists expenses -> MUST NOT include User A's expense
    list_res = await client.get("/api/v1/expenses", headers=second_auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert all(item["id"] != expense_id for item in items)

    # 4. User B tries to update User A's expense -> MUST return 404 NOT_FOUND
    put_res = await client.put(
        f"/api/v1/expenses/{expense_id}",
        headers=second_auth_headers,
        json={
            "title": "Hacked Title",
            "category_id": cat_id,
            "amount": 10.00,
            "expense_date": "2026-08-30",
        },
    )
    assert put_res.status_code == 404

    # 5. User B tries to delete User A's expense -> MUST return 404 NOT_FOUND
    del_res = await client.delete(f"/api/v1/expenses/{expense_id}", headers=second_auth_headers)
    assert del_res.status_code == 404
