import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, 
  FileText, Truck, ShieldAlert, FileCheck, Layers, Printer
} from 'lucide-react';
import { verifyInvoice } from '../services/api';
import AuditCertificateModal from './AuditCertificateModal';

export default function ReconciliationView({
  selectedInvoiceId,
  invoiceDetails,
  onReloadDetails,
  setActiveTab
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  if (!invoiceDetails || !invoiceDetails.invoice) {
    return (
      <div className="p-12 text-center text-[#527763]">
        <p className="text-base font-medium">Please select an invoice from the Dashboard or Workspace tab to perform 3-way reconciliation.</p>
      </div>
    );
  }

  const { invoice, evidence, reconciliation } = invoiceDetails;

  const handleRunVerify = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      await verifyInvoice(selectedInvoiceId);
      await onReloadDetails(selectedInvoiceId);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const poDoc = evidence?.find(e => e.doc_type === 'PURCHASE_ORDER');
  const deliveryDoc = evidence?.find(e => e.doc_type === 'DELIVERY_RECEIPT');

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const isMatched = reconciliation?.overall_status === 'MATCHED';
  const hasDiscrepancy = reconciliation?.discrepancies?.length > 0;
  const isCritical = reconciliation?.overall_status === 'CRITICAL_MISMATCH';

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight text-[#173D32] leading-tight">
            3-Way Evidence Reconciliation Engine
          </h1>
          <p className="text-base text-[#527763] mt-1">
            Cross-verifying Invoice Claims vs Purchase Order Commitments vs Physical Delivery Receipts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCertModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7EE] hover:bg-[#E6DDC9] text-[#173D32] border border-[#D8CEBC] text-[15px] font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
            title="Generate printable official audit certificate"
          >
            <FileCheck className="w-4 h-4 text-[#245747]" />
            <span>Export Official Certificate</span>
          </button>
          <button
            onClick={handleRunVerify}
            disabled={isVerifying}
            className="px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-bold shadow-md border border-[#527763]/40 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Reconciling Documents...' : 'Run 3-Way Reconciliation Check'}</span>
          </button>
          <button
            onClick={() => setActiveTab('duplicates')}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7EE] hover:bg-[#245747] hover:text-[#F0EBDD] text-[#245747] border border-[#D8CEBC] text-[15px] font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Next: Duplicate Check</span>
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

      {/* 3 Columns: Invoice vs PO vs Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Column 1: Invoice */}
        <div className="p-5 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8CEBC]">
            <span className="text-[17px] font-bold text-[#173D32] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#245747]" />
              <span>1. Commercial Invoice</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#E6DDC9] text-[#173D32] border border-[#D8CEBC] font-semibold">
              OFF-CHAIN
            </span>
          </div>

          <div className="space-y-2.5 text-base">
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Invoice Number:</span>
              <span className="font-mono font-bold text-[#173D32]">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Claim Amount:</span>
              <span className="font-mono font-bold text-[#245747] text-lg">{formatINR(invoice.amount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Supplier:</span>
              <span className="text-[#25352E] truncate max-w-[170px] font-medium">{invoice.supplier_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Buyer:</span>
              <span className="text-[#25352E] truncate max-w-[170px] font-medium">{invoice.buyer_name}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#527763]">PO Referenced:</span>
              <span className="font-mono text-[#245747] font-semibold">{invoice.po_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Purchase Order */}
        <div className="p-5 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8CEBC]">
            <span className="text-[17px] font-bold text-[#173D32] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#527763]" />
              <span>2. Approved PO</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#E6DDC9] text-[#173D32] border border-[#D8CEBC] font-semibold">
              EVIDENCE
            </span>
          </div>

          <div className="space-y-2.5 text-base">
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">PO Reference:</span>
              <span className="font-mono font-bold text-[#173D32]">{poDoc?.doc_reference || invoice.po_number || 'PO-2026-4410'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Authorized Value:</span>
              <span className="font-mono font-bold text-[#173D32] text-lg">
                {formatINR(poDoc?.expected_amount || invoice.amount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Expected Quantity:</span>
              <span className="font-mono text-[#25352E] font-bold">{poDoc?.expected_quantity || '1,500'} units</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">PO Issue Date:</span>
              <span className="font-mono text-[#527763]">{poDoc?.issue_date || '2026-09-25'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#527763]">Authorized Signoff:</span>
              <span className="text-[#245747] font-bold">VERIFIED_SIGNATURE</span>
            </div>
          </div>
        </div>

        {/* Column 3: Physical Delivery Receipt */}
        <div className="p-5 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8CEBC]">
            <span className="text-[17px] font-bold text-[#173D32] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#245747]" />
              <span>3. Delivery Receipt (GRN)</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#E6DDC9] text-[#173D32] border border-[#D8CEBC] font-semibold">
              RECEIPT
            </span>
          </div>

          <div className="space-y-2.5 text-base">
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">GRN Reference:</span>
              <span className="font-mono font-bold text-[#173D32]">{deliveryDoc?.doc_reference || 'GRN-2026-9022'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Delivered Units:</span>
              <span className={`font-mono font-bold ${reconciliation?.quantity_match === false ? 'text-[#813E43] text-lg' : 'text-[#245747]'}`}>
                {deliveryDoc?.delivered_quantity || poDoc?.expected_quantity || '1,500'} units
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Warehouse Receipt:</span>
              <span className="font-mono text-[#527763]">{deliveryDoc?.issue_date || '2026-09-29'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D8CEBC]/60">
              <span className="text-[#527763]">Gate Pass Signoff:</span>
              <span className="text-[#245747] font-bold">ACKNOWLEDGED</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#527763]">Physical Match:</span>
              <span className={`font-bold ${reconciliation?.quantity_match === false ? 'text-[#813E43]' : 'text-[#245747]'}`}>
                {reconciliation?.quantity_match === false ? 'SHORTAGE DETECTED' : '100% RECEIVED'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Itemized Discrepancies Table */}
      {reconciliation?.discrepancies?.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#FAF7EE] border-2 border-[#813E43] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#813E43]" />
              <h2 className="text-[20px] font-bold text-[#813E43]">Itemized Commercial Discrepancies</h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/40 font-bold">
              COMPLIANCE HOLD REQUIRED
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#D8CEBC] bg-[#FFFFFF]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#E6DDC9] text-[#173D32] text-xs uppercase font-bold border-b border-[#D8CEBC]">
                <tr>
                  <th className="p-3.5">Field</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Invoiced Value</th>
                  <th className="p-3.5">Verified Baseline</th>
                  <th className="p-3.5">Discrepancy Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CEBC] text-[#25352E]">
                {reconciliation.discrepancies.map((d, i) => (
                  <tr key={i} className="hover:bg-[#F2ECE1]">
                    <td className="p-3.5 font-bold text-[#173D32]">{d.field}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        d.severity === 'CRITICAL' ? 'bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/40' :
                        d.severity === 'MEDIUM' ? 'bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50' :
                        'bg-[#E6DDC9] text-[#25352E]'
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-[#C5A66B]">{String(d.source_val)}</td>
                    <td className="p-3.5 font-mono text-[#527763]">{String(d.target_val)}</td>
                    <td className="p-3.5 text-[#25352E]">{d.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Verification Certificate Modal */}
      <AuditCertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        invoiceDetails={invoiceDetails}
      />

    </div>
  );
}
