import pytest
from fastapi.testclient import TestClient
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

def test_fraud_sim_modified_line_item(client):
    resp = client.post("/api/fraud-sim/run", json={"scenario": "modified-line-item"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario"] == "modified-line-item"
    assert "Line-Item" in data["title"]
    assert len(data["diffs"]) >= 2
    assert data["risk_impact"]["attack_score"] > data["risk_impact"]["baseline_score"]
    assert data["fraud_prevented_amount"] > 0

def test_fraud_sim_reused_po(client):
    resp = client.post("/api/fraud-sim/run", json={"scenario": "reused-po"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario"] == "reused-po"
    assert data["duplicate_impact"]["has_duplicates"] is True
    assert data["duplicate_impact"]["match_type"] == "NORMALIZED_CLAIM"

def test_fraud_sim_cross_lender(client):
    resp = client.post("/api/fraud-sim/run", json={"scenario": "cross-lender-double-draw"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario"] == "cross-lender-double-draw"
    assert data["risk_impact"]["attack_score"] >= 90
    assert data["duplicate_impact"]["has_duplicates"] is True

def test_fraud_sim_genuine_clean(client):
    resp = client.post("/api/fraud-sim/run", json={"scenario": "genuine-clean"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario"] == "genuine-clean"
    assert data["risk_impact"]["baseline_score"] < 30
    assert data["duplicate_impact"]["has_duplicates"] is False

def test_fraud_prevented_counter(client):
    resp = client.get("/api/fraud-sim/prevented-counter")
    assert resp.status_code == 200
    data = resp.json()
    assert data["fraud_prevented_inr"] > 0
    assert "₹" in data["formatted_inr"]

def test_blockchain_anchor_status(client):
    resp = client.get("/api/fraud-sim/anchor-status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["network"] == "LOCAL_APPEND_ONLY_SIMULATION"
    assert data["is_mock"] is True

def test_dashboard_extended_metrics(client):
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "fraud_prevented_amount" in data
    assert "recent_invoices" in data
    assert len(data["recent_invoices"]) > 0
    assert "next_action" in data["recent_invoices"][0]
    assert "recent_audit_events" in data
