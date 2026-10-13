import pytest
import os
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sample_data", "sme_sample")

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_submission_upload_invalid_type():
    """Verify that disallowed file extensions are rejected with HTTP 400."""
    response = client.post(
        "/api/submissions",
        files={
            "invoice": ("malicious.exe", b"fake binary content", "application/octet-stream"),
            "signed_po": ("po.pdf", b"dummy po content", "application/pdf"),
            "delivery_receipt": ("grn.pdf", b"dummy delivery content", "application/pdf"),
        }
    )
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

def test_submission_upload_oversized():
    """Verify that files exceeding 10MB are rejected with HTTP 400."""
    oversized_data = b"0" * (10 * 1024 * 1024 + 1024)  # > 10MB
    response = client.post(
        "/api/submissions",
        files={
            "invoice": ("huge_invoice.pdf", oversized_data, "application/pdf"),
            "signed_po": ("po.pdf", b"dummy po content", "application/pdf"),
            "delivery_receipt": ("grn.pdf", b"dummy delivery content", "application/pdf"),
        }
    )
    assert response.status_code == 400
    assert "exceeds the 10MB size limit" in response.json()["detail"]

def test_submission_sample_set_upload_and_extraction():
    """Verify multipart upload of genuine 3-document set and multi-doc AI extraction."""
    inv_path = os.path.join(SAMPLE_DIR, "sample_invoice.pdf")
    po_path = os.path.join(SAMPLE_DIR, "sample_signed_po.pdf")
    deliv_path = os.path.join(SAMPLE_DIR, "sample_delivery_receipt.pdf")

    assert os.path.exists(inv_path), f"Missing {inv_path}"
    assert os.path.exists(po_path), f"Missing {po_path}"
    assert os.path.exists(deliv_path), f"Missing {deliv_path}"

    with open(inv_path, "rb") as f_inv, open(po_path, "rb") as f_po, open(deliv_path, "rb") as f_del:
        response = client.post(
            "/api/submissions",
            files={
                "invoice": ("sample_invoice.pdf", f_inv.read(), "application/pdf"),
                "signed_po": ("sample_signed_po.pdf", f_po.read(), "application/pdf"),
                "delivery_receipt": ("sample_delivery_receipt.pdf", f_del.read(), "application/pdf"),
            }
        )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"].startswith("sub_")
    assert data["status"] == "INGESTED"

    # Verify SHA-256 hashes
    assert len(data["invoice_hash"]) == 64
    assert len(data["po_hash"]) == 64
    assert len(data["delivery_hash"]) == 64

    # Verify Invoice Extracted Data
    extracted = data["extracted_data"]
    assert extracted is not None
    inv_data = extracted["invoice"]
    assert "INV-2026-8801" in inv_data["invoice_number"]
    assert inv_data["amount"] == 1250000.0
    assert inv_data["supplier_gstin"] == "27AABCA1234F1Z8"
    assert inv_data["buyer_gstin"] == "29AABCT9876C1Z4"
    assert inv_data["po_number"] == "PO-2026-4410"

    # Verify PO Extracted Data & Signature
    po_data = extracted["po"]
    assert "PO-2026-4410" in po_data["po_number"]
    assert po_data["amount"] == 1250000.0
    assert po_data["is_signed"] is True, "Expected PO to have is_signed=True"

    # Verify Delivery Receipt Extracted Data & Sign-off
    del_data = extracted["delivery"]
    assert "GRN-2026-9041" in del_data["receipt_reference"]
    assert del_data["received_quantity"] == 1500
    assert del_data["receiver_signoff"] is True, "Expected Delivery to have receiver_signoff=True"

def test_submission_load_sample_set():
    """Verify preloaded sample set endpoint."""
    response = client.post("/api/submissions/load-sample")
    assert response.status_code == 200
    data = response.json()
    assert data["id"].startswith("sub_sample_")
    assert data["extracted_data"]["po"]["is_signed"] is True
    assert data["extracted_data"]["delivery"]["receiver_signoff"] is True

def test_submission_sse_stream():
    """Verify Server-Sent Events (SSE) stream endpoint for real-time extraction progress."""
    sample_res = client.post("/api/submissions/load-sample")
    sub_id = sample_res.json()["id"]

    with client.stream("GET", f"/api/submissions/{sub_id}/stream") as res:
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]
        chunks = []
        for line in res.iter_lines():
            if line and line.startswith("data: "):
                event_json = json.loads(line.replace("data: ", ""))
                chunks.append(event_json)

    assert len(chunks) >= 5, "Expected multiple extraction progress events"
    assert any(c["stage"] == "invoice" for c in chunks)
    assert any(c["stage"] == "po" for c in chunks)
    assert any(c["stage"] == "delivery" for c in chunks)
    assert any(c["stage"] == "complete" and c["progress"] == 100 for c in chunks)

def test_submission_file_preview():
    """Verify streaming original files for inline browser preview."""
    sample_res = client.post("/api/submissions/load-sample")
    sub_id = sample_res.json()["id"]

    for doc in ["invoice", "po", "delivery"]:
        res = client.get(f"/api/submissions/{sub_id}/files/{doc}")
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert len(res.content) > 100
