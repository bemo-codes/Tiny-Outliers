import unittest
import datetime
from app.services.matching_engine import rank_hospitals
from app.services.synthetic_seed import get_synthetic_dataset

class TestReproducibleScenarios(unittest.TestCase):
    def setUp(self):
        self.dataset = get_synthetic_dataset()
        self.now = datetime.datetime.now(datetime.timezone.utc)
        
        # Prepare full hospitals
        self.hospitals = []
        for h in self.dataset["hospitals"]:
            hc = dict(h)
            hc["resources"] = [r for r in self.dataset["resources"] if r["hospital_id"] == h["id"]]
            hc["capabilities"] = [c for c in self.dataset["capabilities"] if c["hospital_id"] == h["id"]]
            hc["staff_availability"] = [s for s in self.dataset["staff_availability"] if s["hospital_id"] == h["id"]]
            self.hospitals.append(hc)

    def test_scenario_1_nearby_hospital_lacks_icu(self):
        # Scenario 1: City General (CGCH - hosp-004) is close, but lacks ICU capability and beds
        sc1 = self.dataset["scenarios"][0]["emergency"]
        ranked = rank_hospitals(sc1, self.hospitals, now=self.now)
        
        # St. Jude (hosp-001) or Trinity (hosp-010) should be #1 eligible
        top_eligible = [r for r in ranked if r["eligibility_status"] == "eligible"]
        self.assertTrue(len(top_eligible) > 0)
        self.assertIn(top_eligible[0]["hospital_id"], ["hosp-001", "hosp-010"])
        
        # CGCH (hosp-004) must be ineligible because it lacks trauma_center_l1 and ICU bed
        cgch_result = next(r for r in ranked if r["hospital_id"] == "hosp-004")
        self.assertEqual(cgch_result["eligibility_status"], "ineligible")
        self.assertTrue(len(cgch_result["missing_requirements"]) > 0)

    def test_scenario_2_farther_hospital_meets_mandatory_requirements(self):
        # Scenario 2: Cardiac STEMI requires cath_lab
        sc2 = self.dataset["scenarios"][1]["emergency"]
        ranked = rank_hospitals(sc2, self.hospitals, now=self.now)
        
        top_hosp = ranked[0]
        # Apex Heart (hosp-002) has 24/7 cath lab and is eligible
        self.assertEqual(top_hosp["eligibility_status"], "eligible")
        self.assertIn(top_hosp["hospital_id"], ["hosp-002", "hosp-001", "hosp-010"])
        
        # Non-cardiac hospitals without cath_lab must be ineligible
        non_cath = next(r for r in ranked if r["hospital_id"] == "hosp-004")
        self.assertEqual(non_cath["eligibility_status"], "ineligible")

    def test_scenario_3_critical_resource_is_stale(self):
        # Scenario 3: Beacon Hill (hosp-007) has stale ventilator timestamp (> 35m)
        sc3 = self.dataset["scenarios"][2]["emergency"]
        ranked = rank_hospitals(sc3, self.hospitals, now=self.now)
        
        beacon = next(r for r in ranked if r["hospital_id"] == "hosp-007")
        # Diverted and stale -> ineligible or requires_verification
        self.assertIn(beacon["eligibility_status"], ["ineligible", "requires_verification"])
        self.assertEqual(beacon["resource_freshness"], "stale")

    def test_scenario_4_mandatory_medicine_unavailable(self):
        # Scenario 4: Stroke emergency requiring Tenecteplase
        sc4 = self.dataset["scenarios"][3]["emergency"]
        ranked = rank_hospitals(sc4, self.hospitals, now=self.now)
        
        # Memorial Neuro (hosp-003) is top stroke center
        mem_neuro = next(r for r in ranked if r["hospital_id"] == "hosp-003")
        self.assertEqual(mem_neuro["eligibility_status"], "eligible")
        
        # Hospital with 0 stock of medicine is ineligible
        hosp4 = next(r for r in ranked if r["hospital_id"] == "hosp-004")
        self.assertEqual(hosp4["eligibility_status"], "ineligible")

    def test_scenario_5_competing_emergencies(self):
        # Scenario 5: Polytrauma requiring 2 units blood and emergency OT
        sc5 = self.dataset["scenarios"][4]["emergency"]
        ranked = rank_hospitals(sc5, self.hospitals, now=self.now)
        
        top = ranked[0]
        self.assertEqual(top["eligibility_status"], "eligible")
        self.assertIn(top["hospital_id"], ["hosp-001", "hosp-010"])

if __name__ == "__main__":
    unittest.main()
