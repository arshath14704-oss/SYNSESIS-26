import sqlite3
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.services.fraud_simulation import run_fraud_simulation, calculate_fraud_prevented
from app.services.anchor_service import get_anchor_status, anchor_commitment, read_all_anchors

router = APIRouter(prefix="/fraud-sim", tags=["Fraud Simulation Lab & Hybrid Anchors"])

class RunSimulationRequest(BaseModel):
    scenario: str # 'modified-line-item', 'reused-po', 'cross-lender-double-draw', 'genuine-clean'

@router.post("/run")
def trigger_simulation(req: RunSimulationRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Runs a reversible attack scenario and returns before/after comparisons and risk delta."""
    valid_scenarios = ['modified-line-item', 'reused-po', 'cross-lender-double-draw', 'genuine-clean']
    if req.scenario not in valid_scenarios:
        raise HTTPException(status_code=400, detail=f"Invalid scenario '{req.scenario}'. Allowed: {valid_scenarios}")
    
    result = run_fraud_simulation(conn, req.scenario)
    return result

@router.get("/prevented-counter")
def get_fraud_prevented(conn: sqlite3.Connection = Depends(get_db)):
    """Returns the cumulative fraud exposure prevented in INR."""
    amount = calculate_fraud_prevented(conn)
    return {
        "fraud_prevented_inr": amount,
        "formatted_inr": f"₹{amount:,.2f}"
    }

@router.get("/anchor-status")
def get_blockchain_anchor_status():
    """Returns the status of the hybrid audit anchoring layer."""
    return get_anchor_status()

@router.get("/anchors")
def list_blockchain_anchors():
    """Returns all recorded anchor commitments."""
    return read_all_anchors()
