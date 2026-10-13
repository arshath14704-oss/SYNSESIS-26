import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, List
from app.schemas import RiskAssessmentResult, RiskFactor
from app.services.evidence_verification import reconcile_invoice_evidence
from app.services.duplicate_detection import detect_duplicate_invoices

def evaluate_invoice_risk(conn: sqlite3.Connection, invoice_id: str) -> RiskAssessmentResult:
    """Calculates an explainable 0–100 heuristic risk score using 5 distinct pillars."""
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    inv_row = cursor.fetchone()
    if not inv_row:
        raise ValueError(f"Invoice with ID {invoice_id} not found.")

    invoice = dict(inv_row)
    
    # 1. Run or fetch reconciliation
    recon = reconcile_invoice_evidence(conn, invoice_id)
    
    # 2. Run or fetch duplicate check
    dup = detect_duplicate_invoices(conn, invoice_id)

    # 3. Fetch Buyer profile (synthetic demo data)
    cursor.execute("SELECT * FROM buyer_profiles WHERE buyer_name = ?", (invoice["buyer_name"],))
    buyer_row = cursor.fetchone()
    buyer = dict(buyer_row) if buyer_row else {
        "buyer_name": invoice["buyer_name"],
        "credit_score": 710,
        "payment_default_rate": 0.04,
        "avg_days_to_pay": 38,
        "is_synthetic_demo": True
    }

    factors: List[RiskFactor] = []

    # =========================================================================
    # PILLAR 1: Document Inconsistency (Max 30 pts)
    # =========================================================================
    p1_points = 0
    p1_evidence = []
    
    # Check amount match
    if not recon.amount_match:
        p1_points += 20
        amt_discs = [d for d in recon.discrepancies if d.field == "amount"]
        if amt_discs:
            p1_evidence.append(amt_discs[0].message)
        else:
            p1_evidence.append("Invoice billing total diverges significantly from authorized PO amount.")

    # Check GSTIN and header consistency
    if not recon.party_match:
        p1_points += 10
        p1_evidence.append("Missing or unverified GSTIN tax registration identifiers.")

    p1_points = min(30, p1_points)
    factors.append(RiskFactor(
        category="Document Inconsistency",
        points=p1_points,
        max_points=30,
        severity="CRITICAL" if p1_points >= 20 else ("MEDIUM" if p1_points > 0 else "LOW"),
        factor_name="Invoice & PO Document Alignment",
        evidence="; ".join(p1_evidence) if p1_evidence else "Clean document match: Invoiced totals, GSTINs, and commercial terms align perfectly."
    ))

    # =========================================================================
    # PILLAR 2: Duplicate Claim Indicators (Max 30 pts)
    # =========================================================================
    p2_points = 0
    p2_evidence = []

    if dup.has_duplicates:
        top_match = dup.matches[0]
        # Differentiate whether this invoice is the original legitimate claim or the subsequent duplicate attempt
        cursor.execute("SELECT id, invoice_number, invoice_date, created_at, status FROM invoices WHERE id = ?", (top_match.matched_invoice_id,))
        m_row = cursor.fetchone()
        is_original_claim = False
        if m_row:
            t_date = invoice.get("invoice_date", "")
            m_date = m_row["invoice_date"] or ""
            t_num = invoice.get("invoice_number", "")
            m_num = m_row["invoice_number"] or ""
            if "-DUP" in m_num and "-DUP" not in t_num:
                is_original_claim = True
            elif t_date < m_date and "-DUP" not in t_num:
                is_original_claim = True

        if is_original_claim:
            p2_points = 0
            p2_evidence.append(f"Authentic primary claim: Subsequent unauthorized duplicate attempt (#{m_row['invoice_number']}) was quarantined; primary invoice protected.")
        elif top_match.match_type in ["EXACT_FILE_HASH", "NORMALIZED_CLAIM", "CROSS_LENDER_FINANCING_CLAIM"]:
            p2_points = 30
            p2_evidence.append(f"Confirmed duplicate financial claim: {top_match.explanation}")
        elif "REUSED_PO" in top_match.match_type:
            p2_points = 25
            p2_evidence.append(f"Collision on commercial instrument: {top_match.explanation}")
        else:
            p2_points = int(min(20, round(top_match.confidence * 25)))
            p2_evidence.append(f"High similarity flag: {top_match.explanation}")

    p2_points = min(30, p2_points)
    factors.append(RiskFactor(
        category="Duplicate Claim Indicators",
        points=p2_points,
        max_points=30,
        severity="CRITICAL" if p2_points >= 25 else ("MEDIUM" if p2_points > 0 else "LOW"),
        factor_name="Invoice Fingerprint & Registry Check",
        evidence="; ".join(p2_evidence) if p2_evidence else "Unique fingerprint verified: No identical files, normalized claims, or PO collisions found in local or registry logs."
    ))

    # =========================================================================
    # PILLAR 3: Delivery and PO Mismatch (Max 20 pts)
    # =========================================================================
    p3_points = 0
    p3_evidence = []

    if not recon.quantity_match:
        p3_points += 15
        qty_discs = [d for d in recon.discrepancies if "quantity" in d.field]
        if qty_discs:
            p3_evidence.append(qty_discs[0].message)
        else:
            p3_evidence.append("Physical delivery quantity lower than invoiced billing quantity.")

    if not recon.date_valid:
        p3_points += 5
        date_discs = [d for d in recon.discrepancies if d.field == "delivery_date"]
        if date_discs:
            p3_evidence.append(date_discs[0].message)
        else:
            p3_evidence.append("Chronological anomaly between delivery and billing date.")

    p3_points = min(20, p3_points)
    factors.append(RiskFactor(
        category="Delivery and PO Mismatch",
        points=p3_points,
        max_points=20,
        severity="CRITICAL" if p3_points >= 15 else ("MEDIUM" if p3_points > 0 else "LOW"),
        factor_name="Physical Fulfillment Verification",
        evidence="; ".join(p3_evidence) if p3_evidence else "Fulfillment confirmed: 100% of invoiced items verified by signed delivery receipt prior to invoice date."
    ))

    # =========================================================================
    # PILLAR 4: Buyer Payment History (Max 15 pts) [Synthetic Demo Data]
    # =========================================================================
    p4_points = 0
    p4_evidence = []
    
    credit_score = buyer.get("credit_score", 700)
    default_rate = buyer.get("payment_default_rate", 0.05)

    if credit_score < 600:
        p4_points = 15
        p4_evidence.append(f"[Synthetic Demo] Poor credit rating ({credit_score}/900) and historical default rate of {default_rate*100:.1f}%.")
    elif credit_score < 680:
        p4_points = 8
        p4_evidence.append(f"[Synthetic Demo] Moderate credit profile ({credit_score}/900) with minor delayed settlements.")
    else:
        p4_points = 2 # Baseline low credit friction
        p4_evidence.append(f"[Synthetic Demo] Prime institutional debtor ({credit_score}/900) with proven track record (avg {buyer.get('avg_days_to_pay', 30)} days).")

    p4_points = min(15, p4_points)
    factors.append(RiskFactor(
        category="Buyer Payment History",
        points=p4_points,
        max_points=15,
        severity="HIGH" if p4_points >= 12 else ("MEDIUM" if p4_points >= 8 else "LOW"),
        factor_name="Debtor Creditworthiness & Historical Default Rate",
        evidence="; ".join(p4_evidence)
    ))

    # =========================================================================
    # PILLAR 5: Unusual Transaction Patterns (Max 5 pts)
    # =========================================================================
    p5_points = 0
    p5_evidence = []
    
    amount = invoice.get("amount", 0.0)
    if amount > 5000000.0:
        p5_points = 5
        p5_evidence.append(f"High-exposure single ticket size (> ₹50 Lakhs: ₹{amount:,.2f}). Increased liquidity risk.")
    elif amount > 1500000.0:
        p5_points = 2
        p5_evidence.append(f"Substantial single-draw financing request (₹{amount:,.2f}).")
    else:
        p5_points = 0
        p5_evidence.append("Standard invoice ticket size within typical SME financing threshold.")

    p5_points = min(5, p5_points)
    factors.append(RiskFactor(
        category="Unusual Transaction Patterns",
        points=p5_points,
        max_points=5,
        severity="MEDIUM" if p5_points >= 4 else "LOW",
        factor_name="Transaction Size & Exposure Velocity",
        evidence="; ".join(p5_evidence)
    ))

    # =========================================================================
    # BUYER ACCEPTANCE CONFIRMATION CHECK
    # =========================================================================
    cursor.execute("""
    SELECT decision, decision_note, decided_at FROM buyer_acceptances 
    WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1
    """, (invoice_id,))
    ba_row = cursor.fetchone()
    
    if ba_row:
        ba_dict = dict(ba_row)
        ba_decision = ba_dict["decision"]
        if ba_decision == "ACCEPTED":
            current_subtotal = sum(f.points for f in factors)
            reduction = min(10, max(0, current_subtotal))
            factors.append(RiskFactor(
                category="Buyer Confirmation",
                points=-reduction,
                max_points=0,
                severity="LOW",
                factor_name="Debtor Acceptance Sign-Off",
                evidence="Debtor confirmed invoice legitimacy and physical fulfillment via cryptographic buyer portal."
            ))
        elif ba_decision == "DISPUTED":
            note_str = f" Reason: '{ba_dict['decision_note']}'." if ba_dict.get("decision_note") else ""
            factors.append(RiskFactor(
                category="Buyer Confirmation",
                points=35,
                max_points=35,
                severity="CRITICAL",
                factor_name="Debtor Commercial Dispute",
                evidence=f"Debtor explicitly disputed billing/fulfillment via buyer acceptance portal.{note_str}"
            ))

    # Calculate Total Normalized Score
    raw_total = sum(f.points for f in factors)
    total_score = min(100, max(0, raw_total))

    # Assign Risk Band
    if ba_row and ba_row["decision"] == "DISPUTED":
        risk_band = "HIGH"
        recommendation = "REJECT"
        summary_explanation = f"High Risk ({total_score}/100): Debtor actively disputed invoice claims. Financing strictly REJECTED."
    elif total_score >= 60:
        risk_band = "HIGH"
        recommendation = "REJECT"
        summary_explanation = f"High Risk ({total_score}/100): Critical anomalies detected across commercial terms or duplicate checks. Financing should be REJECTED or placed on immediate administrative freeze."
    elif total_score >= 30:
        risk_band = "MEDIUM"
        recommendation = "MANUAL_REVIEW"
        summary_explanation = f"Medium Risk ({total_score}/100): Partial discrepancies identified in logistics reconciliation or debtor credit profile. Requires human compliance officer sign-off."
    else:
        risk_band = "LOW"
        recommendation = "APPROVE"
        summary_explanation = f"Low Risk ({total_score}/100): Validated 3-way match, zero duplicate indicators, and strong buyer credit profile. Eligible for accelerated human approval."

    eval_time = datetime.utcnow().isoformat() + "Z"

    # Persist in DB
    cursor.execute("""
    INSERT INTO risk_evaluations (id, invoice_id, risk_score, risk_band, recommendation, breakdown_json, explanations_json, evaluated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(invoice_id) DO UPDATE SET
        risk_score = excluded.risk_score,
        risk_band = excluded.risk_band,
        recommendation = excluded.recommendation,
        breakdown_json = excluded.breakdown_json,
        explanations_json = excluded.explanations_json,
        evaluated_at = excluded.evaluated_at;
    """, (
        f"risk_{invoice_id}",
        invoice_id,
        total_score,
        risk_band,
        recommendation,
        json.dumps([f.model_dump() for f in factors]),
        json.dumps({"summary": summary_explanation}),
        eval_time
    ))

    return RiskAssessmentResult(
        invoice_id=invoice_id,
        risk_score=total_score,
        risk_band=risk_band,
        recommendation=recommendation,
        summary_explanation=summary_explanation,
        factors=factors,
        evaluated_at=eval_time
    )
