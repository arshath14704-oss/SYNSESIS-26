import json
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.schemas import ReconciliationResult, Discrepancy

def reconcile_invoice_evidence(conn: sqlite3.Connection, invoice_id: str) -> ReconciliationResult:
    """Performs strict 3-way reconciliation across Invoice, Purchase Order, and Delivery Receipt."""
    cursor = conn.cursor()
    
    # 1. Fetch Invoice
    cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    inv_row = cursor.fetchone()
    if not inv_row:
        raise ValueError(f"Invoice with ID {invoice_id} not found.")

    invoice = dict(inv_row)
    
    # 2. Fetch Evidence Documents
    cursor.execute("SELECT * FROM evidence_documents WHERE invoice_id = ?", (invoice_id,))
    evidence_rows = cursor.fetchall()
    
    po_doc: Optional[Dict[str, Any]] = None
    delivery_doc: Optional[Dict[str, Any]] = None
    contract_doc: Optional[Dict[str, Any]] = None

    for r in evidence_rows:
        doc = dict(r)
        if doc["doc_type"] == "PURCHASE_ORDER":
            po_doc = doc
        elif doc["doc_type"] == "DELIVERY_RECEIPT":
            delivery_doc = doc
        elif doc["doc_type"] == "CONTRACT":
            contract_doc = doc

    discrepancies: List[Discrepancy] = []
    amount_match = True
    quantity_match = True
    date_valid = True
    party_match = True

    # Check 1: Purchase Order Reconciliation
    if not po_doc:
        amount_match = False
        discrepancies.append(Discrepancy(
            field="purchase_order_missing",
            source_val=invoice.get("po_number"),
            target_val="NONE_ATTACHED",
            severity="CRITICAL",
            message=f"No matching Purchase Order found for PO reference '{invoice.get('po_number')}'."
        ))
    else:
        po_amt = po_doc.get("expected_amount")
        inv_amt = invoice.get("amount")
        
        # Check Amount mismatch
        if po_amt is not None and abs(inv_amt - po_amt) > 1.0: # Tolerance for minor rounding
            amount_match = False
            delta = inv_amt - po_amt
            severity = "CRITICAL" if abs(delta) > 50000 else "MEDIUM"
            discrepancies.append(Discrepancy(
                field="amount",
                source_val=inv_amt,
                target_val=po_amt,
                severity=severity,
                message=f"Invoice amount ({inv_amt:,.2f}) does not match PO authorized amount ({po_amt:,.2f}). Discrepancy delta: {delta:+,.2f}."
            ))

        # Check PO reference number
        if invoice.get("po_number") and po_doc.get("doc_reference") != invoice.get("po_number"):
            discrepancies.append(Discrepancy(
                field="po_reference",
                source_val=invoice.get("po_number"),
                target_val=po_doc.get("doc_reference"),
                severity="MEDIUM",
                message=f"Invoice PO reference '{invoice.get('po_number')}' differs from attached PO document '{po_doc.get('doc_reference')}'."
            ))

    # Check 2: Delivery Receipt Reconciliation (Quantities)
    if not delivery_doc:
        quantity_match = False
        discrepancies.append(Discrepancy(
            field="delivery_receipt_missing",
            source_val="CLAIMED_DELIVERY",
            target_val="NO_DELIVERY_PROOF",
            severity="CRITICAL",
            message="No signed Delivery Receipt attached. High risk of phantom billing / unfulfilled shipment."
        ))
    else:
        exp_qty = delivery_doc.get("expected_quantity")
        del_qty = delivery_doc.get("delivered_quantity")
        
        # Parse invoice line item total quantity
        inv_line_qty = 0
        try:
            line_items = json.loads(invoice.get("line_items_json") or "[]")
            inv_line_qty = sum(item.get("quantity", 0) for item in line_items)
        except Exception:
            inv_line_qty = 0

        # Compare delivered vs invoiced or expected
        if del_qty is not None and exp_qty is not None and del_qty < exp_qty:
            quantity_match = False
            shortage = exp_qty - del_qty
            discrepancies.append(Discrepancy(
                field="delivered_quantity",
                source_val=f"{exp_qty} units invoiced/ordered",
                target_val=f"{del_qty} units delivered",
                severity="CRITICAL",
                message=f"Quantity mismatch: Delivery Receipt confirms only {del_qty} units received vs {exp_qty} units ordered/invoiced (Shortage of {shortage} units)."
            ))
        elif inv_line_qty > 0 and del_qty is not None and inv_line_qty > del_qty:
            quantity_match = False
            shortage = inv_line_qty - del_qty
            discrepancies.append(Discrepancy(
                field="invoiced_quantity",
                source_val=f"{inv_line_qty} units invoiced",
                target_val=f"{del_qty} units delivered",
                severity="CRITICAL",
                message=f"Invoiced quantity ({inv_line_qty}) exceeds actual verified delivery quantity ({del_qty}). Potential over-invoicing."
            ))

        # Check Delivery Date vs Invoice Date
        del_date_str = delivery_doc.get("issue_date")
        inv_date_str = invoice.get("invoice_date")
        if del_date_str and inv_date_str:
            try:
                del_date = datetime.strptime(del_date_str[:10], "%Y-%m-%d")
                inv_date = datetime.strptime(inv_date_str[:10], "%Y-%m-%d")
                if del_date > inv_date:
                    date_valid = False
                    discrepancies.append(Discrepancy(
                        field="delivery_date",
                        source_val=inv_date_str,
                        target_val=del_date_str,
                        severity="MEDIUM",
                        message=f"Delivery date ({del_date_str}) is dated AFTER invoice date ({inv_date_str}), violating sequential logistics flow."
                    ))
            except ValueError:
                pass

    # Check 3: Party Identity & GSTIN Checks
    if not invoice.get("supplier_gstin") or not invoice.get("buyer_gstin"):
        party_match = False
        discrepancies.append(Discrepancy(
            field="gstin_missing",
            source_val="MISSING_GSTIN",
            target_val="VALID_15_CHAR_GSTIN",
            severity="MEDIUM",
            message="One or more GSTIN identifiers are missing from the invoice header."
        ))

    # Overall Status computation
    critical_count = sum(1 for d in discrepancies if d.severity == "CRITICAL")
    if critical_count > 0:
        overall_status = "CRITICAL_MISMATCH"
    elif len(discrepancies) > 0:
        overall_status = "DISCREPANCY_DETECTED"
    else:
        overall_status = "MATCHED"

    reconciled_time = datetime.utcnow().isoformat() + "Z"
    
    # Save or update in database
    cursor.execute("""
    INSERT INTO reconciliations (id, invoice_id, overall_status, amount_match, quantity_match, date_valid, party_match, discrepancies_json, reconciled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(invoice_id) DO UPDATE SET
        overall_status = excluded.overall_status,
        amount_match = excluded.amount_match,
        quantity_match = excluded.quantity_match,
        date_valid = excluded.date_valid,
        party_match = excluded.party_match,
        discrepancies_json = excluded.discrepancies_json,
        reconciled_at = excluded.reconciled_at;
    """, (
        f"rec_{invoice_id}",
        invoice_id,
        overall_status,
        amount_match,
        quantity_match,
        date_valid,
        party_match,
        json.dumps([d.model_dump() for d in discrepancies]),
        reconciled_time
    ))

    return ReconciliationResult(
        invoice_id=invoice_id,
        overall_status=overall_status,
        amount_match=amount_match,
        quantity_match=quantity_match,
        date_valid=date_valid,
        party_match=party_match,
        discrepancies=discrepancies,
        reconciled_at=reconciled_time
    )
