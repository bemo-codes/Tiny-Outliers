import uuid
import datetime
from typing import List, Optional, Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    JSON,
    CheckConstraint,
    Index
)
from sqlalchemy.orm import relationship
from app.db.base import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)  # patient, ambulance, hospital_staff, admin
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    hospital = relationship("Hospital", back_populates="staff_members")
    audit_logs = relationship("AuditLog", back_populates="actor")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    tier = Column(String(50), default="Tertiary", nullable=False)  # Primary, Secondary, Tertiary, Trauma Level 1
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    contact_phone = Column(String(50), nullable=False)
    emergency_direct_line = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operational_status = Column(String(50), default="active", nullable=False)  # active, diverted, at_capacity
    total_capacity = Column(Integer, default=100, nullable=False)
    current_occupancy = Column(Integer, default=0, nullable=False)
    is_synthetic = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="chk_hospital_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="chk_hospital_longitude"),
    )

    resources = relationship("HospitalResource", back_populates="hospital", cascade="all, delete-orphan")
    capabilities = relationship("HospitalCapability", back_populates="hospital", cascade="all, delete-orphan")
    staff_availability = relationship("HospitalStaffAvailability", back_populates="hospital", cascade="all, delete-orphan")
    staff_members = relationship("User", back_populates="hospital")
    confirmations = relationship("HospitalConfirmation", back_populates="hospital")


class HospitalResource(Base):
    __tablename__ = "hospital_resources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    # bed, ventilator, oxygen, blood, medicine, equipment, operating_theatre
    resource_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    
    available_quantity = Column(Integer, default=0, nullable=False)
    total_quantity = Column(Integer, default=0, nullable=False)
    unit = Column(String(50), default="units", nullable=False)
    
    # available, limited, unavailable, unknown
    availability_status = Column(String(50), default="available", nullable=False, index=True)
    
    # Specific attributes (e.g. medicine: strength, formulation; blood: group, component; beds: bed_type; OT: ot_type)
    attributes = Column(JSON, default=dict, nullable=False)
    
    updated_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("available_quantity >= 0", name="chk_resource_available_qty"),
        CheckConstraint("total_quantity >= 0", name="chk_resource_total_qty"),
    )

    hospital = relationship("Hospital", back_populates="resources")


class HospitalCapability(Base):
    __tablename__ = "hospital_capabilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    capability_code = Column(String(100), nullable=False, index=True)
    # e.g., trauma_center_l1, cath_lab, stroke_unit, pediatric_icu, burn_unit, dialysis, emergency_ot
    capability_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    last_verified_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    hospital = relationship("Hospital", back_populates="capabilities")


class HospitalStaffAvailability(Base):
    __tablename__ = "hospital_staff_availability"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    specialty = Column(String(100), nullable=False, index=True)
    # e.g., trauma_surgeon, interventional_cardiologist, neurologist, pediatric_intensivist, anesthesiologist
    on_duty_count = Column(Integer, default=1, nullable=False)
    on_call_count = Column(Integer, default=0, nullable=False)
    is_available_now = Column(Boolean, default=True, nullable=False)
    shift_ends_at = Column(DateTime(timezone=True), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    hospital = relationship("Hospital", back_populates="staff_availability")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    identifier = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # trauma, cardiac, stroke, respiratory, pediatric, burn, general
    category = Column(String(50), nullable=False, index=True)
    # low, moderate, high, critical
    severity = Column(String(50), nullable=False, index=True)
    symptoms = Column(Text, nullable=False)
    vitals = Column(JSON, default=dict, nullable=False)
    
    # Mandatory capabilities & resources demanded
    required_capabilities = Column(JSON, default=list, nullable=False)
    required_resources = Column(JSON, default=list, nullable=False)
    
    patient_latitude = Column(Float, nullable=True)
    patient_longitude = Column(Float, nullable=True)
    location_address = Column(String(500), nullable=True)
    
    # submitted, matching, awaiting_confirmation, accepted, rejected, ambulance_assigned, en_route, arrived, admitted, cancelled, unavailable
    status = Column(String(50), default="submitted", nullable=False, index=True)
    
    accepted_hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    matches = relationship("HospitalMatch", back_populates="emergency", cascade="all, delete-orphan")
    confirmations = relationship("HospitalConfirmation", back_populates="emergency", cascade="all, delete-orphan")
    ambulance_assignments = relationship("AmbulanceAssignment", back_populates="emergency", cascade="all, delete-orphan")


class HospitalMatch(Base):
    __tablename__ = "hospital_matches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    emergency_id = Column(String(36), ForeignKey("emergency_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    
    match_score = Column(Float, nullable=False)
    eta_minutes = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    # eligible, ineligible, requires_verification
    eligibility_status = Column(String(50), nullable=False, index=True)
    missing_requirements = Column(JSON, default=list, nullable=False)
    reasons = Column(JSON, default=list, nullable=False)
    rank = Column(Integer, nullable=True)
    resource_snapshot_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    emergency = relationship("EmergencyRequest", back_populates="matches")
    hospital = relationship("Hospital")


class HospitalConfirmation(Base):
    __tablename__ = "hospital_confirmations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    emergency_id = Column(String(36), ForeignKey("emergency_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # pending, accepted, rejected, expired
    status = Column(String(50), default="pending", nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    decided_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    reserved_resources = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    emergency = relationship("EmergencyRequest", back_populates="confirmations")
    hospital = relationship("Hospital", back_populates="confirmations")


class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    call_sign = Column(String(50), unique=True, nullable=False, index=True)
    vehicle_type = Column(String(50), default="ALS", nullable=False)  # BLS, ALS, Mobile ICU
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    assigned_hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    contact_phone = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    assignments = relationship("AmbulanceAssignment", back_populates="ambulance")


class AmbulanceAssignment(Base):
    __tablename__ = "ambulance_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    emergency_id = Column(String(36), ForeignKey("emergency_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    ambulance_id = Column(String(36), ForeignKey("ambulances.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    driver_name = Column(String(255), default="Staff Paramedic", nullable=False)
    
    # assigned, dispatched, en_route, arrived_scene, transporting, completed, cancelled
    assignment_status = Column(String(50), default="assigned", nullable=False, index=True)
    estimated_arrival_minutes = Column(Float, nullable=True)
    timeline = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    emergency = relationship("EmergencyRequest", back_populates="ambulance_assignments")
    ambulance = relationship("Ambulance", back_populates="assignments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    payload_before = Column(JSON, nullable=True)
    payload_after = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    actor = relationship("User", back_populates="audit_logs")
