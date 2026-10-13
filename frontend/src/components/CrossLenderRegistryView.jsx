import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, ShieldAlert, Lock, RefreshCw 
} from 'lucide-react';
import { fetchFinancingClaims, submitFinancingClaim } from '../services/api';

const LENDERS = [
  { id: 'LENDER_APEX', name: 'Apex Capital Factoring' },
  { id: 'LENDER_HORIZON', name: 'Horizon Trade Credit' },
  { id: 'LENDER_QUANTUM', name: 'Quantum Trade Finance' },
];

export default function CrossLenderRegistryView() {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Simulator Form State
  const [selectedLender, setSelectedLender] = useState('LENDER_HORIZON');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-7731');
  const [claimAmount, setClaimAmount] = useState(3500000);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFinancingClaims();
      setClaims(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleTestClaim = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    try {
      const lenderObj = LENDERS.find(l => l.id === selectedLender);
      const res = await submitFinancingClaim({
        invoice_number: invoiceNumber,
        invoice_fingerprint: `FINGERPRINT_${invoiceNumber}`,
        lender_id: selectedLender,
        lender_name: lenderObj?.name || 'Competing Lender',
        amount: parseFloat(claimAmount) || 1000000,
      });
      setResult(res);
      await loadClaims();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Title */}
      <div>
        <h1 className="text-[30px] font-bold tracking-tight text-[#173D32] leading-tight">
          Cross-Lender Duplicate Financing Protection Registry
        </h1>
        <p className="text-base text-[#527763] mt-1">
          Shared inter-lender consortium registry preventing suppliers from pledging the same invoice to multiple institutions.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#527763]/40 text-[#173D32] text-sm flex items-center gap-2.5 shadow-sm">
        <Building2 className="w-5 h-5 text-[#245747] shrink-0" />
        <span>
          <strong>Consortium Clearinghouse Simulation:</strong> Inter-lender verification clearinghouse across Apex Capital, Horizon Credit, and Quantum Finance.
        </span>
      </div>

      {/* Interactive Simulator Card: Test Double-Draw Collision */}
      <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#D8CEBC] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#245747]" />
            <h2 className="text-[20px] font-bold text-[#173D32]">
              Live Double-Financing Attack Simulator
            </h2>
          </div>
          <span className="text-sm text-[#527763]">Try financing an already claimed invoice</span>
        </div>

        <form onSubmit={handleTestClaim} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Choose Attempting Lender */}
            <div>
              <label className="block text-sm text-[#173D32] font-bold uppercase mb-1.5">Attempting Lender</label>
              <select
                value={selectedLender}
                onChange={(e) => setSelectedLender(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded-xl p-3 text-base text-[#25352E] focus:outline-none focus:border-[#245747]"
              >
                {LENDERS.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-sm text-[#173D32] font-bold uppercase mb-1.5">Invoice Number to Pledge</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded-xl p-3 text-base text-[#25352E] focus:outline-none focus:border-[#245747] font-mono"
                placeholder="INV-2026-7731"
              />
            </div>

            {/* Claim Amount */}
            <div>
              <label className="block text-sm text-[#173D32] font-bold uppercase mb-1.5">Financing Request Amount (INR)</label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#D8CEBC] rounded-xl p-3 text-base text-[#25352E] focus:outline-none focus:border-[#245747] font-mono"
              />
            </div>

          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-[#527763]">
              Tip: Invoice <code className="font-mono font-bold text-[#173D32]">INV-2026-7731</code> is pre-registered by Apex Capital.
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-bold transition flex items-center gap-2 cursor-pointer shadow-md border border-[#527763]/40"
            >
              <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Evaluating Registry...' : 'Simulate Consortium Claim'}</span>
            </button>
          </div>
        </form>

        {/* Result Callout */}
        {result && (
          <div className={`p-4 rounded-xl border-2 mt-3 transition-all ${
            result.collision_detected
              ? 'bg-[#813E43]/15 border-[#813E43] text-[#813E43]'
              : 'bg-[#245747]/15 border-[#245747] text-[#245747]'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {result.collision_detected ? <ShieldAlert className="w-5 h-5 text-[#813E43]" /> : <ShieldCheck className="w-5 h-5 text-[#245747]" />}
              <span className="text-sm font-bold uppercase tracking-wider">
                {result.collision_detected ? 'DOUBLE-FINANCING COLLISION PREVENTED' : 'CLAIM REGISTERED SUCCESSFULLY'}
              </span>
            </div>
            <p className="text-sm mt-1 leading-relaxed">{result.collision_message}</p>
          </div>
        )}

      </div>

      {/* Claims Table */}
      <div className="rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#D8CEBC] flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-[#173D32]">Consortium Registered Claims Ledger</h2>
            <p className="text-sm text-[#527763]">Live active liens across all participating factoring institutions</p>
          </div>
          <button
            onClick={loadClaims}
            className="p-2 rounded-lg bg-[#FAF7EE] hover:bg-[#E6DDC9] text-[#173D32] border border-[#D8CEBC] transition cursor-pointer"
            title="Refresh Claims"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#E6DDC9] text-[#173D32] uppercase text-xs font-bold border-b border-[#D8CEBC]">
              <tr>
                <th className="p-3.5">Claim ID</th>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Pledged Lender</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Lien Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CEBC] text-[#25352E]">
              {claims.map((c) => (
                <tr key={c.claim_id} className="hover:bg-[#F2ECE1]">
                  <td className="p-3.5 text-[#527763] font-mono font-bold">{c.claim_id}</td>
                  <td className="p-3.5 text-[#173D32] font-mono font-bold">{c.invoice_number}</td>
                  <td className="p-3.5 text-[#245747] font-medium">{c.lender_name}</td>
                  <td className="p-3.5 font-bold text-[#173D32] font-mono">₹{c.amount?.toLocaleString()}</td>
                  <td className="p-3.5 text-[#527763] text-xs font-mono">{c.claim_timestamp}</td>
                  <td className="p-3.5 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
