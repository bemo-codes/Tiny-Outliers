import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.schemas import (
    ApiSuccessEnvelope,
    HospitalResponse,
    HospitalResourceResponse,
    HospitalResourceUpdate,
    HospitalCapabilityResponse,
    HospitalStaffAvailabilityResponse,
    EmergencyResponse
)
from app.services.resource_service import is_resource_fresh
from app.services.synthetic_seed import get_synthetic_dataset
from app.core.security import get_current_user, require_roles, CurrentUser

router = APIRouter()

_dataset = get_synthetic_dataset()
HOSPITALS_STORE = {h["id"]: dict(h) for h in _dataset["hospitals"]}
RESOURCES_STORE = {r["id"]: dict(r) for r in _dataset["resources"]}
CAPABILITIES_STORE = list(_dataset["capabilities"])
STAFF_STORE = list(_dataset["staff_availability"])
AUDIT_STORE: List[Dict[str, Any]] = []

def enrich_hospital(h_dict: Dict[str, Any]) -> HospitalResponse:
    h_id = h_dict["id"]
    res_list = [r for r in RESOURCES_STORE.values() if r["hospital_id"] == h_id]
    enriched_res: List[HospitalResourceResponse] = []
    now = datetime.datetime.now(datetime.timezone.utc)
    
    for r in res_list:
        fresh, age_m = is_resource_fresh(r.get("last_verified_at"), now=now)
        enriched_res.append(HospitalResourceResponse(
            id=r["id"],
            hospital_id=r["hospital_id"],
            resource_type=r["resource_type"],
            resource_name=r["resource_name"],
            category=r["category"],
            available_quantity=r["available_quantity"],
            total_quantity=r["total_quantity"],
            unit=r["unit"],
            availability_status=r["availability_status"],
            attributes=r.get("attributes", {}),
            updated_by_user_id=r.get("updated_by_user_id"),
            last_verified_at=r["last_verified_at"],
            created_at=r.get("created_at", r["last_verified_at"]),
            updated_at=r.get("updated_at", r["last_verified_at"]),
            is_fresh=fresh,
            freshness_age_minutes=age_m
        ))
        
    caps = [
        HospitalCapabilityResponse(
            id=f"cap-{idx}",
            hospital_id=c["hospital_id"],
            capability_code=c["capability_code"],
            capability_name=c["capability_name"],
            is_active=c["is_active"],
            notes=c.get("notes"),
            last_verified_at=now
        )
        for idx, c in enumerate(CAPABILITIES_STORE) if c["hospital_id"] == h_id
    ]
    
    staff = [
        HospitalStaffAvailabilityResponse(
            id=f"stf-{idx}",
            hospital_id=s["hospital_id"],
            specialty=s["specialty"],
            on_duty_count=s["on_duty_count"],
            on_call_count=s.get("on_call_count", 0),
            is_available_now=s["is_available_now"],
            last_verified_at=now
        )
        for idx, s in enumerate(STAFF_STORE) if s["hospital_id"] == h_id
    ]

    return HospitalResponse(
        id=h_dict["id"],
        name=h_dict["name"],
        code=h_dict["code"],
        tier=h_dict["tier"],
        address=h_dict["address"],
        city=h_dict["city"],
        contact_phone=h_dict["contact_phone"],
        emergency_direct_line=h_dict.get("emergency_direct_line"),
        latitude=h_dict["latitude"],
        longitude=h_dict["longitude"],
        operational_status=h_dict["operational_status"],
        total_capacity=h_dict["total_capacity"],
        current_occupancy=h_dict["current_occupancy"],
        is_synthetic=h_dict.get("is_synthetic", True),
        created_at=h_dict.get("created_at", now),
        updated_at=h_dict.get("updated_at", now),
        resources=enriched_res,
        capabilities=caps,
        staff_availability=staff
    )

@router.get("", response_model=ApiSuccessEnvelope[List[HospitalResponse]])
async def list_hospitals():
    enriched = [enrich_hospital(h) for h in HOSPITALS_STORE.values()]
    return ApiSuccessEnvelope(data=enriched, message="Hospital directory retrieved")

@router.get("/{hospital_id}", response_model=ApiSuccessEnvelope[HospitalResponse])
async def get_hospital(hospital_id: str):
    hosp = HOSPITALS_STORE.get(hospital_id)
    if not hosp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} was not found"
        )
    return ApiSuccessEnvelope(data=enrich_hospital(hosp), message="Hospital details retrieved")

@router.get("/{hospital_id}/resources", response_model=ApiSuccessEnvelope[List[HospitalResourceResponse]])
async def get_hospital_resources(hospital_id: str):
    hosp = HOSPITALS_STORE.get(hospital_id)
    if not hosp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} was not found"
        )
    
    enriched = enrich_hospital(hosp).resources
    return ApiSuccessEnvelope(data=enriched, message="Hospital resources retrieved")

@router.put("/{hospital_id}/resources/{resource_id}", response_model=ApiSuccessEnvelope[HospitalResourceResponse])
async def update_resource(
    hospital_id: str,
    resource_id: str,
    payload: HospitalResourceUpdate,
    current_user: CurrentUser = Depends(require_roles("hospital_staff", "admin"))
):
    # Enforce hospital ownership check
    if current_user.role != "admin" and current_user.hospital_id != hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Staff member is not authorized to modify resources for hospital {hospital_id}"
        )

    res = RESOURCES_STORE.get(resource_id)
    if not res or res["hospital_id"] != hospital_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource {resource_id} not found under hospital {hospital_id}"
        )
    
    now = datetime.datetime.now(datetime.timezone.utc)
    old_state = dict(res)
    
    if payload.available_quantity is not None:
        res["available_quantity"] = payload.available_quantity
    if payload.total_quantity is not None:
        res["total_quantity"] = payload.total_quantity
    if payload.availability_status is not None:
        res["availability_status"] = payload.availability_status
    if payload.attributes is not None:
        res["attributes"] = payload.attributes
        
    res["last_verified_at"] = now
    res["updated_at"] = now
    res["updated_by_user_id"] = current_user.id
    
    # Record audit log
    AUDIT_STORE.append({
        "id": f"aud-{len(AUDIT_STORE)+1}",
        "actor_id": current_user.id,
        "action": "UPDATE_RESOURCE",
        "entity_type": "HospitalResource",
        "entity_id": resource_id,
        "payload_before": old_state,
        "payload_after": res,
        "created_at": now
    })
    
    fresh, age_m = is_resource_fresh(res["last_verified_at"], now=now)
    resp_obj = HospitalResourceResponse(
        id=res["id"],
        hospital_id=res["hospital_id"],
        resource_type=res["resource_type"],
        resource_name=res["resource_name"],
        category=res["category"],
        available_quantity=res["available_quantity"],
        total_quantity=res["total_quantity"],
        unit=res["unit"],
        availability_status=res["availability_status"],
        attributes=res.get("attributes", {}),
        updated_by_user_id=current_user.id,
        last_verified_at=res["last_verified_at"],
        created_at=res.get("created_at", now),
        updated_at=res["updated_at"],
        is_fresh=fresh,
        freshness_age_minutes=age_m
    )
    return ApiSuccessEnvelope(data=resp_obj, message="Resource updated and verified successfully")

@router.get("/{hospital_id}/emergencies", response_model=ApiSuccessEnvelope[List[EmergencyResponse]])
async def get_hospital_emergencies(hospital_id: str):
    from app.api.v1.endpoints.emergencies import EMERGENCIES_STORE
    # Return emergencies associated or confirmed with this hospital
    related = [
        EmergencyResponse(**e)
        for e in EMERGENCIES_STORE.values()
        if e.get("accepted_hospital_id") == hospital_id or e.get("status") in ["awaiting_confirmation", "accepted"]
    ]
    return ApiSuccessEnvelope(data=related, message="Hospital emergency queue retrieved")
