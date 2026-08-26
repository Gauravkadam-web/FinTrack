import uuid

import pytest

from app.core.exceptions import ConflictException
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.category_service import CategoryService


@pytest.mark.asyncio
async def test_create_and_get_category(db_session):
    service = CategoryService()
    unique_name = f"TestCat_{uuid.uuid4().hex[:6]}"

    # Create category
    created = await service.create_category(
        db_session, CategoryCreate(name=unique_name)
    )
    assert created.id is not None
    assert created.name == unique_name
    assert created.is_system is False

    # Prevent duplicate
    with pytest.raises(ConflictException):
        await service.create_category(db_session, CategoryCreate(name=unique_name))


@pytest.mark.asyncio
async def test_update_category(db_session):
    service = CategoryService()
    unique_name = f"UpdateCat_{uuid.uuid4().hex[:6]}"
    created = await service.create_category(
        db_session, CategoryCreate(name=unique_name)
    )

    new_name = f"Renamed_{uuid.uuid4().hex[:6]}"
    updated = await service.update_category(
        db_session, created.id, CategoryUpdate(name=new_name)
    )
    assert updated.name == new_name


@pytest.mark.asyncio
async def test_cannot_delete_or_rename_uncategorized(db_session):
    service = CategoryService()
    categories = await service.list_categories(db_session)
    uncategorized = next(
        (c for c in categories if c.name.lower() == "uncategorized"), None
    )
    assert uncategorized is not None

    # Cannot rename system category
    with pytest.raises(ConflictException):
        await service.update_category(
            db_session, uncategorized.id, CategoryUpdate(name="Forbidden")
        )

    # Cannot delete system category
    with pytest.raises(ConflictException):
        await service.delete_category(db_session, uncategorized.id)
