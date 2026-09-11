"""
Email Service with Multi-Protocol Dispatch & Digital Signature Attachment
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)

Sends official Show-Cause Notices with:
1. Signed Notice PDF attachment
2. Hexadecimal digital signature in body
3. SHA-256 integrity hash
4. Verification instructions via TraceX portal

Supported Transmission Protocols:
- Resend REST API (HTTPS port 443 - zero cloud firewall port blocks)
- Brevo REST API (HTTPS port 443)
- Authenticated SMTP over SSL (Port 465) with IPv4 enforcement
- Authenticated SMTP with STARTTLS (Port 587) with IPv4 enforcement
- Sandbox Audit Log simulation when credentials are omitted
"""

import os
import base64
import json
import socket
import smtplib
import ssl
import urllib.request
import urllib.error
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Subclasses of smtplib that strictly enforce IPv4 (socket.AF_INET)
# This prevents "[Errno 101] Network is unreachable" caused by dual-stack DNS
# resolving IPv6 addresses first on Docker/Linux container hosts with no IPv6 gateway.
class IPv4SMTP(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        for res in socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM):
            af, socktype, proto, canonname, sa = res
            sock = socket.socket(af, socktype, proto)
            if timeout is not None:
                sock.settimeout(timeout)
            try:
                sock.connect(sa)
                return sock
            except OSError:
                sock.close()
        raise OSError(101, f"Network is unreachable (IPv4 socket to {host}:{port} failed)")


class IPv4SMTP_SSL(smtplib.SMTP_SSL):
    def _get_socket(self, host, port, timeout):
        for res in socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM):
            af, socktype, proto, canonname, sa = res
            sock = socket.socket(af, socktype, proto)
            if timeout is not None:
                sock.settimeout(timeout)
            try:
                sock.connect(sa)
                return self.context.wrap_socket(sock, server_hostname=self._host)
            except OSError:
                sock.close()
        raise OSError(101, f"Network is unreachable (IPv4 SSL socket to {host}:{port} failed)")


def send_via_resend_api(
    api_key: str,
    from_email: str,
    recipient_email: str,
    subject: str,
    body_html: str,
    notice_id: str,
    pdf_bytes: bytes
) -> Dict[str, Any]:
    """Dispatches email via Resend HTTPS REST API (Port 443, never blocked by cloud firewalls)."""
    sender = from_email if ("@" in from_email and not "gmail.com" in from_email.lower()) else "TraceX Legal Metrology <onboarding@resend.dev>"
    payload = {
        "from": sender,
        "to": [recipient_email],
        "subject": subject,
        "html": body_html,
        "attachments": [
            {
                "filename": f"{notice_id}_Show_Cause_Notice.pdf",
                "content": base64.b64encode(pdf_bytes).decode("ascii")
            }
        ]
    }
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json",
            "User-Agent": "TraceX-Legal-Metrology/1.0"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        return {
            "success": True,
            "mode": "LIVE_HTTPS_RESEND",
            "recipient": recipient_email,
            "message": f"Statutory notice emailed successfully to {recipient_email} via Resend HTTPS API (Port 443). Resend ID: {res_data.get('id', 'sent')}"
        }


