# CARE/ROUTE — FOUR-MEMBER TEAM INTEGRATION CONTRACT

## 1. Member Ownership Matrix

| Member | Primary Focus | Key Deliverables | Shared Dependency |
|---|---|---|---|
| **Member 1 (Frontend)** | UI / UX, Routing, Patient Flow | Landing page, Emergency wizard, Match cards, Leaflet map component | Consumes Member 2 Typed Client, respects Member 4 fields |
| **Member 2 (Backend API)** | FastAPI Controllers, Validation | `/api/v1` routes, Pydantic envelopes, Error mapping, Auth middleware | Connects Member 3 ORM and calls Member 4 matching engine |
| **Member 3 (Database & Staff)** | SQLAlchemy 2.x, Alembic, Hospital UI | 12 ORM Models, Migrations, Seed generator, Resource staff dashboard | Persists records queried by Member 2 and scored by Member 4 |
| **Member 4 (Matching & Security)** | Core Algorithm, RBAC Security | `rank_hospitals()`, Deterministic scoring, JWT logic, Security tests | Pure function called by Member 2 without circular imports |

---

## 2. Canonical Matching Function Contract

```python
def rank_hospitals(emergency: Any, hospitals: List[Any], *, now: Optional[datetime.datetime] = None) -> List[Dict[str, Any]]:
```

### Mandatory Non-Negotiable Return Keys:
1. `hospital_id` (str)
2. `match_score` (float: 0.0 - 99.0)
3. `eta_minutes` (float | None)
4. `eligibility_status` ("eligible" | "ineligible" | "requires_verification")
5. `missing_requirements` (List[str])
6. `resource_snapshot_at` (datetime)

---

## 3. Security & Authorization Contract

- `get_current_user(credentials)` -> `CurrentUser`
- `require_roles(*allowed_roles)` -> Dependency enforcing role check
- Available roles: `patient`, `hospital_staff`, `ambulance`, `admin`.
- Hospital staff can ONLY update resources for their assigned `hospital_id`.

---

## 4. Design Guidelines

- **Strict Monochromatic Palette:** Near-black `#111111`, Charcoal `#1A1A1A`, Dark grey `#303030`, Medium grey `#777777`, Light grey `#D9D9D9`, Off-white `#F5F5F5`, White `#FFFFFF`.
- Zero accent colors (no blue, green, orange, red).
- High-contrast badges using solid fill and fine borders.
