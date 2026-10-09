# CARE/ROUTE — DATABASE SCHEMA ARCHITECTURE
**Engine:** PostgreSQL 15+ / SQLAlchemy 2.0  
**Migration Tool:** Alembic  
**Primary Keys:** UUID (String length 36)  
**Timestamps:** Timezone-aware UTC `DateTime(timezone=True)`

---

## Entity-Relationship Overview (12 Models)

```
[User] (role: patient, hospital_staff, ambulance, admin)
  │
  ├─ 1:N ──> [AuditLog]
  ├─ N:1 ──> [Hospital] (for hospital_staff)
  └─ 1:N ──> [AmbulanceAssignment] (assigned_by)

[Hospital]
  ├─ 1:N ──> [HospitalResource] (bed, ventilator, oxygen, blood, medicine, etc.)
  ├─ 1:N ──> [HospitalCapability] (trauma_center_l1, cath_lab, stroke_unit, etc.)
  ├─ 1:N ──> [HospitalStaffAvailability] (specialty, on_duty_count, is_available_now)
  ├─ 1:N ──> [HospitalConfirmation]
  └─ 1:N ──> [Ambulance]

[Patient]
  └─ 1:N ──> [EmergencyRequest]
                ├─ 1:N ──> [HospitalMatch]
                ├─ 1:N ──> [HospitalConfirmation]
                └─ 1:N ──> [AmbulanceAssignment]

[Ambulance]
  └─ 1:N ──> [AmbulanceAssignment]
```

---

## Model Specifications

1. **`users`**
   - `id`: UUID (PK)
   - `email`: VARCHAR(255) UNIQUE NOT NULL INDEX
   - `hashed_password`: VARCHAR(255) NOT NULL
   - `full_name`: VARCHAR(255) NOT NULL
   - `role`: VARCHAR(50) (patient, ambulance, hospital_staff, admin)
   - `hospital_id`: UUID FK -> hospitals.id (SET NULL)
   - `is_active`: BOOLEAN DEFAULT true

2. **`hospitals`**
   - `id`: UUID (PK)
   - `name`: VARCHAR(255) NOT NULL INDEX
   - `code`: VARCHAR(50) UNIQUE NOT NULL INDEX
   - `tier`: VARCHAR(50) NOT NULL (Primary, Secondary, Tertiary, Trauma Level 1)
   - `address`: VARCHAR(500) NOT NULL
   - `city`: VARCHAR(100) NOT NULL INDEX
   - `contact_phone`: VARCHAR(50) NOT NULL
   - `emergency_direct_line`: VARCHAR(50)
   - `latitude`, `longitude`: FLOAT NOT NULL (with range check constraints)
   - `operational_status`: VARCHAR(50) (active, diverted, at_capacity)
   - `total_capacity`, `current_occupancy`: INTEGER

3. **`hospital_resources`**
   - `id`: UUID (PK)
   - `hospital_id`: UUID FK -> hospitals.id (CASCADE) INDEX
   - `resource_type`: VARCHAR(50) (bed, ventilator, oxygen, blood, medicine, equipment, operating_theatre)
   - `resource_name`: VARCHAR(255) NOT NULL
   - `category`: VARCHAR(100) NOT NULL
   - `available_quantity`: INTEGER >= 0
   - `total_quantity`: INTEGER >= 0
   - `unit`: VARCHAR(50)
   - `availability_status`: VARCHAR(50) (available, limited, unavailable, unknown)
   - `attributes`: JSON (supports medicine name/strength, blood group/component, bed type, etc.)
   - `updated_by_user_id`: UUID FK -> users.id (SET NULL)
   - `last_verified_at`: TIMESTAMP WITH TIME ZONE NOT NULL INDEX

4. **`hospital_capabilities`**
   - `id`: UUID (PK)
   - `hospital_id`: UUID FK -> hospitals.id (CASCADE)
   - `capability_code`: VARCHAR(100) NOT NULL INDEX
   - `capability_name`: VARCHAR(255) NOT NULL
   - `is_active`: BOOLEAN DEFAULT true
   - `last_verified_at`: TIMESTAMP WITH TIME ZONE NOT NULL

