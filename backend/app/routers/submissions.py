import os
import hashlib
import uuid
import json
import mimetypes
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse, FileResponse
import sqlite3

from app.database import get_db
from app.schemas import SubmissionResponse
from app.services.document_extraction import (
    extract_submission_documents,
    generate_extraction_sse_events
)

router = APIRouter(prefix="/submissions", tags=["SME Submissions"])

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
STORAGE_DIR = os.path.join(BACKEND_DIR, "storage")
SAMPLE_DIR = os.path.join(ROOT_DIR, "sample_data", "sme_sample")
os.makedirs(STORAGE_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".json"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_file(file: UploadFile, content: bytes, doc_label: str):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for {doc_label} ('{file.filename}'). Supported formats are PDF, JPG, PNG."
        )
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"{doc_label} ('{file.filename}') exceeds the 10MB size limit ({len(content)} bytes)."
        )


@router.post("", response_model=SubmissionResponse)
async def create_submission(
    invoice: UploadFile = File(...),
    signed_po: UploadFile = File(...),
    delivery_receipt: UploadFile = File(...),
    supplier_id: Optional[str] = Form(None),
    db: sqlite3.Connection = Depends(get_db)
):
    """Multipart upload for Invoice, Signed Purchase Order, and Delivery Receipt."""
    inv_bytes = await invoice.read()
    po_bytes = await signed_po.read()
    deliv_bytes = await delivery_receipt.read()

    validate_file(invoice, inv_bytes, "Invoice")
    validate_file(signed_po, po_bytes, "Signed Purchase Order")
    validate_file(delivery_receipt, deliv_bytes, "Delivery Receipt")

    sub_id = f"sub_{uuid.uuid4().hex[:12]}"
    sub_dir = os.path.join(STORAGE_DIR, sub_id)
    os.makedirs(sub_dir, exist_ok=True)

    inv_hash = compute_sha256(inv_bytes)
    po_hash = compute_sha256(po_bytes)
    deliv_hash = compute_sha256(deliv_bytes)

    # Save files off-chain
    inv_save_path = os.path.join(sub_dir, invoice.filename or "invoice.pdf")
    po_save_path = os.path.join(sub_dir, signed_po.filename or "signed_po.pdf")
    deliv_save_path = os.path.join(sub_dir, delivery_receipt.filename or "delivery_receipt.pdf")

    with open(inv_save_path, "wb") as f:
        f.write(inv_bytes)
    with open(po_save_path, "wb") as f:
        f.write(po_bytes)
    with open(deliv_save_path, "wb") as f:
        f.write(deliv_bytes)

    # Run AI multi-document extraction
    extracted = extract_submission_documents(
        invoice_bytes=inv_bytes,
        po_bytes=po_bytes,
        delivery_bytes=deliv_bytes,
        invoice_name=invoice.filename or "invoice.pdf",
        po_name=signed_po.filename or "signed_po.pdf",
        delivery_name=delivery_receipt.filename or "delivery_receipt.pdf"
    )

    sup_id = supplier_id or extracted["invoice"].get("supplier_name") or "SUPPLIER_01"
    extracted_json = json.dumps(extracted)

    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO submissions (
            id, supplier_id, status, invoice_hash, po_hash, delivery_hash,
            invoice_filename, po_filename, delivery_filename, extracted_data_json
        ) VALUES (?, ?, 'INGESTED', ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            sub_id, sup_id, inv_hash, po_hash, deliv_hash,
            invoice.filename, signed_po.filename, delivery_receipt.filename,
            extracted_json
        )
    )

    cursor.execute("SELECT * FROM submissions WHERE id = ?", (sub_id,))
    row = cursor.fetchone()

    return SubmissionResponse(
        id=row["id"],
        supplier_id=row["supplier_id"],
        status=row["status"],
        invoice_hash=row["invoice_hash"],
        po_hash=row["po_hash"],
        delivery_hash=row["delivery_hash"],
        invoice_filename=row["invoice_filename"],
        po_filename=row["po_filename"],
        delivery_filename=row["delivery_filename"],
        extracted_data=extracted,
        created_at=str(row["created_at"])
    )


