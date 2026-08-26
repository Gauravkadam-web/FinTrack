from sqlalchemy import CheckConstraint, ForeignKeyConstraint, UniqueConstraint

from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense


def test_category_model_structure():
    assert Category.__tablename__ == "categories"
    cols = {c.name for c in Category.__table__.columns}
    assert "id" in cols
    assert "name" in cols
    assert "is_system" in cols
    assert "created_at" in cols
    assert "updated_at" in cols

    # name column has 50 max length
    assert Category.__table__.c.name.type.length == 50
    assert Category.__table__.c.name.nullable is False


def test_expense_model_structure():
    assert Expense.__tablename__ == "expenses"
    cols = {c.name for c in Expense.__table__.columns}
    expected = {
        "id",
        "title",
        "category_id",
        "amount",
        "expense_date",
        "notes",
        "payment_mode",
        "created_at",
        "updated_at",
    }
    assert expected.issubset(cols)

    # Check constraints on expense
    constraint_names = {
        c.name
        for c in Expense.__table__.constraints
        if isinstance(c, CheckConstraint)
    }
    assert "check_expense_amount_positive" in constraint_names
    assert "check_expense_date_not_future" in constraint_names
    assert "check_expense_payment_mode_valid" in constraint_names

    # Check foreign key
    fks = [
        c for c in Expense.__table__.constraints
        if isinstance(c, ForeignKeyConstraint)
    ]
    assert len(fks) >= 1
    assert any(fk.elements[0].target_fullname == "categories.id" for fk in fks)
    assert any(fk.ondelete == "RESTRICT" for fk in fks)


def test_budget_model_structure():
    assert Budget.__tablename__ == "budgets"
    cols = {c.name for c in Budget.__table__.columns}
    expected = {
        "id",
        "category_id",
        "period_month",
        "limit_amount",
        "created_at",
        "updated_at",
    }
    assert expected.issubset(cols)

    # Check constraints on budget
    constraint_names = {
        c.name
        for c in Budget.__table__.constraints
        if isinstance(c, CheckConstraint)
    }
    assert "check_budget_limit_amount_positive" in constraint_names

    # Unique constraint on (category_id, period_month)
    unique_constraints = [
        c for c in Budget.__table__.constraints
        if isinstance(c, UniqueConstraint)
    ]
    assert any(c.name == "uq_budget_category_period" for c in unique_constraints)

    # Check foreign key with CASCADE
    fks = [
        c for c in Budget.__table__.constraints
        if isinstance(c, ForeignKeyConstraint)
    ]
    assert len(fks) >= 1
    assert any(fk.elements[0].target_fullname == "categories.id" for fk in fks)
    assert any(fk.ondelete == "CASCADE" for fk in fks)
