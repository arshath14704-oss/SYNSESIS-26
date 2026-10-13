import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import get_db, init_db, get_connection
from app.services.seed_data import seed_database
from app.services.audit_ledger import verify_chain_integrity, simulate_tampering_attack
from app.services.risk_engine import evaluate_invoice_risk
from app.services.evidence_verification import reconcile_invoice_evidence
from app.services.duplicate_detection import detect_duplicate_invoices

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    conn = get_connection()
    try:
        seed_database(conn, force_reset=True)
        conn.commit()
    finally:
        conn.close()

@pytest.fixture
def client():
    return TestClient(app)

def test_genuine_invoice_verification(client):
    """Scenario 1: A genuine invoice passes 3-way match, has low risk, and is eligible for approval."""
    # Reconcile invoice 1
    resp = client.post("/api/invoices/inv_001_genuine/verify")
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_status"] == "MATCHED"
    assert data["amount_match"] is True
    assert data["quantity_match"] is True
    assert len(data["discrepancies"]) == 0

    # Risk evaluation
    risk_resp = client.post("/api/invoices/inv_001_genuine/risk-assessment")
    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert risk_data["risk_band"] == "LOW"
    assert risk_data["risk_score"] < 30
    assert risk_data["recommendation"] == "APPROVE"

def test_duplicate_invoice_detection(client):
    """Scenario 2: Duplicate invoice submitted with altered invoice number is caught by fingerprinting."""
    dup_resp = client.post("/api/invoices/inv_002_duplicate/duplicate-check")
    assert dup_resp.status_code == 200
    dup_data = dup_resp.json()
    assert dup_data["has_duplicates"] is True
    assert dup_data["duplicate_count"] >= 1
    # Check that it matched inv_001_genuine
    matched_ids = [m["matched_invoice_id"] for m in dup_data["matches"]]
    assert "inv_001_genuine" in matched_ids

    # Risk assessment should reflect the duplicate claim
    risk_resp = client.post("/api/invoices/inv_002_duplicate/risk-assessment")
    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert risk_data["risk_score"] >= 30
    # Check that duplicate factor contributed 25+ points
    dup_factors = [f for f in risk_data["factors"] if f["category"] == "Duplicate Claim Indicators"]
    assert len(dup_factors) > 0
    assert dup_factors[0]["points"] >= 25

def test_delivery_quantity_mismatch(client):
    """Scenario 3: Invoiced 100 units vs Delivery 80 units triggers discrepancy and risk penalty."""
    resp = client.post("/api/invoices/inv_003_qty_mismatch/verify")
    assert resp.status_code == 200
    data = resp.json()
    assert data["quantity_match"] is False
    assert data["overall_status"] in ["DISCREPANCY_DETECTED", "CRITICAL_MISMATCH"]
    
    qty_disc = [d for d in data["discrepancies"] if "quantity" in d["field"]]
    assert len(qty_disc) > 0
    assert "80 units received" in qty_disc[0]["message"]

    # Risk assessment check
    risk_resp = client.post("/api/invoices/inv_003_qty_mismatch/risk-assessment")
    risk_data = risk_resp.json()
    deliv_factors = [f for f in risk_data["factors"] if f["category"] == "Delivery and PO Mismatch"]
    assert len(deliv_factors) > 0
    assert deliv_factors[0]["points"] >= 15

def test_invoice_amount_mismatch(client):
    """Scenario 4: Invoice amount 1.45M differs from PO 1.20M, triggering financial discrepancy."""
    resp = client.post("/api/invoices/inv_004_amount_mismatch/verify")
    assert resp.status_code == 200
    data = resp.json()
    assert data["amount_match"] is False
    amt_disc = [d for d in data["discrepancies"] if d["field"] == "amount"]
    assert len(amt_disc) > 0

    risk_resp = client.post("/api/invoices/inv_004_amount_mismatch/risk-assessment")
    risk_data = risk_resp.json()
    doc_factors = [f for f in risk_data["factors"] if f["category"] == "Document Inconsistency"]
    assert len(doc_factors) > 0
    assert doc_factors[0]["points"] >= 20

def test_risk_score_bounds_and_rubric(client):
    """Verify all risk scores stay strictly between 0 and 100 and factors sum correctly."""
    invoices = ["inv_001_genuine", "inv_002_duplicate", "inv_003_qty_mismatch", "inv_004_amount_mismatch"]
    for inv_id in invoices:
        resp = client.post(f"/api/invoices/{inv_id}/risk-assessment")
        assert resp.status_code == 200
        data = resp.json()
        assert 0 <= data["risk_score"] <= 100
        # Check sum of factors matches risk score
        factor_sum = sum(f["points"] for f in data["factors"])
        assert min(100, factor_sum) == data["risk_score"]

def test_audit_chain_integrity_clean(client):
    """Scenario 5 (Part A): Cryptographic SHA-256 hash chain passes verification when intact."""
    resp = client.get("/api/audit/verify")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_valid"] is True
    assert data["total_blocks"] > 0
    assert data["corrupted_block_id"] is None

def test_audit_chain_tamper_detection(client):
    """Scenario 5 (Part B): Deliberately modifying an audit record causes verification to fail."""
    # Trigger tamper test
    tamper_resp = client.post("/api/demo/tamper-test", json={"block_id": 2})
    assert tamper_resp.status_code == 200
    
    # Check verification endpoint directly
    verify_resp = client.get("/api/audit/verify")
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is False
    assert verify_data["corrupted_block_id"] == 2
    assert "tampering detected" in verify_data["error_message"].lower()

    # Reset back for subsequent tests
    reset_resp = client.post("/api/demo/reset")
    assert reset_resp.status_code == 200
    clean_verify = client.get("/api/audit/verify").json()
    assert clean_verify["is_valid"] is True

def test_cross_lender_duplicate_protection(client):
    """Scenario 6: Cross-Lender collision detected when Lender B attempts to finance an existing claim."""
    # Attempt to finance inv_005 (which is already registered by Apex Capital)
    conflict_payload = {
        "invoice_id": "inv_005_financed",
        "invoice_number": "INV-2026-7731",
        "invoice_fingerprint": "some_fp", # will match by invoice_number
        "lender_id": "LENDER_HORIZON",
        "lender_name": "Horizon Trade Credit",
        "amount": 3500000.0
    }
    resp = client.post("/api/financing-registry/claims", json=conflict_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["collision_detected"] is True
    assert data["status"] == "REJECTED_COLLISION"
    assert "Double-Financing Alert" in data["collision_message"]
    assert "Apex Capital" in data["collision_message"]

def test_invalid_upload_and_malformed_requests(client):
    """Test validation: rejects unsupported extensions and malformed payload."""
    files = {"file": ("malicious.exe", b"binarycontent", "application/octet-stream")}
    resp = client.post("/api/invoices/upload", files=files)
    assert resp.status_code == 400
    assert "Unsupported file format" in resp.json()["detail"]

    # Test non-existent invoice
    resp404 = client.get("/api/invoices/non_existent_id")
    assert resp404.status_code == 404