5. **`hospital_staff_availability`**
   - `id`: UUID (PK)
   - `hospital_id`: UUID FK -> hospitals.id (CASCADE)
   - `specialty`: VARCHAR(100) NOT NULL INDEX
   - `on_duty_count`: INTEGER DEFAULT 1
   - `on_call_count`: INTEGER DEFAULT 0
   - `is_available_now`: BOOLEAN DEFAULT true
   - `last_verified_at`: TIMESTAMP WITH TIME ZONE NOT NULL

6. **`patients`**
   - `id`: UUID (PK)
   - `identifier`: VARCHAR(100) UNIQUE NOT NULL
   - `full_name`, `age`, `gender`, `blood_group`, `allergies`, `medical_history`

7. **`emergency_requests`**
   - `id`: UUID (PK)
   - `patient_id`: UUID FK -> patients.id (SET NULL)
   - `created_by_user_id`: UUID FK -> users.id (SET NULL)
   - `category`: VARCHAR(50) (trauma, cardiac, stroke, respiratory, pediatric, burn, general)
   - `severity`: VARCHAR(50) (low, moderate, high, critical)
   - `symptoms`: TEXT NOT NULL
   - `vitals`: JSON
   - `required_capabilities`: JSON array
   - `required_resources`: JSON array
   - `patient_latitude`, `patient_longitude`: FLOAT
   - `location_address`: VARCHAR(500)
   - `status`: VARCHAR(50) (submitted, matching, awaiting_confirmation, accepted, rejected, ambulance_assigned, en_route, arrived, admitted, cancelled, unavailable)
   - `accepted_hospital_id`: UUID FK -> hospitals.id (SET NULL)

8. **`hospital_matches`**
   - `id`: UUID (PK)
   - `emergency_id`: UUID FK -> emergency_requests.id (CASCADE)
   - `hospital_id`: UUID FK -> hospitals.id (CASCADE)
   - `match_score`: FLOAT NOT NULL
   - `eta_minutes`, `distance_km`: FLOAT
   - `eligibility_status`: VARCHAR(50) (eligible, ineligible, requires_verification)
   - `missing_requirements`: JSON array
   - `reasons`: JSON array
   - `rank`: INTEGER
   - `resource_snapshot_at`: TIMESTAMP WITH TIME ZONE NOT NULL

9. **`hospital_confirmations`**
   - `id`: UUID (PK)
   - `emergency_id`: UUID FK -> emergency_requests.id (CASCADE)
   - `hospital_id`: UUID FK -> hospitals.id (CASCADE)
   - `status`: VARCHAR(50) (pending, accepted, rejected, expired)
   - `rejection_reason`: TEXT
   - `decided_by_user_id`: UUID FK -> users.id (SET NULL)
   - `decided_at`: TIMESTAMP WITH TIME ZONE
   - `reserved_resources`: JSON array

10. **`ambulances`**
    - `id`: UUID (PK)
    - `call_sign`: VARCHAR(50) UNIQUE NOT NULL
    - `vehicle_type`: VARCHAR(50) (BLS, ALS, Mobile ICU)
    - `current_latitude`, `current_longitude`: FLOAT
    - `is_available`: BOOLEAN DEFAULT true
    - `assigned_hospital_id`: UUID FK -> hospitals.id (SET NULL)
    - `contact_phone`: VARCHAR(50) NOT NULL

11. **`ambulance_assignments`**
    - `id`: UUID (PK)
    - `emergency_id`: UUID FK -> emergency_requests.id (CASCADE)
    - `ambulance_id`: UUID FK -> ambulances.id (CASCADE)
    - `assigned_by_user_id`: UUID FK -> users.id (SET NULL)
    - `driver_name`: VARCHAR(255) NOT NULL
    - `assignment_status`: VARCHAR(50) (assigned, dispatched, en_route, arrived_scene, transporting, completed, cancelled)
    - `estimated_arrival_minutes`: FLOAT
    - `timeline`: JSON array

12. **`audit_logs`**
    - `id`: UUID (PK)
    - `actor_id`: UUID FK -> users.id (SET NULL)
    - `action`: VARCHAR(100) NOT NULL INDEX
    - `entity_type`: VARCHAR(100) NOT NULL INDEX
    - `entity_id`: UUID NOT NULL INDEX
    - `payload_before`, `payload_after`: JSON
    - `ip_address`: VARCHAR(50)
    - `created_at`: TIMESTAMP WITH TIME ZONE NOT NULL INDEX
