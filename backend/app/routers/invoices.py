import json
import uuid
import sqlite3
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.database import get_db
from app.schemas import (
    InvoiceCreate, InvoiceResponse, ExtractedInvoiceData,
    ReconciliationResult, DuplicateCheckResult, RiskAssessmentResult,
    DecisionRequest, EvidenceDoc
)
from app.services.document_extraction import (
    process_uploaded_document, get_preset_invoice, calculate_file_hash
)
from app.services.evidence_verification import reconcile_invoice_evidence
from app.services.duplicate_detection import (
    detect_duplicate_invoices, compute_normalized_fingerprint
)
from app.services.risk_engine import evaluate_invoice_risk
from app.services.audit_ledger import record_audit_event

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def row_to_invoice_resp(r: sqlite3.Row) -> InvoiceResponse:
    d = dict(r)
    line_items = []
    if d.get("line_items_json"):
        try:
            line_items = json.loads(d["line_items_json"])
        except Exception:
            line_items = []
    return InvoiceResponse(
        id=d["id"],
        invoice_number=d["invoice_number"],
        supplier_name=d["supplier_name"],
        buyer_name=d["buyer_name"],
        supplier_gstin=d.get("supplier_gstin"),
        buyer_gstin=d.get("buyer_gstin"),
        po_number=d.get("po_number"),
        invoice_date=d["invoice_date"],
        due_date=d.get("due_date"),
        amount=d["amount"],
        tax_amount=d.get("tax_amount", 0.0),
        currency=d.get("currency", "INR"),
        status=d["status"],
        file_name=d.get("file_name"),
        file_sha256=d.get("file_sha256"),
        normalized_fingerprint=d.get("normalized_fingerprint"),
        line_items=line_items,
        created_at=str(d.get("created_at")),
        updated_at=str(d.get("updated_at"))
    )

