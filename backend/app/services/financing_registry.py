import sqlite3
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.schemas import FinancingClaimRequest, FinancingClaimResponse

def register_financing_claim(
    conn: sqlite3.Connection,
    claim_req: FinancingClaimRequest
) -> FinancingClaimResponse:
    """Registers an invoice claim in the cross-lender shared registry or flags a collision."""
    cursor = conn.cursor()

    # Check for existing claim with identical fingerprint or invoice number
    cursor.execute("""
    SELECT * FROM financing_claims 
    WHERE invoice_fingerprint = ? OR invoice_number = ?
    """, (claim_req.invoice_fingerprint, claim_req.invoice_number))
    
    existing = cursor.fetchone()

    now_iso = datetime.utcnow().isoformat() + "Z"

    if existing:
        e = dict(existing)
        # Collision detected!
        return FinancingClaimResponse(
            claim_id=e["claim_id"],
            invoice_id=e.get("invoice_id"),
            invoice_number=claim_req.invoice_number,
            invoice_fingerprint=claim_req.invoice_fingerprint,
            lender_id=claim_req.lender_id,
            lender_name=claim_req.lender_name,
            amount=claim_req.amount,
            status="REJECTED_COLLISION",
            claim_timestamp=now_iso,
            collision_detected=True,
            collision_message=(
                f"Double-Financing Alert! Invoice #{claim_req.invoice_number} is ALREADY registered by "
                f"competing lender '{e['lender_name']}' ({e['lender_id']}) on {e['claim_timestamp']}. "
                f"Status: {e['status']}. Multi-lender factoring fraud prevented."
            )
        )

    # Register new clean claim
    new_claim_id = f"claim_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
    INSERT INTO financing_claims (claim_id, invoice_id, invoice_number, invoice_fingerprint, lender_id, lender_name, amount, status, claim_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_claim_id,
        claim_req.invoice_id,
        claim_req.invoice_number,
        claim_req.invoice_fingerprint,
        claim_req.lender_id,
        claim_req.lender_name,
        claim_req.amount,
        "REGISTERED",
        now_iso
    ))

    return FinancingClaimResponse(
        claim_id=new_claim_id,
        invoice_id=claim_req.invoice_id,
        invoice_number=claim_req.invoice_number,
        invoice_fingerprint=claim_req.invoice_fingerprint,
        lender_id=claim_req.lender_id,
        lender_name=claim_req.lender_name,
        amount=claim_req.amount,
        status="REGISTERED",
        claim_timestamp=now_iso,
        collision_detected=False,
        collision_message="Claim successfully registered in the multi-lender shared fraud network."
    )

def list_all_claims(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Returns all registered claims across all lenders."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM financing_claims ORDER BY claim_timestamp DESC")
    return [dict(r) for r in cursor.fetchall()]
