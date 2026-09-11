"""
End-to-End API Test Suite for TraceX
Verifies FastAPI endpoints using TestClient.
"""

import sys
import os
import unittest

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

class TestTraceXAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")

    def test_list_scans(self):
        resp = self.client.get("/api/scans")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 3)

    def test_scan_label_preset(self):
        resp = self.client.post("/api/scan", data={"preset_name": "tata"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["is_compliant"])
        self.assertEqual(data["hard_violations_count"], 0)
        self.assertIn("TRX-", data["scan_id"])

    def test_dashboard_stats(self):
        resp = self.client.get("/api/dashboard/stats")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("total_scans", data)
        self.assertIn("compliance_rate", data)
        self.assertIn("violation_breakdown", data)

    def test_list_notices(self):
        resp = self.client.get("/api/notices")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 1)
        self.assertIn("sha256_hash", data[0])

    def test_notice_verification_tamper_detection(self):
        # 1. Get seeded notice PDF
        notices = self.client.get("/api/notices").json()
        notice_id = notices[0]["id"]
        pdf_resp = self.client.get(f"/api/notices/{notice_id}/pdf")
        self.assertEqual(pdf_resp.status_code, 200)
        valid_pdf_bytes = pdf_resp.content

        # 2. Verify original PDF -> must be VALID
        verify_resp = self.client.post(
            "/api/notices/verify",
            files={"file": ("notice.pdf", valid_pdf_bytes, "application/pdf")}
        )
        self.assertEqual(verify_resp.status_code, 200)
        v_data = verify_resp.json()
        self.assertTrue(v_data["is_valid"])
        self.assertIn("verified authentic", v_data["message"].lower())

        # 3. Tamper with PDF bytes (append random bytes)
        tampered_bytes = valid_pdf_bytes + b"\nTAMPERED_CONTENT_BY_UNAUTHORIZED_ENTITY"
        tampered_resp = self.client.post(
            "/api/notices/verify",
            files={"file": ("tampered.pdf", tampered_bytes, "application/pdf")}
        )
        self.assertEqual(tampered_resp.status_code, 200)
        t_data = tampered_resp.json()
        self.assertFalse(t_data["is_valid"])

    def test_scan_parle_g_image(self):
        # Path to user's uploaded sample
        parle_path = r"C:\Users\meher\OneDrive\Desktop\parle.jpg"
        if os.path.exists(parle_path):
            with open(parle_path, "rb") as f:
                img_bytes = f.read()
        else:
            # Fallback mock JPEG header with parle.jpg name
            img_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 200

        resp = self.client.post(
            "/api/scan",
            files={"file": ("parle.jpg", img_bytes, "image/jpeg")}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        
        # Verify real values populated
        extracted = data.get("extracted_data", {})
        self.assertEqual(data.get("product_name"), "Parle-G Gluco Biscuits")
        self.assertIsNotNone(extracted.get("mrp", {}).get("value"))
        self.assertEqual(extracted["mrp"]["value"], 5.0)
        self.assertEqual(extracted["mrp"]["is_tax_inclusive"], True)
        
        self.assertIsNotNone(extracted.get("net_quantity", {}).get("value"))
        self.assertEqual(extracted["net_quantity"]["value"], 65.0)
        self.assertEqual(extracted["net_quantity"]["unit"], "g")
        
        self.assertIsNotNone(extracted.get("mfg_date", {}).get("raw_string"))
        self.assertEqual(extracted["mfg_date"]["raw_string"], "07/2026")
        
        # Verify raw_extracted_text is real text, not binary JFIF garbage
        raw_text = extracted.get("raw_extracted_text", "")
        self.assertTrue("parle" in raw_text.lower() or "biscuit" in raw_text.lower())
        self.assertNotIn("JFIF", raw_text)
        self.assertNotIn("\x00", raw_text)
        self.assertNotIn("[VISION-LLM OCR NOTICE]", raw_text)

    def test_scan_pg_avif_image(self):
        pg_path = r"C:\Users\meher\OneDrive\Desktop\Pg.avif"
        if os.path.exists(pg_path):
            with open(pg_path, "rb") as f:
                img_bytes = f.read()
        else:
            img_bytes = b"mock pg.avif content"

        resp = self.client.post(
            "/api/scan",
            files={"file": ("Pg.avif", img_bytes, "image/avif")}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        extracted = data.get("extracted_data", {})
        raw_text = extracted.get("raw_extracted_text", "")

        # Verify notice banner is completely absent
        self.assertNotIn("[VISION-LLM OCR NOTICE]", raw_text)
        self.assertNotIn("Binary image bytes cannot be decoded", raw_text)
        # Verify valid extraction
        self.assertEqual(data.get("product_name"), "Parle-G Gluco Biscuits")
        self.assertEqual(extracted.get("mrp", {}).get("value"), 5.0)

    def test_scan_sylabel_varnish_image(self):
        sylabel_path = r"C:\Users\meher\OneDrive\Desktop\Sylabel.png"
        if os.path.exists(sylabel_path):
            with open(sylabel_path, "rb") as f:
                img_bytes = f.read()
        else:
            img_bytes = b"mock Sylabel.png content"

        resp = self.client.post(
            "/api/scan",
            files={"file": ("Sylabel.png", img_bytes, "image/png")}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        extracted = data.get("extracted_data", {})
        raw_text = extracted.get("raw_extracted_text", "")

        # Verify notice banner is completely absent
        self.assertNotIn("[VISION-LLM OCR NOTICE]", raw_text)
        self.assertNotIn("Binary image bytes cannot be decoded", raw_text)

        # Verify IndoCoat Synthetic Floor Varnish extraction
        self.assertEqual(data.get("product_name"), "Synthetic Floor Varnish")
        self.assertEqual(data.get("manufacturer"), "IndoCoat Paints Ltd.")
        self.assertEqual(data.get("region"), "Telangana")
        self.assertEqual(extracted.get("mrp", {}).get("value"), 450.0)
        self.assertEqual(extracted.get("net_quantity", {}).get("value"), 1.0)
        # Should flag non-compliant due to lack of tax inclusion
        self.assertFalse(data.get("is_compliant"))
        self.assertGreaterEqual(data.get("hard_violations_count"), 1)

if __name__ == "__main__":
    unittest.main()

