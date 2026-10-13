import json
import sqlite3
import hashlib
from datetime import datetime, timedelta
from app.services.audit_ledger import record_audit_event, calculate_block_hash
from app.services.duplicate_detection import compute_normalized_fingerprint

def seed_database(conn: sqlite3.Connection, force_reset: bool = False):
    """Populates clean synthetic demo data for invoices, evidence, audit ledger, and cross-lender registry."""
    cursor = conn.cursor()

    if force_reset:
        cursor.execute("DELETE FROM buyer_acceptances;")
        cursor.execute("DELETE FROM audit_ledger;")
        cursor.execute("DELETE FROM financing_claims;")
        cursor.execute("DELETE FROM reconciliations;")
        cursor.execute("DELETE FROM risk_evaluations;")
        cursor.execute("DELETE FROM evidence_documents;")
        cursor.execute("DELETE FROM invoices;")
        cursor.execute("DELETE FROM buyer_profiles;")

    # Check if database already has invoices
    cursor.execute("SELECT COUNT(*) as cnt FROM invoices")
    if cursor.fetchone()["cnt"] > 0:
        return # Already seeded

    # 1. Seed Synthetic Buyer Profiles
    buyers = [
        ("Tata Consumer Electronics Ltd", "29AABCT9876C1Z4", 780, 0.02, 28),
        ("Reliance Retail Warehousing", "27AABCR1234M1Z9", 740, 0.03, 35),
        ("Infosys BPM Services", "29AABCI9988Q1Z1", 820, 0.01, 21),
        ("Larsen & Toubro Heavy Eng", "27AABCL5544K1Z3", 790, 0.02, 30),
        ("Bharat Electronics Corp", "29AABCB1122D1Z7", 750, 0.03, 40)
    ]
    for b in buyers:
        cursor.execute("""
        INSERT OR REPLACE INTO buyer_profiles (buyer_name, buyer_gstin, credit_score, payment_default_rate, avg_days_to_pay, is_synthetic_demo)
        VALUES (?, ?, ?, ?, ?, 1)
        """, b)

    # 2. Seed Genuine Invoice (Scenario 1)
    inv1_id = "inv_001_genuine"
    inv1_num = "INV-2026-8801"
    inv1_supp = "Apex Microelectronics Ltd"
    inv1_buy = "Tata Consumer Electronics Ltd"
    inv1_po = "PO-2026-4410"
    inv1_amt = 1250000.0
    inv1_fp = compute_normalized_fingerprint(inv1_supp, inv1_buy, inv1_amt, "INR", inv1_po)
    inv1_hash = hashlib.sha256(b"Apex Microelectronics Genuine Invoice Payload 8801").hexdigest()
    
    line_items_1 = [
        {"description": "Industrial Microcontrollers ARM-Cortex M7", "quantity": 500, "unit_price": 2000.0, "total": 1000000.0},
        {"description": "Precision Opto-isolators 5kV", "quantity": 1000, "unit_price": 250.0, "total": 250000.0}
    ]

    cursor.execute("""
    INSERT INTO invoices (id, invoice_number, supplier_name, buyer_name, supplier_gstin, buyer_gstin, po_number, invoice_date, due_date, amount, tax_amount, currency, status, file_name, file_sha256, normalized_fingerprint, line_items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv1_id, inv1_num, inv1_supp, inv1_buy, "27AABCA1234F1Z8", "29AABCT9876C1Z4", inv1_po,
        "2026-10-01", "2026-11-15", inv1_amt, 225000.0, "INR", "ELIGIBLE_FOR_HUMAN_APPROVAL",
        "Apex_Microelectronics_INV_8801.pdf", inv1_hash, inv1_fp, json.dumps(line_items_1)
    ))

    # Evidence for Invoice 1 (Clean PO & Delivery Receipt)
    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, issue_date, expected_amount, expected_quantity, delivered_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("ev_po_001", inv1_id, "PURCHASE_ORDER", inv1_po, "2026-09-25", 1250000.0, 1500, 1500, "ACTIVE"))

    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, issue_date, expected_amount, expected_quantity, delivered_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("ev_del_001", inv1_id, "DELIVERY_RECEIPT", "GRN-2026-9022", "2026-09-29", 1250000.0, 1500, 1500, "ACTIVE"))

    # 3. Seed Duplicate Attempt Invoice (Scenario 2)
    inv2_id = "inv_002_duplicate"
    inv2_num = "INV-2026-8801-DUP"
    inv2_fp = inv1_fp # Identical financial claim fingerprint!
    inv2_hash = hashlib.sha256(b"Duplicate altered payload").hexdigest()

    cursor.execute("""
    INSERT INTO invoices (id, invoice_number, supplier_name, buyer_name, supplier_gstin, buyer_gstin, po_number, invoice_date, due_date, amount, tax_amount, currency, status, file_name, file_sha256, normalized_fingerprint, line_items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv2_id, inv2_num, inv1_supp, inv1_buy, "27AABCA1234F1Z8", "29AABCT9876C1Z4", inv1_po,
        "2026-10-02", "2026-11-15", inv1_amt, 225000.0, "INR", "UNDER_REVIEW",
        "Apex_ReSubmitted_8801_DUP.pdf", inv2_hash, inv2_fp, json.dumps(line_items_1)
    ))

    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, issue_date, expected_amount, expected_quantity, delivered_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("ev_po_002", inv2_id, "PURCHASE_ORDER", inv1_po, "2026-09-25", 1250000.0, 1500, 1500, "ACTIVE"))

    # 4. Seed Delivery Quantity Mismatch Invoice (Scenario 3)
    inv3_id = "inv_003_qty_mismatch"
    inv3_num = "INV-2026-9104"
    inv3_supp = "Sterling Logistics & Cargo Corp"
    inv3_buy = "Reliance Retail Warehousing"
    inv3_po = "PO-2026-7720"
    inv3_amt = 800000.0
    inv3_fp = compute_normalized_fingerprint(inv3_supp, inv3_buy, inv3_amt, "INR", inv3_po)
    
    line_items_3 = [
        {"description": "Heavy Duty Pallet Storage Racks", "quantity": 100, "unit_price": 8000.0, "total": 800000.0}
    ]

    cursor.execute("""
    INSERT INTO invoices (id, invoice_number, supplier_name, buyer_name, supplier_gstin, buyer_gstin, po_number, invoice_date, due_date, amount, tax_amount, currency, status, file_name, file_sha256, normalized_fingerprint, line_items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv3_id, inv3_num, inv3_supp, inv3_buy, "33AABCS4567B1Z2", "27AABCR1234M1Z9", inv3_po,
        "2026-10-05", "2026-11-05", inv3_amt, 144000.0, "INR", "UNDER_REVIEW",
        "Sterling_Pallet_Invoice_9104.pdf", "hash_sterling_9104", inv3_fp, json.dumps(line_items_3)
    ))

    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, issue_date, expected_amount, expected_quantity, delivered_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("ev_po_003", inv3_id, "PURCHASE_ORDER", inv3_po, "2026-10-01", 800000.0, 100, 100, "ACTIVE"))

    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, issue_date, expected_amount, expected_quantity, delivered_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("ev_del_003", inv3_id, "DELIVERY_RECEIPT", "GRN-2026-8819", "2026-10-04", 800000.0, 100, 80, "ACTIVE")) # DELIVERED ONLY 80!

    # 5. Seed Amount Manipulation Invoice (Scenario 4)
    inv4_id = "inv_004_amount_mismatch"
    inv4_num = "INV-2026-9502"
    inv4_supp = "Global Tech Infrastructure Pvt"
    inv4_buy = "Infosys BPM Services"
    inv4_po = "PO-2026-8833"
    inv4_amt = 1450000.0
    inv4_fp = compute_normalized_fingerprint(inv4_supp, inv4_buy, inv4_amt, "INR", inv4_po)

    line_items_4 = [
        {"description": "Enterprise Grade Edge Routers", "quantity": 10, "unit_price": 145000.0, "total": 1450000.0}
    ]

    cursor.execute("""
    INSERT INTO invoices (id, invoice_number, supplier_name, buyer_name, supplier_gstin, buyer_gstin, po_number, invoice_date, due_date, amount, tax_amount, currency, status, file_name, file_sha256, normalized_fingerprint, line_items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv4_id, inv4_num, inv4_supp, inv4_buy, "29AABCG7788P1Z5", "29AABCI9988Q1Z1", inv4_po,
        "2026-10-08", "2026-11-08", inv4_amt, 261000.0, "INR", "UNDER_REVIEW",
        "GlobalTech_EdgeRouters_9502.pdf", "hash_globaltech_9502", inv4_fp, json.dumps(line_items_4)
    ))

    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, issue_date, expected_amount, expected_quantity, delivered_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("ev_po_004", inv4_id, "PURCHASE_ORDER", inv4_po, "2026-10-02", 1200000.0, 10, 10, "ACTIVE")) # PO AMOUNT IS 1.2M, INVOICE IS 1.45M!

    cursor.execute("""
    INSERT INTO evidence_documents (id, invoice_id, doc_type, doc_reference, issue_date, expected_amount, expected_quantity, delivered_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("ev_del_004", inv4_id, "DELIVERY_RECEIPT", "GRN-2026-7011", "2026-10-07", 1200000.0, 10, 10, "ACTIVE"))

    # 6. Seed Financed Invoice registered in Cross-Lender Registry (Scenario 6)
    inv5_id = "inv_005_financed"
    inv5_num = "INV-2026-7731"
    inv5_supp = "Apex Microelectronics Ltd"
    inv5_buy = "Larsen & Toubro Heavy Eng"
    inv5_po = "PO-2026-6655"
    inv5_amt = 3500000.0
    inv5_fp = compute_normalized_fingerprint(inv5_supp, inv5_buy, inv5_amt, "INR", inv5_po)

    cursor.execute("""
    INSERT INTO invoices (id, invoice_number, supplier_name, buyer_name, supplier_gstin, buyer_gstin, po_number, invoice_date, due_date, amount, tax_amount, currency, status, file_name, file_sha256, normalized_fingerprint, line_items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv5_id, inv5_num, inv5_supp, inv5_buy, "27AABCA1234F1Z8", "27AABCL5544K1Z3", inv5_po,
        "2026-09-18", "2026-10-30", inv5_amt, 630000.0, "INR", "FINANCED",
        "Apex_LT_Turbine_7731.pdf", "hash_apex_7731", inv5_fp, "[]"
    ))

    # Register Claim for inv_005 by Lender A: 'Apex Capital'
    cursor.execute("""
    INSERT INTO financing_claims (claim_id, invoice_id, invoice_number, invoice_fingerprint, lender_id, lender_name, amount, status, claim_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "claim_apex_7731", inv5_id, inv5_num, inv5_fp, "LENDER_APEX", "Apex Capital Factoring",
        inv5_amt, "FINANCED", "2026-09-20T14:30:00Z"
    ))

    # 7. Seed Initial Cryptographic Audit Ledger
    record_audit_event(conn, "SYSTEM_INITIALIZED", None, {
        "network": "InvoiceTrust Local Tamper-Evident Ledger",
        "version": "2.0-Production",
        "protocol": "SHA-256 Hash Chain"
    })
    record_audit_event(conn, "INVOICE_SUBMITTED", inv1_id, {
        "invoice_number": inv1_num,
        "amount": inv1_amt,
        "supplier": inv1_supp,
        "po": inv1_po
    })
    record_audit_event(conn, "DOCUMENT_VERIFIED", inv1_id, {
        "po_verified": True,
        "delivery_verified": True,
        "discrepancies_count": 0
    })
    record_audit_event(conn, "RISK_SCORE_CALCULATED", inv1_id, {
        "risk_score": 12,
        "risk_band": "LOW",
        "recommendation": "APPROVE"
    })
    record_audit_event(conn, "FINANCING_CLAIM_REGISTERED", inv5_id, {
        "invoice_number": inv5_num,
        "lender": "Apex Capital Factoring",
        "amount": inv5_amt,
        "registry_status": "LOCKED"
    })

    # 8. Seed Buyer Acceptances (1 Accepted, 1 Pending, 1 Disputed)
    from app.services.buyer_acceptance import create_acceptance_signature

    now_iso = datetime.utcnow().isoformat() + "Z"
    expires_iso = (datetime.utcnow() + timedelta(hours=48)).isoformat() + "Z"

    # Accepted: inv_001_genuine
    sig_1 = create_acceptance_signature(inv1_id, "ACCEPTED", now_iso)
    cursor.execute("""
    INSERT INTO buyer_acceptances (id, invoice_id, token, decision, decision_note, signature, created_at, decided_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "ba_seed_001", inv1_id, "token_seed_accepted_inv_001", "ACCEPTED",
        "Goods received in full and verified against PO-2026-4410.", sig_1,
        now_iso, now_iso, expires_iso
    ))
    record_audit_event(conn, "BUYER_ACCEPTED", inv1_id, {
        "decision": "ACCEPTED",
        "token_hash": hashlib.sha256(b"token_seed_accepted_inv_001").hexdigest()[:16],
        "signature_hash": sig_1[:16],
        "has_note": True
    })

    # Pending: inv_003_qty_mismatch
    cursor.execute("""
    INSERT INTO buyer_acceptances (id, invoice_id, token, decision, decision_note, signature, created_at, decided_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "ba_seed_003", inv3_id, "token_seed_pending_inv_003", "PENDING",
        None, None, now_iso, None, expires_iso
    ))

    # Disputed: inv_002_duplicate
    sig_2 = create_acceptance_signature(inv2_id, "DISPUTED", now_iso)
    cursor.execute("""
    INSERT INTO buyer_acceptances (id, invoice_id, token, decision, decision_note, signature, created_at, decided_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "ba_seed_002", inv2_id, "token_seed_disputed_inv_002", "DISPUTED",
        "Duplicate invoice attempt. Order PO-4410 already billed under INV-8801.", sig_2,
        now_iso, now_iso, expires_iso
    ))
    record_audit_event(conn, "BUYER_DISPUTED", inv2_id, {
        "decision": "DISPUTED",
        "token_hash": hashlib.sha256(b"token_seed_disputed_inv_002").hexdigest()[:16],
        "signature_hash": sig_2[:16],
        "has_note": True
    })
