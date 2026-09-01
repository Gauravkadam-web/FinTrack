from sqlalchemy import CheckConstraint, ForeignKeyConstraint, UniqueConstraint

from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.refresh_token import RefreshToken
from app.models.user import User


def test_user_model_structure():
    assert User.__tablename__ == "users"
    cols = {c.name for c in User.__table__.columns}
    assert {"id", "email", "password_hash", "display_name", "google_id", "email_verified", "is_active", "created_at", "updated_at"}.issubset(cols)


def test_refresh_token_model_structure():
    assert RefreshToken.__tablename__ == "refresh_tokens"
    cols = {c.name for c in RefreshToken.__table__.columns}
    assert {"id", "user_id", "token_hash", "device_info", "expires_at", "revoked_at", "replaced_by", "created_at"}.issubset(cols)


def test_category_model_structure():
    assert Category.__tablename__ == "categories"
    cols = {c.name for c in Category.__table__.columns}
    assert {"id", "user_id", "name", "is_system", "created_at", "updated_at"}.issubset(cols)

    # name column has 50 max length
    assert Category.__table__.c.name.type.length == 50
    assert Category.__table__.c.name.nullable is False


def test_expense_model_structure():
    assert Expense.__tablename__ == "expenses"
    cols = {c.name for c in Expense.__table__.columns}
    expected = {
        "id",
        "user_id",
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
        c.name for c in Expense.__table__.constraints if isinstance(c, CheckConstraint)
    }
    assert "check_expense_amount_positive" in constraint_names
    assert "check_expense_date_not_future" in constraint_names
    assert "check_expense_payment_mode_valid" in constraint_names

    # Check foreign keys (category and user)
    fks = [
        c for c in Expense.__table__.constraints if isinstance(c, ForeignKeyConstraint)
    ]
    assert len(fks) >= 2
    assert any(fk.elements[0].target_fullname == "categories.id" for fk in fks)
    assert any(fk.elements[0].target_fullname == "users.id" for fk in fks)


def test_budget_model_structure():
    assert Budget.__tablename__ == "budgets"
    cols = {c.name for c in Budget.__table__.columns}
    expected = {
        "id",
        "user_id",
        "category_id",
        "period_month",
        "limit_amount",
        "created_at",
        "updated_at",
    }
    assert expected.issubset(cols)

    # Check constraints on budget
    constraint_names = {
        c.name for c in Budget.__table__.constraints if isinstance(c, CheckConstraint)
    }
    assert "check_budget_limit_amount_positive" in constraint_names

    # Unique constraint on (user_id, category_id, period_month)
    unique_constraints = [
        c for c in Budget.__table__.constraints if isinstance(c, UniqueConstraint)
    ]
    assert any(c.name == "uq_budget_user_category_period" for c in unique_constraints)
