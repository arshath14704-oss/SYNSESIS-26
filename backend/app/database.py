import sqlite3
import os
from typing import Generator

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "invoicetrust.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency yielding SQLite connection with auto-commit/rollback."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initializes tables for invoices, evidence, audit ledger, and cross-lender registry."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Invoices Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT NOT NULL,
            supplier_name TEXT NOT NULL,
            buyer_name TEXT NOT NULL,
            supplier_gstin TEXT,
            buyer_gstin TEXT,
            po_number TEXT,
            invoice_date TEXT NOT NULL,
            due_date TEXT,
            amount REAL NOT NULL,
            tax_amount REAL DEFAULT 0.0,
            currency TEXT DEFAULT 'INR',
            status TEXT NOT NULL,
            file_name TEXT,
            file_sha256 TEXT,
            normalized_fingerprint TEXT,
            line_items_json TEXT,
            raw_extracted_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Evidence Supporting Documents Table (PO, Delivery, Contract)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS evidence_documents (
            id TEXT PRIMARY KEY,
            invoice_id TEXT,
            doc_type TEXT NOT NULL,
            doc_reference TEXT NOT NULL,
            issue_date TEXT,
            expected_amount REAL,
            expected_quantity INTEGER,
            delivered_quantity INTEGER,
            status TEXT DEFAULT 'ACTIVE',
            details_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
        """)

        # Reconciliation Results Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reconciliations (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL UNIQUE,
            overall_status TEXT NOT NULL,
            amount_match BOOLEAN,
            quantity_match BOOLEAN,
            date_valid BOOLEAN,
            party_match BOOLEAN,
            discrepancies_json TEXT,
            reconciled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
        """)

        # Risk Evaluations Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS risk_evaluations (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL UNIQUE,
            risk_score INTEGER NOT NULL,
            risk_band TEXT NOT NULL,
            recommendation TEXT NOT NULL,
            breakdown_json TEXT NOT NULL,
            explanations_json TEXT NOT NULL,
            evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
        """)

        # Tamper-Evident SHA-256 Audit Ledger Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_ledger (
            block_id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            invoice_id TEXT,
            timestamp TEXT NOT NULL,
            metadata_json TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            current_hash TEXT NOT NULL
        );
        """)

        # Cross-Lender Financing Registry Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS financing_claims (
            claim_id TEXT PRIMARY KEY,
            invoice_id TEXT,
            invoice_number TEXT NOT NULL,
            invoice_fingerprint TEXT NOT NULL,
            lender_id TEXT NOT NULL,
            lender_name TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            claim_timestamp TEXT NOT NULL,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
        );
        """)

        # Synthetic Buyer Reputations
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS buyer_profiles (
            buyer_name TEXT PRIMARY KEY,
            buyer_gstin TEXT,
            credit_score INTEGER,
            payment_default_rate REAL,
            avg_days_to_pay INTEGER,
            is_synthetic_demo BOOLEAN DEFAULT 1
        );
        """)

        # Buyer Acceptance Portal Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS buyer_acceptances (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            decision TEXT DEFAULT 'PENDING',
            decision_note TEXT,
            signature TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            decided_at TEXT,
            expires_at TEXT NOT NULL,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
        """)

        # Submissions Table (SME Dashboard 3-Slot Ingestion)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            supplier_id TEXT,
            status TEXT DEFAULT 'INGESTED',
            invoice_hash TEXT NOT NULL,
            po_hash TEXT NOT NULL,
            delivery_hash TEXT NOT NULL,
            invoice_filename TEXT,
            po_filename TEXT,
            delivery_filename TEXT,
            extracted_data_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        conn.commit()
    finally:
        conn.close()

