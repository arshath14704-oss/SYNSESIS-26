import sqlite3
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.schemas import (
    BuyerAcceptanceLinkResponse,
    BuyerAcceptancePublicInfo,
    BuyerAcceptanceDecisionRequest,
    BuyerAcceptanceDecisionResponse,
    BuyerAcceptanceStatusResponse,
)
from app.services.buyer_acceptance import (
    generate_acceptance_link,
    get_acceptance_by_token,
    record_buyer_decision,
    get_invoice_acceptance,
)

router = APIRouter(tags=["Buyer Acceptance Portal"])

@router.post("/invoices/{invoice_id}/acceptance-link", response_model=BuyerAcceptanceLinkResponse)
def create_buyer_link(invoice_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Generates a secure, 48-hour acceptance link for the debtor buyer."""
    try:
        return generate_acceptance_link(conn, invoice_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/invoices/{invoice_id}/acceptance", response_model=BuyerAcceptanceStatusResponse)
def get_acceptance_status(invoice_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Fetches the latest buyer acceptance record for an invoice."""
    return get_invoice_acceptance(conn, invoice_id)

@router.get("/accept/{token}", response_model=BuyerAcceptancePublicInfo)
def get_public_acceptance_view(token: str, conn: sqlite3.Connection = Depends(get_db)):
    """Returns limited, non-sensitive invoice public information for the buyer confirmation page."""
    info, code, err = get_acceptance_by_token(conn, token)
    if code != 200:
        raise HTTPException(status_code=code, detail=err)
    return info

@router.post("/accept/{token}", response_model=BuyerAcceptanceDecisionResponse)
def submit_public_buyer_decision(
    token: str,
    req: BuyerAcceptanceDecisionRequest,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Records the buyer's ACCEPT or DISPUTE decision with cryptographic signature."""
    if req.decision.upper() not in ["ACCEPT", "DISPUTE"]:
        raise HTTPException(status_code=400, detail="Decision must be either 'ACCEPT' or 'DISPUTE'.")

    resp, code, err = record_buyer_decision(conn, token, req.decision, req.note)
    if code != 200:
        raise HTTPException(status_code=code, detail=err)
    return resp
