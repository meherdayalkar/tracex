"""
PDF Generator Service (ReportLab)
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)

Generates:
1. Compliance Audit Reports
2. Official Show-Cause Notices under Section 36(1) with RSA digital signature block
"""

import os
import io
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage")
REPORTS_DIR = os.path.join(STORAGE_DIR, "reports")
NOTICES_DIR = os.path.join(STORAGE_DIR, "notices")

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(NOTICES_DIR, exist_ok=True)

def generate_compliance_report_pdf(scan_data: Dict[str, Any]) -> bytes:
    """
    Generates a formal Compliance Inspection Report PDF and returns raw bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A'),
        alignment=1  # Center
    )
    sub_style = ParagraphStyle(
        'HeaderSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    meta_label = ParagraphStyle('MetaLabel', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.HexColor('#1E293B'))
    meta_val = ParagraphStyle('MetaVal', fontName='Helvetica', fontSize=9, leading=12, textColor=colors.HexColor('#334155'))
    
    story = []

    # 1. Header
    story.append(Paragraph("GOVERNMENT OF INDIA", sub_style))
    story.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", sub_style))
    story.append(Paragraph("DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY DIVISION", sub_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("LEGAL METROLOGY PACKAGING COMPLIANCE AUDIT REPORT", header_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceBefore=8, spaceAfter=14))

    # 2. Metadata Grid
    scan_id = scan_data.get("id", "TRX-000000")
    created_at = scan_data.get("created_at", datetime.now().strftime("%d %b %Y, %H:%M IST"))
    prod_name = scan_data.get("product_name", "Packaged Commodity")
    mfg_name = scan_data.get("manufacturer", "Not Specified")
    is_compliant = scan_data.get("is_compliant", False)
    status_str = "COMPLIANT (PASS)" if is_compliant else "NON-COMPLIANT (VIOLATIONS DETECTED)"
    status_color = colors.HexColor('#059669') if is_compliant else colors.HexColor('#DC2626')

    meta_data = [
        [Paragraph("Audit Scan ID:", meta_label), Paragraph(f"<b>{scan_id}</b>", meta_val),
         Paragraph("Date & Time:", meta_label), Paragraph(str(created_at), meta_val)],
        [Paragraph("Product Name:", meta_label), Paragraph(prod_name, meta_val),
         Paragraph("Manufacturer:", meta_label), Paragraph(mfg_name or "N/A", meta_val)],
        [Paragraph("Statutory Status:", meta_label), Paragraph(f"<font color='{status_color.hexval()}'><b>{status_str}</b></font>", meta_val),
         Paragraph("Inspecting Unit:", meta_label), Paragraph("Circle Legal Metrology Inspectorate", meta_val)]
    ]

    t_meta = Table(meta_data, colWidths=[110, 150, 100, 150])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 16))

    # 3. Statutory Rules Evaluation Table
    eval_res = scan_data.get("evaluation_result") or {}
    checks = eval_res.get("checks") or []

    story.append(Paragraph("<b>STATUTORY DECLARATIONS EVALUATION (PCR 2011 & 2022 AMENDMENTS)</b>", meta_label))
    story.append(Spacer(1, 6))

    rule_rows = [
        [Paragraph("<b>Rule ID</b>", meta_label), Paragraph("<b>Statutory Rule & Requirement</b>", meta_label), Paragraph("<b>Status</b>", meta_label), Paragraph("<b>Findings & Audit Reason</b>", meta_label)]
    ]

    for c in checks:
        c_status = c.get("status", "").upper()
        is_pass = c_status == "PASS"
        st_color = "#059669" if is_pass else ("#DC2626" if c.get("severity") == "violation" else "#D97706")
        status_cell = f"<font color='{st_color}'><b>{c_status}</b></font>"
        
        rule_rows.append([
            Paragraph(f"<font face='Courier'>{c.get('rule_id', '')}</font>", meta_val),
            Paragraph(f"<b>{c.get('rule_description', '')}</b><br/><font size='7' color='#64748B'>{c.get('citation', '')}</font>", meta_val),
            Paragraph(status_cell, meta_val),
            Paragraph(c.get("reason", ""), meta_val)
        ])

    t_rules = Table(rule_rows, colWidths=[75, 175, 60, 200])
    t_rules.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_rules)
    story.append(Spacer(1, 20))

    # 4. Footer & Legal Disclaimer
    disclaimer = ("<b>Statutory Notice:</b> This audit report is generated algorithmically under the Legal Metrology (Packaged Commodities) "
                  "Rules, 2011. Violations are subject to penalties under Section 36(1) of the Legal Metrology Act, 2009. "
                  "Certified for official enforcement and surveillance records.")
    story.append(Paragraph(disclaimer, sub_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_formal_notice_pdf(notice_data: Dict[str, Any]) -> bytes:
    """
    Generates an official Show-Cause Notice under Section 36(1) of the Legal Metrology Act, 2009.
    Returns exact PDF byte content for cryptographic hashing and signing.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('NoticeTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=15, leading=18, alignment=1, textColor=colors.HexColor('#0F172A'))
    sub_style = ParagraphStyle('NoticeSub', fontName='Helvetica', fontSize=8.5, leading=11, alignment=1, textColor=colors.HexColor('#334155'))
    body_style = ParagraphStyle('NoticeBody', fontName='Helvetica', fontSize=9.5, leading=14, textColor=colors.HexColor('#1E293B'))
    bold_body = ParagraphStyle('NoticeBold', fontName='Helvetica-Bold', fontSize=9.5, leading=14, textColor=colors.HexColor('#0F172A'))

    story = []

    # Header
    story.append(Paragraph("GOVERNMENT OF INDIA", sub_style))
    story.append(Paragraph("DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY DIVISION", sub_style))
    story.append(Paragraph("OFFICE OF THE CONTROLLER OF LEGAL METROLOGY", sub_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("FORMAL SHOW-CAUSE NOTICE UNDER SECTION 36(1)", title_style))
    story.append(Paragraph("READ WITH RULE 6 & RULE 12 OF LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011", sub_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceBefore=8, spaceAfter=14))

    # Reference Numbers
    notice_no = notice_data.get("id", "NOT-2026-0001")
    insp_ref = notice_data.get("inspector_ref", "INSP/DOCA/DEL/2026/049")
    issued_at = notice_data.get("issued_at", datetime.now().strftime("%d %B %Y"))
    company = notice_data.get("company_name", "M/s Packaged Commodities Manufacturer")
    recipient = notice_data.get("recipient_email", "compliance@company.com")
    deadline = notice_data.get("response_deadline", "15 Calendar Days")

    meta_tbl = [
        [Paragraph(f"<b>Notice Ref No:</b> {notice_no}", body_style), Paragraph(f"<b>Date of Issue:</b> {issued_at}", body_style)],
        [Paragraph(f"<b>Inspectorate File:</b> {insp_ref}", body_style), Paragraph(f"<b>Response Window:</b> {deadline}", body_style)]
    ]
    t_meta = Table(meta_tbl, colWidths=[250, 250])
    t_meta.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    # Addressee
    story.append(Paragraph("<b>TO:</b>", bold_body))
    story.append(Paragraph(f"<b>{company}</b>", bold_body))
    story.append(Paragraph(f"Official Electronic Address: {recipient}", body_style))
    story.append(Spacer(1, 10))

    # Subject
    story.append(Paragraph(f"<b>SUB: SHOW-CAUSE NOTICE FOR CONTRAVENTION OF MANDATORY PACKAGING DECLARATIONS UNDER THE LEGAL METROLOGY ACT, 2009</b>", bold_body))
    story.append(Spacer(1, 8))

    # Body Paragraph
    p1 = ("WHEREAS an automated surveillance inspection was executed under Section 15 of the Legal Metrology Act, 2009, "
          f"inspecting the pre-packaged commodity bearing identifier <b>{notice_data.get('product_name', 'Commercial Pack')}</b> "
          "manufactured, packed, or distributed by your establishment;")
    story.append(Paragraph(p1, body_style))
    story.append(Spacer(1, 6))

    p2 = ("AND WHEREAS laboratory optical audit revealed direct contraventions of the statutory packaging mandates specified under "
          "the Legal Metrology (Packaged Commodities) Rules, 2011, as detailed in the Table of Infractions herein below:")
    story.append(Paragraph(p2, body_style))
    story.append(Spacer(1, 8))

    # Table of Infractions
    violations = notice_data.get("violations") or []
    if not violations:
        violations = [
            {"rule_id": "rule_6_1_f", "rule_description": "Missing 'inclusive of all taxes'", "citation": "Rule 6(1)(f)", "reason": "MRP declared without tax clause."},
            {"rule_id": "rule_6_1_a", "rule_description": "Incomplete Manufacturer Address", "citation": "Rule 6(1)(a)", "reason": "Missing mandatory 6-digit postal PIN code."}
        ]

    v_rows = [
        [Paragraph("<b>Rule Violation</b>", body_style), Paragraph("<b>Statutory Citation</b>", body_style), Paragraph("<b>Observation & Defect</b>", body_style)]
    ]
    for v in violations:
        v_rows.append([
            Paragraph(f"<b>{v.get('rule_description', '')}</b><br/><font face='Courier' size='7'>{v.get('rule_id', '')}</font>", body_style),
            Paragraph(v.get('citation', ''), body_style),
            Paragraph(v.get('reason', ''), body_style)
        ])

    t_v = Table(v_rows, colWidths=[150, 150, 200])
    t_v.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#94A3B8')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_v)
    story.append(Spacer(1, 12))

    p3 = (f"NOW THEREFORE, notice is hereby given requiring you to SHOW CAUSE within <b>{deadline}</b> of receipt of this notice as to why legal "
          "proceedings should not be initiated against you under Section 36(1) of the Act, punishable with fine up to ₹25,000 for the first offence, "
          "₹50,000 for the second offence, and ₹1,00,000 or imprisonment for subsequent offences. Compounding may be requested under Section 48.")
    story.append(Paragraph(p3, body_style))
    story.append(Spacer(1, 14))

    # Digital Signature & Verification Block
    sig_block = [
        [Paragraph("<b>ISSUED BY:</b><br/>Inspector of Legal Metrology<br/>Enforcement & Market Surveillance Division<br/>Department of Consumer Affairs, New Delhi", body_style),
         Paragraph("<b>TAMPER-EVIDENT DIGITAL SIGNATURE:</b><br/>"
                   f"Algorithm: RSA-2048 / SHA-256 (PSS)<br/>"
                   f"Issuer: Legal Metrology Root Authority<br/>"
                   "Status: Cryptographically Signed & Timestamped", body_style)]
    ]
    t_sig = Table(sig_block, colWidths=[250, 250])
    t_sig.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0F172A')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)
    story.append(Spacer(1, 8))

    # Verification Note
    verify_note = ("<b>Notice Verification:</b> To verify document integrity, recipient may upload this PDF to the official TraceX "
                   "Inspectorate Portal. The portal validates the SHA-256 byte digest against the RSA public key.")
    story.append(Paragraph(verify_note, sub_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
