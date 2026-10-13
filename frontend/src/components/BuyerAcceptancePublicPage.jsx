import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, 
  Building2, DollarSign, Calendar, FileText, ArrowRight, Lock, 
  Check, ShieldAlert, Hash, Award
} from 'lucide-react';
import { fetchPublicAcceptance, submitBuyerDecision } from '../services/api';

export default function BuyerAcceptancePublicPage({ token, onBackToApp }) {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPublicAcceptance(token);
        setInvoice(data);
      } catch (err) {
        setError(err.message || 'Unable to load invoice confirmation.');
      } finally {
        setIsLoading(false);
      }
    }
    if (token) {
      loadData();
    }
  }, [token]);

  const handleDecision = async (chosenDecision) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await submitBuyerDecision(token, chosenDecision, note);
      setReceipt(res);
    } catch (err) {
      setError(err.message || 'Failed to submit decision.');
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-[#F0EBDD] text-[#25352E] flex flex-col justify-center items-center px-4 py-8">
      
      {/* Brand Header */}
      <div className="max-w-md w-full text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#173D32] border border-[#C5A66B]/50 shadow-xl mb-3">
          <Award className="w-7 h-7 text-[#C5A66B]" />
        </div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-[#173D32]">
          InvoiceTrust AI
        </h1>
        <p className="text-xs text-[#527763] mt-0.5">
          Buyer Confirmation & Cryptographic Sign-Off Portal
        </p>
      </div>

      <div className="max-w-md w-full bg-[#FAF7EE] border-2 border-[#173D32] rounded-2xl shadow-xl overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center text-[#527763] space-y-3">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-[#245747] border-t-transparent rounded-full"></div>
            <p className="text-xs">Validating security token & loading invoice claims...</p>
          </div>
        )}

        {/* Error State (404 / 410) */}
        {!isLoading && error && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#813E43]/20 border border-[#813E43]/40 flex items-center justify-center text-[#813E43]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#173D32] font-mono">Confirmation Link Unavailable</h2>
              <p className="text-xs text-[#813E43] mt-2 leading-relaxed">{error}</p>
            </div>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="mt-4 px-4 py-2 rounded-lg bg-[#FAF7EE] hover:bg-[#E6DDC9] text-[#173D32] border border-[#D8CEBC] text-xs font-semibold transition"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        )}

        {/* Receipt View (After Decision) */}
        {!isLoading && receipt && (
          <div className="p-8 space-y-5 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                receipt.decision === 'ACCEPTED' 
                  ? 'bg-[#245747]/20 text-[#245747] border border-[#527763]/40' 
                  : 'bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/40'
              }`}>
                {receipt.decision === 'ACCEPTED' ? <Check className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <h2 className="text-base font-bold text-[#173D32] font-mono">
                {receipt.decision === 'ACCEPTED' ? 'Receipt Cryptographically Confirmed' : 'Commercial Dispute Filed'}
              </h2>
              <p className="text-xs text-[#527763] leading-relaxed">
                {receipt.message}
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#D8CEBC] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#527763]">Status:</span>
                <span className="text-[#245747] font-bold">{receipt.status}</span>
              </div>
              {receipt.digital_signature && (
                <div className="pt-2 border-t border-[#D8CEBC]">
                  <span className="text-[#527763] block text-[10px]">DIGITAL SIGNATURE RECEIPT:</span>
                  <span className="text-[#245747] break-all font-bold">{receipt.digital_signature}</span>
                </div>
              )}
            </div>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="w-full py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] font-bold text-xs transition cursor-pointer shadow-md"
              >
                Return to Platform
              </button>
            )}
          </div>
        )}

        {/* Action Form (Invoice Pending) */}
        {!isLoading && !error && !receipt && invoice && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8CEBC]">
              <div>
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-[#527763]">Pledged Invoice</span>
                <h2 className="text-lg font-bold font-mono text-[#173D32]">{invoice.invoice_number}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50">
                PENDING SIGNOFF
              </span>
            </div>

            {/* Details Table */}
            <div className="space-y-2 text-xs bg-[#FFFFFF] p-4 rounded-xl border border-[#D8CEBC]">
              <div className="flex justify-between">
                <span className="text-[#527763]">Corporate Debtor:</span>
                <span className="font-bold text-[#173D32]">{invoice.buyer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#527763]">Supplier:</span>
                <span className="text-[#25352E] font-medium">{invoice.supplier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#527763]">PO Referenced:</span>
                <span className="font-mono text-[#245747] font-semibold">{invoice.po_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#D8CEBC]">
                <span className="text-[#527763]">Commercial Total:</span>
                <span className="font-mono font-bold text-base text-[#245747]">{formatINR(invoice.amount)}</span>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-[#173D32] uppercase">Confirmation Remarks (Optional):</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Confirm delivery acknowledgment or detail any issues..."
                rows={2}
                className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded-xl p-2.5 text-xs text-[#25352E] focus:outline-none focus:border-[#245747]"
              />
            </div>

            {/* Decision Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleDecision('DISPUTED')}
                disabled={isSubmitting}
                className="py-2.5 px-3 rounded-xl bg-[#813E43]/15 hover:bg-[#813E43]/25 border border-[#813E43]/40 text-[#813E43] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                <span>Dispute Receipt</span>
              </button>

              <button
                onClick={() => handleDecision('ACCEPTED')}
                disabled={isSubmitting}
                className="py-2.5 px-3 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md border border-[#527763]/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Sign Off</span>
              </button>
            </div>

            <div className="text-[10px] text-center text-[#527763] font-mono">
              Signing produces an HMAC-SHA256 non-repudiation receipt anchored into the ledger.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
