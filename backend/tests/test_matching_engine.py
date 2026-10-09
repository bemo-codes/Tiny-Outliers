import unittest
import datetime
from app.services.matching_engine import rank_hospitals, haversine_distance, calculate_demo_eta_minutes

class TestMatchingEngine(unittest.TestCase):
    def setUp(self):
        self.now = datetime.datetime(2026, 10, 9, 12, 0, 0, tzinfo=datetime.timezone.utc)
        self.fresh_ts = self.now - datetime.timedelta(minutes=4)
        self.stale_ts = self.now - datetime.timedelta(minutes=25)

        self.candidate_hospital = {
            "id": "h-test-1",
            "name": "General Test Hospital",
            "address": "123 Medical Way",
            "contact_phone": "+91 22 5550 1111",
            "operational_status": "active",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "capabilities": [
                {"capability_code": "trauma_center_l1", "is_active": True},
                {"capability_code": "emergency_ot", "is_active": True}
            ],
            "resources": [
                {
                    "resource_type": "bed",
                    "available_quantity": 4,
                    "availability_status": "available",
                    "last_verified_at": self.fresh_ts
                },
                {
                    "resource_type": "ventilator",
                    "available_quantity": 2,
                    "availability_status": "available",
                    "last_verified_at": self.fresh_ts
                }
            ],
            "staff_availability": [
                {"specialty": "trauma_surgeon", "on_duty_count": 2, "is_available_now": True}
            ]
        }

    def test_eligible_when_all_requirements_met(self):
        emergency = {
            "category": "trauma",
            "severity": "critical",
            "required_capabilities": ["trauma_center_l1"],
            "required_resources": [{"resource_type": "bed", "minimum_quantity": 1}],
            "patient_latitude": 19.0800,
            "patient_longitude": 72.8800
        }
        results = rank_hospitals(emergency, [self.candidate_hospital], now=self.now)
        self.assertEqual(len(results), 1)
        res = results[0]
        self.assertEqual(res["eligibility_status"], "eligible")
        self.assertEqual(res["missing_requirements"], [])
        self.assertIsNotNone(res["eta_minutes"])
        self.assertIsNotNone(res["distance_km"])
        self.assertGreater(res["match_score"], 60.0)

    def test_ineligible_when_mandatory_capability_missing(self):
        emergency = {
            "category": "cardiac",
            "severity": "critical",
            "required_capabilities": ["cath_lab"],
            "required_resources": [],
            "patient_latitude": 19.0800,
            "patient_longitude": 72.8800
        }
        results = rank_hospitals(emergency, [self.candidate_hospital], now=self.now)
        res = results[0]
        self.assertEqual(res["eligibility_status"], "ineligible")
        self.assertTrue(any("cath_lab" in m for m in res["missing_requirements"]))

    def test_stale_resource_requires_verification(self):
        # Resource verified 25 minutes ago (> 10 min threshold)
        hosp_stale = dict(self.candidate_hospital)
        hosp_stale["resources"] = [
            {
                "resource_type": "ventilator",
                "available_quantity": 3,
                "availability_status": "available",
                "last_verified_at": self.stale_ts
            }
        ]
        emergency = {
            "category": "respiratory",
            "severity": "high",
            "required_capabilities": [],
            "required_resources": [{"resource_type": "ventilator", "minimum_quantity": 1}],
            "patient_latitude": 19.0800,
            "patient_longitude": 72.8800
        }
        results = rank_hospitals(emergency, [hosp_stale], now=self.now)
        res = results[0]
        self.assertEqual(res["eligibility_status"], "requires_verification")
        self.assertEqual(res["resource_freshness"], "stale")

    def test_missing_timestamp_treated_as_stale_or_unknown(self):
        hosp_no_ts = dict(self.candidate_hospital)
        hosp_no_ts["resources"] = [
            {
                "resource_type": "bed",
                "available_quantity": 5,
                "availability_status": "available",
                "last_verified_at": None  # Missing timestamp
            }
        ]
        emergency = {
            "category": "general",
            "severity": "moderate",
            "required_capabilities": [],
            "required_resources": [{"resource_type": "bed", "minimum_quantity": 1}],
            "patient_latitude": 19.0800,
            "patient_longitude": 72.8800
        }
        results = rank_hospitals(emergency, [hosp_no_ts], now=self.now)
        res = results[0]
        self.assertEqual(res["eligibility_status"], "requires_verification")

    def test_missing_coordinates_returns_null_eta_and_distance(self):
        emergency = {
            "category": "general",
            "severity": "low",
            "required_capabilities": [],
            "required_resources": [],
            "patient_latitude": None,
            "patient_longitude": None
        }
        results = rank_hospitals(emergency, [self.candidate_hospital], now=self.now)
        res = results[0]
        self.assertIsNone(res["distance_km"])
        self.assertIsNone(res["eta_minutes"])

    def test_deterministic_output_for_identical_inputs(self):
        emergency = {
            "category": "trauma",
            "severity": "critical",
            "required_capabilities": ["trauma_center_l1"],
            "required_resources": [{"resource_type": "bed", "minimum_quantity": 1}],
            "patient_latitude": 19.0800,
            "patient_longitude": 72.8800
        }
        run1 = rank_hospitals(emergency, [self.candidate_hospital], now=self.now)
        run2 = rank_hospitals(emergency, [self.candidate_hospital], now=self.now)
        self.assertEqual(run1[0]["match_score"], run2[0]["match_score"])
        self.assertEqual(run1[0]["eligibility_status"], run2[0]["eligibility_status"])

if __name__ == "__main__":
    unittest.main()
