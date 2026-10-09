import math
import datetime
from typing import List, Dict, Any, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in km."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calculate_demo_eta_minutes(distance_km: float) -> float:
    """
    Deterministic demo urban travel time assumption (avg 32 km/h in city traffic + 3 min staging).
    Explicitly labeled as prototype demo calculation.
    """
    transit_minutes = (distance_km / 32.0) * 60.0
    return round(transit_minutes + 3.0, 1)

def rank_hospitals(emergency: Any, hospitals: List[Any], *, now: Optional[datetime.datetime] = None) -> List[Dict[str, Any]]:
    """
    CARE/ROUTE Explainable Deterministic Matching Engine
    
    Evaluates mandatory capability, resource availability, freshness, specialist availability,
    capacity, distance and ETA.
    
    Returns a sorted list of dictionaries with required fields:
    - hospital_id
    - match_score
    - eta_minutes
    - eligibility_status
    - missing_requirements
    - resource_snapshot_at
    """
    if now is None:
        now = datetime.datetime.now(datetime.timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=datetime.timezone.utc)
    
    stale_threshold_minutes = 10.0

    # Helper to get attributes whether dict or object
    def get_val(item: Any, key: str, default: Any = None) -> Any:
        if isinstance(item, dict):
            return item.get(key, default)
        return getattr(item, key, default)

    # Extract emergency criteria
    emergency_cat = str(get_val(emergency, "category", "general")).lower()
    emergency_sev = str(get_val(emergency, "severity", "moderate")).lower()
    required_caps = [str(c).lower() for c in (get_val(emergency, "required_capabilities") or [])]
    required_res = get_val(emergency, "required_resources") or []
    
    p_lat = get_val(emergency, "patient_latitude")
    p_lon = get_val(emergency, "patient_longitude")
    has_patient_coords = (p_lat is not None and p_lon is not None and isinstance(p_lat, (int, float)) and isinstance(p_lon, (int, float)))

    results: List[Dict[str, Any]] = []

    for hosp in hospitals:
        h_id = str(get_val(hosp, "id"))
        h_name = str(get_val(hosp, "name", "Hospital"))
        h_address = str(get_val(hosp, "address", ""))
        h_phone = get_val(hosp, "contact_phone")
        h_direct = get_val(hosp, "emergency_direct_line")
        h_op_status = str(get_val(hosp, "operational_status", "active")).lower()
        h_lat = get_val(hosp, "latitude")
        h_lon = get_val(hosp, "longitude")
        
        resources = get_val(hosp, "resources") or []
        capabilities = get_val(hosp, "capabilities") or []
        staff_list = get_val(hosp, "staff_availability") or []

        missing_requirements: List[str] = []
        verification_reasons: List[str] = []
        positive_factors: List[str] = []
        
        # 1. Operational status
        if h_op_status == "diverted":
            missing_requirements.append("Hospital is actively diverting emergency traffic")
        elif h_op_status == "at_capacity":
            missing_requirements.append("Hospital emergency department reported at maximum capacity")

        # 2. Capabilities check
        active_cap_codes = set()
        for cap in capabilities:
            cap_code = str(get_val(cap, "capability_code", "")).lower()
            is_active = bool(get_val(cap, "is_active", True))
            if is_active:
                active_cap_codes.add(cap_code)

        for req_c in required_caps:
            if req_c not in active_cap_codes:
                missing_requirements.append(f"Missing mandatory capability: {req_c}")
            else:
                positive_factors.append(f"Confirmed capability: {req_c}")

        # Category-based default capabilities
        category_capability_map = {
            "cardiac": "cath_lab",
            "stroke": "stroke_unit",
            "trauma": "trauma_center_l1",
            "pediatric": "pediatric_icu",
            "burn": "burn_unit",
        }
        needed_default_cap = category_capability_map.get(emergency_cat)
        if needed_default_cap and needed_default_cap not in active_cap_codes and emergency_sev in ["high", "critical"]:
            missing_requirements.append(f"Lacks specialized {needed_default_cap.replace('_', ' ')} for {emergency_cat} emergency")

        # 3. Mandatory Resources & Freshness check
        res_by_type: Dict[str, List[Any]] = {}
        most_recent_snapshot: datetime.datetime = now - datetime.timedelta(hours=24)
        has_any_fresh_timestamp = False
        stale_resource_count = 0
        unknown_resource_count = 0

        for r in resources:
            r_type = str(get_val(r, "resource_type", "")).lower()
            if r_type not in res_by_type:
                res_by_type[r_type] = []
            res_by_type[r_type].append(r)
            
            # Timestamp evaluation
            last_ts = get_val(r, "last_verified_at")
            if last_ts is not None:
                if isinstance(last_ts, str):
                    try:
                        last_ts = datetime.datetime.fromisoformat(last_ts.replace("Z", "+00:00"))
                    except Exception:
                        last_ts = None
                elif last_ts.tzinfo is None:
                    last_ts = last_ts.replace(tzinfo=datetime.timezone.utc)
            
            if last_ts is not None:
                has_any_fresh_timestamp = True
                if last_ts > most_recent_snapshot:
                    most_recent_snapshot = last_ts
                age_minutes = (now - last_ts).total_seconds() / 60.0
                if age_minutes > stale_threshold_minutes:
                    stale_resource_count += 1
            else:
                # Missing timestamp is strictly treated as stale/unknown
                stale_resource_count += 1

            status_val = str(get_val(r, "availability_status", "unknown")).lower()
            if status_val == "unknown":
                unknown_resource_count += 1

        if not has_any_fresh_timestamp:
            most_recent_snapshot = now - datetime.timedelta(hours=1)

        for req_r in required_res:
            r_type = str(get_val(req_r, "resource_type", "")).lower()
            min_qty = int(get_val(req_r, "minimum_quantity", 1))
            matched_items = res_by_type.get(r_type, [])
            
            if not matched_items:
                missing_requirements.append(f"No {r_type} inventory registered")
                continue
            
            # Check availability status and quantity
            total_avail = 0
            has_fresh_verified = False
            has_unknown_or_stale = False
            
            for item in matched_items:
                item_status = str(get_val(item, "availability_status", "unknown")).lower()
                avail_qty = int(get_val(item, "available_quantity", 0))
                
                # Verify freshness of this specific item
                item_ts = get_val(item, "last_verified_at")
                if isinstance(item_ts, str):
                    try:
                        item_ts = datetime.datetime.fromisoformat(item_ts.replace("Z", "+00:00"))
                    except Exception:
                        item_ts = None
                elif item_ts is not None and item_ts.tzinfo is None:
                    item_ts = item_ts.replace(tzinfo=datetime.timezone.utc)
                
                is_stale = True
                if item_ts:
                    age_m = (now - item_ts).total_seconds() / 60.0
                    if age_m <= stale_threshold_minutes:
                        is_stale = False
                
                if item_status == "unavailable":
                    continue
                elif item_status == "unknown" or is_stale:
                    has_unknown_or_stale = True
                    total_avail += avail_qty
                elif item_status in ["available", "limited"]:
                    if not is_stale:
                        has_fresh_verified = True
                        total_avail += avail_qty
                    else:
                        has_unknown_or_stale = True
                        total_avail += avail_qty

            if total_avail < min_qty:
                missing_requirements.append(f"Insufficient {r_type}: needed {min_qty}, reported {total_avail}")
            elif has_unknown_or_stale and not has_fresh_verified:
                verification_reasons.append(f"Critical {r_type} data is stale or unknown (> {int(stale_threshold_minutes)}m old); requires radio/phone verification")
            else:
                positive_factors.append(f"Adequate fresh {r_type} available ({total_avail} units)")

        # 4. Specialist availability check
        specialist_available = False
        category_specialist_map = {
            "cardiac": "interventional_cardiologist",
            "stroke": "neurologist",
            "trauma": "trauma_surgeon",
            "pediatric": "pediatric_intensivist",
            "burn": "burn_specialist",
        }
        needed_spec = category_specialist_map.get(emergency_cat)
        if needed_spec:
            for s in staff_list:
                spec_name = str(get_val(s, "specialty", "")).lower()
                is_avail = bool(get_val(s, "is_available_now", False))
                on_duty = int(get_val(s, "on_duty_count", 0))
                if needed_spec in spec_name and (is_avail or on_duty > 0):
                    specialist_available = True
                    positive_factors.append(f"On-duty specialist: {spec_name.replace('_', ' ')}")
                    break
            if not specialist_available and emergency_sev in ["high", "critical"]:
                verification_reasons.append(f"On-duty {needed_spec.replace('_', ' ')} not confirmed on shift")

        # 5. Distance and ETA
        distance_km: Optional[float] = None
        eta_minutes: Optional[float] = None
        
        has_hosp_coords = (h_lat is not None and h_lon is not None and isinstance(h_lat, (int, float)) and isinstance(h_lon, (int, float)))
        if has_patient_coords and has_hosp_coords:
            distance_km = haversine_distance(p_lat, p_lon, h_lat, h_lon)
            eta_minutes = calculate_demo_eta_minutes(distance_km)
            positive_factors.append(f"Estimated distance {distance_km} km (demo ETA: ~{eta_minutes} mins)")
        else:
            distance_km = None
            eta_minutes = None

        # 6. Determine Eligibility Status
        if missing_requirements:
            eligibility_status = "ineligible"
        elif verification_reasons:
            eligibility_status = "requires_verification"
        else:
            eligibility_status = "eligible"

        # 7. Deterministic Scoring Algorithm
        # Base score depends on status
        if eligibility_status == "eligible":
            base_score = 75.0
        elif eligibility_status == "requires_verification":
            base_score = 45.0
        else:
            base_score = 15.0

        # Distance penalty/bonus (up to +20 for close, penalty for very far)
        distance_component = 0.0
        if distance_km is not None:
            if distance_km <= 3.0:
                distance_component = 20.0
            elif distance_km <= 8.0:
                distance_component = 16.0
            elif distance_km <= 15.0:
                distance_component = 10.0
            elif distance_km <= 25.0:
                distance_component = 5.0
            else:
                distance_component = 1.0

        # Specialist bonus
        specialist_component = 5.0 if specialist_available else 0.0

        # Freshness penalty if stale records exist
        freshness_penalty = min(stale_resource_count * 2.0 + unknown_resource_count * 1.5, 15.0)

        raw_score = base_score + distance_component + specialist_component - freshness_penalty
        final_score = round(max(5.0, min(99.0, raw_score)), 1)

        # Freshness label
        overall_freshness = "fresh"
        if stale_resource_count > 0:
            overall_freshness = "stale"
        elif unknown_resource_count > 0:
            overall_freshness = "unknown"

        all_reasons = positive_factors + verification_reasons
        if missing_requirements:
            all_reasons = [f"INELIGIBLE: {m}" for m in missing_requirements] + all_reasons

        results.append({
            "hospital_id": h_id,
            "match_score": final_score,
            "eta_minutes": eta_minutes,
            "eligibility_status": eligibility_status,
            "missing_requirements": missing_requirements,
            "resource_snapshot_at": most_recent_snapshot,
            "distance_km": distance_km,
            "reasons": all_reasons,
            "resource_freshness": overall_freshness,
            "hospital_name": h_name,
            "hospital_address": h_address,
            "hospital_phone": h_phone,
            "emergency_direct_line": h_direct,
        })

    # Sort deterministically:
    # 1. Eligible first, then requires_verification, then ineligible
    # 2. Descending match_score
    # 3. Ascending eta_minutes (if both non-null)
    # 4. Tie-break: hospital_id for 100% determinism
    def sort_key(item: Dict[str, Any]):
        status_order = {
            "eligible": 0,
            "requires_verification": 1,
            "ineligible": 2
        }.get(item["eligibility_status"], 3)
        eta_val = item["eta_minutes"] if item["eta_minutes"] is not None else 9999.0
        return (status_order, -item["match_score"], eta_val, item["hospital_id"])

    results.sort(key=sort_key)

    # Assign rank
    for idx, res in enumerate(results, start=1):
        res["rank"] = idx

    return results
