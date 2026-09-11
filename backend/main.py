"""
TraceX - Legal Metrology Label Compliance Scanner (SIH26034)
FastAPI Master Backend
Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution
"""

import os
import io
import csv
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import engine, Base, get_db, get_db_type
from models import ScanRecord, FormalNoticeRecord
from rules_engine import evaluate_rules
from vision_extractor import extract_label_from_image, ExtractionResult
from crypto_signer import (
    init_keys,
    compute_sha256,
    sign_document_bytes,
    verify_document_bytes,
    get_public_key_pem
)
from pdf_generator import (
    generate_compliance_report_pdf,
    generate_formal_notice_pdf,
    STORAGE_DIR,
    REPORTS_DIR,
    NOTICES_DIR
)
from email_service import send_formal_notice_email
from seed_data import seed_if_empty

app = FastAPI(
    title="TraceX - Legal Metrology Label Compliance Scanner",
    description="Statutory Compliance Surveillance Platform for Ministry of Consumer Affairs (DoCA) - SIH26034",
    version="1.0.0"
)

# CORS Middleware (Environment-aware for Vercel production + local dev)
frontend_env = os.environ.get("FRONTEND_URL", "").strip()
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if frontend_env:
    for u in frontend_env.split(","):
        cleaned = u.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if frontend_env else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Ensure database tables, RSA signing keys, and initial seed records exist."""
    Base.metadata.create_all(bind=engine)
    init_keys()
    try:
        seed_if_empty()
    except Exception as ex:
        print(f"[STARTUP] Seeding check note: {ex}")

# Mount static directory for generated PDFs and uploads
app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TraceX Legal Metrology Surveillance Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "keys_initialized": True,
        "database": get_db_type()
    }

@app.get("/api/crypto/public-key")
def get_public_key():
    """Returns PEM-encoded RSA public key for external verification."""
    return {
        "algorithm": "RSA-2048",
        "public_key_pem": get_public_key_pem(),
        "authority": "Legal Metrology Root Inspectorate Authority (DoCA)"
    }

@app.post("/api/scan")
async def scan_label(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    preset_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Main ingestion endpoint:
    Processes uploaded packaging image, extracts structured fields via Vision-LLM,
    applies codified Legal Metrology rules, stores audit record, and builds PDF report.
    """
    scan_id = f"TRX-{uuid.uuid4().hex[:6].upper()}"
    filename = ""
    image_bytes = b""

    if file and file.filename:
        filename = file.filename
        image_bytes = await file.read()
    elif preset_name:
        filename = f"{preset_name}.jpg"
        image_bytes = f"Preset: {preset_name}".encode('utf-8')
    elif raw_text:
        filename = "text_input.txt"
        image_bytes = raw_text.encode('utf-8')
    else:
        # Default compliant fallback
        filename = "tata_salt_sample.jpg"
        image_bytes = b"Default packaging scan"

    # Step 1: Vision Extraction
    extraction = extract_label_from_image(image_bytes, filename, preset_name=preset_name)
    extracted_dict = extraction.model_dump()

    # Step 2: Statutory Rules Evaluation
    evaluation = evaluate_rules(extracted_dict)

    # Step 3: Generate Compliance Report PDF
    scan_meta = {
        "id": scan_id,
        "created_at": datetime.now().strftime("%d %b %Y, %H:%M IST"),
        "product_name": extraction.product_name,
        "manufacturer": extraction.manufacturer_name,
        "is_compliant": evaluation["is_compliant"],
        "evaluation_result": evaluation
    }
    pdf_bytes = generate_compliance_report_pdf(scan_meta)
    pdf_filename = f"{scan_id}_audit_report.pdf"
    pdf_filepath = os.path.join(REPORTS_DIR, pdf_filename)
    with open(pdf_filepath, "wb") as f:
        f.write(pdf_bytes)

    # Region deduction from PIN or address
    region = "Delhi NCT"
    addr_lower = (extraction.manufacturer_address or "").lower()
    if "700" in addr_lower or "kolkata" in addr_lower or "bengal" in addr_lower:
        region = "West Bengal"
    elif "560" in addr_lower or "bengaluru" in addr_lower or "karnataka" in addr_lower:
        region = "Karnataka"
    elif "400" in addr_lower or "mumbai" in addr_lower or "maharashtra" in addr_lower:
        region = "Maharashtra"
    elif "302" in addr_lower or "jaipur" in addr_lower or "rajasthan" in addr_lower:
        region = "Rajasthan"
    elif "500" in addr_lower or "hyderabad" in addr_lower or "telangana" in addr_lower:
        region = "Telangana"

    # Step 4: Save to Database
    record = ScanRecord(
        id=scan_id,
        product_name=extraction.product_name or "Packaged Commodity",
        manufacturer=extraction.manufacturer_name,
        image_filename=filename,
        extracted_data=extracted_dict,
        is_compliant=evaluation["is_compliant"],
        hard_violations_count=evaluation["hard_violations_count"],
        advisories_count=evaluation["advisories_count"],
        region=region,
        evaluation_result=evaluation,
        pdf_filename=pdf_filename
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "scan_id": scan_id,
        "created_at": record.created_at.isoformat(),
        "product_name": record.product_name,
        "manufacturer": record.manufacturer,
        "region": record.region,
        "is_compliant": record.is_compliant,
        "hard_violations_count": record.hard_violations_count,
        "advisories_count": record.advisories_count,
        "extracted_data": record.extracted_data,
        "evaluation_result": record.evaluation_result,
        "pdf_url": f"/api/scans/{scan_id}/pdf"
    }

