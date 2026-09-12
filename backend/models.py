"""
SQLAlchemy ORM Models
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    badge_number = Column(String(100), unique=True, index=True, nullable=False)
    designation = Column(String(100), default="Legal Metrology Officer", nullable=False)
    jurisdiction = Column(String(100), default="National Directorate", nullable=False)
    role = Column(String(50), default="inspector", nullable=False)  # "admin" or "inspector"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ScanRecord(Base):
    __tablename__ = "scans"

    id = Column(String(32), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    product_name = Column(String(255), nullable=False, default="Inspected Commodity")
    manufacturer = Column(String(255), nullable=True)
    image_filename = Column(String(255), nullable=True)
    extracted_data = Column(JSON, nullable=False)
    is_compliant = Column(Boolean, default=False, index=True)
    hard_violations_count = Column(Integer, default=0)
    advisories_count = Column(Integer, default=0)
    region = Column(String(100), default="Delhi NCT", index=True)
    evaluation_result = Column(JSON, nullable=False)
    pdf_filename = Column(String(255), nullable=True)

    notices = relationship("FormalNoticeRecord", back_populates="scan", cascade="all, delete-orphan")

class FormalNoticeRecord(Base):
    __tablename__ = "formal_notices"

    id = Column(String(32), primary_key=True, index=True)
    scan_id = Column(String(32), ForeignKey("scans.id"), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, index=True)
    response_deadline = Column(String(100), default="15 Calendar Days")
    inspector_ref = Column(String(100), default="INSP/DOCA/DEL/2026/049")
    sha256_hash = Column(String(64), nullable=False, index=True)
    signature_hex = Column(Text, nullable=False)
    pdf_filename = Column(String(255), nullable=False)
    status = Column(String(50), default="ISSUED")  # ISSUED, DELIVERED, VERIFIED, TAMPERED
    notes = Column(Text, nullable=True)

    scan = relationship("ScanRecord", back_populates="notices")
