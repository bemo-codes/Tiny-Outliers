import datetime
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.schemas import (
    ApiSuccessEnvelope,
    AmbulanceAssignmentCreateRequest,
    AmbulanceAssignmentStatusUpdate,
    AmbulanceAssignmentResponse,
    AmbulanceResponse
)
from app.core.security import get_current_user, require_roles, CurrentUser
from app.services.synthetic_seed import get_synthetic_dataset
from app.api.v1.endpoints.emergencies import EMERGENCIES_STORE

router = APIRouter()

_dataset = get_synthetic_dataset()
AMBULANCES_STORE = {a["id"]: dict(a) for a in _dataset["ambulances"]}
ASSIGNMENTS_STORE: Dict[str, Dict[str, Any]] = {}

@router.get("", response_model=ApiSuccessEnvelope[List[AmbulanceResponse]])
async def list_ambulances():
    res = [
        AmbulanceResponse(
            id=a["id"],
            call_sign=a["call_sign"],
            vehicle_type=a["vehicle_type"],
            current_latitude=a.get("latitude"),
            current_longitude=a.get("longitude"),
            is_available=a["is_available"],
            assigned_hospital_id=a.get("assigned_hospital_id"),
            contact_phone=a["contact_phone"],
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        for a in AMBULANCES_STORE.values()
    ]
    return ApiSuccessEnvelope(data=res, message="Ambulance fleet registry retrieved")

@router.post("/assignments", response_model=ApiSuccessEnvelope[AmbulanceAssignmentResponse])
async def create_assignment(
    payload: AmbulanceAssignmentCreateRequest,
    current_user: CurrentUser = Depends(require_roles("ambulance", "hospital_staff", "admin"))
):
    emg = EMERGENCIES_STORE.get(payload.emergency_id)
    if not emg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency {payload.emergency_id} not found"
        )
    
    amb = AMBULANCES_STORE.get(payload.ambulance_id)
    if not amb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance {payload.ambulance_id} not found"
        )
        
    a_id = f"asg-{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now(datetime.timezone.utc)
    
    assignment_record = {
        "id": a_id,
        "emergency_id": payload.emergency_id,
        "ambulance_id": payload.ambulance_id,
        "assigned_by_user_id": current_user.id,
        "driver_name": payload.driver_name,
        "assignment_status": "assigned",
        "estimated_arrival_minutes": 12.0,
        "timeline": [
            {"status": "assigned", "timestamp": now.isoformat(), "note": "Ambulance unit dispatched by coordination lead"}
        ],
        "created_at": now,
        "updated_at": now
    }
    ASSIGNMENTS_STORE[a_id] = assignment_record
    
    amb["is_available"] = False
    emg["status"] = "ambulance_assigned"
    emg["updated_at"] = now

    return ApiSuccessEnvelope(
        data=AmbulanceAssignmentResponse(**assignment_record),
        message="Ambulance assigned and unit dispatched"
    )

@router.patch("/assignments/{assignment_id}", response_model=ApiSuccessEnvelope[AmbulanceAssignmentResponse])
async def update_assignment_status(
    assignment_id: str,
    payload: AmbulanceAssignmentStatusUpdate,
    current_user: CurrentUser = Depends(require_roles("ambulance", "admin"))
):
    asg = ASSIGNMENTS_STORE.get(assignment_id)
    if not asg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance assignment {assignment_id} not found"
        )
        
    allowed_statuses = {"assigned", "dispatched", "en_route", "arrived_scene", "transporting", "completed", "cancelled"}
    if payload.assignment_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid assignment status '{payload.assignment_status}'"
        )
        
    now = datetime.datetime.now(datetime.timezone.utc)
    asg["assignment_status"] = payload.assignment_status
    if payload.estimated_arrival_minutes is not None:
        asg["estimated_arrival_minutes"] = payload.estimated_arrival_minutes
    asg["updated_at"] = now
    
    asg["timeline"].append({
        "status": payload.assignment_status,
        "timestamp": now.isoformat(),
        "note": payload.note or f"Status shifted to {payload.assignment_status}",
        "actor": current_user.id
    })
    
    # Sync linked emergency status
    emg = EMERGENCIES_STORE.get(asg["emergency_id"])
    if emg:
        status_map = {
            "en_route": "en_route",
            "arrived_scene": "arrived",
            "completed": "admitted"
        }
        if payload.assignment_status in status_map:
            emg["status"] = status_map[payload.assignment_status]
            emg["updated_at"] = now

    if payload.assignment_status in ["completed", "cancelled"]:
        amb = AMBULANCES_STORE.get(asg["ambulance_id"])
        if amb:
            amb["is_available"] = True

    return ApiSuccessEnvelope(
        data=AmbulanceAssignmentResponse(**asg),
        message=f"Ambulance status updated to {payload.assignment_status}"
    )

@router.get("/assignments", response_model=ApiSuccessEnvelope[List[AmbulanceAssignmentResponse]])
async def list_assignments():
    return ApiSuccessEnvelope(
        data=[AmbulanceAssignmentResponse(**a) for a in ASSIGNMENTS_STORE.values()],
        message="Active assignments list retrieved"
    )
