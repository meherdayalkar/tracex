"""
Unit Tests for TraceX Statutory Rules Engine
Tests each named rule check against hardcoded sample JSON data.
Zero external test framework required (runs via standard unittest / python).
"""

import sys
import os
import unittest

# Ensure root backend dir is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rules_engine import (
    check_rule_6_1_a_manufacturer,
    check_rule_6_1_b_net_quantity,
    check_rule_6_1_f_mrp_tax,
    check_rule_6_1_d_mfg_date,
    check_rule_consumer_care_2022,
    check_country_of_origin,
    check_font_size_heuristic,
    check_qr_code,
    evaluate_rules
)

class TestRulesEngine(unittest.TestCase):

    def test_compliant_sample(self):
        sample = {
            "manufacturer_name": "Tata Consumer Products Ltd",
            "manufacturer_address": "1, Bishop Lefroy Road, Kolkata - 700020, West Bengal",
            "has_pin_code": True,
            "net_quantity": {"value": 1.0, "unit": "kg"},
            "mrp": {"value": 28.0, "currency": "INR", "is_tax_inclusive": True},
            "mfg_date": {"month": 8, "year": 2026, "raw_string": "08/2026"},
            "best_before": {"duration": "24 Months", "is_only_duration": False},
            "consumer_care": {"email": "care@tataconsumer.com", "phone": "1800-345-1720"},
            "country_of_origin": "India",
            "is_imported": False,
            "font_size_estimate": {"mrp_height_ratio": 0.035, "threshold": 0.02},
            "qr_code_data": {"detected": True, "raw_payload": "https://tataconsumer.com/qr/salt", "status": "valid"}
        }

        result = evaluate_rules(sample)
        self.assertTrue(result["is_compliant"])
        self.assertEqual(result["hard_violations_count"], 0)
        self.assertEqual(result["passed_count"], 8)

    def test_missing_tax_inclusivity(self):
        sample = {
            "mrp": {"value": 99.0, "currency": "INR", "is_tax_inclusive": False}
        }
        res = check_rule_6_1_f_mrp_tax(sample)
        self.assertEqual(res["status"], "fail")
        self.assertEqual(res["severity"], "violation")
        self.assertIn("inclusive of all taxes", res["reason"])

    def test_non_metric_and_non_standard_units(self):
        # Non-metric unit 'lb'
        sample_lb = {"net_quantity": {"value": 1.0, "unit": "lb"}}
        res_lb = check_rule_6_1_b_net_quantity(sample_lb)
        self.assertEqual(res_lb["status"], "fail")
        self.assertIn("Non-metric unit", res_lb["reason"])

        # Non-standard unit 'gms'
        sample_gms = {"net_quantity": {"value": 250.0, "unit": "gms"}}
        res_gms = check_rule_6_1_b_net_quantity(sample_gms)
        self.assertEqual(res_gms["status"], "fail")
        self.assertIn("Non-standard metric abbreviation", res_gms["reason"])

        # Standard unit 'g'
        sample_g = {"net_quantity": {"value": 250.0, "unit": "g"}}
        res_g = check_rule_6_1_b_net_quantity(sample_g)
        self.assertEqual(res_g["status"], "pass")

    def test_best_before_without_mfg_date(self):
        sample = {
            "mfg_date": None,
            "best_before": {"duration": "Best before 6 months", "is_only_duration": True}
        }
        res = check_rule_6_1_d_mfg_date(sample)
        self.assertEqual(res["status"], "fail")
        self.assertIn("without the mandatory explicit Month and Year", res["reason"])

    def test_consumer_care_2022_amendment(self):
        # Missing phone
        sample_email_only = {"consumer_care": {"email": "help@store.in", "phone": ""}}
        res_email = check_rule_consumer_care_2022(sample_email_only)
        self.assertEqual(res_email["status"], "fail")
        self.assertIn("telephone helpline is missing", res_email["reason"])

        # Missing email
        sample_phone_only = {"consumer_care": {"email": "", "phone": "1800-200-1122"}}
        res_phone = check_rule_consumer_care_2022(sample_phone_only)
        self.assertEqual(res_phone["status"], "fail")
        self.assertIn("email ID is missing", res_phone["reason"])

        # Both present
        sample_both = {"consumer_care": {"email": "help@store.in", "phone": "1800-200-1122"}}
        res_both = check_rule_consumer_care_2022(sample_both)
        self.assertEqual(res_both["status"], "pass")

    def test_incomplete_address_missing_pin(self):
        sample = {
            "manufacturer_name": "Delight Bakery Works",
            "manufacturer_address": "Industrial Area, Phase 2, Delhi",
            "has_pin_code": False
        }
        res = check_rule_6_1_a_manufacturer(sample)
        self.assertEqual(res["status"], "fail")
        self.assertIn("missing mandatory 6-digit Indian postal PIN code", res["reason"])

    def test_qr_code_validation(self):
        # Blank QR
        sample_blank = {"qr_code_data": {"detected": True, "raw_payload": "", "status": "blank"}}
        res_blank = check_qr_code(sample_blank)
        self.assertEqual(res_blank["status"], "fail")

        # Broken QR
        sample_broken = {"qr_code_data": {"detected": True, "raw_payload": "http://invalid-dead-link", "status": "broken"}}
        res_broken = check_qr_code(sample_broken)
        self.assertEqual(res_broken["status"], "fail")

if __name__ == "__main__":
    unittest.main()
