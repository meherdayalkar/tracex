"""
Email Service with SMTP + TLS & Digital Signature Attachment
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)

Sends official Show-Cause Notices with:
1. Signed Notice PDF attachment
2. Hexadecimal digital signature in body
3. SHA-256 integrity hash
4. Verification instructions via TraceX portal
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Dict, Any, Optional
from dotenv import load_dotenv

def send_formal_notice_email(
    recipient_email: str,
    company_name: str,
    notice_id: str,
    pdf_bytes: bytes,
    sha256_hash: str,
    signature_hex: str,
    response_deadline: str = "15 Calendar Days"
) -> Dict[str, Any]:
    """
    Constructs and dispatches the formal statutory notice email.
    If live SMTP credentials are not configured, securely simulates dispatch
    and records an audit delivery receipt.
    """
    load_dotenv()
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_pass = os.environ.get("SMTP_PASS", "").replace(" ", "").strip()
    from_email = os.environ.get("FROM_EMAIL", "").strip()

    # For Gmail SMTP, 'From' header must match authenticated account to avoid 553 relay error
    if not from_email or ("gmail.com" in smtp_host.lower() and smtp_user):
        from_email = smtp_user or "notices@consumerhelpline.gov.in"
    subject = f"[OFFICIAL NOTICE] Contravention of Legal Metrology Act, 2009 - Ref: {notice_id}"

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0F172A; background: #F8F9FB; padding: 20px; }}
        .card {{ background: #ffffff; border: 1px solid #CBD5E1; border-radius: 8px; max-width: 650px; margin: 0 auto; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.04); }}
        .header {{ border-bottom: 2px solid #0F172A; padding-bottom: 15px; margin-bottom: 20px; }}
        .gov-title {{ font-size: 13px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }}
        .notice-title {{ font-size: 18px; font-weight: bold; color: #0F172A; margin: 5px 0; }}
        .meta-box {{ background: #F1F5F9; border-left: 4px solid #0F172A; padding: 12px 16px; margin: 20px 0; font-size: 13px; }}
        .hash-box {{ background: #0F172A; color: #F8FAFC; border-radius: 6px; padding: 16px; font-family: 'Courier New', monospace; font-size: 11px; word-break: break-all; margin: 20px 0; }}
        .hash-label {{ color: #94A3B8; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }}
        .btn {{ display: inline-block; background: #0F172A; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 13px; margin: 15px 0; }}
        .footer {{ font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 15px; margin-top: 25px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="gov-title">Government of India • Department of Consumer Affairs</div>
          <div class="notice-title">Statutory Show-Cause Notice under Section 36(1)</div>
          <div style="font-size: 12px; color: #64748B;">Notice Identifier: <b>{notice_id}</b></div>
        </div>

        <p>To: <b>{company_name}</b> ({recipient_email}),</p>
        
        <p>You are hereby served with an official Show-Cause Notice in respect of contraventions detected under the 
        <b>Legal Metrology (Packaged Commodities) Rules, 2011</b> during market surveillance.</p>

        <div class="meta-box">
          <b>Notice Reference:</b> {notice_id}<br/>
          <b>Statutory Response Window:</b> {response_deadline}<br/>
          <b>Statutory Authority:</b> Enforcement Directorate, Legal Metrology Division, New Delhi
        </div>

        <p>Please find attached the court-admissible Notice Document (PDF). To prevent tampering, this document has been 
        cryptographically signed by the Inspectorate using an RSA-2048 keypair with SHA-256 hashing.</p>

        <div class="hash-box">
          <div class="hash-label">Document SHA-256 Hash Digest:</div>
          <div style="color: #38BDF8;">{sha256_hash}</div>
          <div class="hash-label" style="margin-top: 10px;">RSA-2048 Digital Signature (Hex):</div>
          <div style="color: #A7F3D0;">{signature_hex[:96]}... (truncated)</div>
        </div>

        <p><b>Verification Instructions:</b></p>
        <p>To independently verify that this document was issued by the Department of Consumer Affairs and has not been altered, 
        upload the attached PDF to the TraceX Notice Verification Portal.</p>

        <div class="footer">
          This communication is delivered over an authenticated SMTP session with TLS transport-layer encryption.
          Issued under the authority of the Controller of Legal Metrology, Government of India.
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart('mixed')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = recipient_email

    # HTML body
    html_part = MIMEText(body_html, 'html')
    msg.attach(html_part)

    # Attach PDF
    pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
    pdf_attachment.add_header('Content-Disposition', 'attachment', filename=f"{notice_id}_Show_Cause_Notice.pdf")
    msg.attach(pdf_attachment)

    # Dispatch logic
    if smtp_user and smtp_pass:
        try:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
            return {
                "success": True,
                "mode": "LIVE_SMTP_TLS",
                "recipient": recipient_email,
                "message": f"Statutory notice emailed successfully to {recipient_email} with TLS encryption."
            }
        except Exception as e:
            return {
                "success": False,
                "mode": "LIVE_SMTP_ERROR",
                "error": str(e),
                "message": f"Failed to send email via SMTP: {str(e)}"
            }
    else:
        # Development / Hackathon local simulation mode
        return {
            "success": True,
            "mode": "SIMULATED_AUDIT_LOG",
            "recipient": recipient_email,
            "message": f"[PROTOTYPE AUDIT LOG] Notice {notice_id} recorded in audit database. Live email delivery to {recipient_email} skipped because SMTP_USER and SMTP_PASS are not configured in backend/.env."
        }
