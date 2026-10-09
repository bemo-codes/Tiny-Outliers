# CARE/ROUTE — REQUIREMENTS TRACEABILITY MATRIX

| ID | Requirement Specification | Responsible | Code Location | Verification Method | Status |
|---|---|---|---|---|---|
| REQ-01 | Emergency registration with symptoms, vitals, location, mandatory resources | Member 1 & 2 | `src/pages/EmergencyRegistrationPage.tsx`, `backend/app/api/v1/endpoints/emergencies.py` | Unit tests in `backend/tests/test_matching_engine.py` & UI verification | Implemented & Verified |
| REQ-02 | Deterministic explainable matching engine with exact 6 required keys | Member 4 | `backend/app/services/matching_engine.py`, `src/services/matchingEngine.ts` | 10 unit tests in `test_matching_engine.py` | Implemented & Verified |
| REQ-03 | Mandatory eligibility: Hospital capability & specialist verification | Member 4 | `backend/app/services/matching_engine.py:rank_hospitals` | Test `test_ineligible_when_mandatory_capability_missing` | Implemented & Verified |
| REQ-04 | Resource freshness enforcement (`RESOURCE_STALE_AFTER_MINUTES=10`) | Member 3 & 4 | `backend/app/services/resource_service.py`, `matching_engine.py` | Test `test_stale_resource_requires_verification` | Implemented & Verified |
| REQ-05 | Unknown / Missing timestamp treated as stale / requires verification | Member 4 | `backend/app/services/matching_engine.py` | Test `test_missing_timestamp_treated_as_stale_or_unknown` | Implemented & Verified |
| REQ-06 | Missing coordinates return null ETA and distance (no hallucinated values) | Member 4 | `backend/app/services/matching_engine.py` | Test `test_missing_coordinates_returns_null_eta_and_distance` | Implemented & Verified |
| REQ-07 | One-tap trusted phone dialer (`tel:{hospital_phone}`) with fallback | Member 1 | `src/pages/HospitalMatchesPage.tsx`, `backend/app/services/resource_service.py` | Test `test_phone_link_formatting` & UI review | Implemented & Verified |
| REQ-08 | Hospital resource management dashboard with freshness counters | Member 3 | `src/pages/HospitalDashboardPage.tsx`, `backend/app/api/v1/endpoints/hospitals.py` | API endpoint test & dashboard interactive test | Implemented & Verified |
| REQ-09 | Explicit hospital acceptance & rejection workflow | Member 2 & 3 | `backend/app/api/v1/endpoints/confirmations.py`, `src/pages/HospitalDashboardPage.tsx` | Endpoints and UI acceptance actions | Implemented & Verified |
| REQ-10 | Authorized ambulance assignment & transport timeline | Member 2 & 4 | `backend/app/api/v1/endpoints/ambulances.py`, `src/pages/AmbulanceDashboardPage.tsx` | Endpoints and Paramedic update actions | Implemented & Verified |
| REQ-11 | Five reproducible synthetic scenarios (ICU deficit, STEMI, Stale, Medicine, Blood) | Member 3 | `backend/app/services/synthetic_seed.py`, `src/data/syntheticData.ts` | 5 unit tests in `test_scenarios.py` | Implemented & Verified |
| REQ-12 | Admin mass-casualty and system telemetry dashboard | Member 1 & 2 | `src/pages/AdminDashboardPage.tsx`, `backend/app/api/v1/endpoints/health.py` | Health API telemetry verification | Implemented & Verified |
| REQ-13 | 12 SQLAlchemy ORM models with UUIDs and Alembic migrations | Member 3 | `backend/app/models/entities.py`, `backend/alembic/versions/001_initial_schema.py` | Code syntax verification & model relationships | Implemented & Verified |
| REQ-14 | Strict monochromatic design system (#111111 to #FFFFFF, zero color) | Member 1 | `src/index.css`, all `src/pages/*.tsx` | Visual design audit & CSS inspection | Implemented & Verified |
| REQ-15 | Typed API client supporting production REST and high-fidelity demo mode | Member 1 & 2 | `src/services/apiClient.ts` | Frontend build and runtime state persistence | Implemented & Verified |
| REQ-16 | Leaflet / OpenStreetMap interactive tactical positioning map | Member 1 | `src/components/map/EmergencyMap.tsx` | Leaflet component rendering & marker pins | Implemented & Verified |
| REQ-17 | PostgreSQL local instance running in container | DevOps | `backend/Dockerfile`, `.env.example` | Blocked by workspace lack of live PostgreSQL daemon | Documented Limitation |
