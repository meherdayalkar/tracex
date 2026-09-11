"""
Cryptographic Signing & Verification Service
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)

Implements RSA-2048 Digital Signing and SHA-256 Integrity Verification for
official Legal Metrology Notices under Section 36(1).
"""

import os
import hashlib
from typing import Tuple, Dict, Any, Optional

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidSignature

KEYS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keys")
PRIVATE_KEY_PATH = os.path.join(KEYS_DIR, "private_key.pem")
PUBLIC_KEY_PATH = os.path.join(KEYS_DIR, "public_key.pem")

_private_key: Optional[rsa.RSAPrivateKey] = None
_public_key: Optional[rsa.RSAPublicKey] = None

def init_keys() -> Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
    """
    Initializes RSA-2048 keypair on startup.
    Generates and persists keys to disk if not already present.
    """
    global _private_key, _public_key

    if _private_key is not None and _public_key is not None:
        return _private_key, _public_key

    os.makedirs(KEYS_DIR, exist_ok=True)

    env_pem = os.environ.get("RSA_PRIVATE_KEY_PEM", "").strip()
    if env_pem:
        if "\\n" in env_pem and "\n" not in env_pem:
            env_pem = env_pem.replace("\\n", "\n")
        _private_key = serialization.load_pem_private_key(env_pem.encode("utf-8"), password=None)
        _public_key = _private_key.public_key()
        # Persist to disk for local file reference
        pem_priv = _private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        with open(PRIVATE_KEY_PATH, "wb") as f:
            f.write(pem_priv)
        pem_pub = _public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        with open(PUBLIC_KEY_PATH, "wb") as f:
            f.write(pem_pub)
        return _private_key, _public_key

    if os.path.exists(PRIVATE_KEY_PATH) and os.path.exists(PUBLIC_KEY_PATH):
        with open(PRIVATE_KEY_PATH, "rb") as f:
            _private_key = serialization.load_pem_private_key(f.read(), password=None)
        with open(PUBLIC_KEY_PATH, "rb") as f:
            _public_key = serialization.load_pem_public_key(f.read())
    else:
        # Generate new RSA-2048 keypair
        _private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        _public_key = _private_key.public_key()

        # Save private key
        pem_priv = _private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        with open(PRIVATE_KEY_PATH, "wb") as f:
            f.write(pem_priv)

        # Save public key
        pem_pub = _public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        with open(PUBLIC_KEY_PATH, "wb") as f:
            f.write(pem_pub)

    return _private_key, _public_key

def compute_sha256(content_bytes: bytes) -> str:
    """
    Computes cryptographic SHA-256 digest of exact byte content.
    """
    return hashlib.sha256(content_bytes).hexdigest()

def sign_document_bytes(content_bytes: bytes) -> Dict[str, Any]:
    """
    Computes SHA-256 hash of document and generates RSA-2048 digital signature.
    Uses PSS padding with MGF1(SHA-256).
    """
    priv_key, _ = init_keys()
    doc_hash = compute_sha256(content_bytes)

    # Sign exact document bytes with SHA-256
    signature = priv_key.sign(
        content_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )

    return {
        "sha256_hash": doc_hash,
        "signature_hex": signature.hex(),
        "key_algorithm": "RSA-2048 / SHA-256 / PSS",
        "authority": "Department of Consumer Affairs (DoCA) Legal Metrology Division"
    }

def verify_document_bytes(content_bytes: bytes, signature_hex: str) -> Dict[str, Any]:
    """
    Verifies document bytes against the provided hexadecimal RSA signature.
    Returns validation verdict and re-calculated SHA-256 hash.
    """
    _, pub_key = init_keys()
    doc_hash = compute_sha256(content_bytes)

    try:
        sig_bytes = bytes.fromhex(signature_hex.strip())
        pub_key.verify(
            sig_bytes,
            content_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return {
            "is_valid": True,
            "sha256_hash": doc_hash,
            "error": None,
            "message": "Document authenticity verified. Issued by Department of Consumer Affairs (DoCA)."
        }
    except InvalidSignature:
        return {
            "is_valid": False,
            "sha256_hash": doc_hash,
            "error": "INVALID_SIGNATURE",
            "message": "This document may have been altered or tampered with - digital signature is invalid."
        }
    except ValueError as e:
        return {
            "is_valid": False,
            "sha256_hash": doc_hash,
            "error": "MALFORMED_SIGNATURE",
            "message": f"Malformed signature format: {str(e)}"
        }
    except Exception as e:
        return {
            "is_valid": False,
            "sha256_hash": doc_hash,
            "error": "VERIFICATION_ERROR",
            "message": f"Verification error: {str(e)}"
        }

def get_public_key_pem() -> str:
    """Returns PEM-formatted public key string."""
    _, pub_key = init_keys()
    return pub_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")
