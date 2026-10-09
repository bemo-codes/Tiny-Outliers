import unittest
import datetime
from app.services.resource_service import is_resource_fresh, format_phone_link

class TestResourceService(unittest.TestCase):
    def setUp(self):
        self.now = datetime.datetime(2026, 10, 9, 12, 0, 0, tzinfo=datetime.timezone.utc)

    def test_freshness_within_threshold(self):
        ts = self.now - datetime.timedelta(minutes=5)
        is_fresh, age = is_resource_fresh(ts, now=self.now)
        self.assertTrue(is_fresh)
        self.assertAlmostEqual(age, 5.0, places=1)

    def test_stale_exceeding_threshold(self):
        ts = self.now - datetime.timedelta(minutes=15)
        is_fresh, age = is_resource_fresh(ts, now=self.now)
        self.assertFalse(is_fresh)
        self.assertAlmostEqual(age, 15.0, places=1)

    def test_missing_timestamp_is_stale(self):
        is_fresh, age = is_resource_fresh(None, now=self.now)
        self.assertFalse(is_fresh)
        self.assertEqual(age, 999.0)

    def test_phone_link_formatting(self):
        self.assertEqual(format_phone_link("+91 22 5550 0101"), "tel:+91 22 5550 0101")
        self.assertIsNone(format_phone_link(None))
        self.assertIsNone(format_phone_link(""))
        self.assertIsNone(format_phone_link("12"))

if __name__ == "__main__":
    unittest.main()
