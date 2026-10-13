import hashlib
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from app.schemas import AuditBlockResponse, AuditVerificationResult

GENESIS_PREV_HASH = "0" * 64

def canonical_serialize(data: Dict[str, Any]) -> str:
    """Serializes a dictionary into a canonical, deterministically sorted JSON string."""
    return json.dumps(data, sort_keys=True, separators=(',', ':'))

def calculate_block_hash(
    block_id: int,
    event_type: str,
    invoice_id: Optional[str],
    timestamp: str,
    metadata: Dict[str, Any],
    prev_hash: str
) -> str:
    """Computes SHA-256 hash over canonical payload concatenated with previous hash."""
    payload = {
        "block_id": block_id,
        "event_type": event_type,
        "invoice_id": invoice_id or "",
        "timestamp": timestamp,
        "metadata": metadata
    }
    canonical_repr = canonical_serialize(payload)
    hash_input = f"{canonical_repr}|{prev_hash}"
    return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

def record_audit_event(
    conn: sqlite3.Connection,
    event_type: str,
    invoice_id: Optional[str],
    metadata: Dict[str, Any]
) -> AuditBlockResponse:
    """Appends an immutable audit event to the cryptographic hash chain."""
    cursor = conn.cursor()

    # Get the latest block to retrieve its current_hash
    cursor.execute("SELECT block_id, current_hash FROM audit_ledger ORDER BY block_id DESC LIMIT 1")
    latest = cursor.fetchone()
    
    if latest:
        next_block_id = latest["block_id"] + 1
        prev_hash = latest["current_hash"]
    else:
        next_block_id = 1
        prev_hash = GENESIS_PREV_HASH

    now_iso = datetime.utcnow().isoformat() + "Z"
    
    # Calculate current block hash
    cur_hash = calculate_block_hash(
        block_id=next_block_id,
        event_type=event_type,
        invoice_id=invoice_id,
        timestamp=now_iso,
        metadata=metadata,
        prev_hash=prev_hash
    )

    metadata_str = json.dumps(metadata)

    cursor.execute("""
    INSERT INTO audit_ledger (block_id, event_type, invoice_id, timestamp, metadata_json, prev_hash, current_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (next_block_id, event_type, invoice_id, now_iso, metadata_str, prev_hash, cur_hash))

    return AuditBlockResponse(
        block_id=next_block_id,
        event_type=event_type,
        invoice_id=invoice_id,
        timestamp=now_iso,
        metadata=metadata,
        prev_hash=prev_hash,
        current_hash=cur_hash
    )

def verify_chain_integrity(conn: sqlite3.Connection) -> AuditVerificationResult:
    """Recalculates every block hash from Genesis to latest block to verify unbroken chain integrity."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_ledger ORDER BY block_id ASC")
    rows = cursor.fetchall()

    if not rows:
        return AuditVerificationResult(
            is_valid=True,
            total_blocks=0,
            genesis_hash=GENESIS_PREV_HASH,
            latest_hash=GENESIS_PREV_HASH,
            error_message=None
        )

    expected_prev_hash = GENESIS_PREV_HASH
    genesis_hash = ""
    latest_hash = ""

    for idx, row in enumerate(rows):
        b = dict(row)
        b_id = b["block_id"]
        e_type = b["event_type"]
        inv_id = b["invoice_id"]
        ts = b["timestamp"]
        prev_h = b["prev_hash"]
        curr_h = b["current_hash"]
        
        try:
            meta = json.loads(b["metadata_json"])
        except Exception:
            meta = {}

        if idx == 0:
            genesis_hash = curr_h

        # 1. Check prev_hash pointer consistency
        if prev_h != expected_prev_hash:
            return AuditVerificationResult(
                is_valid=False,
                total_blocks=len(rows),
                genesis_hash=genesis_hash,
                latest_hash=curr_h,
                corrupted_block_id=b_id,
                expected_hash=expected_prev_hash,
                actual_hash=prev_h,
                error_message=f"Hash chain broken at Block #{b_id}: Previous block hash pointer '{prev_h[:16]}...' does not match expected '{expected_prev_hash[:16]}...'."
            )

        # 2. Recalculate current hash from payload
        recomputed = calculate_block_hash(
            block_id=b_id,
            event_type=e_type,
            invoice_id=inv_id,
            timestamp=ts,
            metadata=meta,
            prev_hash=prev_h
        )

        if recomputed != curr_h:
            return AuditVerificationResult(
                is_valid=False,
                total_blocks=len(rows),
                genesis_hash=genesis_hash,
                latest_hash=curr_h,
                corrupted_block_id=b_id,
                expected_hash=recomputed,
                actual_hash=curr_h,
                error_message=f"Cryptographic payload tampering detected at Block #{b_id}! Stored hash '{curr_h[:16]}...' does not match recomputed SHA-256 payload '{recomputed[:16]}...'."
            )

        expected_prev_hash = curr_h
        latest_hash = curr_h

    return AuditVerificationResult(
        is_valid=True,
        total_blocks=len(rows),
        genesis_hash=genesis_hash,
        latest_hash=latest_hash,
        error_message=None
    )

def simulate_tampering_attack(conn: sqlite3.Connection, target_block_id: Optional[int] = None) -> Dict[str, Any]:
    """Controlled demo action that secretly mutates a historic ledger row to prove verification fails."""
    cursor = conn.cursor()
    
    if target_block_id is None:
        cursor.execute("SELECT block_id FROM audit_ledger ORDER BY block_id ASC LIMIT 1 OFFSET 1")
        row = cursor.fetchone()
        if not row:
            cursor.execute("SELECT block_id FROM audit_ledger ORDER BY block_id ASC LIMIT 1")
            row = cursor.fetchone()
        if not row:
            raise ValueError("Audit ledger is empty. Cannot tamper with non-existent records.")
        target_block_id = row["block_id"]

    # Mutate the metadata inside the targeted block without updating its current_hash
    cursor.execute("SELECT metadata_json FROM audit_ledger WHERE block_id = ?", (target_block_id,))
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"Block #{target_block_id} does not exist.")

    try:
        data = json.loads(row["metadata_json"])
    except Exception:
        data = {}

    # Maliciously modify an approval amount or note
    data["TAMPERED_BY_ATTACKER"] = True
    data["malicious_override_amount"] = 999999999.00
    data["fraudulent_status"] = "FORCE_APPROVED_WITHOUT_AUTHORIZATION"

    tampered_json = json.dumps(data)

    cursor.execute("""
    UPDATE audit_ledger 
    SET metadata_json = ? 
    WHERE block_id = ?
    """, (tampered_json, target_block_id))

    return {
        "status": "TAMPERED",
        "tampered_block_id": target_block_id,
        "message": f"Block #{target_block_id} was deliberately modified in the SQLite database. Its SHA-256 hash now diverges from its payload."
    }
