from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total: float

class ExtractedInvoiceData(BaseModel):
    invoice_number: str
    supplier_name: str
    buyer_name: str
    supplier_gstin: Optional[str] = None
    buyer_gstin: Optional[str] = None
    po_number: Optional[str] = None
    invoice_date: str
    due_date: Optional[str] = None
    amount: float
    tax_amount: float = 0.0
    currency: str = "INR"
    line_items: List[LineItem] = []
    confidence_scores: Dict[str, float] = {}
    missing_fields: List[str] = []
    extraction_source: str = "OCR_OR_PARSER" # 'NATIVE_PDF', 'OCR', 'FALLBACK_STRUCTURED'

class InvoiceCreate(BaseModel):
    invoice_number: str
    supplier_name: str
    buyer_name: str
    supplier_gstin: Optional[str] = None
    buyer_gstin: Optional[str] = None
    po_number: Optional[str] = None
    invoice_date: str
    due_date: Optional[str] = None
    amount: float
    tax_amount: float = 0.0
    currency: str = "INR"
    line_items: List[LineItem] = []
    file_name: Optional[str] = "manual_entry.pdf"
    file_sha256: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    supplier_name: str
    buyer_name: str
    supplier_gstin: Optional[str] = None
    buyer_gstin: Optional[str] = None
    po_number: Optional[str] = None
    invoice_date: str
    due_date: Optional[str] = None
    amount: float
    tax_amount: float
    currency: str
    status: str
    file_name: Optional[str]
    file_sha256: Optional[str]
    normalized_fingerprint: Optional[str]
    line_items: List[LineItem] = []
    created_at: str
    updated_at: str

class EvidenceDoc(BaseModel):
    id: str
    invoice_id: Optional[str]
    doc_type: str # 'PURCHASE_ORDER', 'DELIVERY_RECEIPT', 'CONTRACT'
    doc_reference: str
    issue_date: Optional[str]
    expected_amount: Optional[float]
    expected_quantity: Optional[int]
    delivered_quantity: Optional[int]
    status: str = "ACTIVE"
    details: Dict[str, Any] = {}

class Discrepancy(BaseModel):
    field: str
    source_val: Any
    target_val: Any
    severity: str # 'LOW', 'MEDIUM', 'CRITICAL'
    message: str

class ReconciliationResult(BaseModel):
    invoice_id: str
    overall_status: str # 'MATCHED', 'DISCREPANCY_DETECTED', 'CRITICAL_MISMATCH'
    amount_match: bool
    quantity_match: bool
    date_valid: bool
    party_match: bool
    discrepancies: List[Discrepancy]
    reconciled_at: str

class DuplicateMatch(BaseModel):
    matched_invoice_id: str
    matched_invoice_number: str
    matched_supplier: str
    match_type: str # 'EXACT_FILE_HASH', 'NORMALIZED_CLAIM', 'FUZZY_SIMILARITY', 'REUSED_PO'
    confidence: float
    shared_fields: List[str]
    explanation: str

class DuplicateCheckResult(BaseModel):
    invoice_id: str
    has_duplicates: bool
    duplicate_count: int
    highest_similarity: float
    matches: List[DuplicateMatch]
    fingerprint: str
    graph_nodes: List[Dict[str, Any]] = []
    graph_edges: List[Dict[str, Any]] = []

class RiskFactor(BaseModel):
    category: str
    points: int
    max_points: int
    severity: str
    factor_name: str
    evidence: str

class RiskAssessmentResult(BaseModel):
    invoice_id: str
    risk_score: int # 0 to 100
    risk_band: str # 'LOW', 'MEDIUM', 'HIGH'
    recommendation: str # 'APPROVE', 'MANUAL_REVIEW', 'REJECT'
    summary_explanation: str
    factors: List[RiskFactor]
    evaluated_at: str

class DecisionRequest(BaseModel):
    decision: str # 'APPROVE', 'REJECT', 'HOLD', 'FINANCE', 'REPAY', 'DISPUTE'
    reviewer_notes: Optional[str] = "Reviewer verified evidence."
    reviewer_id: Optional[str] = "COMPLIANCE_OFFICER_01"

class AuditBlockResponse(BaseModel):
    block_id: int
    event_type: str
    invoice_id: Optional[str]
    timestamp: str
    metadata: Dict[str, Any]
    prev_hash: str
    current_hash: str

