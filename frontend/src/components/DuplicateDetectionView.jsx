import React, { useState } from 'react';
import { 
  Copy, AlertTriangle, CheckCircle2, ShieldAlert, Fingerprint, 
  ArrowRight, RefreshCw, Network, Share2, Layers
} from 'lucide-react';
import { checkDuplicates } from '../services/api';
import FraudInvestigationLab from './FraudInvestigationLab';

export default function DuplicateDetectionView({
  selectedInvoiceId,
  invoiceDetails,
  onReloadDetails,
  setActiveTab
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [error, setError] = useState(null);

  if (!invoiceDetails || !invoiceDetails.invoice) {
    return (
      <div className="p-12 text-center text-[#527763]">
        <p className="text-base font-medium">Please select an invoice from the Dashboard to perform duplicate fingerprinting.</p>
      </div>
    );
  }

  const { invoice } = invoiceDetails;

  const handleRunDuplicateCheck = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const res = await checkDuplicates(selectedInvoiceId);
      setDuplicateResult(res);
      await onReloadDetails(selectedInvoiceId);
    } catch (err) {
      setError(err.message || 'Duplicate check failed');
    } finally {
      setIsChecking(false);
    }
  };

  const hasDups = duplicateResult ? duplicateResult.has_duplicates : (invoice.status === 'UNDER_REVIEW' && invoice.invoice_number.includes('-DUP'));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight text-[#173D32] leading-tight">
            Advanced Duplicate Invoice Detection & Fraud Graph
          </h1>
          <p className="text-base text-[#527763] mt-1">
            Multi-tier fingerprinting: Byte-level SHA-256, normalized commercial claims, and cross-lender registry collision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunDuplicateCheck}
            disabled={isChecking}
            className="px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-bold shadow-md border border-[#527763]/40 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Scanning Registry...' : 'Scan Duplicate Fingerprints'}</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7EE] hover:bg-[#245747] hover:text-[#F0EBDD] text-[#245747] border border-[#D8CEBC] text-[15px] font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Next: Financing Decision</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#813E43]/15 border border-[#813E43]/40 text-[#813E43] text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#813E43] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Tier 1: File SHA-256 */}
        <div className="p-5 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-[#173D32]">
            <span className="font-bold text-[#245747] uppercase tracking-wider">Tier 1: Document SHA-256</span>
            <Fingerprint className="w-5 h-5 text-[#245747]" />
          </div>
          <div className="text-xs font-mono text-[#245747] font-semibold break-all bg-[#FFFFFF] p-3 rounded-xl border border-[#D8CEBC]">
            {invoice.file_sha256 || 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
          </div>
          <p className="text-sm text-[#527763] leading-normal">Detects exact byte-for-byte uploaded file duplicates across past batches.</p>
        </div>

        {/* Tier 2: Normalized Composite Fingerprint */}
        <div className="p-5 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-[#173D32]">
            <span className="font-bold text-[#527763] uppercase tracking-wider">Tier 2: Commercial Claim Digest</span>
            <Layers className="w-5 h-5 text-[#527763]" />
          </div>
          <div className="text-xs font-mono text-[#173D32] font-semibold break-all bg-[#FFFFFF] p-3 rounded-xl border border-[#D8CEBC]">
            {invoice.normalized_fingerprint || duplicateResult?.fingerprint || 'CLAIM: a4b9e83120cfd911a84f331904e223b91a7882'}
          </div>
          <p className="text-sm text-[#527763] leading-normal">Normalizes Supplier + Buyer + Amount + Currency + PO to catch altered invoice numbers.</p>
        </div>

        {/* Tier 3: PO Reuse & Network Overlap */}
        <div className="p-5 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-[#173D32]">
            <span className="font-bold text-[#173D32] uppercase tracking-wider">Tier 3: PO Reuse Defense</span>
            <Network className="w-5 h-5 text-[#173D32]" />
          </div>
          <div className="text-sm font-bold text-[#173D32] font-mono bg-[#FFFFFF] p-3 rounded-xl border border-[#D8CEBC] flex items-center justify-between">
            <span>PO #{invoice.po_number || 'N/A'}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${hasDups ? 'bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/40' : 'bg-[#245747]/15 text-[#245747] border border-[#527763]/40'}`}>
              {hasDups ? 'COLLISION DETECTED' : 'UNIQUE INSTRUMENT'}
            </span>
          </div>
          <p className="text-sm text-[#527763] leading-normal">Flags repeated purchase orders submitted under slightly modified invoice identifiers.</p>
        </div>

      </div>

      {/* Matched Conflicting Invoices List */}
      {duplicateResult?.matches?.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#FAF7EE] border-2 border-[#813E43] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#813E43]" />
              <h2 className="text-[20px] font-bold text-[#813E43]">Conflicting Claims & Collisions in Network</h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/40 font-bold">
              HOLD RECOMMENDED
            </span>
          </div>

          <div className="space-y-3">
            {duplicateResult.matches.map((match, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#173D32]">{match.matched_invoice_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#E6DDC9] text-[#25352E] font-semibold">
                      Match: {match.match_type}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#813E43]">
                    {(match.confidence * 100).toFixed(0)}% Match Confidence
                  </span>
                </div>
                <p className="text-sm text-[#25352E] leading-relaxed">{match.explanation}</p>
                <div className="flex items-center gap-2 text-xs text-[#527763] pt-1">
                  <span>Shared Overlapping Fields:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {match.shared_fields.map((f, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded bg-[#FAF7EE] border border-[#D8CEBC] font-mono text-[#245747] text-xs font-semibold">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Conflict Entity Graph */}
      <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#245747]" />
            <h2 className="text-[20px] font-bold text-[#173D32]">Interactive Conflict Entity Graph</h2>
          </div>
          <span className="text-sm text-[#527763]">Dynamic node visualization of participants & collisions</span>
        </div>

        {/* Interactive SVG Network Map */}
        <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] relative overflow-hidden">
          <svg className="w-full h-64" viewBox="0 0 800 240">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E6DDC9" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="800" height="240" fill="url(#grid)" />

            {/* Connecting lines */}
            <line x1="120" y1="120" x2="360" y2="120" stroke="#245747" strokeWidth="2.5" strokeDasharray={hasDups ? "4,4" : "none"} />
            <text x="230" y="112" fill="#527763" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">ISSUED_BY</text>

            <line x1="440" y1="120" x2="680" y2="120" stroke="#527763" strokeWidth="2.5" />
            <text x="560" y="112" fill="#527763" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">BILLED_TO</text>

            {invoice.po_number && (
              <>
                <line x1="400" y1="95" x2="400" y2="40" stroke="#C5A66B" strokeWidth="2" />
                <text x="410" y="70" fill="#8F7441" fontSize="10" fontFamily="sans-serif" fontWeight="bold">PO_REF</text>
                <circle cx="400" cy="30" r="18" fill="#E6DDC9" stroke="#C5A66B" strokeWidth="2" />
                <text x="400" y="34" fill="#173D32" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">PO</text>
              </>
            )}

            {hasDups && (
              <>
                <line x1="400" y1="145" x2="400" y2="200" stroke="#813E43" strokeWidth="2.5" strokeDasharray="3,3" />
                <text x="410" y="175" fill="#813E43" fontSize="10" fontFamily="sans-serif" fontWeight="bold">CONFLICT_DETECTED</text>
                <circle cx="400" cy="210" r="20" fill="#813E43" stroke="#813E43" strokeWidth="2" />
                <text x="400" y="214" fill="#F0EBDD" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">DUP</text>
              </>
            )}

            {/* Node 1: Supplier */}
            <circle cx="120" cy="120" r="34" fill="#173D32" stroke="#245747" strokeWidth="2.5" />
            <text x="120" y="116" fill="#F0EBDD" fontSize="11" fontWeight="bold" textAnchor="middle">
              SUPPLIER
            </text>
            <text x="120" y="130" fill="#E6DDC9" fontSize="9" textAnchor="middle">
              {invoice.supplier_name.slice(0, 14)}...
            </text>

            {/* Node 2: Target Invoice */}
            <circle cx="400" cy="120" r="44" fill={hasDups ? "#813E43" : "#245747"} stroke={hasDups ? "#6D3337" : "#173D32"} strokeWidth="3" />
            <text x="400" y="112" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {invoice.invoice_number.slice(0, 12)}
            </text>
            <text x="400" y="128" fill="#C5A66B" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              ₹{(invoice.amount / 100000).toFixed(1)}L
            </text>
            <text x="400" y="142" fill={hasDups ? "#F0EBDD" : "#E6DDC9"} fontSize="9" fontWeight="bold" textAnchor="middle">
              {hasDups ? "COLLISION" : "UNIQUE"}
            </text>

            {/* Node 3: Buyer */}
            <circle cx="680" cy="120" r="34" fill="#173D32" stroke="#527763" strokeWidth="2.5" />
            <text x="680" y="116" fill="#F0EBDD" fontSize="11" fontWeight="bold" textAnchor="middle">
              BUYER
            </text>
            <text x="680" y="130" fill="#E6DDC9" fontSize="9" textAnchor="middle">
              {invoice.buyer_name.slice(0, 14)}...
            </text>
          </svg>

          {hasDups && (
            <div className="mt-3 p-3.5 rounded-xl bg-[#813E43]/15 border border-[#813E43]/40 text-[#813E43] text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#813E43] shrink-0" />
              <span>
                <strong>Multi-Instrument Graph Collision:</strong> Purchase Order #{invoice.po_number} is concurrently linked to multiple active invoice nodes across the network.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fraud Investigation Lab Panel */}
      <FraudInvestigationLab 
        onSelectInvoice={onReloadDetails}
        setActiveTab={setActiveTab}
      />

    </div>
  );
}
