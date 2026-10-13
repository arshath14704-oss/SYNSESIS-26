import hmac
import hashlib
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from app.schemas import (
    BuyerAcceptanceLinkResponse,
    BuyerAcceptancePublicInfo,
    BuyerAcceptanceDecisionResponse,
    BuyerAcceptanceStatusResponse,
)
from app.services.audit_ledger import record_audit_event

DEMO_SIGNING_SECRET = b"invoicetrust_buyer_acceptance_secret_demo_key_2026"

def create_acceptance_signature(invoice_id: str, decision: str, timestamp: str) -> str:
    """Signs the buyer decision over canonical values using HMAC-SHA256."""
    payload = f"{invoice_id}:{decision}:{timestamp}".encode("utf-8")
    return hmac.new(DEMO_SIGNING_SECRET, payload, hashlib.sha256).hexdigest()

def generate_acceptance_link(conn: sqlite3.Connection, invoice_id: str) -> BuyerAcceptanceLinkResponse:
    """Generates a secure 48-hour unique token for the buyer confirmation portal."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM invoices WHERE id = ?", (invoice_id,))
    if not cursor.fetchone():
        raise ValueError(f"Invoice with ID {invoice_id} not found.")

    token = secrets.token_urlsafe(32)
    new_id = f"ba_{uuid.uuid4().hex[:8]}"
    expires_at = (datetime.utcnow() + timedelta(hours=48)).isoformat() + "Z"
    created_at = datetime.utcnow().isoformat() + "Z"

    cursor.execute("""
    INSERT INTO buyer_acceptances (id, invoice_id, token, decision, created_at, expires_at)
    VALUES (?, ?, ?, 'PENDING', ?, ?)
    """, (new_id, invoice_id, token, created_at, expires_at))

    return BuyerAcceptanceLinkResponse(
        id=new_id,
        invoice_id=invoice_id,
        token=token,
        url=f"/accept/{token}",
        expires_at=expires_at,
        decision="PENDING"
    )

def get_acceptance_by_token(conn: sqlite3.Connection, token: str) -> Tuple[Optional[BuyerAcceptancePublicInfo], int, Optional[str]]:
    """Fetches non-sensitive invoice public information for the buyer portal or returns 404/410."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM buyer_acceptances WHERE token = ?", (token,))
    row = cursor.fetchone()
    if not row:
        return None, 404, "Invalid or unknown acceptance token."

    acceptance = dict(row)

    # Check if already decided
    if acceptance["decision"] != "PENDING":
        return None, 410, f"This invoice confirmation has already been recorded as '{acceptance['decision']}' on {acceptance.get('decided_at', 'earlier')}."

    # Check expiration
    expires_str = acceptance["expires_at"].rstrip("Z")
    try:
        expires_dt = datetime.fromisoformat(expires_str)
        if datetime.utcnow() > expires_dt:
            return None, 410, "This buyer confirmation link has expired (48-hour validity exceeded). Please request a refreshed link."
    except Exception:
        pass

    # Retrieve invoice limited non-sensitive info
    cursor.execute("SELECT invoice_number, supplier_name, buyer_name, amount, currency, invoice_date, status FROM invoices WHERE id = ?", (acceptance["invoice_id"],))
    inv_row = cursor.fetchone()
    if not inv_row:
        return None, 404, "Associated invoice not found."

    inv = dict(inv_row)
    public_info = BuyerAcceptancePublicInfo(
        invoice_number=inv["invoice_number"],
        supplier_name=inv["supplier_name"],
        buyer_name=inv["buyer_name"],
        amount=inv["amount"],
        currency=inv.get("currency", "INR"),
        invoice_date=inv["invoice_date"],
        token=token,
        status=inv["status"],
        expires_at=acceptance["expires_at"],
        decision=acceptance["decision"]
    )
    return public_info, 200, None

def record_buyer_decision(
    conn: sqlite3.Connection,
    token: str,
    decision_type: str,
    note: Optional[str] = None
) -> Tuple[Optional[BuyerAcceptanceDecisionResponse], int, Optional[str]]:
    """Records the buyer decision with cryptographic HMAC signature and non-sensitive audit block."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM buyer_acceptances WHERE token = ?", (token,))
    row = cursor.fetchone()
    if not row:
        return None, 404, "Invalid or unknown acceptance token."

    acceptance = dict(row)

    # Double-submit guard
    if acceptance["decision"] != "PENDING":
        return None, 410, f"Cannot re-submit: this confirmation was already decided as '{acceptance['decision']}' on {acceptance.get('decided_at', 'earlier')}."

    # Expiry guard
    expires_str = acceptance["expires_at"].rstrip("Z")
    try:
        expires_dt = datetime.fromisoformat(expires_str)
        if datetime.utcnow() > expires_dt:
            return None, 410, "Confirmation link has expired. Action cannot be accepted."
    except Exception:
        pass

    invoice_id = acceptance["invoice_id"]
    now_iso = datetime.utcnow().isoformat() + "Z"
    normalized_decision = "ACCEPTED" if decision_type.upper() == "ACCEPT" else "DISPUTED"

    # Create HMAC digital receipt
    signature = create_acceptance_signature(invoice_id, normalized_decision, now_iso)
    receipt_hash = signature[:16]

    # Update acceptance table
    cursor.execute("""
    UPDATE buyer_acceptances
    SET decision = ?, decision_note = ?, signature = ?, decided_at = ?
    WHERE token = ?
    """, (normalized_decision, note or "", signature, now_iso, token))

    # Update invoice status
    if normalized_decision == "ACCEPTED":
        cursor.execute("SELECT status FROM invoices WHERE id = ?", (invoice_id,))
        curr = cursor.fetchone()
        if curr and curr["status"] in ["UNDER_REVIEW", "SUBMITTED"]:
            cursor.execute("UPDATE invoices SET status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (invoice_id,))
    else:
        cursor.execute("UPDATE invoices SET status = 'DISPUTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (invoice_id,))

    # Commit audit ledger event (STRICT PRIVACY: ONLY HASHES AND STATUS, NO SENSITIVE FIELDS)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]
    event_type = "BUYER_ACCEPTED" if normalized_decision == "ACCEPTED" else "BUYER_DISPUTED"
    record_audit_event(conn, event_type, invoice_id, {
        "decision": normalized_decision,
        "token_hash": token_hash,
        "signature_hash": receipt_hash,
        "has_note": bool(note)
    })

    return BuyerAcceptanceDecisionResponse(
        status="SUCCESS",
        decision=normalized_decision,
        signature=signature,
        receipt_hash=receipt_hash,
        decided_at=now_iso,
        message=f"Buyer confirmation recorded as '{normalized_decision}'. Cryptographic receipt: {receipt_hash}."
    ), 200, None

def get_invoice_acceptance(conn: sqlite3.Connection, invoice_id: str) -> BuyerAcceptanceStatusResponse:
    """Returns current buyer acceptance state for an invoice."""
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM buyer_acceptances
    WHERE invoice_id = ?
    ORDER BY created_at DESC LIMIT 1
    """, (invoice_id,))
    row = cursor.fetchone()
    if not row:
        return BuyerAcceptanceStatusResponse(invoice_id=invoice_id, decision="NONE")

    d = dict(row)
    return BuyerAcceptanceStatusResponse(
        id=d["id"],
        invoice_id=d["invoice_id"],
        token=d["token"],
        decision=d["decision"],
        decision_note=d.get("decision_note"),
        signature=d.get("signature"),
        created_at=d.get("created_at"),
        decided_at=d.get("decided_at"),
        expires_at=d.get("expires_at"),
        url=f"/accept/{d['token']}"
    )
