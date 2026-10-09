import datetime
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.schemas import (
    ApiSuccessEnvelope,
    ConfirmationCreateRequest,
    ConfirmationDecisionRequest,
    ConfirmationResponse
)
from app.core.security import get_current_user, require_roles, CurrentUser
from app.api.v1.endpoints.emergencies import EMERGENCIES_STORE

router = APIRouter()

CONFIRMATIONS_STORE: Dict[str, Dict[str, Any]] = {}
from app.api.v1.endpoints.hospitals import AUDIT_STORE

@router.post("", response_model=ApiSuccessEnvelope[ConfirmationResponse])
async def create_confirmation(payload: ConfirmationCreateRequest):
    emg = EMERGENCIES_STORE.get(payload.emergency_id)
    if not emg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency {payload.emergency_id} not found"
        )
        
    c_id = f"cnf-{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now(datetime.timezone.utc)
    
    conf_record = {
        "id": c_id,
        "emergency_id": payload.emergency_id,
        "hospital_id": payload.hospital_id,
        "status": "pending",
        "rejection_reason": None,
        "decided_by_user_id": None,
        "decided_at": None,
        "reserved_resources": payload.reserved_resources,
        "created_at": now,
        "updated_at": now
    }
    CONFIRMATIONS_STORE[c_id] = conf_record
    
    # Update emergency state
    emg["status"] = "awaiting_confirmation"
    emg["updated_at"] = now

    return ApiSuccessEnvelope(
        data=ConfirmationResponse(**conf_record),
        message="Hospital confirmation request dispatched and awaiting staff review"
    )

@router.patch("/{confirmation_id}", response_model=ApiSuccessEnvelope[ConfirmationResponse])
async def update_confirmation_decision(
    confirmation_id: str,
    payload: ConfirmationDecisionRequest,
    current_user: CurrentUser = Depends(require_roles("hospital_staff", "admin"))
):
    conf = CONFIRMATIONS_STORE.get(confirmation_id)
    if not conf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Confirmation request {confirmation_id} not found"
        )
    
    # Enforce ownership
    if current_user.role != "admin" and current_user.hospital_id != conf["hospital_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized to decide confirmation for hospital {conf['hospital_id']}"
        )
        
    if payload.status not in ["accepted", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'accepted' or 'rejected'"
        )
        
    now = datetime.datetime.now(datetime.timezone.utc)
    conf["status"] = payload.status
    conf["rejection_reason"] = payload.rejection_reason if payload.status == "rejected" else None
    conf["decided_by_user_id"] = current_user.id
    conf["decided_at"] = now
    conf["updated_at"] = now
    
    # Update linked emergency request
    emg = EMERGENCIES_STORE.get(conf["emergency_id"])
    if emg:
        if payload.status == "accepted":
            emg["status"] = "accepted"
            emg["accepted_hospital_id"] = conf["hospital_id"]
        else:
            emg["status"] = "rejected"
        emg["updated_at"] = now

    AUDIT_STORE.append({
        "id": f"aud-{len(AUDIT_STORE)+1}",
        "actor_id": current_user.id,
        "action": f"CONFIRMATION_{payload.status.upper()}",
        "entity_type": "HospitalConfirmation",
        "entity_id": confirmation_id,
        "payload_before": {"status": "pending"},
        "payload_after": conf,
        "created_at": now
    })

    return ApiSuccessEnvelope(
        data=ConfirmationResponse(**conf),
        message=f"Confirmation request successfully {payload.status}"
    )

@router.get("", response_model=ApiSuccessEnvelope[List[ConfirmationResponse]])
async def list_confirmations(hospital_id: Optional[str] = None):
    records = list(CONFIRMATIONS_STORE.values())
    if hospital_id:
        records = [r for r in records if r["hospital_id"] == hospital_id]
    return ApiSuccessEnvelope(data=[ConfirmationResponse(**r) for r in records], message="Confirmations retrieved")
