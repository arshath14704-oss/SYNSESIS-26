import os
import sys
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import init_db, get_connection
from app.services.seed_data import seed_database

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

def test_create_acceptance_link(client):
    """Test generating a buyer confirmation link for an invoice."""
    resp = client.post("/api/invoices/inv_001_genuine/acceptance-link")
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert len(data["token"]) >= 32
    assert data["url"] == f"/accept/{data['token']}"
    assert "expires_at" in data
    assert data["decision"] == "PENDING"

def test_get_public_acceptance_view(client):
    """Test public invoice summary endpoint for the buyer portal."""
    link_resp = client.post("/api/invoices/inv_001_genuine/acceptance-link")
    token = link_resp.json()["token"]

    view_resp = client.get(f"/api/accept/{token}")
    assert view_resp.status_code == 200
    data = view_resp.json()
    assert data["invoice_number"] == "INV-2026-8801"
    assert data["supplier_name"] == "Apex Microelectronics Ltd"
    assert data["amount"] == 1250000.0
    assert "supplier_gstin" not in data  # Privacy: sensitive tax details omitted from public view
    assert data["decision"] == "PENDING"

    # Test unknown token returns 404
    not_found = client.get("/api/accept/unknown_token_that_does_not_exist_12345")
    assert not_found.status_code == 404

def test_accept_flow_writes_ledger_block(client):
    """Test accepting an invoice: records HMAC signature and immutable audit ledger block."""
    link_resp = client.post("/api/invoices/inv_004_amount_mismatch/acceptance-link")
    token = link_resp.json()["token"]

    decision_resp = client.post(f"/api/accept/{token}", json={
        "decision": "ACCEPT",
        "note": "Physical warehouse confirmed delivery."
    })
    assert decision_resp.status_code == 200
    dec_data = decision_resp.json()
    assert dec_data["status"] == "SUCCESS"
    assert dec_data["decision"] == "ACCEPTED"
    assert "signature" in dec_data
    assert "receipt_hash" in dec_data

    # Check audit ledger
    audit_resp = client.get("/api/audit")
    assert audit_resp.status_code == 200
    blocks = audit_resp.json()
    buyer_blocks = [b for b in blocks if b["event_type"] == "BUYER_ACCEPTED"]
    assert len(buyer_blocks) >= 1
    latest_block = buyer_blocks[-1]
    # Check that privacy rule is upheld: no sensitive names or amounts in metadata
    meta = latest_block["metadata"]
    assert meta["decision"] == "ACCEPTED"
    assert "amount" not in meta
    assert "supplier_name" not in meta
    assert "signature_hash" in meta

def test_dispute_flow_updates_status_and_ledger(client):
    """Test buyer disputing an invoice: updates invoice status to DISPUTED and writes audit block."""
    link_resp = client.post("/api/invoices/inv_003_qty_mismatch/acceptance-link")
    token = link_resp.json()["token"]

    dispute_resp = client.post(f"/api/accept/{token}", json={
        "decision": "DISPUTE",
        "note": "Short shipment of 20 units detected on receiving dock."
    })
    assert dispute_resp.status_code == 200
    dispute_data = dispute_resp.json()
    assert dispute_data["decision"] == "DISPUTED"

    # Verify invoice status is now DISPUTED
    inv_resp = client.get("/api/invoices/inv_003_qty_mismatch")
    assert inv_resp.status_code == 200
    assert inv_resp.json()["invoice"]["status"] == "DISPUTED"

def test_double_submit_rejected(client):
    """Test that a decided token cannot be decided a second time (returns 410)."""
    link_resp = client.post("/api/invoices/inv_001_genuine/acceptance-link")
    token = link_resp.json()["token"]

    # First submit succeeds
    first_resp = client.post(f"/api/accept/{token}", json={"decision": "ACCEPT"})
    assert first_resp.status_code == 200

    # Second submit must be rejected with 410 Gone
    second_resp = client.post(f"/api/accept/{token}", json={"decision": "ACCEPT"})
    assert second_resp.status_code == 410
    assert "already" in second_resp.json()["detail"].lower()

def test_expired_token_returns_410(client):
    """Test that an expired token returns 410 Gone on both GET and POST."""
    conn = get_connection()
    expired_token = "expired_token_test_32_characters_long_val"
    past_time = (datetime.utcnow() - timedelta(hours=50)).isoformat() + "Z"
    try:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO buyer_acceptances (id, invoice_id, token, decision, created_at, expires_at)
        VALUES ('ba_expired_test', 'inv_001_genuine', ?, 'PENDING', ?, ?)
        """, (expired_token, past_time, past_time))
        conn.commit()
    finally:
        conn.close()

    # GET expired token -> 410
    get_resp = client.get(f"/api/accept/{expired_token}")
    assert get_resp.status_code == 410
    assert "expired" in get_resp.json()["detail"].lower()

    # POST expired token -> 410
    post_resp = client.post(f"/api/accept/{expired_token}", json={"decision": "ACCEPT"})
    assert post_resp.status_code == 410
    assert "expired" in post_resp.json()["detail"].lower()
