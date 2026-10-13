import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, ShieldCheck, ArrowRight, 
  DollarSign, AlertOctagon, UserCheck, AlertTriangle, FileText,
  Link, Copy, QrCode, ExternalLink, Check, Lock
} from 'lucide-react';
import { submitDecision, fetchAcceptanceStatus, createAcceptanceLink } from '../services/api';

const PIPELINE_STEPS = [
  { id: 'SUBMITTED', label: '1. Ingested' },
  { id: 'VERIFIED', label: '2. 3-Way Verified' },
  { id: 'ELIGIBLE_FOR_HUMAN_APPROVAL', label: '3. Risk Screened' },
  { id: 'APPROVED', label: '4. Human Approved' },
  { id: 'FINANCED', label: '5. Capital Disbursed' },
];

export default function FinancingWorkflowView({
  selectedInvoiceId,
  invoiceDetails,
  onReloadDetails,
  setActiveTab,
  onOpenBuyerPortal
}) {
  const [decision, setDecision] = useState('APPROVE');
  const [reviewerNotes, setReviewerNotes] = useState('Compliance verified 3-way match, unique fingerprint, and clean debtor credit profile.');
  const [reviewerId, setReviewerId] = useState('COMPLIANCE_OFFICER_01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  // Buyer Acceptance State
  const [acceptance, setAcceptance] = useState(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAcceptance() {
      if (selectedInvoiceId) {
        try {
          const res = await fetchAcceptanceStatus(selectedInvoiceId);
          setAcceptance(res);
        } catch (err) {
          console.error(err);
        }
      }
    }
    loadAcceptance();
  }, [selectedInvoiceId]);

  if (!invoiceDetails || !invoiceDetails.invoice) {
    return (
      <div className="p-12 text-center text-[#527763]">
        <p className="text-base font-medium">Please select an invoice from the Dashboard to manage financing approval.</p>
      </div>
    );
  }

  const { invoice, risk_evaluation } = invoiceDetails;
  const isHighRisk = risk_evaluation?.risk_band === 'HIGH';

  const handleDecisionSubmit = async (chosenAction) => {
    setIsSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await submitDecision(selectedInvoiceId, chosenAction, reviewerNotes, reviewerId);
      setFeedback(res.message);
      await onReloadDetails(selectedInvoiceId);
    } catch (err) {
      setError(err.message || 'Decision failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    setError(null);
    try {
      const res = await createAcceptanceLink(selectedInvoiceId);
      setAcceptance({
        ...res,
        decision: 'PENDING',
        url: res.url
      });
    } catch (err) {
      setError(err.message || 'Failed to generate buyer link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (acceptance?.token) {
      const fullUrl = `${window.location.origin}/accept/${acceptance.token}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight text-[#173D32] leading-tight">
            Financing Workflow & Settlement Console
          </h1>
          <p className="text-base text-[#527763] mt-1">
            Enforcing Human-in-the-Loop compliance approvals, buyer verification links, and capital disbursement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('audit')}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7EE] hover:bg-[#245747] hover:text-[#F0EBDD] text-[#245747] border border-[#D8CEBC] text-[15px] font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Next: Audit Centre</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-[#245747]/15 border border-[#527763]/40 text-[#245747] text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-[#245747] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[#813E43]/15 border border-[#813E43]/40 text-[#813E43] text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-5 h-5 text-[#813E43] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lifecycle Progress Stepper */}
      <div className="p-5 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm">
        <div className="text-xs font-bold text-[#527763] uppercase tracking-wider mb-3 font-mono">
          FINANCING PIPELINE LIFECYCLE
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[15px]">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCurrent = invoice.status === step.id;
            const isPast = ['APPROVED', 'FINANCED'].includes(invoice.status) && idx <= 3;
            return (
              <div 
                key={step.id} 
                className={`flex-1 p-3 rounded-xl border text-center transition-all w-full ${
                  isCurrent 
                    ? 'bg-[#245747] border-[#C5A66B] text-[#F0EBDD] font-bold shadow-md' 
                    : isPast 
                    ? 'bg-[#1E4A3D] border-[#527763] text-[#E6DDC9] font-semibold' 
                    : 'bg-[#FAF7EE] border-[#D8CEBC] text-[#527763]'
                }`}
              >
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buyer Acceptance Gateway Card */}
      <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8CEBC]">
          <div>
            <h2 className="text-[20px] font-bold text-[#173D32] flex items-center gap-2">
              <Link className="w-5 h-5 text-[#245747]" />
              <span>Corporate Debtor (Buyer) Cryptographic Signoff Gateway</span>
            </h2>
            <p className="text-base text-[#527763] mt-0.5">
              Generate an immutable digital signoff link for {invoice.buyer_name} to confirm goods delivery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!acceptance?.token ? (
              <button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className="px-4 py-2 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#527763]/40"
              >
                <Link className="w-4 h-4" />
                <span>{isGeneratingLink ? 'Generating...' : 'Generate Buyer Signoff Link'}</span>
              </button>
            ) : (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                acceptance.decision === 'ACCEPTED' ? 'bg-[#245747]/15 text-[#245747] border-[#527763]/40' :
                acceptance.decision === 'DISPUTED' ? 'bg-[#813E43]/20 text-[#813E43] border-[#813E43]/40' :
                'bg-[#C5A66B]/20 text-[#8F7441] border-[#C5A66B]/50'
              }`}>
                {acceptance.decision === 'ACCEPTED' ? 'BUYER ACCEPTED' :
                 acceptance.decision === 'DISPUTED' ? 'BUYER DISPUTED' :
                 'PENDING BUYER SIGNOFF'}
              </span>
            )}
          </div>
        </div>

        {acceptance?.token && (
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <span className="text-[#527763] font-medium">Public Verification URL:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF7EE] hover:bg-[#E6DDC9] border border-[#D8CEBC] text-[#173D32] text-xs transition flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#245747]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={() => onOpenBuyerPortal(acceptance.token)}
                  className="px-3 py-1.5 rounded-lg bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-xs transition flex items-center gap-1 cursor-pointer font-bold shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Buyer Portal</span>
                </button>
              </div>
            </div>

            <div className="text-sm font-mono text-[#245747] font-bold break-all bg-[#FAF7EE] p-3 rounded-lg border border-[#D8CEBC]">
              {`${window.location.origin}/accept/${acceptance.token}`}
            </div>

            {acceptance.signature && (
              <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-xs font-mono">
                <span className="text-[#527763]">Cryptographic Seal Signature:</span>
                <span className="text-[#245747] font-bold truncate max-w-sm">{acceptance.signature}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Human Compliance Decision Panel */}
      <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8CEBC]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#245747]" />
            <h2 className="text-[20px] font-bold text-[#173D32]">
              Human Compliance Review & Decision
            </h2>
          </div>
          <span className="text-sm text-[#527763] font-semibold">Role: Compliance Officer</span>
        </div>

        {isHighRisk && (
          <div className="p-3.5 rounded-xl bg-[#813E43]/15 border border-[#813E43]/40 text-[#813E43] text-sm flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-[#813E43] shrink-0" />
            <span>
              <strong>Compliance Guard Active:</strong> High-risk invoice claims cannot be approved without entering an explicit compliance <code>OVERRIDE</code> in the reviewer notes.
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-base font-bold text-[#173D32] uppercase mb-1.5">
              Reviewer Notes & Audit Justification:
            </label>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded-xl p-3.5 text-base text-[#25352E] focus:outline-none focus:border-[#245747]"
              placeholder="Enter compliance justification notes here..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-sm text-[#527763] font-medium">
              <span>Reviewer ID: </span>
              <strong className="text-[#173D32] font-mono font-bold">{reviewerId}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleDecisionSubmit('HOLD')}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7EE] hover:bg-[#E6DDC9] text-[#8F7441] border border-[#C5A66B]/50 text-[15px] font-bold transition cursor-pointer shadow-sm"
              >
                Place on Hold
              </button>
              <button
                onClick={() => handleDecisionSubmit('REJECT')}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-[#813E43]/15 hover:bg-[#813E43]/25 border border-[#813E43]/40 text-[#813E43] text-[15px] font-bold transition cursor-pointer shadow-sm"
              >
                Reject Claim
              </button>
              <button
                onClick={() => handleDecisionSubmit('APPROVE')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-bold shadow-md border border-[#527763]/40 transition cursor-pointer"
              >
                Approve Invoice
              </button>
              <button
                onClick={() => handleDecisionSubmit('FINANCE')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#173D32] hover:bg-[#133027] text-[#C5A66B] text-[15px] font-bold shadow-md border border-[#C5A66B]/40 transition cursor-pointer"
              >
                Disburse Capital (Finance)
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