@router.get("", response_model=List[InvoiceResponse])
def list_invoices(status: Optional[str] = None, conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM invoices WHERE status = ? ORDER BY created_at DESC", (status,))
    else:
        cursor.execute("SELECT * FROM invoices ORDER BY created_at DESC")
    rows = cursor.fetchall()
    return [row_to_invoice_resp(r) for r in rows]

@router.get("/preset/{scenario_key}", response_model=ExtractedInvoiceData)
def get_scenario_preset(scenario_key: str):
    """Returns instant high-fidelity preset invoice for 1-click live demo scenarios."""
    return get_preset_invoice(scenario_key)

@router.post("/upload", response_model=ExtractedInvoiceData)
async def upload_invoice_document(file: UploadFile = File(...)):
    """Validates and extracts invoice data from uploaded PDF, PNG, JPG, or JSON."""
    filename = file.filename or "invoice.pdf"
    content = await file.read()

    # File size validation: max 10MB
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit (10MB).")

    allowed_exts = [".pdf", ".png", ".jpg", ".jpeg", ".json"]
    import os
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Supported: PDF, PNG, JPG, JSON.")

    extracted = process_uploaded_document(content, filename)
    return extracted

@router.post("", response_model=InvoiceResponse)
def create_invoice(inv_in: InvoiceCreate, conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    new_id = f"inv_{uuid.uuid4().hex[:8]}"

    fingerprint = compute_normalized_fingerprint(
        supplier_name=inv_in.supplier_name,
        buyer_name=inv_in.buyer_name,
        amount=inv_in.amount,
        currency=inv_in.currency,
        po_number=inv_in.po_number
    )

    line_items_data = [item.model_dump() for item in inv_in.line_items]

    cursor.execute("""
    INSERT INTO invoices (
        id, invoice_number, supplier_name, buyer_name, supplier_gstin, buyer_gstin,
        po_number, invoice_date, due_date, amount, tax_amount, currency,
        status, file_name, file_sha256, normalized_fingerprint, line_items_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_id, inv_in.invoice_number, inv_in.supplier_name, inv_in.buyer_name,
        inv_in.supplier_gstin, inv_in.buyer_gstin, inv_in.po_number,
        inv_in.invoice_date, inv_in.due_date, inv_in.amount, inv_in.tax_amount,
        inv_in.currency, "SUBMITTED", inv_in.file_name, inv_in.file_sha256,
        fingerprint, json.dumps(line_items_data)
    ))

    # Commit audit event for invoice creation
    record_audit_event(conn, "INVOICE_SUBMITTED", new_id, {
        "invoice_number": inv_in.invoice_number,
        "amount": inv_in.amount,
        "supplier": inv_in.supplier_name,
        "buyer": inv_in.buyer_name,
        "po": inv_in.po_number,
        "fingerprint": fingerprint[:16] + "..."
    })

    cursor.execute("SELECT * FROM invoices WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    return row_to_invoice_resp(row)

@router.get("/{invoice_id}")
def get_invoice_details(invoice_id: str, conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    inv_row = cursor.fetchone()
    if not inv_row:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    invoice = row_to_invoice_resp(inv_row)

    # Fetch Evidence
    cursor.execute("SELECT * FROM evidence_documents WHERE invoice_id = ?", (invoice_id,))
    evidence = [dict(r) for r in cursor.fetchall()]

    # Fetch Reconciliation if exists
    cursor.execute("SELECT * FROM reconciliations WHERE invoice_id = ?", (invoice_id,))
    recon_row = cursor.fetchone()
    recon = None
    if recon_row:
        r = dict(recon_row)
        recon = {
            "overall_status": r["overall_status"],
            "amount_match": bool(r["amount_match"]),
            "quantity_match": bool(r["quantity_match"]),
            "date_valid": bool(r["date_valid"]),
            "party_match": bool(r["party_match"]),
            "discrepancies": json.loads(r["discrepancies_json"] or "[]"),
            "reconciled_at": r["reconciled_at"]
        }

    # Fetch Risk Evaluation if exists
    cursor.execute("SELECT * FROM risk_evaluations WHERE invoice_id = ?", (invoice_id,))
    risk_row = cursor.fetchone()
    risk = None
    if risk_row:
        rk = dict(risk_row)
        risk = {
            "risk_score": rk["risk_score"],
            "risk_band": rk["risk_band"],
            "recommendation": rk["recommendation"],
            "factors": json.loads(rk["breakdown_json"]),
            "summary_explanation": json.loads(rk["explanations_json"]).get("summary", ""),
            "evaluated_at": rk["evaluated_at"]
        }

    return {
        "invoice": invoice,
        "evidence": evidence,
        "reconciliation": recon,
        "risk_evaluation": risk
    }

@router.post("/{invoice_id}/verify", response_model=ReconciliationResult)
def verify_invoice(invoice_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Runs 3-way reconciliation on the invoice and records an immutable audit block."""
    result = reconcile_invoice_evidence(conn, invoice_id)

    # Record audit event
    record_audit_event(conn, "DOCUMENT_VERIFIED", invoice_id, {
        "overall_status": result.overall_status,
        "amount_match": result.amount_match,
        "quantity_match": result.quantity_match,
        "discrepancies_count": len(result.discrepancies)
    })

    # Update invoice status
    cursor = conn.cursor()
    new_status = "VERIFIED" if result.overall_status == "MATCHED" else "UNDER_REVIEW"
    cursor.execute("UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, invoice_id))

    return result

@router.post("/{invoice_id}/duplicate-check", response_model=DuplicateCheckResult)
def check_invoice_duplicates(invoice_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Executes multi-tier duplicate detection across files, fingerprints, and shared references."""
    result = detect_duplicate_invoices(conn, invoice_id)

    record_audit_event(conn, "DUPLICATE_CHECK_COMPLETED", invoice_id, {
        "has_duplicates": result.has_duplicates,
        "duplicate_count": result.duplicate_count,
        "highest_similarity": result.highest_similarity
    })

    if result.has_duplicates:
        cursor = conn.cursor()
        cursor.execute("UPDATE invoices SET status = 'UNDER_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (invoice_id,))

    return result

@router.post("/{invoice_id}/risk-assessment", response_model=RiskAssessmentResult)
def assess_invoice_risk(invoice_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Computes explainable 0–100 risk score with 5-pillar rubric."""
    result = evaluate_invoice_risk(conn, invoice_id)

    record_audit_event(conn, "RISK_SCORE_CALCULATED", invoice_id, {
        "risk_score": result.risk_score,
        "risk_band": result.risk_band,
        "recommendation": result.recommendation
    })

    cursor = conn.cursor()
    if result.risk_band == "LOW":
        new_status = "ELIGIBLE_FOR_HUMAN_APPROVAL"
    elif result.risk_band == "MEDIUM":
        new_status = "UNDER_REVIEW"
    else:
        new_status = "UNDER_REVIEW"
    
    cursor.execute("UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, invoice_id))

    return result

@router.post("/{invoice_id}/decision")
def record_financing_decision(
    invoice_id: str,
    decision_req: DecisionRequest,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Enforces human-in-the-loop decision with strict safeguards against auto-approving high-risk claims."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    inv_row = cursor.fetchone()
    if not inv_row:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    invoice = dict(inv_row)

    # Check risk evaluation
    cursor.execute("SELECT * FROM risk_evaluations WHERE invoice_id = ?", (invoice_id,))
    risk_row = cursor.fetchone()
    
    # Security Rule: Never allow approval if risk is HIGH without explicit confirmation
    if decision_req.decision == "APPROVE" and risk_row and risk_row["risk_band"] == "HIGH":
        if "OVERRIDE" not in (decision_req.reviewer_notes or "").upper():
            raise HTTPException(
                status_code=400,
                detail="Security Constraint Violation: High-risk invoice claims cannot be approved without an explicit compliance OVERRIDE in reviewer notes."
            )

    new_status_map = {
        "APPROVE": "APPROVED",
        "REJECT": "REJECTED",
        "HOLD": "UNDER_REVIEW",
        "FINANCE": "FINANCED",
        "REPAY": "REPAID",
        "DISPUTE": "DISPUTED"
    }
    target_status = new_status_map.get(decision_req.decision, "UNDER_REVIEW")

    cursor.execute("""
    UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    """, (target_status, invoice_id))

    # Commit audit block
    record_audit_event(conn, "HUMAN_DECISION_RECORDED", invoice_id, {
        "decision": decision_req.decision,
        "resulting_status": target_status,
        "reviewer_id": decision_req.reviewer_id,
        "notes": decision_req.reviewer_notes
    })

    return {
        "invoice_id": invoice_id,
        "status": target_status,
        "decision": decision_req.decision,
        "reviewer": decision_req.reviewer_id,
        "message": f"Invoice successfully updated to {target_status} with audit proof."
    }

@router.get("/{invoice_id}/evidence")
def get_invoice_evidence(invoice_id: str, conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evidence_documents WHERE invoice_id = ?", (invoice_id,))
    return [dict(r) for r in cursor.fetchall()]

@router.post("/{invoice_id}/evidence")
def attach_evidence_document(
    invoice_id: str,
    doc_type: str = Form(...), # PURCHASE_ORDER, DELIVERY_RECEIPT
    doc_reference: str = Form(...),
    expected_amount: Optional[float] = Form(None),
    expected_quantity: Optional[int] = Form(None),
    delivered_quantity: Optional[int] = Form(None),
    conn: sqlite3.Connection = Depends(get_db)
):
    cursor = conn.cursor()
    doc_id = f"ev_{uuid.uuid4().hex[:8]}"
    
    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, expected_amount, expected_quantity, delivered_quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (doc_id, invoice_id, doc_type, doc_reference, expected_amount, expected_quantity, delivered_quantity))

    record_audit_event(conn, "EVIDENCE_ATTACHED", invoice_id, {
        "doc_type": doc_type,
        "doc_reference": doc_reference,
        "expected_qty": expected_quantity,
        "delivered_qty": delivered_quantity
    })

    return {"status": "ATTACHED", "evidence_id": doc_id}
