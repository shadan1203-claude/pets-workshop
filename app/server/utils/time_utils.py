"""Shared time helpers so reminder due dates are compared consistently in UTC."""
from datetime import datetime, timezone


def utcnow():
    """Return the current time as a naive UTC datetime (matches how due_at is stored)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def parse_iso_datetime(value, field_name='due_at'):
    """Parse an ISO-8601 string into a naive UTC datetime.

    Values with timezone info are converted to UTC and stripped of tzinfo so
    they compare directly against utcnow(). Naive values are assumed to
    already be UTC.
    """
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} is required and must be an ISO-8601 datetime string")

    try:
        parsed = datetime.fromisoformat(value.strip())
    except ValueError:
        raise ValueError(f"{field_name} must be a valid ISO-8601 datetime string")

    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

    return parsed


def to_iso_utc(value):
    """Render a naive UTC datetime as an ISO-8601 string with an explicit offset."""
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc).isoformat()
