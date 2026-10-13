import os
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional

ANCHOR_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "anchors.json")

def ensure_anchor_dir():
    os.makedirs(os.path.dirname(ANCHOR_FILE), exist_ok=True)
    if not os.path.exists(ANCHOR_FILE):
        with open(ANCHOR_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)

def calculate_canonical_commitment(invoice_id: str, invoice_hash: str, fingerprint: str, status: str, timestamp: str) -> str:
    """Computes canonical 32-byte SHA-256 commitment of off-chain invoice state."""
    payload = f"{invoice_id}|{invoice_hash}|{fingerprint}|{status}|{timestamp}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def get_anchor_status() -> Dict[str, Any]:
    """Returns anchoring network status with transparent simulation labeling."""
    ensure_anchor_dir()
    anchors = []
    try:
        with open(ANCHOR_FILE, "r", encoding="utf-8") as f:
            anchors = json.load(f)
    except Exception:
        anchors = []

    return {
        "network": "LOCAL_APPEND_ONLY_SIMULATION",
        "description": "Cryptographic local append-only anchor log (Hardhat/EVM ready)",
        "is_connected": True,
        "is_mock": True,
        "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3 (Simulated)",
        "smart_contract": "blockchain/contracts/InvoiceLifecycle.sol",
        "total_anchors": len(anchors),
        "latest_block_height": 1042 + len(anchors),
        "last_synced_at": datetime.utcnow().isoformat() + "Z"
    }

def anchor_commitment(
    invoice_id: str,
    invoice_hash: str,
    fingerprint: str,
    amount: float,
    status: str,
    lender_id: str = "INVOICETRUST_LOCAL"
) -> Dict[str, Any]:
    """Records an immutable anchor commitment to the local append-only file."""
    ensure_anchor_dir()
    now_iso = datetime.utcnow().isoformat() + "Z"
    commit_hash = calculate_canonical_commitment(invoice_id, invoice_hash, fingerprint, status, now_iso)
    
    anchor_entry = {
        "anchor_id": f"anc_{len(read_all_anchors()) + 1:04d}",
        "invoice_id": invoice_id,
        "invoice_hash": invoice_hash,
        "fingerprint": fingerprint,
        "amount": amount,
        "status": status,
        "lender_id": lender_id,
        "commitment_hash": commit_hash,
        "tx_hash": f"0x{hashlib.sha256((commit_hash + now_iso).encode('utf-8')).hexdigest()}",
        "block_number": 1042 + len(read_all_anchors()) + 1,
        "timestamp": now_iso
    }

    try:
        anchors = read_all_anchors()
        anchors.append(anchor_entry)
        with open(ANCHOR_FILE, "w", encoding="utf-8") as f:
            json.dump(anchors, f, indent=2)
    except Exception as e:
        print(f"Failed to persist anchor entry: {e}")

    return anchor_entry

def read_all_anchors() -> List[Dict[str, Any]]:
    ensure_anchor_dir()
    try:
        with open(ANCHOR_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []
