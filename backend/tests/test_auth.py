"""
Unit & Integration Test Suite for TraceX Authentication & Authorization
Verifies password hashing, JWT generation, officer registration, login, and access control.
"""

import sys
import os
import unittest
import uuid

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from auth import hash_password, verify_password, create_access_token, decode_access_token

class TestTraceXAuth(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        from database import engine, Base
        import models
        Base.metadata.create_all(bind=engine)
        from seed_data import seed_admin_if_empty
        seed_admin_if_empty()
        cls.client = TestClient(app)

    def test_password_hashing_and_verification(self):
        password = "SecureOfficerPassword2026!"
        hashed = hash_password(password)
        self.assertTrue(hashed.startswith("pbkdf2_sha256$600000$"))
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_jwt_token_encoding_and_decoding(self):
        claims = {
            "sub": "USR-TEST-001",
            "email": "test.officer@doca.gov.in",
            "badge_number": "DOCA-TEST-001"
        }
        token = create_access_token(claims)
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], "USR-TEST-001")
        self.assertEqual(payload["email"], "test.officer@doca.gov.in")
        self.assertEqual(payload["badge_number"], "DOCA-TEST-001")

    def test_default_admin_login(self):
        """Pre-seeded Chief Metrology Inspector demo login test."""
        resp = self.client.post("/api/auth/login", json={
            "email": "admin@doca.gov.in",
            "password": "Admin@TraceX2026"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["email"], "admin@doca.gov.in")
        self.assertEqual(data["user"]["role"], "admin")
        self.assertEqual(data["user"]["badge_number"], "DOCA-HQ-001")

    def test_login_invalid_password(self):
        resp = self.client.post("/api/auth/login", json={
            "email": "admin@doca.gov.in",
            "password": "WrongPasswordXYZ"
        })
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Invalid official email or officer password", resp.json()["detail"])

    def test_officer_registration_and_me_profile(self):
        unique_id = uuid.uuid4().hex[:6]
        email = f"officer_{unique_id}@doca.gov.in"
        badge = f"DOCA-INSP-{unique_id.upper()}"
        password = "OfficerSecret2026"

        # 1. Register new officer
        reg_resp = self.client.post("/api/auth/register", json={
            "email": email,
            "full_name": "Inspector Meher Dayalkar",
            "badge_number": badge,
            "designation": "Assistant Controller",
            "jurisdiction": "Maharashtra",
            "password": password
        })
        self.assertEqual(reg_resp.status_code, 200)
        reg_data = reg_resp.json()
        self.assertIn("access_token", reg_data)
        token = reg_data["access_token"]
        self.assertEqual(reg_data["user"]["email"], email)
        self.assertEqual(reg_data["user"]["badge_number"], badge)

        # 2. Access /api/auth/me with Bearer token
        me_resp = self.client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(me_resp.status_code, 200)
        me_data = me_resp.json()
        self.assertEqual(me_data["email"], email)
        self.assertEqual(me_data["full_name"], "Inspector Meher Dayalkar")
        self.assertEqual(me_data["badge_number"], badge)
        self.assertEqual(me_data["jurisdiction"], "Maharashtra")

        # 3. Re-login with the new officer credentials
        login_resp = self.client.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        self.assertEqual(login_resp.status_code, 200)
        self.assertIn("access_token", login_resp.json())

    def test_registration_duplicate_email_rejected(self):
        resp = self.client.post("/api/auth/register", json={
            "email": "admin@doca.gov.in",
            "full_name": "Impostor Admin",
            "badge_number": "DOCA-FAKE-999",
            "password": "Password123"
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("already exists", resp.json()["detail"])

    def test_registration_short_password_rejected(self):
        resp = self.client.post("/api/auth/register", json={
            "email": "short.pwd@doca.gov.in",
            "full_name": "Test Officer",
            "badge_number": "DOCA-SHORT-001",
            "password": "123"
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("at least 6 characters", resp.json()["detail"])

    def test_auth_me_unauthorized_without_token(self):
        resp = self.client.get("/api/auth/me")
        self.assertEqual(resp.status_code, 401)


if __name__ == "__main__":
    unittest.main()
