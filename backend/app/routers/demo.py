import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.database import get_db
from app.services.seed_data import seed_database
from app.services.audit_ledger import simulate_tampering_attack, verify_chain_integrity

router = APIRouter(prefix="/demo", tags=["Demo & Simulator"])

class TamperRequest(BaseModel):
    block_id: Optional[int] = None

@router.post("/reset")
def reset_demo_database(conn: sqlite3.Connection = Depends(get_db)):
    """Wipes and resets the entire database with clean synthetic demo data and intact audit ledger."""
    seed_database(conn, force_reset=True)
    return {
        "status": "RESET_SUCCESSFUL",
        "message": "InvoiceTrust database restored to pristine seed state. All 6 demo scenarios ready."
    }

@router.post("/tamper-test")
def trigger_tamper_attack(tamper_req: TamperRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Simulates an insider threat or malicious attack by mutating an audit ledger block in SQLite."""
    tamper_result = simulate_tampering_attack(conn, tamper_req.block_id)
    verify_result = verify_chain_integrity(conn)
    return {
        "attack_result": tamper_result,
        "verification_result": verify_result
    }
