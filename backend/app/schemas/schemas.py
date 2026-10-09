from typing import List, Optional, Dict, Any, Generic, TypeVar
import datetime
from pydantic import BaseModel, Field

T = TypeVar("T")

# Standard Envelopes
class ApiSuccessEnvelope(BaseModel, Generic[T]):
    data: T
    message: str = "Success"

class ApiErrorDetails(BaseModel):
    code: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)

class ApiErrorEnvelope(BaseModel):
    error: ApiErrorDetails

# Auth Schemas
class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "patient"  # patient, ambulance, hospital_staff, admin
    hospital_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    hospital_id: Optional[str] = None
    created_at: datetime.datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Resource Schemas
class ResourceAttributes(BaseModel):
    # Flexible container for resource-specific data
    bed_type: Optional[str] = None
    capacity: Optional[int] = None
    medicine_name: Optional[str] = None
    strength: Optional[str] = None
    formulation: Optional[str] = None
    blood_group: Optional[str] = None
    blood_component: Optional[str] = None
    ot_type: Optional[str] = None
    extra: Dict[str, Any] = Field(default_factory=dict)

class HospitalResourceBase(BaseModel):
    resource_type: str  # bed, ventilator, oxygen, blood, medicine, equipment, operating_theatre
    resource_name: str
    category: str
    available_quantity: int = Field(ge=0)
    total_quantity: int = Field(ge=0)
    unit: str = "units"
    availability_status: str = "available"  # available, limited, unavailable, unknown
    attributes: Dict[str, Any] = Field(default_factory=dict)

class HospitalResourceCreate(HospitalResourceBase):
    pass

class HospitalResourceUpdate(BaseModel):
    available_quantity: Optional[int] = Field(default=None, ge=0)
    total_quantity: Optional[int] = Field(default=None, ge=0)
    availability_status: Optional[str] = None  # available, limited, unavailable, unknown
    attributes: Optional[Dict[str, Any]] = None

class HospitalResourceResponse(HospitalResourceBase):
    id: str
    hospital_id: str
    updated_by_user_id: Optional[str] = None
    last_verified_at: datetime.datetime
    created_at: datetime.datetime
    updated_at: datetime.datetime
    is_fresh: bool = True
    freshness_age_minutes: float = 0.0

# Hospital Schemas
class HospitalCapabilityResponse(BaseModel):
    id: str
    hospital_id: str
    capability_code: str
    capability_name: str
    is_active: bool
    notes: Optional[str] = None
    last_verified_at: datetime.datetime

class HospitalStaffAvailabilityResponse(BaseModel):
    id: str
    hospital_id: str
    specialty: str
    on_duty_count: int
    on_call_count: int
    is_available_now: bool
    last_verified_at: datetime.datetime

class HospitalResponse(BaseModel):
    id: str
    name: str
    code: str
    tier: str
    address: str
    city: str
    contact_phone: str
    emergency_direct_line: Optional[str] = None
    latitude: float
    longitude: float
    operational_status: str
    total_capacity: int
    current_occupancy: int
    is_synthetic: bool = True
    created_at: datetime.datetime
    updated_at: datetime.datetime
    resources: List[HospitalResourceResponse] = Field(default_factory=list)
    capabilities: List[HospitalCapabilityResponse] = Field(default_factory=list)
    staff_availability: List[HospitalStaffAvailabilityResponse] = Field(default_factory=list)

# Emergency Request Schemas
class RequiredResourceSpec(BaseModel):
    resource_type: str
    minimum_quantity: int = 1
    attributes: Dict[str, Any] = Field(default_factory=dict)

class EmergencyCreateRequest(BaseModel):
    category: str  # trauma, cardiac, stroke, respiratory, pediatric, burn, general
    severity: str  # low, moderate, high, critical
    patient_age: Optional[int] = None
    symptoms: str
    vitals: Dict[str, Any] = Field(default_factory=dict)
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None
    location_address: Optional[str] = None
    required_capabilities: List[str] = Field(default_factory=list)
    required_resources: List[RequiredResourceSpec] = Field(default_factory=list)

class EmergencyStatusUpdate(BaseModel):
    status: str  # submitted, matching, awaiting_confirmation, accepted, rejected, ambulance_assigned, en_route, arrived, admitted, cancelled, unavailable
    reason: Optional[str] = None

class EmergencyResponse(BaseModel):
    id: str
    category: str
    severity: str
    symptoms: str
    vitals: Dict[str, Any]
    required_capabilities: List[str]
    required_resources: List[Dict[str, Any]]
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None
    location_address: Optional[str] = None
    status: str
    accepted_hospital_id: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

# Matching Result Schema - Mandatory fields exactly as specified
class HospitalMatchResult(BaseModel):
    hospital_id: str
    match_score: float
    eta_minutes: Optional[float] = None
    eligibility_status: str  # eligible, ineligible, requires_verification
    missing_requirements: List[str]
    resource_snapshot_at: datetime.datetime
    # Optional fields
    rank: Optional[int] = None
    distance_km: Optional[float] = None
    reasons: List[str] = Field(default_factory=list)
    resource_freshness: str = "fresh"  # fresh, stale, unknown
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_phone: Optional[str] = None
    emergency_direct_line: Optional[str] = None

# Confirmation Schemas
class ConfirmationCreateRequest(BaseModel):
    emergency_id: str
    hospital_id: str
    reserved_resources: List[str] = Field(default_factory=list)

class ConfirmationDecisionRequest(BaseModel):
    status: str  # accepted, rejected
    rejection_reason: Optional[str] = None

class ConfirmationResponse(BaseModel):
    id: str
    emergency_id: str
    hospital_id: str
    status: str
    rejection_reason: Optional[str] = None
    decided_by_user_id: Optional[str] = None
    decided_at: Optional[datetime.datetime] = None
    reserved_resources: List[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

# Ambulance Schemas
class AmbulanceAssignmentCreateRequest(BaseModel):
    emergency_id: str
    ambulance_id: str
    driver_name: str = "Staff Paramedic"

class AmbulanceAssignmentStatusUpdate(BaseModel):
    assignment_status: str  # assigned, dispatched, en_route, arrived_scene, transporting, completed, cancelled
    estimated_arrival_minutes: Optional[float] = None
    note: Optional[str] = None

class AmbulanceAssignmentResponse(BaseModel):
    id: str
    emergency_id: str
    ambulance_id: str
    assigned_by_user_id: Optional[str] = None
    driver_name: str
    assignment_status: str
    estimated_arrival_minutes: Optional[float] = None
    timeline: List[Dict[str, Any]]
    created_at: datetime.datetime
    updated_at: datetime.datetime

class AmbulanceResponse(BaseModel):
    id: str
    call_sign: str
    vehicle_type: str
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    is_available: bool
    assigned_hospital_id: Optional[str] = None
    contact_phone: str
    created_at: datetime.datetime

# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    payload_before: Optional[Dict[str, Any]] = None
    payload_after: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