@app.post("/api/rules/evaluate")
def evaluate_custom_payload(payload: Dict[str, Any]):
    """Direct statutory evaluation of raw JSON payload."""
    return evaluate_rules(payload)

@app.get("/api/scans")
def list_scans(
    q: Optional[str] = Query(None, description="Search product name or manufacturer"),
    status: Optional[str] = Query("all", description="all, compliant, non-compliant"),
    region: Optional[str] = Query(None, description="filter by region"),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Returns past scans with search, filter, and audit metadata."""
    query = db.query(ScanRecord)

    if q:
        search = f"%{q}%"
        query = query.filter(
            (ScanRecord.product_name.ilike(search)) |
            (ScanRecord.manufacturer.ilike(search)) |
            (ScanRecord.id.ilike(search))
        )

    if status == "compliant":
        query = query.filter(ScanRecord.is_compliant == True)
    elif status == "non-compliant":
        query = query.filter(ScanRecord.is_compliant == False)

    if region and region != "All India":
        query = query.filter(ScanRecord.region == region)

    records = query.order_by(desc(ScanRecord.created_at)).limit(limit).all()

    return [
        {
            "id": r.id,
            "created_at": r.created_at.strftime("%d %b %Y, %H:%M IST"),
            "product_name": r.product_name,
            "manufacturer": r.manufacturer,
            "region": getattr(r, "region", "Delhi NCT"),
            "is_compliant": r.is_compliant,
            "hard_violations_count": r.hard_violations_count,
            "advisories_count": r.advisories_count,
            "pdf_url": f"/api/scans/{r.id}/pdf"
        }
        for r in records
    ]

@app.get("/api/scans/export/csv")
@app.get("/api/scans/export.csv")
def export_scans_csv(db: Session = Depends(get_db)):
    """Exports all surveillance audit records as a downloadable CSV."""
    records = db.query(ScanRecord).order_by(desc(ScanRecord.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Scan ID", "Audit Timestamp", "Product Name", "Manufacturer", "Region",
        "Compliance Status", "Hard Violations", "Advisories",
        "MRP (INR)", "Tax Inclusivity", "Declared Net Qty", "PIN Code Present", "Mfg Date"
    ])
    for r in records:
        ext = r.extracted_data or {}
        writer.writerow([
            r.id,
            r.created_at.strftime("%Y-%m-%d %H:%M"),
            r.product_name,
            r.manufacturer or "N/A",
            getattr(r, "region", "Delhi NCT"),
            "COMPLIANT" if r.is_compliant else "NON-COMPLIANT",
            r.hard_violations_count,
            r.advisories_count,
            ext.get("mrp", {}).get("value", "N/A"),
            "YES" if ext.get("mrp", {}).get("is_tax_inclusive") else "NO",
            f"{ext.get('net_quantity', {}).get('value', '')} {ext.get('net_quantity', {}).get('unit', '')}".strip(),
            "YES" if ext.get("has_pin_code") else "NO",
            ext.get("mfg_date", {}).get("raw_string", "N/A")
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=TraceX_Surveillance_Records.csv"}
    )

@app.get("/api/scans/{scan_id}")
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    """Retrieves detailed record for a specific scan."""
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan record not found")
    
    return {
        "id": record.id,
        "created_at": record.created_at.strftime("%d %b %Y, %H:%M IST"),
        "product_name": record.product_name,
        "manufacturer": record.manufacturer,
        "is_compliant": record.is_compliant,
        "hard_violations_count": record.hard_violations_count,
        "advisories_count": record.advisories_count,
        "extracted_data": record.extracted_data,
        "evaluation_result": record.evaluation_result,
        "pdf_url": f"/api/scans/{record.id}/pdf"
    }

@app.get("/api/scans/{scan_id}/pdf")
def download_scan_pdf(scan_id: str, db: Session = Depends(get_db)):
    """Downloads or streams compliance report PDF, regenerating on the fly if needed."""
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan record not found")
    
    pdf_filename = record.pdf_filename or f"{record.id}_audit_report.pdf"
    filepath = os.path.join(REPORTS_DIR, pdf_filename)
    if not os.path.exists(filepath):
        try:
            os.makedirs(REPORTS_DIR, exist_ok=True)
            created_str = (
                record.created_at.strftime("%d %b %Y, %H:%M IST")
                if hasattr(record.created_at, "strftime")
                else str(record.created_at)
            )
            scan_meta = {
                "id": record.id,
                "created_at": created_str,
                "product_name": record.product_name,
                "manufacturer": record.manufacturer,
                "is_compliant": record.is_compliant,
                "evaluation_result": record.evaluation_result or {}
            }
            pdf_bytes = generate_compliance_report_pdf(scan_meta)
            with open(filepath, "wb") as f:
                f.write(pdf_bytes)
            if not record.pdf_filename:
                record.pdf_filename = pdf_filename
                db.commit()
        except Exception as ex:
            print(f"[PDF-REGEN] Error regenerating scan report PDF: {ex}")
            raise HTTPException(status_code=404, detail="PDF report could not be loaded from storage")
    
    return FileResponse(filepath, media_type="application/pdf", filename=pdf_filename)

@app.post("/api/notices/generate")
def create_formal_notice(
    scan_id: str = Form(...),
    recipient_email: str = Form(...),
    company_name: Optional[str] = Form(None),
    response_deadline: Optional[str] = Form("15 Calendar Days"),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Generates an official Show-Cause Notice under Section 36(1),
    signs it cryptographically with RSA-2048, records hash, and emails company.
    """
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")

    notice_id = f"NOT-2026-{uuid.uuid4().hex[:4].upper()}"
    comp_name = company_name or scan.manufacturer or "Packaged Commodity Manufacturer"

    # Extract violations from scan evaluation
    eval_res = scan.evaluation_result or {}
    checks = eval_res.get("checks", [])
    violations = [c for c in checks if c.get("status") == "fail"]

    notice_meta = {
        "id": notice_id,
        "scan_id": scan_id,
        "product_name": scan.product_name,
        "company_name": comp_name,
        "recipient_email": recipient_email,
        "issued_at": datetime.now().strftime("%d %B %Y"),
        "response_deadline": response_deadline or "15 Calendar Days",
        "inspector_ref": "INSP/DOCA/DEL/2026/049",
        "violations": violations
    }

    # Step 1: Generate Notice PDF
    pdf_bytes = generate_formal_notice_pdf(notice_meta)
    pdf_filename = f"{notice_id}_Show_Cause_Notice.pdf"
    pdf_filepath = os.path.join(NOTICES_DIR, pdf_filename)
    with open(pdf_filepath, "wb") as f:
        f.write(pdf_bytes)

    # Step 2: Cryptographically sign PDF bytes with RSA-2048 + SHA-256
    crypto_meta = sign_document_bytes(pdf_bytes)
    sha256_hash = crypto_meta["sha256_hash"]
    signature_hex = crypto_meta["signature_hex"]

    # Step 3: Record in DB
    notice_record = FormalNoticeRecord(
        id=notice_id,
        scan_id=scan_id,
        recipient_email=recipient_email,
        company_name=comp_name,
        response_deadline=response_deadline or "15 Calendar Days",
        inspector_ref="INSP/DOCA/DEL/2026/049",
        sha256_hash=sha256_hash,
        signature_hex=signature_hex,
        pdf_filename=pdf_filename,
        status="ISSUED",
        notes=notes
    )
    db.add(notice_record)
    db.commit()
    db.refresh(notice_record)

    # Step 4: Dispatch Email with PDF attachment & verification instructions
    email_result = send_formal_notice_email(
        recipient_email=recipient_email,
        company_name=comp_name,
        notice_id=notice_id,
        pdf_bytes=pdf_bytes,
        sha256_hash=sha256_hash,
        signature_hex=signature_hex,
        response_deadline=response_deadline
    )

    return {
        "notice_id": notice_id,
        "scan_id": scan_id,
        "company_name": comp_name,
        "recipient_email": recipient_email,
        "issued_at": notice_record.issued_at.strftime("%d %b %Y, %H:%M IST"),
        "response_deadline": notice_record.response_deadline,
        "sha256_hash": sha256_hash,
        "signature_hex": signature_hex,
        "pdf_url": f"/api/notices/{notice_id}/pdf",
        "email_status": email_result,
        "verification_instructions": "To verify authenticity, upload notice PDF to the TraceX Notice Verification Portal."
    }

@app.get("/api/notices")
def list_notices(db: Session = Depends(get_db)):
    """Returns notice history with cryptographic verification hashes."""
    notices = db.query(FormalNoticeRecord).order_by(desc(FormalNoticeRecord.issued_at)).all()
    return [
        {
            "id": n.id,
            "scan_id": n.scan_id,
            "recipient_email": n.recipient_email,
            "company_name": n.company_name,
            "issued_at": n.issued_at.strftime("%d %b %Y, %H:%M IST"),
            "response_deadline": n.response_deadline,
            "sha256_hash": n.sha256_hash,
            "signature_hex": n.signature_hex,
            "status": n.status,
            "pdf_url": f"/api/notices/{n.id}/pdf"
        }
        for n in notices
    ]

@app.patch("/api/notices/{notice_id}/status")
@app.post("/api/notices/{notice_id}/status")
def update_notice_status(
    notice_id: str,
    status_payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Updates formal notice lifecycle status (ISSUED -> ACKNOWLEDGED -> RESPONDED -> RESOLVED / ESCALATED)."""
    record = db.query(FormalNoticeRecord).filter(FormalNoticeRecord.id == notice_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Formal notice record not found")

    new_status = (status_payload.get("status") or record.status).upper()
    valid_statuses = {"ISSUED", "ACKNOWLEDGED", "RESPONDED", "RESOLVED", "ESCALATED"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{new_status}'. Allowed: {valid_statuses}")

    record.status = new_status
    db.commit()
    return {
        "id": record.id,
        "status": record.status,
        "updated_at": datetime.now().strftime("%d %b %Y, %H:%M IST"),
        "message": f"Notice status updated to {record.status}"
    }

@app.get("/api/notices/{notice_id}/pdf")
def download_notice_pdf(notice_id: str, db: Session = Depends(get_db)):
    """Downloads or views formal notice PDF, regenerating on the fly if needed."""
    record = db.query(FormalNoticeRecord).filter(FormalNoticeRecord.id == notice_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Notice record not found")
    
    pdf_filename = record.pdf_filename or f"{record.id}_Show_Cause_Notice.pdf"
    filepath = os.path.join(NOTICES_DIR, pdf_filename)
    if not os.path.exists(filepath):
        try:
            os.makedirs(NOTICES_DIR, exist_ok=True)
            scan = db.query(ScanRecord).filter(ScanRecord.id == record.scan_id).first()
            eval_res = (scan.evaluation_result or {}) if scan else {}
            checks = eval_res.get("checks", [])
            violations = [c for c in checks if c.get("status") == "fail"]
            issued_str = (
                record.issued_at.strftime("%d %B %Y")
                if hasattr(record.issued_at, "strftime")
                else str(record.issued_at)
            )
            notice_meta = {
                "id": record.id,
                "scan_id": record.scan_id,
                "product_name": scan.product_name if scan else "Packaged Commodity",
                "company_name": record.company_name,
                "recipient_email": record.recipient_email,
                "issued_at": issued_str,
                "response_deadline": record.response_deadline or "15 Calendar Days",
                "inspector_ref": record.inspector_ref or "INSP/DOCA/DEL/2026/049",
                "violations": violations
            }
            pdf_bytes = generate_formal_notice_pdf(notice_meta)
            with open(filepath, "wb") as f:
                f.write(pdf_bytes)
            if not record.pdf_filename:
                record.pdf_filename = pdf_filename
                db.commit()
        except Exception as ex:
            print(f"[PDF-REGEN] Error regenerating notice PDF: {ex}")
            raise HTTPException(status_code=404, detail="Notice PDF file could not be loaded from storage")
    
    return FileResponse(filepath, media_type="application/pdf", filename=pdf_filename)

@app.post("/api/notices/verify")
async def verify_notice_document(
    file: UploadFile = File(...),
    signature_hex: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Public Document Verification Endpoint:
    Accepts an uploaded notice PDF, computes its exact SHA-256 byte digest,
    and verifies the digital signature using the Department's RSA-2048 public key.
    """
    pdf_bytes = await file.read()
    computed_hash = compute_sha256(pdf_bytes)

    # Search for record matching hash in database
    notice = db.query(FormalNoticeRecord).filter(FormalNoticeRecord.sha256_hash == computed_hash).first()

    target_signature = signature_hex
    if not target_signature and notice:
        target_signature = notice.signature_hex

    if not target_signature:
        # Check if file has any match or if it's altered
        return {
            "is_valid": False,
            "sha256_hash": computed_hash,
            "error": "UNRECOGNIZED_DOCUMENT",
            "message": "⚠️ This document was not found in the official Legal Metrology registry or has been altered.",
            "notice_id": None
        }

    # Verify signature against uploaded bytes
    verification = verify_document_bytes(pdf_bytes, target_signature)

    if verification["is_valid"]:
        return {
            "is_valid": True,
            "sha256_hash": computed_hash,
            "notice_id": notice.id if notice else "VERIFIED_DOC",
            "company_name": notice.company_name if notice else "Verified Entity",
            "issued_at": notice.issued_at.strftime("%d %b %Y") if notice else "Official Date",
            "authority": "Department of Consumer Affairs (DoCA), Government of India",
            "message": "✔ Official Legal Metrology Show-Cause Notice verified authentic. Document bytes have not been tampered with."
        }
    else:
        return {
            "is_valid": False,
            "sha256_hash": computed_hash,
            "notice_id": notice.id if notice else None,
            "error": verification["error"],
            "message": "⚠️ This document may have been altered — signature invalid. Byte content does not match the authority signature."
        }

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    region: Optional[str] = Query(None, description="Filter dashboard by state/region"),
    db: Session = Depends(get_db)
):
    """
    Aggregated compliance analytics formatted for Recharts with Repeat Offender ranking and Region filters.
    """
    query = db.query(ScanRecord)
    if region and region != "All India":
        query = query.filter(ScanRecord.region == region)

    total_scans = query.count()
    compliant_scans = query.filter(ScanRecord.is_compliant == True).count()
    non_compliant_scans = query.filter(ScanRecord.is_compliant == False).count()
    total_notices = db.query(FormalNoticeRecord).count()

    # Calculate violation breakdown across scans
    violation_counts = {
        "Rule 6(1)(f) Tax Clause": 0,
        "Rule 6(1)(a) Incomplete PIN/Addr": 0,
        "Rule 6(1)(d) Missing Mfg Date": 0,
        "2022 Amend Consumer Email": 0,
        "Rule 12 Non-Standard 'gms'": 0,
        "Rule 9 Font Size Undersized": 0
    }

    # Repeat Offenders tracking
    mfg_offenders = {}

    scans = query.all()
    for s in scans:
        checks = (s.evaluation_result or {}).get("checks", [])
        mfg = s.manufacturer or "Unspecified Manufacturer"
        
        if not s.is_compliant:
            if mfg not in mfg_offenders:
                mfg_offenders[mfg] = {
                    "manufacturer": mfg,
                    "violations_count": 0,
                    "scans_count": 0,
                    "primary_defect": "Rule 6(1) Deficiencies",
                    "region": getattr(s, "region", "Delhi NCT"),
                    "scan_ids": []
                }
            mfg_offenders[mfg]["scans_count"] += 1
            mfg_offenders[mfg]["scan_ids"].append(s.id)

        for c in checks:
            if c.get("status") == "fail":
                rid = c.get("rule_id", "")
                if not s.is_compliant and mfg in mfg_offenders:
                    mfg_offenders[mfg]["violations_count"] += 1
                    mfg_offenders[mfg]["primary_defect"] = c.get("rule_description", "Rule 6(1)")

                if "6_1_f" in rid:
                    violation_counts["Rule 6(1)(f) Tax Clause"] += 1
                elif "6_1_a" in rid:
                    violation_counts["Rule 6(1)(a) Incomplete PIN/Addr"] += 1
                elif "6_1_d" in rid:
                    violation_counts["Rule 6(1)(d) Missing Mfg Date"] += 1
                elif "consumer" in rid:
                    violation_counts["2022 Amend Consumer Email"] += 1
                elif "6_1_b" in rid:
                    violation_counts["Rule 12 Non-Standard 'gms'"] += 1
                elif "font" in rid:
                    violation_counts["Rule 9 Font Size Undersized"] += 1

    repeat_offenders = sorted(
        list(mfg_offenders.values()),
        key=lambda x: (x["violations_count"], x["scans_count"]),
        reverse=True
    )

    chart_data = [
        {"rule": k, "count": v}
        for k, v in violation_counts.items()
    ]

    compliance_ratio = [
        {"name": "Compliant", "value": compliant_scans, "color": "#059669"},
        {"name": "Non-Compliant", "value": non_compliant_scans, "color": "#DC2626"}
    ]

    rate = round((compliant_scans / total_scans * 100), 1) if total_scans > 0 else 100.0

    return {
        "total_scans": total_scans,
        "compliant_scans": compliant_scans,
        "non_compliant_scans": non_compliant_scans,
        "compliance_rate": rate,
        "total_notices_sent": total_notices,
        "violation_breakdown": chart_data,
        "compliance_ratio": compliance_ratio,
        "repeat_offenders": repeat_offenders,
        "selected_region": region or "All India",
        "regions_available": ["All India", "Delhi NCT", "Maharashtra", "Karnataka", "West Bengal", "Rajasthan"]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting TraceX Production Engine on 0.0.0.0:{port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

