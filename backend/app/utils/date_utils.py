import calendar
from datetime import date, datetime
from typing import Optional, Tuple

from app.core.exceptions import ValidationException


def parse_period_month(month_str: Optional[str] = None) -> date:
    """Parse 'YYYY-MM' string into the first day of that month (DATE).
    Defaults to the first day of the current month if month_str is None.
    """
    if not month_str:
        today = date.today()
        return date(today.year, today.month, 1)

    try:
        dt = datetime.strptime(month_str.strip(), "%Y-%m")
        return date(dt.year, dt.month, 1)
    except ValueError:
        raise ValidationException(
            message="Invalid month format. Expected 'YYYY-MM' (e.g. '2026-08')",
            field="month",
        )


def get_month_bounds(month_str: Optional[str] = None) -> Tuple[date, date]:
    """Get the (start_date, end_date) for a given 'YYYY-MM' string (or current month)."""
    start_date = parse_period_month(month_str)
    _, last_day = calendar.monthrange(start_date.year, start_date.month)
    end_date = date(start_date.year, start_date.month, last_day)
    return start_date, end_date


def get_previous_month(first_of_month: date) -> date:
    """Get the first day of the preceding month."""
    if first_of_month.month == 1:
        return date(first_of_month.year - 1, 12, 1)
    return date(first_of_month.year, first_of_month.month - 1, 1)


def format_period_month(dt: date) -> str:
    """Format date to 'YYYY-MM' string."""
    return dt.strftime("%Y-%m")
