import uuid
from datetime import date
from decimal import Decimal

import pytest

from app.core.exceptions import ConflictException
from app.schemas.budget import BudgetCreate
from app.schemas.category import CategoryCreate
from app.schemas.expense import ExpenseCreate
from app.services.budget_service import BudgetService
from app.services.category_service import CategoryService
from app.services.expense_service import ExpenseService


@pytest.mark.asyncio
async def test_budget_status_thresholds(db_session, test_user):
    cat_service = CategoryService()
    budget_service = BudgetService()
    expense_service = ExpenseService()

    # Create fresh unique category for test_user
    cat_name = f"BudgetCat_{uuid.uuid4().hex[:6]}"
    category = await cat_service.create_category(
        db_session, CategoryCreate(name=cat_name), test_user.id
    )

    test_month = date(2024, 1, 1)

    # 1. Create category budget with limit 1000.00
    budget = await budget_service.create_budget(
        db_session,
        BudgetCreate(
            category_id=category.id,
            period_month=test_month,
            limit_amount=Decimal("1000.00"),
        ),
        test_user.id,
    )
    assert budget.status == "on_track"
    assert budget.spent == Decimal("0.00")
    assert budget.remaining == Decimal("1000.00")

    # 2. Add expense of 850 in that past month (85% -> near_limit)
    await expense_service.create_expense(
        db_session,
        ExpenseCreate(
            title="Groceries",
            category_id=category.id,
            amount=Decimal("850.00"),
            expense_date=date(2024, 1, 10),
        ),
        test_user.id,
    )

    budgets_list = await budget_service.list_budgets(db_session, test_user.id, "2024-01")
    cat_b = next((b for b in budgets_list.categories if b.id == budget.id), None)
    assert cat_b is not None
    assert cat_b.spent == Decimal("850.00")
    assert cat_b.remaining == Decimal("150.00")
    assert cat_b.status == "near_limit"

    # 3. Add another expense of 200 (total 1050 -> over_budget)
    await expense_service.create_expense(
        db_session,
        ExpenseCreate(
            title="More groceries",
            category_id=category.id,
            amount=Decimal("200.00"),
            expense_date=date(2024, 1, 15),
        ),
        test_user.id,
    )

    budgets_list2 = await budget_service.list_budgets(db_session, test_user.id, "2024-01")
    cat_b2 = next((b for b in budgets_list2.categories if b.id == budget.id), None)
    assert cat_b2 is not None
    assert cat_b2.spent == Decimal("1050.00")
    assert cat_b2.remaining == Decimal("-50.00")
    assert cat_b2.status == "over_budget"


@pytest.mark.asyncio
async def test_duplicate_budget_prevention(db_session, test_user):
    cat_service = CategoryService()
    budget_service = BudgetService()
    cat_name = f"DupCat_{uuid.uuid4().hex[:6]}"
    category = await cat_service.create_category(
        db_session, CategoryCreate(name=cat_name), test_user.id
    )

    test_month = date(2024, 5, 1)

    # Set category budget
    await budget_service.create_budget(
        db_session,
        BudgetCreate(
            category_id=category.id,
            period_month=test_month,
            limit_amount=Decimal("50000.00"),
        ),
        test_user.id,
    )

    # Setting duplicate category budget for same month should fail
    with pytest.raises(ConflictException):
        await budget_service.create_budget(
            db_session,
            BudgetCreate(
                category_id=category.id,
                period_month=test_month,
                limit_amount=Decimal("60000.00"),
            ),
            test_user.id,
        )
