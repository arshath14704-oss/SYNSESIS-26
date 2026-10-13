import sqlite3
from typing import List
from fastapi import APIRouter, Depends
from app.database import get_db
from app.schemas import FinancingClaimRequest, FinancingClaimResponse
from app.services.financing_registry import register_financing_claim, list_all_claims

router = APIRouter(prefix="/financing-registry", tags=["Cross-Lender Registry"])

@router.get("")
def get_all_claims(conn: sqlite3.Connection = Depends(get_db)):
    """Returns simulated shared registry claims across all participating lenders."""
    return list_all_claims(conn)

@router.post("/claims", response_model=FinancingClaimResponse)
def submit_financing_claim(
    claim_req: FinancingClaimRequest,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Attempts to register an invoice financing claim. Detects double-financing attempts across lenders."""
    return register_financing_claim(conn, claim_req)