@router.post("/load-sample", response_model=SubmissionResponse)
def load_sample_set(db: sqlite3.Connection = Depends(get_db)):
    """Preloads the sample genuine document set (Invoice, Signed PO, Delivery Receipt)."""
    inv_path = os.path.join(SAMPLE_DIR, "sample_invoice.pdf")
    po_path = os.path.join(SAMPLE_DIR, "sample_signed_po.pdf")
    deliv_path = os.path.join(SAMPLE_DIR, "sample_delivery_receipt.pdf")

    if not (os.path.exists(inv_path) and os.path.exists(po_path) and os.path.exists(deliv_path)):
        raise HTTPException(status_code=404, detail="Sample files not found on server")

    with open(inv_path, "rb") as f:
        inv_bytes = f.read()
    with open(po_path, "rb") as f:
        po_bytes = f.read()
    with open(deliv_path, "rb") as f:
        deliv_bytes = f.read()

    sub_id = f"sub_sample_{uuid.uuid4().hex[:8]}"
    sub_dir = os.path.join(STORAGE_DIR, sub_id)
    os.makedirs(sub_dir, exist_ok=True)

    with open(os.path.join(sub_dir, "sample_invoice.pdf"), "wb") as f:
        f.write(inv_bytes)
    with open(os.path.join(sub_dir, "sample_signed_po.pdf"), "wb") as f:
        f.write(po_bytes)
    with open(os.path.join(sub_dir, "sample_delivery_receipt.pdf"), "wb") as f:
        f.write(deliv_bytes)

    inv_hash = compute_sha256(inv_bytes)
    po_hash = compute_sha256(po_bytes)
    deliv_hash = compute_sha256(deliv_bytes)

    extracted = extract_submission_documents(
        invoice_bytes=inv_bytes,
        po_bytes=po_bytes,
        delivery_bytes=deliv_bytes,
        invoice_name="sample_invoice.pdf",
        po_name="sample_signed_po.pdf",
        delivery_name="sample_delivery_receipt.pdf"
    )

    extracted_json = json.dumps(extracted)
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO submissions (
            id, supplier_id, status, invoice_hash, po_hash, delivery_hash,
            invoice_filename, po_filename, delivery_filename, extracted_data_json
        ) VALUES (?, 'Apex Microelectronics Ltd', 'INGESTED', ?, ?, ?, 'sample_invoice.pdf', 'sample_signed_po.pdf', 'sample_delivery_receipt.pdf', ?)
        """,
        (sub_id, inv_hash, po_hash, deliv_hash, extracted_json)
    )

    cursor.execute("SELECT * FROM submissions WHERE id = ?", (sub_id,))
    row = cursor.fetchone()

    return SubmissionResponse(
        id=row["id"],
        supplier_id=row["supplier_id"],
        status=row["status"],
        invoice_hash=row["invoice_hash"],
        po_hash=row["po_hash"],
        delivery_hash=row["delivery_hash"],
        invoice_filename=row["invoice_filename"],
        po_filename=row["po_filename"],
        delivery_filename=row["delivery_filename"],
        extracted_data=extracted,
        created_at=str(row["created_at"])
    )


@router.get("/{id}", response_model=SubmissionResponse)
def get_submission(id: str, db: sqlite3.Connection = Depends(get_db)):
    """Returns details of a specific submission."""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM submissions WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Submission '{id}' not found")

    extracted = None
    if row["extracted_data_json"]:
        try:
            extracted = json.loads(row["extracted_data_json"])
        except Exception:
            pass

    return SubmissionResponse(
        id=row["id"],
        supplier_id=row["supplier_id"],
        status=row["status"],
        invoice_hash=row["invoice_hash"],
        po_hash=row["po_hash"],
        delivery_hash=row["delivery_hash"],
        invoice_filename=row["invoice_filename"],
        po_filename=row["po_filename"],
        delivery_filename=row["delivery_filename"],
        extracted_data=extracted,
        created_at=str(row["created_at"])
    )


@router.get("/{id}/stream")
async def stream_submission_extraction(id: str, db: sqlite3.Connection = Depends(get_db)):
    """Server-Sent Events (SSE) emitting real-time field-by-field extraction progress."""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM submissions WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Submission '{id}' not found")

    extracted = {}
    if row["extracted_data_json"]:
        try:
            extracted = json.loads(row["extracted_data_json"])
        except Exception:
            pass

    return StreamingResponse(
        generate_extraction_sse_events(extracted),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/{id}/files/{doc_type}")
def get_submission_file(id: str, doc_type: str, db: sqlite3.Connection = Depends(get_db)):
    """Streams the stored original file for inline browser viewing."""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM submissions WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Submission '{id}' not found")

    doc_key = doc_type.lower()
    filename = None
    if doc_key in ["invoice", "inv"]:
        filename = row["invoice_filename"]
    elif doc_key in ["po", "signed_po", "purchase_order"]:
        filename = row["po_filename"]
    elif doc_key in ["delivery", "delivery_receipt", "grn"]:
        filename = row["delivery_filename"]
    else:
        raise HTTPException(status_code=400, detail=f"Invalid doc_type '{doc_type}'. Expected invoice, po, or delivery.")

    if not filename:
        raise HTTPException(status_code=404, detail="File name not found for document")

    sub_dir = os.path.join(STORAGE_DIR, id)
    file_path = os.path.join(sub_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Physical file '{filename}' not found in off-chain storage")

    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            media_type = "application/pdf"
        elif ext in [".jpg", ".jpeg"]:
            media_type = "image/jpeg"
        elif ext == ".png":
            media_type = "image/png"
        else:
            media_type = "application/octet-stream"

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )
