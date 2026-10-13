import re
import hashlib
import sqlite3
import json
from typing import Dict, Any, List, Tuple
from app.schemas import DuplicateCheckResult, DuplicateMatch

def compute_normalized_fingerprint(
    supplier_name: str,
    buyer_name: str,
    amount: float,
    currency: str,
    po_number: str = None
) -> str:
    """Computes a deterministic canonical fingerprint from core financial claim identifiers."""
    norm_supplier = re.sub(r'[^a-zA-Z0-9]', '', supplier_name.lower().strip())
    norm_buyer = re.sub(r'[^a-zA-Z0-9]', '', buyer_name.lower().strip())
    norm_amount = f"{float(amount):.2f}"
    norm_currency = currency.upper().strip()
    norm_po = re.sub(r'[^a-zA-Z0-9]', '', (po_number or "").lower().strip())

    payload = f"{norm_supplier}|{norm_buyer}|{norm_amount}|{norm_currency}|{norm_po}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def string_similarity(s1: str, s2: str) -> float:
    """Computes character trigram / token overlap similarity between two strings."""
    if not s1 or not s2:
        return 0.0
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2:
        return 1.0
    
    # Simple Dice-like bigram similarity
    def get_bigrams(s):
        return set(s[i:i+2] for i in range(len(s) - 1))
    
    b1 = get_bigrams(s1)
    b2 = get_bigrams(s2)
    if not b1 or not b2:
        return 0.5 if s1 in s2 or s2 in s1 else 0.0
    
    intersection = len(b1.intersection(b2))
    return (2.0 * intersection) / (len(b1) + len(b2))

def detect_duplicate_invoices(conn: sqlite3.Connection, target_invoice_id: str) -> DuplicateCheckResult:
    """Comprehensive multi-tier duplicate detection across files, fingerprints, and shared references."""
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM invoices WHERE id = ?", (target_invoice_id,))
    target_row = cursor.fetchone()
    if not target_row:
        raise ValueError(f"Invoice with ID {target_invoice_id} not found.")

    target = dict(target_row)
    t_file_hash = target.get("file_sha256")
    t_fingerprint = target.get("normalized_fingerprint") or compute_normalized_fingerprint(
        target["supplier_name"], target["buyer_name"], target["amount"], target["currency"], target.get("po_number")
    )
    t_po = target.get("po_number")
    t_inv_num = target.get("invoice_number", "")
    t_supplier = target.get("supplier_name", "")
    t_buyer = target.get("buyer_name", "")
    t_amount = target.get("amount", 0.0)

    # Fetch all OTHER invoices
    cursor.execute("SELECT * FROM invoices WHERE id != ?", (target_invoice_id,))
    other_rows = cursor.fetchall()

    matches: List[DuplicateMatch] = []

    for row in other_rows:
        inv = dict(row)
        shared_fields = []
        is_match = False
        match_type = ""
        confidence = 0.0
        explanation = ""

        # Case 1: Exact File Hash Match (Byte-for-byte identical document uploaded)
        if t_file_hash and inv.get("file_sha256") and t_file_hash == inv.get("file_sha256"):
            is_match = True
            match_type = "EXACT_FILE_HASH"
            confidence = 1.0
            shared_fields = ["file_content", "sha256_hash", "amount", "supplier", "buyer"]
            explanation = f"Exact byte-for-byte file match detected with previously processed invoice {inv.get('invoice_number')} (SHA-256: {t_file_hash[:16]}...)."

        # Case 2: Exact Normalized Claim Fingerprint
        elif t_fingerprint and inv.get("normalized_fingerprint") and t_fingerprint == inv.get("normalized_fingerprint"):
            is_match = True
            match_type = "NORMALIZED_CLAIM"
            confidence = 0.98
            shared_fields = ["supplier", "buyer", "amount", "po_number", "currency"]
            explanation = f"Identical economic claim detected: Same Supplier, Buyer, PO ({t_po}), and Amount ({t_amount:,.2f}) as {inv.get('invoice_number')}."

        # Case 3: Reused PO reference with altered invoice number
        elif t_po and inv.get("po_number") and t_po.lower().strip() == inv.get("po_number", "").lower().strip():
            # Check if amounts are identical or close
            amt_diff = abs(t_amount - inv.get("amount", 0.0))
            if amt_diff < 1.0:
                is_match = True
                match_type = "REUSED_PO_IDENTICAL_AMOUNT"
                confidence = 0.95
                shared_fields = ["po_number", "amount", "parties"]
                explanation = f"Repeated Purchase Order '{t_po}' with identical billing value submitted under invoice #{inv.get('invoice_number')}."
            else:
                is_match = True
                match_type = "REUSED_PO_DIFFERENT_AMOUNT"
                confidence = 0.85
                shared_fields = ["po_number"]
                explanation = f"Purchase Order '{t_po}' is already assigned to active invoice #{inv.get('invoice_number')}."

        # Case 4: Fuzzy Similarity (Altered invoice numbers, e.g., INV-001 vs INV-001A, same parties and amount)
        else:
            inv_num_sim = string_similarity(t_inv_num, inv.get("invoice_number", ""))
            same_supplier = (t_supplier.lower().strip() == inv.get("supplier_name", "").lower().strip())
            same_buyer = (t_buyer.lower().strip() == inv.get("buyer_name", "").lower().strip())
            amt_close = abs(t_amount - inv.get("amount", 0.0)) < 1.0

            if same_supplier and same_buyer and amt_close and inv_num_sim > 0.7:
                is_match = True
                match_type = "FUZZY_SIMILARITY"
                confidence = round(0.70 + (inv_num_sim * 0.25), 2)
                shared_fields = ["supplier", "buyer", "amount", "invoice_number_similarity"]
                explanation = f"Suspiciously similar claim: High naming overlap ({inv_num_sim*100:.0f}%) with #{inv.get('invoice_number')} for identical amount."

        if is_match:
            matches.append(DuplicateMatch(
                matched_invoice_id=inv["id"],
                matched_invoice_number=inv.get("invoice_number", "UNKNOWN"),
                matched_supplier=inv.get("supplier_name", "UNKNOWN"),
                match_type=match_type,
                confidence=confidence,
                shared_fields=shared_fields,
                explanation=explanation
            ))

    # Also check cross-lender financing claims table
    cursor.execute("""
    SELECT * FROM financing_claims 
    WHERE (invoice_fingerprint = ? OR invoice_number = ?)
      AND invoice_id != ?
    """, (t_fingerprint, t_inv_num, target_invoice_id))
    claim_rows = cursor.fetchall()
    
    for c_row in claim_rows:
        claim = dict(c_row)
        matches.append(DuplicateMatch(
            matched_invoice_id=claim.get("invoice_id") or claim["claim_id"],
            matched_invoice_number=claim["invoice_number"],
            matched_supplier=target["supplier_name"],
            match_type="CROSS_LENDER_FINANCING_CLAIM",
            confidence=0.99,
            shared_fields=["external_registry", "lender_claim", "fingerprint"],
            explanation=f"Collision in Cross-Lender Registry: Financed or claimed by external lender '{claim['lender_name']}'."
        ))

    # Build relationship graph nodes and edges for visualization
    nodes = [
        {"id": target_invoice_id, "label": f"Invoice: {t_inv_num}", "type": "target_invoice", "status": target.get("status")},
        {"id": f"supp_{target_invoice_id}", "label": f"Supplier: {t_supplier}", "type": "supplier"},
        {"id": f"buy_{target_invoice_id}", "label": f"Buyer: {t_buyer}", "type": "buyer"}
    ]
    edges = [
        {"source": f"supp_{target_invoice_id}", "target": target_invoice_id, "relation": "ISSUED_BY"},
        {"source": target_invoice_id, "target": f"buy_{target_invoice_id}", "relation": "BILLED_TO"}
    ]
    
    if t_po:
        po_id = f"po_{t_po}"
        nodes.append({"id": po_id, "label": f"PO: {t_po}", "type": "po"})
        edges.append({"source": target_invoice_id, "target": po_id, "relation": "REFERENCES_PO"})

    for m in matches:
        m_id = m.matched_invoice_id
        nodes.append({"id": m_id, "label": f"Matched: {m.matched_invoice_number}", "type": "conflicting_invoice", "confidence": m.confidence})
        edges.append({"source": target_invoice_id, "target": m_id, "relation": f"CONFLICT ({m.match_type})"})

    highest_sim = max([m.confidence for m in matches], default=0.0)

    return DuplicateCheckResult(
        invoice_id=target_invoice_id,
        has_duplicates=len(matches) > 0,
        duplicate_count=len(matches),
        highest_similarity=highest_sim,
        matches=matches,
        fingerprint=t_fingerprint,
        graph_nodes=nodes,
        graph_edges=edges
    )
