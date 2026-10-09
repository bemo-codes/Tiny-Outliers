# CARE/ROUTE — API CONTRACT SPECIFICATION
**Version:** 1.0.0  
**Prefix:** `/api/v1`  
**Protocol:** REST over HTTPS  
**Authentication:** HTTP Bearer JWT

---

## 1. Response Envelopes

### Success Envelope
```json
{
  "data": <Payload Object or Array>,
  "message": "Human readable status message"
}
```

### Error Envelope
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Descriptive error message",
    "details": {
      "field": "Specific validation or runtime diagnostic context"
    }
  }
}
```

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/login`
- **Request:** `{"email": "string", "password": "string"}`
- **Response `200`:** `ApiSuccessEnvelope<TokenResponse>`
- **Errors `401`:** Invalid credentials

### `POST /api/v1/auth/register`
- **Request:** `{"email": "string", "password": "string", "full_name": "string", "role": "patient|hospital_staff|ambulance|admin", "hospital_id": null}`
- **Response `200`:** `ApiSuccessEnvelope<TokenResponse>`

### `GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200`:** `ApiSuccessEnvelope<UserResponse>`

---

## 3. Emergency & Matching Endpoints

### `POST /api/v1/emergencies`
- **Request:**
  ```json
  {
    "category": "trauma | cardiac | stroke | respiratory | pediatric | burn | general",
    "severity": "low | moderate | high | critical",
    "patient_age": 42,
    "symptoms": "Description of condition",
    "vitals": {"bp": "120/80", "pulse": 85, "spo2": 97},
    "allergies": "Penicillin",
    "medical_history": "Hypertension",
    "patient_latitude": 19.0760,
    "patient_longitude": 72.8777,
    "location_address": "Sector 4 Junction",
    "required_capabilities": ["trauma_center_l1", "cath_lab"],
    "required_resources": [{"resource_type": "bed", "minimum_quantity": 1}]
  }
  ```
- **Response `200`:** `ApiSuccessEnvelope<EmergencyResponse>`

### `GET /api/v1/emergencies/{emergency_id}`
- **Response `200`:** `ApiSuccessEnvelope<EmergencyResponse>`

### `GET /api/v1/emergencies/{emergency_id}/matches`
- **Response `200`:** `ApiSuccessEnvelope<List<HospitalMatchResult>>`
- **Exact Required Fields:**
  - `hospital_id`: string
  - `match_score`: float (0.0 to 99.0)
  - `eta_minutes`: float | null
  - `eligibility_status`: `"eligible" | "ineligible" | "requires_verification"`
  - `missing_requirements`: string[]
  - `resource_snapshot_at`: ISO8601 UTC timestamp
  - `rank`: integer
  - `distance_km`: float | null
  - `reasons`: string[]
  - `resource_freshness`: `"fresh" | "stale" | "unknown"`
  - `hospital_name`: string
  - `hospital_address`: string
  - `hospital_phone`: string
  - `emergency_direct_line`: string | null

---

## 4. Hospital & Resource Endpoints

### `GET /api/v1/hospitals`
- Returns directory of registered hospitals, capabilities, current occupancy, and direct contact numbers.

### `GET /api/v1/hospitals/{hospital_id}/resources`
- Returns inventory list with calculated `is_fresh` and `freshness_age_minutes`. Stale if age > `RESOURCE_STALE_AFTER_MINUTES` (10 min).

### `PUT /api/v1/hospitals/{hospital_id}/resources/{resource_id}`
- **Headers:** `Authorization: Bearer <token>` (hospital_staff of this hospital or admin)
- **Request:** `{"available_quantity": 4, "total_quantity": 10, "availability_status": "available"}`
- **Response `200`:** `ApiSuccessEnvelope<HospitalResourceResponse>`

---

## 5. Confirmations & Ambulance Coordination

### `POST /api/v1/confirmations`
- Dispatches emergency acceptance request to designated hospital.

### `PATCH /api/v1/confirmations/{confirmation_id}`
- Hospital staff decision: `{"status": "accepted" | "rejected", "rejection_reason": "string"}`.

### `POST /api/v1/ambulances/assignments`
- Dispatches authorized ambulance unit.

### `PATCH /api/v1/ambulances/assignments/{assignment_id}`
- Paramedic updates status: `"dispatched" | "en_route" | "arrived_scene" | "transporting" | "completed"`.

---

## 6. System Health

### `GET /api/v1/health`
- Reports telemetry, freshness metrics, scenario availability, and database connectivity.
