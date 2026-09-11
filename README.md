# [TraceX] — Legal Metrology Label Compliance Scanner (SIH26034)

> **Official Prototype for Smart India Hackathon (SIH26034)**  
> **Organisation**: Ministry of Consumer Affairs, Food & Public Distribution → Department of Consumer Affairs (DoCA)  
> **Theme**: Agriculture, FoodTech & Rural Development | **Category**: Software  
> **Statutory Citation**: Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011)

A full-stack compliance platform that scans packaged commodity labels, validates them against India's **Legal Metrology (Packaged Commodities) Rules 2011** and **2022 Amendments**, and serves two primary audiences through one shared rules engine:
1. **Ordinary Consumers**: Simple card-based interface, big plain-language pass/fail indicators, browser Text-to-Speech (`SpeechSynthesis`), and National Consumer Helpline (NCH 1912) Complaint Helper.
2. **Government Inspectors & Legal Metrology Officers**: Dense technical audit tables, confidence scores, audit-trail scan IDs, persistent left sidebar, Recharts surveillance dashboard, and a **tamper-evident formal notice system** cryptographically signed with RSA-2048 + SHA-256.

---

## 🏗️ Tech Stack

- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 + Recharts + Lucide Icons (mobile-responsive).
- **Backend**: Python 3.14 + FastAPI + Pydantic v2 + SQLAlchemy (SQLite prototype, PostgreSQL-ready).
- **Digital Signing & Cryptography**: Python `cryptography` library (RSA-2048 keypair + SHA-256 hash + PSS padding).
- **Document Generation**: ReportLab (standard A4 printable Compliance Reports & Formal Show-Cause Notices under Section 36(1)).
- **Email Delivery**: SMTP with TLS transport-layer encryption and mock audit fallback.
- **Label Extraction**: Hybrid Vision-LLM extraction layer with deterministic heuristic fallback and confidence scoring.

---

## 🎨 Design System

- **Aesthetic**: Professional regulatory / compliance-tool look (banking / legal-tech precision, not a playful consumer startup).
- **Color Palette**:
  - Deep Navy Primary: `#0F172A` / `#1B2A4A`
  - Background: Off-white `#F8F9FB`
  - Restrained Accents: Amber (`#D97706`) and Teal
  - Strict Status Colors: Green (Compliant / Pass), Red (Violation / Fail), Amber (Advisory / Needs Review)
- **Typography**: Inter / sans-serif with **Monospace** (`JetBrains Mono` / `ui-monospace`) strictly applied to Rule IDs, Scan IDs, and Cryptographic SHA-256 / RSA signatures.

---

## 🚀 Quick Start Guide

### 1. Start the Backend API Server

Open a terminal in the `backend/` directory:

```bash
cd backend
# Activate virtual environment
.\.venv\Scripts\activate
# Start FastAPI server
uvicorn main:app --reload --port 8000
```
API Documentation (Swagger): `http://localhost:8000/docs`  
Health Check: `http://localhost:8000/api/health`

### 2. Start the Frontend Application

Open a second terminal in the `frontend/` directory:

```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Running Automated Unit & Integration Tests

The project includes 17 automated tests verifying rules, RSA signatures, tamper detection, and API endpoints:

```bash
cd backend
.\.venv\Scripts\python -m unittest discover -s tests -p "test_*.py"
```

**Verifies**:
- Rule 6(1)(a) manufacturer address & 6-digit postal PIN validation
- Rule 6(1)(b) & Rule 12 standard metric units & non-standard unit detection (`gms`)
- Rule 6(1)(f) MRP tax inclusivity clause (*"inclusive of all taxes"*)
- Rule 6(1)(d) manufacturing month & year anchor date
- 2022 Amendment consumer care contact (**BOTH** email and phone required)
- QR code digital disclosure validation
- RSA-2048 document signing, SHA-256 digest computation, and byte-level tamper detection
- All FastAPI REST endpoints (`/api/scan`, `/api/scans`, `/api/notices`, `/api/notices/verify`, `/api/dashboard/stats`)

---

## 🌟 Core Features Walkthrough

### 1. Consumer Mode
- **Status Indicator**: Big green/red card with large status icon and plain-language summary.
- **Plain-Language Cards**: Price & Taxes, Net Quantity, Packaging Date, and Customer Care.
- **Audio Read-Aloud**: Text-to-Speech button using the browser `SpeechSynthesis` API.
- **Expandable Guidance**: *"Why does this matter?"* and *"What should I do?"* accordions.
- **Complaint Helper**: For non-compliant scans, prepares an official grievance draft for the **National Consumer Helpline (NCH)** with one-click copy, link to `consumerhelpline.gov.in`, and the **1912** toll-free helpline.

### 2. Inspector / Admin Mode
- **Persistent Left Sidebar Navigation**:
  - `Inspection & Scan`: Ingestion, preset selectors, and dense audit matrix.
  - `Scan History Log`: Searchable database of past audits with status filters and PDF downloads.
  - `Formal Notices`: Dispatched show-cause notices with recipient email, issue date, and verification hash.
  - `Verify Notice Integrity`: Public document authenticity verification tool.
  - `National Dashboard`: Flat/muted Recharts analytics (compliance ratio donut chart, top violations bar chart, and national KPIs).
- **Dense Data Table**: Displays `Rule ID | Statutory Clause | Status | Legal Observation | Severity | Confidence %`.
- **Scan Audit Trail**: Every inspection displays a unique audit ID and timestamp (e.g. `Scan #TRX-A4F291 — 11 Sep 2026, 14:32 IST`).

### 3. Tamper-Evident Formal Notice System
1. When non-compliant packaging is detected, click **"Send Notice to Company"**.
2. An official Show-Cause Notice under Section 36(1) is compiled as an A4 PDF.
3. The exact byte content of the PDF is hashed with **SHA-256**.
4. The hash is digitally signed with the Inspectorate's **RSA-2048 private key**.
5. The notice is dispatched to the company over SMTP with TLS.
6. **Integrity Verification**: Open **"Verify Notice Integrity"** $\rightarrow$ upload the received PDF $\rightarrow$ TraceX re-hashes the PDF and checks the signature against the RSA public key:
   - Valid: `✔ Document Authenticity Verified: Issued by Legal Metrology Inspectorate`
   - Tampered: `⚠️ This document may have been altered — signature invalid`

---

## 🌐 Production Deployment Guide

TraceX is 100% production-ready for zero-cost deployment on **Vercel** (Frontend) and **Render** (Backend + PostgreSQL).

### 1. Database (Render PostgreSQL / Neon / Supabase)
1. Create a free PostgreSQL instance on [Render](https://render.com) or [Neon](https://neon.tech).
2. Copy the connection string (`postgresql://...`).

### 2. Backend Deployment (Render)
1. Create a **New Web Service** connected to your GitHub repository.
2. Settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://tracex.vercel.app`).
   - `GEMINI_API_KEY`: (Optional) Your Google Gemini API key.
   - `SMTP_USER` & `SMTP_PASS`: (Optional) For live Gmail notice delivery.

### 3. Frontend Deployment (Vercel)
1. Import your GitHub repository on [Vercel](https://vercel.com).
2. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://tracex-backend.onrender.com`, without trailing slash).
4. Deploy!

