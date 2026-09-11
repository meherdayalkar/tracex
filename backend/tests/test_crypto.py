"""
Unit Tests for RSA Cryptographic Signing and Verification
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crypto_signer import (
    init_keys,
    compute_sha256,
    sign_document_bytes,
    verify_document_bytes,
    get_public_key_pem
)

class TestCryptoSigner(unittest.TestCase):

    def setUp(self):
        init_keys()

    def test_key_initialization(self):
        pub_pem = get_public_key_pem()
        self.assertIn("BEGIN PUBLIC KEY", pub_pem)
        self.assertIn("END PUBLIC KEY", pub_pem)

    def test_sign_and_verify_valid(self):
        doc_content = b"%PDF-1.4 Mock Legal Metrology Notice for Section 36(1) violations."
        signed_meta = sign_document_bytes(doc_content)

        self.assertIn("sha256_hash", signed_meta)
        self.assertIn("signature_hex", signed_meta)
        self.assertEqual(signed_meta["sha256_hash"], compute_sha256(doc_content))

        # Verify with exact document bytes
        verification = verify_document_bytes(doc_content, signed_meta["signature_hex"])
        self.assertTrue(verification["is_valid"])
        self.assertIsNone(verification["error"])
        self.assertIn("Document authenticity verified", verification["message"])

    def test_tamper_detection(self):
        original_doc = b"%PDF-1.4 Original Notice: Fine is Rs. 25,000"
        signed_meta = sign_document_bytes(original_doc)

        # Alter single byte / word
        tampered_doc = b"%PDF-1.4 Tampered Notice: Fine is Rs. 00,000"

        # Verification must FAIL
        verification = verify_document_bytes(tampered_doc, signed_meta["signature_hex"])
        self.assertFalse(verification["is_valid"])
        self.assertEqual(verification["error"], "INVALID_SIGNATURE")
        self.assertIn("altered or tampered with", verification["message"])

    def test_malformed_signature_hex(self):
        doc_content = b"Some test document"
        verification = verify_document_bytes(doc_content, "not_a_valid_hex_string_XYZ")
        self.assertFalse(verification["is_valid"])
        self.assertEqual(verification["error"], "MALFORMED_SIGNATURE")

if __name__ == "__main__":
    unittest.main()
