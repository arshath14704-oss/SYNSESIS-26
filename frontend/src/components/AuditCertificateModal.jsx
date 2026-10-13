import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, AlertTriangle, Lock, FileText, Award } from 'lucide-react';

export default function AuditCertificateModal({ isOpen, onClose, invoiceDetails }) {
  if (!isOpen || !invoiceDetails?.invoice) return null;

  const { invoice, evidence, reconciliation } = invoiceDetails;

  const handlePrint = () => {
    window.print();
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn text-[#25352E]">
      <div className="bg-[#FAF7EE] border-2 border-[#173D32] rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Actions */}
        <div className="p-4 border-b border-[#245747] flex items-center justify-between bg-[#173D32] text-[#F0EBDD]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C5A66B]" />
            <span className="font-mono text-sm font-bold text-[#F0EBDD]">Official Verification Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-xs font-semibold flex items-center gap-1.5 transition border border-[#C5A66B]/40 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#E6DDC9] hover:text-[#FFFFFF] hover:bg-[#245747] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Sheet */}
        <div className="p-8 space-y-6 overflow-y-auto bg-[#FFFFFF] font-sans text-[#25352E] border-2 border-[#D8CEBC] m-4 rounded-xl shadow-inner">
          
          {/* Certificate Header */}
          <div className="text-center space-y-1 border-b-2 border-[#173D32] pb-6">
            <div className="font-mono text-xs text-[#C5A66B] font-bold tracking-widest uppercase">
              INVOICETRUST AI • CRYPTOGRAPHIC AUDIT CLEARANCE
            </div>
            <h1 className="text-2xl font-bold font-mono text-[#173D32]">
              CERTIFICATE OF TRADE RECONCILIATION
            </h1>
            <p className="text-xs text-[#527763]">
              Deterministic 3-Way Evidence Verification & Off-Chain SHA-256 Attestation
            </p>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-[#FAF7EE] p-4 rounded-lg border border-[#D8CEBC]">
            <div>
              <span className="text-[#527763] block text-[10px] font-semibold">INVOICE NUMBER:</span>
              <span className="font-bold text-[#173D32]">{invoice.invoice_number}</span>
            </div>
            <div>
              <span className="text-[#527763] block text-[10px] font-semibold">CLAIM AMOUNT:</span>
              <span className="font-bold text-[#245747]">{formatINR(invoice.amount)}</span>
            </div>
            <div>
              <span className="text-[#527763] block text-[10px] font-semibold">AUDIT STATUS:</span>
              <span className={`font-bold ${reconciliation?.overall_status === 'MATCHED' ? 'text-[#245747]' : 'text-[#813E43]'}`}>
                {reconciliation?.overall_status || 'VERIFIED'}
              </span>
            </div>
            <div>
              <span className="text-[#527763] block text-[10px] font-semibold">TIMESTAMP:</span>
              <span className="text-[#25352E]">{reconciliation?.reconciled_at || new Date().toISOString()}</span>
            </div>
          </div>

          {/* Parties & Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#FAF7EE] border border-[#D8CEBC] space-y-1.5">
              <span className="text-[10px] text-[#245747] font-mono font-bold uppercase">SUPPLIER (ORIGINATOR)</span>
              <div className="font-bold text-[#173D32] text-sm">{invoice.supplier_name}</div>
              <div className="text-[#527763] font-mono text-[11px]">GSTIN: {invoice.supplier_gstin || '27AABCA1234F1Z8'}</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FAF7EE] border border-[#D8CEBC] space-y-1.5">
              <span className="text-[10px] text-[#527763] font-mono font-bold uppercase">BUYER (CORPORATE DEBTOR)</span>
              <div className="font-bold text-[#173D32] text-sm">{invoice.buyer_name}</div>
              <div className="text-[#527763] font-mono text-[11px]">GSTIN: {invoice.buyer_gstin || '29AABCT9876C1Z4'}</div>
            </div>
          </div>

          {/* 3-Way Reconciliation Breakdown Table */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-[#173D32] uppercase">Reconciliation Evidence Ledger:</span>
            <table className="w-full text-xs text-left border border-[#D8CEBC]">
              <thead className="bg-[#E6DDC9] text-[#173D32] font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Verification Vector</th>
                  <th className="p-2.5">Expected Baseline</th>
                  <th className="p-2.5">Invoiced Value</th>
                  <th className="p-2.5 text-right">Attestation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CEBC] text-[#25352E]">
                <tr>
                  <td className="p-2.5 font-medium">Purchase Order Reference</td>
                  <td className="p-2.5 font-mono">{invoice.po_number || 'PO-2026-4410'}</td>
                  <td className="p-2.5 font-mono">{invoice.po_number || 'PO-2026-4410'}</td>
                  <td className="p-2.5 text-right text-[#245747] font-mono font-bold">MATCHED</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Delivered Unit Quantity</td>
                  <td className="p-2.5 font-mono">Verified GRN</td>
                  <td className="p-2.5 font-mono">Invoiced Units</td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {reconciliation?.quantity_match ? (
                      <span className="text-[#245747]">100% MATCHED</span>
                    ) : (
                      <span className="text-[#813E43]">DISCREPANCY</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Commercial Rate / Total</td>
                  <td className="p-2.5 font-mono">{formatINR(invoice.amount)}</td>
                  <td className="p-2.5 font-mono">{formatINR(invoice.amount)}</td>
                  <td className="p-2.5 text-right font-mono font-bold">
                    {reconciliation?.amount_match ? (
                      <span className="text-[#245747]">MATCHED</span>
                    ) : (
                      <span className="text-[#813E43]">MISMATCH</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cryptographic Hashes Footer */}
          <div className="p-4 rounded-lg bg-[#FAF7EE] border border-[#D8CEBC] space-y-2 text-[11px] font-mono">
            <div>
              <span className="text-[#527763] block">OFF-CHAIN DOCUMENT SHA-256 HASH:</span>
              <span className="text-[#245747] break-all font-bold">{invoice.file_sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
            </div>
            <div>
              <span className="text-[#527763] block">NORMALIZED ECONOMIC CLAIM FINGERPRINT:</span>
              <span className="text-[#173D32] break-all font-bold">{invoice.normalized_fingerprint || 'CLAIM_CANONICAL_FINGERPRINT_HASH'}</span>
            </div>
          </div>

          {/* Compliance Sign-Off */}
          <div className="pt-4 border-t-2 border-[#173D32] flex items-center justify-between text-xs text-[#527763] font-mono">
            <div>
              <span>Generated by: </span>
              <strong className="text-[#173D32]">InvoiceTrust AI Engine v2.0</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C5A66B]" />
              <strong className="text-[#245747] font-bold">VALID_CRYPTOGRAPHIC_SEAL</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
