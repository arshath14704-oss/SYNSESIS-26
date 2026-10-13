import json
import sqlite3
from typing import List
from fastapi import APIRouter, Depends
from app.database import get_db
from app.schemas import AuditBlockResponse, AuditVerificationResult
from app.services.audit_ledger import verify_chain_integrity

router = APIRouter(prefix="/audit", tags=["Audit Ledger"])

@router.get("", response_model=List[AuditBlockResponse])
def get_audit_ledger(conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_ledger ORDER BY block_id ASC")
    rows = cursor.fetchall()
    results = []
    for r in rows:
        meta = {}
        try:
            meta = json.loads(r["metadata_json"])
        except Exception:
            meta = {}
        results.append(AuditBlockResponse(
            block_id=r["block_id"],
            event_type=r["event_type"],
            invoice_id=r["invoice_id"],
            timestamp=r["timestamp"],
            metadata=meta,
            prev_hash=r["prev_hash"],
            current_hash=r["current_hash"]
        ))
    return results

@router.get("/verify", response_model=AuditVerificationResult)
def verify_audit_chain(conn: sqlite3.Connection = Depends(get_db)):
    """Recalculates cryptographic SHA-256 hashes from genesis to latest block to assert immutability."""
    return verify_chain_integrity(conn)
