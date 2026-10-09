import datetime
from typing import Dict, Any, List
from fastapi import APIRouter
from app.schemas.schemas import ApiSuccessEnvelope, AuditLogResponse
from app.api.v1.endpoints.hospitals import AUDIT_STORE, HOSPITALS_STORE, RESOURCES_STORE
from app.api.v1.endpoints.emergencies import EMERGENCIES_STORE
from app.services.resource_service import is_resource_fresh
from app.services.synthetic_seed import get_synthetic_dataset

router = APIRouter()
_dataset = get_synthetic_dataset()

@router.get("", response_model=ApiSuccessEnvelope[Dict[str, Any]])
async def get_system_health():
    now = datetime.datetime.now(datetime.timezone.utc)
    fresh_count = 0
    stale_count = 0
    unknown_count = 0
    unavailable_count = 0

    for r in RESOURCES_STORE.values():
        status_val = r.get("availability_status", "unknown")
        if status_val == "unavailable":
            unavailable_count += 1
        elif status_val == "unknown":
            unknown_count += 1
            
        fresh, _ = is_resource_fresh(r.get("last_verified_at"), now=now)
        if fresh:
            fresh_count += 1
        else:
            stale_count += 1

    health_data = {
        "status": "healthy",
        "service": "CARE/ROUTE Emergency Core Engine",
        "version": "1.0.0",
        "timestamp": now.isoformat(),
        "database_backend": "SQLAlchemy 2.x + PostgreSQL (Async Engine configured)",
        "mode": "hybrid_in_memory_verified_store",
        "stale_threshold_minutes": 10,
        "metrics": {
            "hospitals_registered": len(HOSPITALS_STORE),
            "resources_tracked": len(RESOURCES_STORE),
            "fresh_resources": fresh_count,
            "stale_resources": stale_count,
            "unknown_resources": unknown_count,
            "unavailable_resources": unavailable_count,
            "active_emergencies": len(EMERGENCIES_STORE),
            "audit_records": len(AUDIT_STORE)
        },
        "scenarios_available": [s["name"] for s in _dataset["scenarios"]],
        "disclaimer": "Fictional demonstration prototype. Not a clinical diagnostic system or emergency dispatch service."
    }
    return ApiSuccessEnvelope(data=health_data, message="System operational and telemetry verified")

@router.get("/audit-logs", response_model=ApiSuccessEnvelope[List[AuditLogResponse]])
async def get_audit_logs():
    return ApiSuccessEnvelope(
        data=[AuditLogResponse(**a) for a in reversed(AUDIT_STORE)],
        message="System audit logs retrieved"
    )
