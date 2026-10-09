import random
import datetime
from typing import List, Dict, Any

# Fixed random seed for deterministic reproduction
SEED = 42

def get_synthetic_dataset() -> Dict[str, Any]:
    rnd = random.Random(SEED)
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Base coordinates: Metro Emergency Sector (e.g. coordinates around Mumbai/Bengaluru healthcare corridor)
    base_lat = 19.0760
    base_lon = 72.8777
    
    hospitals = [
        {
            "id": "hosp-001",
            "name": "St. Jude Level-1 Trauma & Surgical Center",
            "code": "SJL1T",
            "tier": "Trauma Level 1",
            "address": "104 Healthcare Boulevard, Central District",
            "city": "Metro Central",
            "contact_phone": "+91 22 5550 0101",
            "emergency_direct_line": "+91 22 5550 0199",
            "latitude": base_lat + 0.012,
            "longitude": base_lon + 0.015,
            "operational_status": "active",
            "total_capacity": 350,
            "current_occupancy": 280,
            "is_synthetic": True,
        },
        {
            "id": "hosp-002",
            "name": "Apex Interventional Heart & Vascular Institute",
            "code": "AIHVI",
            "tier": "Tertiary",
            "address": "42 Coronary Avenue, Sector 4",
            "city": "Metro Central",
            "contact_phone": "+91 22 5550 0202",
            "emergency_direct_line": "+91 22 5550 0299",
            "latitude": base_lat + 0.035,
            "longitude": base_lon - 0.020,
            "operational_status": "active",
            "total_capacity": 220,
            "current_occupancy": 165,
            "is_synthetic": True,
        },
        {
            "id": "hosp-003",
            "name": "Memorial Neuro & Comprehensive Stroke Center",
            "code": "MNCSC",
            "tier": "Tertiary",
            "address": "88 Synapse Road, North Hub",
            "city": "Metro North",
            "contact_phone": "+91 22 5550 0303",
            "emergency_direct_line": "+91 22 5550 0399",
            "latitude": base_lat + 0.045,
            "longitude": base_lon + 0.030,
            "operational_status": "active",
            "total_capacity": 180,
            "current_occupancy": 140,
            "is_synthetic": True,
        },
        {
            "id": "hosp-004",
            "name": "City General Community Hospital",
            "code": "CGCH",
            "tier": "Secondary",
            "address": "15 Civic Ring Road, West Ward",
            "city": "Metro West",
            "contact_phone": "+91 22 5550 0404",
            "emergency_direct_line": None,
            "latitude": base_lat - 0.018,
            "longitude": base_lon - 0.025,
            "operational_status": "active",
            "total_capacity": 120,
            "current_occupancy": 110,
            "is_synthetic": True,
        },
        {
            "id": "hosp-005",
            "name": "Metropolitan Children & Neonatal Emergency Center",
            "code": "MCNEC",
            "tier": "Tertiary",
            "address": "50 Pediatric Way, South Greens",
            "city": "Metro South",
            "contact_phone": "+91 22 5550 0505",
            "emergency_direct_line": "+91 22 5550 0599",
            "latitude": base_lat - 0.032,
            "longitude": base_lon + 0.010,
            "operational_status": "active",
            "total_capacity": 160,
            "current_occupancy": 125,
            "is_synthetic": True,
        },
        {
            "id": "hosp-006",
            "name": "National Burn & Reconstructive Trauma Institute",
            "code": "NBRTI",
            "tier": "Tertiary",
            "address": "12 Thermal Park, East Sector",
            "city": "Metro East",
            "contact_phone": "+91 22 5550 0606",
            "emergency_direct_line": "+91 22 5550 0699",
            "latitude": base_lat + 0.025,
            "longitude": base_lon + 0.055,
            "operational_status": "active",
            "total_capacity": 90,
            "current_occupancy": 70,
            "is_synthetic": True,
        },
        {
            "id": "hosp-007",
            "name": "Beacon Hill Emergency Medical Center",
            "code": "BHEMC",
            "tier": "Secondary",
            "address": "77 Ridge View, West Sector",
            "city": "Metro West",
            "contact_phone": "+91 22 5550 0707",
            "emergency_direct_line": "+91 22 5550 0799",
            "latitude": base_lat - 0.040,
            "longitude": base_lon - 0.045,
            "operational_status": "diverted",
            "total_capacity": 140,
            "current_occupancy": 138,
            "is_synthetic": True,
        },
        {
            "id": "hosp-008",
            "name": "Highland Pulmonary & Critical Care Hospital",
            "code": "HPCH",
            "tier": "Tertiary",
            "address": "30 Oxygen Spur, North Valley",
            "city": "Metro North",
            "contact_phone": "+91 22 5550 0808",
            "emergency_direct_line": "+91 22 5550 0899",
            "latitude": base_lat + 0.060,
            "longitude": base_lon - 0.010,
            "operational_status": "active",
            "total_capacity": 200,
            "current_occupancy": 150,
            "is_synthetic": True,
        },
        {
            "id": "hosp-009",
            "name": "Sunrise Suburban Acute Care Hospital",
            "code": "SSACH",
            "tier": "Secondary",
            "address": "9 Eastern Bypass, Outlying Hub",
            "city": "Suburban East",
            "contact_phone": "+91 22 5550 0909",
            "emergency_direct_line": None,
            "latitude": base_lat - 0.010,
            "longitude": base_lon + 0.070,
            "operational_status": "active",
            "total_capacity": 110,
            "current_occupancy": 85,
            "is_synthetic": True,
        },
        {
            "id": "hosp-010",
            "name": "Trinity Academic Health Sciences Center",
            "code": "TAHSC",
            "tier": "Trauma Level 1",
            "address": "200 University Medical Road",
            "city": "Metro Central",
            "contact_phone": "+91 22 5550 1010",
            "emergency_direct_line": "+91 22 5550 1099",
            "latitude": base_lat + 0.005,
            "longitude": base_lon - 0.015,
            "operational_status": "active",
            "total_capacity": 500,
            "current_occupancy": 410,
            "is_synthetic": True,
        },
        {
            "id": "hosp-011",
            "name": "Evergreen Community Urgent Care",
            "code": "ECUC",
            "tier": "Primary",
            "address": "4 Pine Plaza, Old City",
            "city": "Old Metro",
            "contact_phone": "+91 22 5550 1111",
            "emergency_direct_line": None,
            "latitude": base_lat + 0.020,
            "longitude": base_lon - 0.035,
            "operational_status": "active",
            "total_capacity": 45,
            "current_occupancy": 40,
            "is_synthetic": True,
        },
        {
            "id": "hosp-012",
            "name": "Northshore Emergency & Orthopedic Hospital",
            "code": "NEOH",
            "tier": "Secondary",
            "address": "62 Coastline Highway, North Bay",
            "city": "Metro North",
            "contact_phone": "+91 22 5550 1212",
            "emergency_direct_line": "+91 22 5550 1299",
            "latitude": base_lat + 0.075,
            "longitude": base_lon + 0.025,
            "operational_status": "active",
            "total_capacity": 130,
            "current_occupancy": 92,
            "is_synthetic": True,
        },
    ]

    # Capabilities for hospitals
    capabilities = [
        {"hospital_id": "hosp-001", "capability_code": "trauma_center_l1", "capability_name": "Level 1 Trauma Center", "is_active": True},
        {"hospital_id": "hosp-001", "capability_code": "cath_lab", "capability_name": "Cardiac Catheterization Lab", "is_active": True},
        {"hospital_id": "hosp-001", "capability_code": "emergency_ot", "capability_name": "Dedicated Emergency Operating Theatre", "is_active": True},
        {"hospital_id": "hosp-001", "capability_code": "stroke_unit", "capability_name": "Comprehensive Stroke Unit", "is_active": True},
        
        {"hospital_id": "hosp-002", "capability_code": "cath_lab", "capability_name": "24/7 Primary PCI Cath Lab", "is_active": True},
        {"hospital_id": "hosp-002", "capability_code": "cardiac_icu", "capability_name": "Coronary Intensive Care Unit", "is_active": True},
        
        {"hospital_id": "hosp-003", "capability_code": "stroke_unit", "capability_name": "Neuro-Interventional Stroke Unit", "is_active": True},
        {"hospital_id": "hosp-003", "capability_code": "neuro_icu", "capability_name": "Neurological ICU", "is_active": True},
        
        {"hospital_id": "hosp-004", "capability_code": "general_ed", "capability_name": "Basic Emergency Department", "is_active": True},
        
        {"hospital_id": "hosp-005", "capability_code": "pediatric_icu", "capability_name": "Pediatric Intensive Care Unit", "is_active": True},
        {"hospital_id": "hosp-005", "capability_code": "neonatal_icu", "capability_name": "Neonatal Intensive Care Unit", "is_active": True},
        
        {"hospital_id": "hosp-006", "capability_code": "burn_unit", "capability_name": "Specialized Burn Resuscitation Unit", "is_active": True},
        
        {"hospital_id": "hosp-008", "capability_code": "respiratory_icu", "capability_name": "High-Dependency Respiratory Unit", "is_active": True},
        
        {"hospital_id": "hosp-010", "capability_code": "trauma_center_l1", "capability_name": "Level 1 Trauma Center", "is_active": True},
        {"hospital_id": "hosp-010", "capability_code": "cath_lab", "capability_name": "Cardiac Cath Lab", "is_active": True},
        {"hospital_id": "hosp-010", "capability_code": "stroke_unit", "capability_name": "Stroke Center", "is_active": True},
        {"hospital_id": "hosp-010", "capability_code": "pediatric_icu", "capability_name": "Pediatric ICU", "is_active": True},
        {"hospital_id": "hosp-010", "capability_code": "emergency_ot", "capability_name": "Trauma Surgical Suites", "is_active": True},
    ]

    # Staff availability
    staff_availability = [
        {"hospital_id": "hosp-001", "specialty": "trauma_surgeon", "on_duty_count": 3, "is_available_now": True},
        {"hospital_id": "hosp-001", "specialty": "anesthesiologist", "on_duty_count": 4, "is_available_now": True},
        {"hospital_id": "hosp-001", "specialty": "interventional_cardiologist", "on_duty_count": 2, "is_available_now": True},
        
        {"hospital_id": "hosp-002", "specialty": "interventional_cardiologist", "on_duty_count": 3, "is_available_now": True},
        {"hospital_id": "hosp-002", "specialty": "cardiac_surgeon", "on_duty_count": 2, "is_available_now": True},
        
        {"hospital_id": "hosp-003", "specialty": "neurologist", "on_duty_count": 2, "is_available_now": True},
        {"hospital_id": "hosp-003", "specialty": "neurosurgeon", "on_duty_count": 1, "is_available_now": True},
        
        {"hospital_id": "hosp-004", "specialty": "general_physician", "on_duty_count": 2, "is_available_now": True},
        {"hospital_id": "hosp-004", "specialty": "trauma_surgeon", "on_duty_count": 0, "is_available_now": False},
        
        {"hospital_id": "hosp-005", "specialty": "pediatric_intensivist", "on_duty_count": 2, "is_available_now": True},
        
        {"hospital_id": "hosp-006", "specialty": "burn_specialist", "on_duty_count": 2, "is_available_now": True},
        
        {"hospital_id": "hosp-010", "specialty": "trauma_surgeon", "on_duty_count": 4, "is_available_now": True},
        {"hospital_id": "hosp-010", "specialty": "interventional_cardiologist", "on_duty_count": 3, "is_available_now": True},
        {"hospital_id": "hosp-010", "specialty": "neurologist", "on_duty_count": 2, "is_available_now": True},
    ]

    # Generate Resources for each hospital (~150 records)
    resources: List[Dict[str, Any]] = []
    resource_templates = [
        {"type": "bed", "name": "ICU Bed with Invasive Monitoring", "category": "Critical Care", "total": 20, "avail": 6, "unit": "beds", "attrs": {"bed_type": "ICU", "capacity": 1}},
        {"type": "bed", "name": "Emergency Resuscitation Bay", "category": "Emergency Room", "total": 12, "avail": 3, "unit": "bays", "attrs": {"bed_type": "ED_Bay", "capacity": 1}},
        {"type": "ventilator", "name": "High-Frequency ICU Ventilator", "category": "Respiratory", "total": 15, "avail": 5, "unit": "units", "attrs": {"invasive_capable": True}},
        {"type": "oxygen", "name": "Liquid Medical Oxygen Bulk Reserve", "category": "Life Support", "total": 5000, "avail": 3800, "unit": "liters", "attrs": {"purity_percent": 99.5}},
        {"type": "blood", "name": "O-Negative Universal Donor PRBC", "category": "Blood Bank", "total": 24, "avail": 8, "unit": "units", "attrs": {"blood_group": "O-", "component": "PRBC"}},
        {"type": "blood", "name": "A-Positive PRBC", "category": "Blood Bank", "total": 30, "avail": 14, "unit": "units", "attrs": {"blood_group": "A+", "component": "PRBC"}},
        {"type": "medicine", "name": "Tenecteplase / Alteplase (tPA)", "category": "Thrombolytics", "total": 10, "avail": 4, "unit": "vials", "attrs": {"medicine_name": "Tenecteplase", "strength": "40mg"}},
        {"type": "medicine", "name": "Norepinephrine 4mg/4mL Ampoules", "category": "Vasopressors", "total": 50, "avail": 22, "unit": "ampoules", "attrs": {"medicine_name": "Norepinephrine", "strength": "4mg"}},
        {"type": "operating_theatre", "name": "Emergency Trauma Suite 1", "category": "Surgical Suites", "total": 2, "avail": 1, "unit": "theatres", "attrs": {"ot_type": "Trauma_L1"}},
        {"type": "equipment", "name": "Point-of-Care Ultrasound (POCUS/FAST)", "category": "Diagnostic", "total": 6, "avail": 4, "unit": "devices", "attrs": {"device_type": "Ultrasound"}},
    ]

    res_counter = 1
    for h in hospitals:
        h_id = h["id"]
        # Special conditions for scenarios:
        # Scenario 1: Nearby hospital (City General hosp-004) has 0 ICU beds
        # Scenario 3: Beacon Hill (hosp-007) and Sunrise (hosp-009) have stale timestamps (> 35 mins old)
        # Scenario 4: Medicine unavailable at St Jude or City General
        for t in resource_templates:
            # Deterministic variation
            avail_q = rnd.randint(1, t["total"])
            status_val = "available" if avail_q > 2 else ("limited" if avail_q > 0 else "unavailable")
            
            # Default fresh timestamp (3-8 minutes ago)
            minutes_ago = rnd.randint(2, 7)
            
            if h_id == "hosp-004" and t["type"] == "bed" and "ICU" in t["name"]:
                avail_q = 0
                status_val = "unavailable"
            
            if h_id == "hosp-007" or h_id == "hosp-009":
                # Stale scenario: 45 minutes old
                minutes_ago = rnd.randint(35, 75)
            
            if h_id == "hosp-004" and t["type"] == "medicine" and "Tenecteplase" in t["name"]:
                avail_q = 0
                status_val = "unavailable"
            
            ts = now - datetime.timedelta(minutes=minutes_ago)
            
            resources.append({
                "id": f"res-{res_counter:03d}",
                "hospital_id": h_id,
                "resource_type": t["type"],
                "resource_name": t["name"],
                "category": t["category"],
                "available_quantity": avail_q,
                "total_quantity": t["total"],
                "unit": t["unit"],
                "availability_status": status_val,
                "attributes": t["attrs"],
                "last_verified_at": ts,
            })
            res_counter += 1

    # Demo users
    users = [
        {"id": "usr-pat-01", "email": "patient@careroute.org", "role": "patient", "full_name": "Demo Citizen", "hospital_id": None},
        {"id": "usr-stf-01", "email": "staff.stjude@careroute.org", "role": "hospital_staff", "full_name": "Dr. Sarah Chen, ED Director", "hospital_id": "hosp-001"},
        {"id": "usr-stf-02", "email": "staff.apex@careroute.org", "role": "hospital_staff", "full_name": "Dr. Rajesh Rao, Cath Lab Lead", "hospital_id": "hosp-002"},
        {"id": "usr-amb-01", "email": "paramedic.alpha@careroute.org", "role": "ambulance", "full_name": "Officer David Miller, EMT-P", "hospital_id": "hosp-001"},
        {"id": "usr-adm-01", "email": "admin@careroute.org", "role": "admin", "full_name": "System Regional Administrator", "hospital_id": None},
    ]

    # Ambulances
    ambulances = [
        {"id": "amb-001", "call_sign": "MEDIC-ONE", "vehicle_type": "ALS", "latitude": base_lat + 0.008, "longitude": base_lon + 0.009, "is_available": True, "assigned_hospital_id": "hosp-001", "contact_phone": "+91 22 5550 9101"},
        {"id": "amb-002", "call_sign": "RAPID-CARDIAC-4", "vehicle_type": "Mobile ICU", "latitude": base_lat + 0.025, "longitude": base_lon - 0.015, "is_available": True, "assigned_hospital_id": "hosp-002", "contact_phone": "+91 22 5550 9102"},
        {"id": "amb-003", "call_sign": "TRAUMA-RESPONSE-7", "vehicle_type": "ALS", "latitude": base_lat - 0.012, "longitude": base_lon - 0.018, "is_available": False, "assigned_hospital_id": "hosp-004", "contact_phone": "+91 22 5550 9103"},
        {"id": "amb-004", "call_sign": "PEDIATRIC-TRANSPORT-2", "vehicle_type": "Mobile ICU", "latitude": base_lat - 0.028, "longitude": base_lon + 0.015, "is_available": True, "assigned_hospital_id": "hosp-005", "contact_phone": "+91 22 5550 9104"},
    ]

    # 5 Reproducible Scenarios
    scenarios = [
        {
            "id": "scenario-1",
            "name": "Scenario 1: Nearby Hospital Lacks ICU Capability",
            "description": "Patient is 1.2 km from City General (CGCH), but patient requires Critical ICU and mechanical ventilator. CGCH has 0 ICU beds, making it ineligible despite proximity.",
            "emergency": {
                "id": "emg-sc-1",
                "category": "trauma",
                "severity": "critical",
                "patient_age": 42,
                "symptoms": "High-speed vehicular collision; severe polytrauma, hypotension, GCS 8.",
                "vitals": {"bp": "82/50", "pulse": 132, "spo2": 88, "gcs": 8},
                "required_capabilities": ["trauma_center_l1", "emergency_ot"],
                "required_resources": [{"resource_type": "bed", "minimum_quantity": 1}],
                "patient_latitude": base_lat - 0.015,
                "patient_longitude": base_lon - 0.022,
                "location_address": "Near City General Junction, West Sector",
            }
        },
        {
            "id": "scenario-2",
            "name": "Scenario 2: Farther Hospital Meets Mandatory Capabilities",
            "description": "Patient experiencing acute STEMI cardiac event. Requires 24/7 Primary PCI Cath Lab. Nearby secondary hospitals lack cath lab; Apex Heart (farther) fulfills all criteria.",
            "emergency": {
                "id": "emg-sc-2",
                "category": "cardiac",
                "severity": "critical",
                "patient_age": 58,
                "symptoms": "Crushing retrosternal chest pain radiating to left arm, diaphoretic, ST elevation in lead V1-V4.",
                "vitals": {"bp": "145/95", "pulse": 96, "spo2": 94},
                "required_capabilities": ["cath_lab"],
                "required_resources": [{"resource_type": "bed", "minimum_quantity": 1}],
                "patient_latitude": base_lat - 0.010,
                "patient_longitude": base_lon - 0.010,
                "location_address": "72 Market Square, Old Commercial District",
            }
        },
        {
            "id": "scenario-3",
            "name": "Scenario 3: Critical Resource Data is Stale",
            "description": "Beacon Hill is close to patient but last verified its ventilators > 45 minutes ago (threshold is 10 min). Engine marks status as 'requires_verification' with stale alert.",
            "emergency": {
                "id": "emg-sc-3",
                "category": "respiratory",
                "severity": "high",
                "patient_age": 67,
                "symptoms": "Severe acute respiratory distress, severe wheezing, accessory muscle use, cyanosis.",
                "vitals": {"bp": "130/85", "pulse": 118, "spo2": 81},
                "required_capabilities": [],
                "required_resources": [{"resource_type": "ventilator", "minimum_quantity": 1}],
                "patient_latitude": base_lat - 0.038,
                "patient_longitude": base_lon - 0.040,
                "location_address": "Ridge View Colony, West Sector",
            }
        },
        {
            "id": "scenario-4",
            "name": "Scenario 4: Mandatory Thrombolytic Medicine Unavailable",
            "description": "Suspected acute ischemic stroke within 3-hour window. Requires Tenecteplase/Alteplase (tPA). Hospitals with zero stock are flagged ineligible.",
            "emergency": {
                "id": "emg-sc-4",
                "category": "stroke",
                "severity": "critical",
                "patient_age": 64,
                "symptoms": "Sudden onset right-sided hemiplegia and expressive aphasia, symptom onset 45 minutes ago.",
                "vitals": {"bp": "165/100", "pulse": 88, "spo2": 96},
                "required_capabilities": ["stroke_unit"],
                "required_resources": [{"resource_type": "medicine", "minimum_quantity": 1}],
                "patient_latitude": base_lat + 0.030,
                "patient_longitude": base_lon + 0.020,
                "location_address": "84 Grand Avenue, Sector 5",
            }
        },
        {
            "id": "scenario-5",
            "name": "Scenario 5: Competing Emergencies for Limited Resource",
            "description": "Mass casualty collision event with 2 simultaneous requests competing for the last 2 O-Negative PRBC universal blood units and ICU resuscitation bays.",
            "emergency": {
                "id": "emg-sc-5",
                "category": "trauma",
                "severity": "critical",
                "patient_age": 31,
                "symptoms": "Severe hemorrhagic shock following industrial explosion, active arterial bleed.",
                "vitals": {"bp": "70/40", "pulse": 145, "spo2": 85},
                "required_capabilities": ["emergency_ot"],
                "required_resources": [
                    {"resource_type": "blood", "minimum_quantity": 2},
                    {"resource_type": "bed", "minimum_quantity": 1}
                ],
                "patient_latitude": base_lat + 0.010,
                "patient_longitude": base_lon + 0.010,
                "location_address": "Industrial Corridor Gate 3",
            }
        }
    ]

    return {
        "hospitals": hospitals,
        "capabilities": capabilities,
        "staff_availability": staff_availability,
        "resources": resources,
        "users": users,
        "ambulances": ambulances,
        "scenarios": scenarios,
    }
