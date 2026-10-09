import datetime
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.schemas import (
    ApiSuccessEnvelope,
    EmergencyCreateRequest,
    EmergencyResponse,
    EmergencyStatusUpdate,
    HospitalMatchResult
)
from app.services.matching_engine import rank_hospitals
from app.services.synthetic_seed import get_synthetic_dataset
from app.core.security import get_current_user, require_roles, CurrentUser

router = APIRouter()

# Data store initialized with synthetic seed
_dataset = get_synthetic_dataset()
EMERGENCIES_STORE: Dict[str, Dict[str, Any]] = {}
MATCHES_STORE: Dict[str, List[Dict[str, Any]]] = {}

# Prepopulate with the 5 scenario emergencies
for sc in _dataset["scenarios"]:
    emg = sc["emergency"]
    e_id = emg["id"]
    now_ts = datetime.datetime.now(datetime.timezone.utc)
    EMERGENCIES_STORE[e_id] = {
        "id": e_id,
        "category": emg["category"],
        "severity": emg["severity"],
        "symptoms": emg["symptoms"],
        "vitals": emg["vitals"],
        "required_capabilities": emg.get("required_capabilities", []),
        "required_resources": emg.get("required_resources", []),
        "patient_latitude": emg.get("patient_latitude"),
        "patient_longitude": emg.get("patient_longitude"),
        "location_address": emg.get("location_address"),
        "status": "matching",
        "accepted_hospital_id": None,
        "created_at": now_ts,
        "updated_at": now_ts
    }
    # Rank immediately
    hosp_list = _dataset["hospitals"]
    # attach resources, caps, staff to hosp items
    full_hosps = []
    for h in hosp_list:
        h_copy = dict(h)
        h_copy["resources"] = [r for r in _dataset["resources"] if r["hospital_id"] == h["id"]]
        h_copy["capabilities"] = [c for c in _dataset["capabilities"] if c["hospital_id"] == h["id"]]
        h_copy["staff_availability"] = [s for s in _dataset["staff_availability"] if s["hospital_id"] == h["id"]]
        full_hosps.append(h_copy)
    
    ranked = rank_hospitals(emg, full_hosps)
    MATCHES_STORE[e_id] = ranked

@router.post("", response_model=ApiSuccessEnvelope[EmergencyResponse])
async def create_emergency(payload: EmergencyCreateRequest):
    new_id = f"emg-{uuid.uuid4().hex[:8]}"
    now_ts = datetime.datetime.now(datetime.timezone.utc)
    
    req_dict = {
        "id": new_id,
        "category": payload.category,
        "severity": payload.severity,
        "symptoms": payload.symptoms,
        "vitals": payload.vitals,
        "required_capabilities": payload.required_capabilities,
        "required_resources": [r.model_dump() for r in payload.required_resources],
        "patient_latitude": payload.patient_latitude,
        "patient_longitude": payload.patient_longitude,
        "location_address": payload.location_address,
        "status": "matching",
        "accepted_hospital_id": None,
        "created_at": now_ts,
        "updated_at": now_ts
    }
    EMERGENCIES_STORE[new_id] = req_dict
    
    # Calculate matches automatically
    hosp_list = _dataset["hospitals"]
    full_hosps = []
    for h in hosp_list:
        h_copy = dict(h)
        h_copy["resources"] = [r for r in _dataset["resources"] if r["hospital_id"] == h["id"]]
        h_copy["capabilities"] = [c for c in _dataset["capabilities"] if c["hospital_id"] == h["id"]]
        h_copy["staff_availability"] = [s for s in _dataset["staff_availability"] if s["hospital_id"] == h["id"]]
        full_hosps.append(h_copy)
    
    ranked = rank_hospitals(req_dict, full_hosps)
    MATCHES_STORE[new_id] = ranked
    
    return ApiSuccessEnvelope(
        data=EmergencyResponse(**req_dict),
        message="Emergency registered and candidate hospitals ranked"
    )

@router.get("/{emergency_id}", response_model=ApiSuccessEnvelope[EmergencyResponse])
async def get_emergency(emergency_id: str):
    emg = EMERGENCIES_STORE.get(emergency_id)
    if not emg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with ID {emergency_id} was not found"
        )
    return ApiSuccessEnvelope(data=EmergencyResponse(**emg), message="Emergency details retrieved")

@router.patch("/{emergency_id}/status", response_model=ApiSuccessEnvelope[EmergencyResponse])
async def update_emergency_status(emergency_id: str, payload: EmergencyStatusUpdate):
    emg = EMERGENCIES_STORE.get(emergency_id)
    if not emg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with ID {emergency_id} was not found"
        )
    
    allowed_statuses = {
        "submitted", "matching", "awaiting_confirmation", "accepted", "rejected",
        "ambulance_assigned", "en_route", "arrived", "admitted", "cancelled", "unavailable"
    }
    if payload.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Must be one of: {sorted(list(allowed_statuses))}"
        )
        
    emg["status"] = payload.status
    emg["updated_at"] = datetime.datetime.now(datetime.timezone.utc)
    return ApiSuccessEnvelope(data=EmergencyResponse(**emg), message=f"Emergency status updated to {payload.status}")

@router.get("/{emergency_id}/matches", response_model=ApiSuccessEnvelope[List[HospitalMatchResult]])
async def get_matches(emergency_id: str):
    emg = EMERGENCIES_STORE.get(emergency_id)
    if not emg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with ID {emergency_id} was not found"
        )
    
    matches = MATCHES_STORE.get(emergency_id)
    if matches is None:
        # Re-compute
        hosp_list = _dataset["hospitals"]
        full_hosps = []
        for h in hosp_list:
            h_copy = dict(h)
            h_copy["resources"] = [r for r in _dataset["resources"] if r["hospital_id"] == h["id"]]
            h_copy["capabilities"] = [c for c in _dataset["capabilities"] if c["hospital_id"] == h["id"]]
            h_copy["staff_availability"] = [s for s in _dataset["staff_availability"] if s["hospital_id"] == h["id"]]
            full_hosps.append(h_copy)
        matches = rank_hospitals(emg, full_hosps)
        MATCHES_STORE[emergency_id] = matches
        
    match_models = [HospitalMatchResult(**m) for m in matches]
    return ApiSuccessEnvelope(data=match_models, message="Ranked hospital matches retrieved")

@router.post("/{emergency_id}/matches", response_model=ApiSuccessEnvelope[List[HospitalMatchResult]])
async def trigger_matching(emergency_id: str):
    emg = EMERGENCIES_STORE.get(emergency_id)
    if not emg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request with ID {emergency_id} was not found"
        )
    
    hosp_list = _dataset["hospitals"]
    full_hosps = []
    for h in hosp_list:
        h_copy = dict(h)
        h_copy["resources"] = [r for r in _dataset["resources"] if r["hospital_id"] == h["id"]]
        h_copy["capabilities"] = [c for c in _dataset["capabilities"] if c["hospital_id"] == h["id"]]
        h_copy["staff_availability"] = [s for s in _dataset["staff_availability"] if s["hospital_id"] == h["id"]]
        full_hosps.append(h_copy)
        
    matches = rank_hospitals(emg, full_hosps)
    MATCHES_STORE[emergency_id] = matches
    match_models = [HospitalMatchResult(**m) for m in matches]
    return ApiSuccessEnvelope(data=match_models, message="Matching engine re-evaluated candidate hospitals")
