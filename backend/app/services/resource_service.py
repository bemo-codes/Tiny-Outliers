import datetime
from typing import Optional, Dict, Any
from app.core.config import settings

def is_resource_fresh(last_verified_at: Optional[datetime.datetime], *, now: Optional[datetime.datetime] = None) -> tuple[bool, float]:
    """
    Returns (is_fresh, age_minutes).
    If timestamp is missing, it is unconditionally STALE (age_minutes = 999.0).
    """
    if last_verified_at is None:
        return False, 999.0
    
    if now is None:
        now = datetime.datetime.now(datetime.timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=datetime.timezone.utc)
        
    if last_verified_at.tzinfo is None:
        last_verified_at = last_verified_at.replace(tzinfo=datetime.timezone.utc)
        
    age_seconds = (now - last_verified_at).total_seconds()
    age_minutes = round(age_seconds / 60.0, 1)
    is_fresh = age_minutes <= settings.RESOURCE_STALE_AFTER_MINUTES
    return is_fresh, age_minutes

def format_phone_link(phone: Optional[str]) -> Optional[str]:
    """
    Validates and formats telephone string for tel: URI.
    Returns None if missing or invalid.
    """
    if not phone or not phone.strip():
        return None
    cleaned = phone.strip()
    # Check minimum length for plausible contact
    if len(cleaned) < 5:
        return None
    return f"tel:{cleaned}"
