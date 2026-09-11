"""
Seed Data Script for TraceX Legal Metrology Platform
Pre-populates SQLite database with:
- 1 Compliant Scan (Tata Salt)
- 2 Non-Compliant Scans (Delight Cookies & Kitchen King Masala)
- Pre-generated, cryptographically signed Formal Notices
Guarantees 100% demo reliability without depending on live camera or OCR.
"""

import os
import sys
from datetime import datetime, timedelta, timezone

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
from models import ScanRecord, FormalNoticeRecord
from rules_engine import evaluate_rules
from vision_extractor import extract_label_from_image
from crypto_signer import init_keys, sign_document_bytes
from pdf_generator import generate_compliance_report_pdf, generate_formal_notice_pdf, REPORTS_DIR, NOTICES_DIR

def seed(drop=True):
    if drop:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding TraceX Database...")
    init_keys()

    # 1. Compliant Product: Tata Salt
    scan1_id = "TRX-A4F291"
    ext1 = extract_label_from_image(b"tata", "tata_salt_sample.jpg")
    dict1 = ext1.model_dump()
    eval1 = evaluate_rules(dict1)
    
    meta1 = {
        "id": scan1_id,
        "created_at": (datetime.now() - timedelta(days=2)).strftime("%d %b %Y, 14:32 IST"),
        "product_name": ext1.product_name,
        "manufacturer": ext1.manufacturer_name,
        "is_compliant": eval1["is_compliant"],
        "evaluation_result": eval1
    }
    pdf1_bytes = generate_compliance_report_pdf(meta1)
    pdf1_name = f"{scan1_id}_audit_report.pdf"
    with open(os.path.join(REPORTS_DIR, pdf1_name), "wb") as f:
        f.write(pdf1_bytes)

    rec1 = ScanRecord(
        id=scan1_id,
        created_at=datetime.now(timezone.utc) - timedelta(days=2),
        product_name=ext1.product_name,
        manufacturer=ext1.manufacturer_name,
        image_filename="tata_salt_sample.jpg",
        extracted_data=dict1,
        is_compliant=eval1["is_compliant"],
        hard_violations_count=eval1["hard_violations_count"],
        advisories_count=eval1["advisories_count"],
        region="West Bengal",
        evaluation_result=eval1,
        pdf_filename=pdf1_name
    )
    db.add(rec1)

    # 2. Non-Compliant Product: Delight Cookies
    scan2_id = "TRX-B92C18"
    ext2 = extract_label_from_image(b"cookie", "delight_cookies_sample.jpg")
    dict2 = ext2.model_dump()
    eval2 = evaluate_rules(dict2)

    meta2 = {
        "id": scan2_id,
        "created_at": (datetime.now() - timedelta(days=1)).strftime("%d %b %Y, 11:15 IST"),
        "product_name": ext2.product_name,
        "manufacturer": ext2.manufacturer_name,
        "is_compliant": eval2["is_compliant"],
        "evaluation_result": eval2
    }
    pdf2_bytes = generate_compliance_report_pdf(meta2)
    pdf2_name = f"{scan2_id}_audit_report.pdf"
    with open(os.path.join(REPORTS_DIR, pdf2_name), "wb") as f:
        f.write(pdf2_bytes)

    rec2 = ScanRecord(
        id=scan2_id,
        created_at=datetime.now(timezone.utc) - timedelta(days=1),
        product_name=ext2.product_name,
        manufacturer=ext2.manufacturer_name,
        image_filename="delight_cookies_sample.jpg",
        extracted_data=dict2,
        is_compliant=eval2["is_compliant"],
        hard_violations_count=eval2["hard_violations_count"],
        advisories_count=eval2["advisories_count"],
        region="Delhi NCT",
        evaluation_result=eval2,
        pdf_filename=pdf2_name
    )
    db.add(rec2)

    # 3. Non-Compliant Product: Kitchen King Masala (Rule 12 non-standard unit)
    scan3_id = "TRX-C77D43"
    ext3 = extract_label_from_image(b"garam", "kitchen_king_garam_masala.jpg")
    dict3 = ext3.model_dump()
    eval3 = evaluate_rules(dict3)

    meta3 = {
        "id": scan3_id,
        "created_at": datetime.now().strftime("%d %b %Y, 09:40 IST"),
        "product_name": ext3.product_name,
        "manufacturer": ext3.manufacturer_name,
        "is_compliant": eval3["is_compliant"],
        "evaluation_result": eval3
    }
    pdf3_bytes = generate_compliance_report_pdf(meta3)
    pdf3_name = f"{scan3_id}_audit_report.pdf"
    with open(os.path.join(REPORTS_DIR, pdf3_name), "wb") as f:
        f.write(pdf3_bytes)

    rec3 = ScanRecord(
        id=scan3_id,
        created_at=datetime.now(timezone.utc) - timedelta(hours=5),
        product_name=ext3.product_name,
        manufacturer=ext3.manufacturer_name,
        image_filename="kitchen_king_garam_masala.jpg",
        extracted_data=dict3,
        is_compliant=eval3["is_compliant"],
        hard_violations_count=eval3["hard_violations_count"],
        advisories_count=eval3["advisories_count"],
        region="Rajasthan",
        evaluation_result=eval3,
        pdf_filename=pdf3_name
    )
    db.add(rec3)

    # 4. Second Non-Compliant Product for Delight Food Works (Repeat Offender Demo)
    scan4_id = "TRX-D48E91"
    dict4 = dict2.copy()
    dict4["product_name"] = "Delight Choco Biscuits"
    eval4 = evaluate_rules(dict4)
    rec4 = ScanRecord(
        id=scan4_id,
        created_at=datetime.now(timezone.utc) - timedelta(hours=1),
        product_name="Delight Choco Biscuits",
        manufacturer="Delight Food Works",
        image_filename="delight_choco_sample.jpg",
        extracted_data=dict4,
        is_compliant=False,
        hard_violations_count=3,
        advisories_count=1,
        region="Delhi NCT",
        evaluation_result=eval4,
        pdf_filename=pdf2_name
    )
    db.add(rec4)
    db.commit()

    # 4. Generate Pre-signed Formal Notice for Scan 2 (Delight Cookies)
    notice1_id = "NOT-2026-8812"
    violations2 = [c for c in eval2.get("checks", []) if c.get("status") == "fail"]
    notice_meta1 = {
        "id": notice1_id,
        "scan_id": scan2_id,
        "product_name": ext2.product_name,
        "company_name": ext2.manufacturer_name,
        "recipient_email": "compliance@delightfoods.com",
        "issued_at": (datetime.now() - timedelta(days=1)).strftime("%d %B %Y"),
        "response_deadline": "15 Calendar Days",
        "inspector_ref": "INSP/DOCA/DEL/2026/049",
        "violations": violations2
    }
    n1_pdf_bytes = generate_formal_notice_pdf(notice_meta1)
    n1_pdf_name = f"{notice1_id}_Show_Cause_Notice.pdf"
    with open(os.path.join(NOTICES_DIR, n1_pdf_name), "wb") as f:
        f.write(n1_pdf_bytes)

    crypto1 = sign_document_bytes(n1_pdf_bytes)
    notice1 = FormalNoticeRecord(
        id=notice1_id,
        scan_id=scan2_id,
        recipient_email="compliance@delightfoods.com",
        company_name=ext2.manufacturer_name,
        issued_at=datetime.utcnow() - timedelta(days=1),
        response_deadline="15 Calendar Days",
        inspector_ref="INSP/DOCA/DEL/2026/049",
        sha256_hash=crypto1["sha256_hash"],
        signature_hex=crypto1["signature_hex"],
        pdf_filename=n1_pdf_name,
        status="ISSUED",
        notes="Notice dispatched regarding missing tax clause, missing mfg date, and incomplete address."
    )
    db.add(notice1)
    db.commit()

    print(f"✔ Successfully seeded 3 scan records and 1 signed formal notice ({notice1_id})!")
    db.close()

def seed_if_empty():
    """Seeds the database only if there are no existing scans (safe for cloud cold-starts)."""
    db = SessionLocal()
    try:
        count = db.query(ScanRecord).count()
        if count == 0:
            print("[AUTO-SEED] Empty database detected. Seeding demonstration records...")
            seed(drop=False)
        else:
            print(f"[AUTO-SEED] Database already contains {count} scan record(s). Skipping seed.")
    except Exception as e:
        print(f"[AUTO-SEED] Seeding notice: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