def send_via_brevo_api(
    api_key: str,
    from_email: str,
    recipient_email: str,
    subject: str,
    body_html: str,
    notice_id: str,
    pdf_bytes: bytes
) -> Dict[str, Any]:
    """Dispatches email via Brevo HTTPS REST API (Port 443)."""
    sender_email = from_email or "notices@consumerhelpline.gov.in"
    payload = {
        "sender": {"name": "TraceX Legal Metrology", "email": sender_email},
        "to": [{"email": recipient_email}],
        "subject": subject,
        "htmlContent": body_html,
        "attachment": [
            {
                "name": f"{notice_id}_Show_Cause_Notice.pdf",
                "content": base64.b64encode(pdf_bytes).decode("ascii")
            }
        ]
    }
    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": api_key.strip(),
            "Content-Type": "application/json",
            "User-Agent": "TraceX-Legal-Metrology/1.0"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return {
            "success": True,
            "mode": "LIVE_HTTPS_BREVO",
            "recipient": recipient_email,
            "message": f"Statutory notice emailed successfully to {recipient_email} via Brevo HTTPS API (Port 443)."
        }


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
    Supports Resend / Brevo over HTTPS (Port 443) and direct SMTP with IPv4 + Port 465/587 fallback.
    """
    load_dotenv()
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_pass = os.environ.get("SMTP_PASS", "").replace(" ", "").strip()
    from_email = os.environ.get("FROM_EMAIL", "").strip()
    resend_api_key = os.environ.get("RESEND_API_KEY", "").strip()
    brevo_api_key = os.environ.get("BREVO_API_KEY", "").strip()

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
          This communication is delivered over an authenticated, cryptographically signed channel.
          Issued under the authority of the Controller of Legal Metrology, Government of India.
        </div>
      </div>
    </body>
    </html>
    """

    # Priority 1: Resend HTTPS API (Port 443 - zero firewall blocks on Render/Vercel)
    if resend_api_key:
        try:
            return send_via_resend_api(
                resend_api_key, from_email, recipient_email, subject, body_html, notice_id, pdf_bytes
            )
        except Exception as resend_err:
            print(f"[EMAIL] Resend API failed: {resend_err}. Falling back to other channels.")

    # Priority 2: Brevo HTTPS API (Port 443)
    if brevo_api_key:
        try:
            return send_via_brevo_api(
                brevo_api_key, from_email, recipient_email, subject, body_html, notice_id, pdf_bytes
            )
        except Exception as brevo_err:
            print(f"[EMAIL] Brevo API failed: {brevo_err}. Falling back to other channels.")

    # Priority 3: Direct SMTP with IPv4 and Dual-Port Fallback (Port 465 SSL & Port 587 STARTTLS)
    if smtp_user and smtp_pass:
        msg = MIMEMultipart('mixed')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = recipient_email

        html_part = MIMEText(body_html, 'html')
        msg.attach(html_part)

        pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename=f"{notice_id}_Show_Cause_Notice.pdf")
        msg.attach(pdf_attachment)

        ports_to_try = [465, 587] if smtp_port in (465, 587) else [smtp_port, 465, 587]
        errors = []

        for port in ports_to_try:
            try:
                if port == 465:
                    server = IPv4SMTP_SSL(smtp_host, 465, timeout=10)
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
                    server.quit()
                    return {
                        "success": True,
                        "mode": "LIVE_SMTP_SSL",
                        "recipient": recipient_email,
                        "message": f"Statutory notice emailed successfully to {recipient_email} via authenticated SMTP over SSL (Port 465)."
                    }
                else:
                    server = IPv4SMTP(smtp_host, port, timeout=10)
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
                    server.quit()
                    return {
                        "success": True,
                        "mode": "LIVE_SMTP_TLS",
                        "recipient": recipient_email,
                        "message": f"Statutory notice emailed successfully to {recipient_email} via authenticated SMTP with STARTTLS (Port {port})."
                    }
            except Exception as e:
                errors.append(f"Port {port} ({type(e).__name__}: {str(e)})")

        error_summary = " | ".join(errors)
        is_cloud_block = any(k in error_summary.lower() for k in ["101", "unreachable", "timed out", "timeout", "refused"])

        advice = ""
        if is_cloud_block:
            advice = (
                " Note: Cloud hosting platforms (like Render Free Tier) frequently block outbound TCP ports 25, 465, and 587 to prevent spam abuse. "
                "The legal notice PDF was successfully signed with RSA-2048 and registered in the database. "
                "To deliver live emails from Render over open HTTPS (Port 443), add a free RESEND_API_KEY in Render Environment Variables."
            )

        return {
            "success": False,
            "mode": "LIVE_SMTP_ERROR",
            "error": error_summary,
            "message": f"Failed to send email via SMTP: {error_summary}.{advice}"
        }
    else:
        # Development / Hackathon local simulation mode
        return {
            "success": True,
            "mode": "SIMULATED_AUDIT_LOG",
            "recipient": recipient_email,
            "message": f"[PROTOTYPE AUDIT LOG] Notice {notice_id} recorded in audit database. Live email delivery to {recipient_email} simulated because SMTP or RESEND credentials are not set."
        }