class AuditVerificationResult(BaseModel):
    is_valid: bool
    total_blocks: int
    genesis_hash: str
    latest_hash: str
    corrupted_block_id: Optional[int] = None
    expected_hash: Optional[str] = None
    actual_hash: Optional[str] = None
    error_message: Optional[str] = None

class FinancingClaimRequest(BaseModel):
    invoice_id: Optional[str] = None
    invoice_number: str
    invoice_fingerprint: str
    lender_id: str
    lender_name: str
    amount: float

class FinancingClaimResponse(BaseModel):
    claim_id: str
    invoice_id: Optional[str]
    invoice_number: str
    invoice_fingerprint: str
    lender_id: str
    lender_name: str
    amount: float
    status: str
    claim_timestamp: str
    collision_detected: bool = False
    collision_message: Optional[str] = None

class BuyerAcceptanceLinkResponse(BaseModel):
    id: str
    invoice_id: str
    token: str
    url: str
    expires_at: str
    decision: str = "PENDING"

class BuyerAcceptancePublicInfo(BaseModel):
    invoice_number: str
    supplier_name: str
    buyer_name: str
    amount: float
    currency: str
    invoice_date: str
    token: str
    status: str
    expires_at: str
    decision: str = "PENDING"

class BuyerAcceptanceDecisionRequest(BaseModel):
    decision: str # "ACCEPT" | "DISPUTE"
    note: Optional[str] = None

class BuyerAcceptanceDecisionResponse(BaseModel):
    status: str
    decision: str
    signature: str
    receipt_hash: str
    decided_at: str
    message: str

class BuyerAcceptanceStatusResponse(BaseModel):
    id: Optional[str] = None
    invoice_id: str
    token: Optional[str] = None
    decision: str = "NONE" # NONE, PENDING, ACCEPTED, DISPUTED
    decision_note: Optional[str] = None
    signature: Optional[str] = None
    created_at: Optional[str] = None
    decided_at: Optional[str] = None
    expires_at: Optional[str] = None
    url: Optional[str] = None

class DashboardMetrics(BaseModel):
    total_invoices: int
    verified_invoices: int
    potential_duplicates: int
    flagged_manual_review: int
    total_invoice_value: float
    estimated_financing_exposure: float
    avg_verification_time_seconds: float
    audit_chain_valid: bool
    audit_block_count: int
    buyer_confirmed_invoices: int = 0
    status_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    volume_trends: List[Dict[str, Any]]
    fraud_prevented_amount: float = 0.0
    recent_invoices: List[Dict[str, Any]] = []
    recent_audit_events: List[Dict[str, Any]] = []

class SubmissionInvoiceData(BaseModel):
    invoice_number: str
    invoice_date: str
    due_date: Optional[str] = None
    supplier_name: str
    buyer_name: str
    supplier_gstin: Optional[str] = None
    buyer_gstin: Optional[str] = None
    po_number: Optional[str] = None
    amount: float
    tax_amount: float = 0.0
    currency: str = "INR"
    line_items: List[LineItem] = []
    confidence_scores: Dict[str, float] = {}
    missing_fields: List[str] = []

class SubmissionPOData(BaseModel):
    po_number: str
    po_date: str
    supplier_name: str
    buyer_name: str
    amount: float
    line_items: List[LineItem] = []
    is_signed: bool = False
    confidence_scores: Dict[str, float] = {}
    missing_fields: List[str] = []

class SubmissionDeliveryData(BaseModel):
    receipt_reference: str
    delivery_date: str
    received_quantity: int
    items: List[Dict[str, Any]] = []
    receiver_signoff: bool = False
    confidence_scores: Dict[str, float] = {}
    missing_fields: List[str] = []

class SubmissionExtractionResult(BaseModel):
    invoice: SubmissionInvoiceData
    po: SubmissionPOData
    delivery: SubmissionDeliveryData

class SubmissionResponse(BaseModel):
    id: str
    supplier_id: Optional[str] = None
    status: str
    invoice_hash: str
    po_hash: str
    delivery_hash: str
    invoice_filename: Optional[str] = None
    po_filename: Optional[str] = None
    delivery_filename: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    created_at: str

class SSEExtractionEvent(BaseModel):
    stage: str
    field: Optional[str] = None
    value: Optional[Any] = None
    confidence: Optional[float] = None
    progress: int
    message: str

