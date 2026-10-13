import React, { useState } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck, 
  ArrowRight, RefreshCw, Copy, Check, Lock, FileCheck2, 
  Sparkles, ExternalLink, Layers
} from 'lucide-react';
import { createSubmission, loadSampleSubmission, getSubmissionFileUrl } from '../services/api';

export default function SMEDashboardView({ onConfirmVerification, setActiveTab }) {
  // 3-slot upload states
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [poFile, setPoFile] = useState(null);
  const [deliveryFile, setDeliveryFile] = useState(null);

  // Submission state
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // SSE Stream states
  const [streaming, setStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamMessage, setStreamMessage] = useState('');
  const [highlightedField, setHighlightedField] = useState(null);

  // Active document preview tab
  const [activeDocTab, setActiveDocTab] = useState('invoice'); // 'invoice' | 'po' | 'delivery'
  const [copiedHash, setCopiedHash] = useState(null);

  // Drag and drop states
  const [dragActive, setDragActive] = useState({ invoice: false, po: false, delivery: false });

  // Extracted metadata editable form
  const [metadata, setMetadata] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const getConfidenceBadge = (score) => {
    const val = typeof score === 'number' ? score : 0.85;
    const pct = Math.round(val * 100);
    if (pct >= 90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-bold bg-[#245747]/15 text-[#245747] border border-[#245747]/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> {pct}%
        </span>
      );
    }
    if (pct >= 70) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-bold bg-[#C5A66B]/20 text-[#8B6E32] border border-[#C5A66B]/40">
          <AlertTriangle className="w-3.5 h-3.5" /> {pct}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-bold bg-[#813E43]/15 text-[#813E43] border border-[#813E43]/30">
        <AlertTriangle className="w-3.5 h-3.5" /> {pct}%
      </span>
    );
  };

  const handleStartSSEStream = (subId) => {
    setStreaming(true);
    setStreamProgress(5);
    setStreamMessage('Connecting to real-time extraction pipeline...');

    const eventSource = new EventSource(`/api/submissions/${subId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress) setStreamProgress(data.progress);
        if (data.message) setStreamMessage(data.message);
        if (data.field) {
          setHighlightedField(data.field);
          setTimeout(() => setHighlightedField(null), 1200);
        }
        if (data.stage === 'complete') {
          eventSource.close();
          setStreaming(false);
          setStreamProgress(100);
          setStreamMessage('Multi-document extraction verified successfully');
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('SSE connection closed or completed');
      eventSource.close();
      setStreaming(false);
    };
  };

  const handleLoadSampleSet = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadSampleSubmission();
      setSubmission(result);
      setMetadata(result.extracted_data);
      // Sample File Chips
      setInvoiceFile({ name: 'sample_invoice.pdf', size: 184320 });
      setPoFile({ name: 'sample_signed_po.pdf', size: 165888 });
      setDeliveryFile({ name: 'sample_delivery_receipt.pdf', size: 172032 });
      
      handleStartSSEStream(result.id);
    } catch (err) {
      setError('Failed to load sample set: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (e) => {
    if (e) e.preventDefault();
    if (!invoiceFile || !poFile || !deliveryFile) {
      setError('Please provide all three documents: Commercial Invoice, Signed Purchase Order, and Delivery Receipt.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('invoice', invoiceFile);
      formData.append('signed_po', poFile);
      formData.append('delivery_receipt', deliveryFile);

      const result = await createSubmission(formData);
      setSubmission(result);
      setMetadata(result.extracted_data);

      handleStartSSEStream(result.id);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e, slot, status) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [slot]: status }));
  };

  const handleDrop = (e, slot) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [slot]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (slot === 'invoice') setInvoiceFile(file);
      if (slot === 'po') setPoFile(file);
      if (slot === 'delivery') setDeliveryFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FBF9F4] p-5 rounded-xl border border-[#D8CEBC] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#245747]/15 text-[#245747] border border-[#245747]/30 uppercase tracking-wide">
              Document Intake
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[#173D32]">
              3-Way Trade Document Package Upload
            </h2>
          </div>
          <p className="text-sm text-[#527763] mt-1">
            Submit invoice, signed purchase order, and delivery receipt for OCR parsing and cryptographic off-chain hashing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoadSampleSet}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#245747] hover:bg-[#173D32] text-[#F0EBDD] text-sm font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#C5A66B]" />
            <span>Load Sample 3-Way Set</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-[#813E43]/10 border border-[#813E43]/40 text-[#813E43] text-sm flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-[#813E43] shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* 3-Slot Drag & Drop Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Slot 1: Invoice */}
        <div
          onDragOver={(e) => handleDrag(e, 'invoice', true)}
          onDragLeave={(e) => handleDrag(e, 'invoice', false)}
          onDrop={(e) => handleDrop(e, 'invoice')}
          className={`p-5 rounded-xl border transition-all ${
            dragActive.invoice
              ? 'border-[#245747] bg-[#E6DDC9]'
              : invoiceFile
              ? 'border-[#245747] bg-[#FBF9F4]'
              : 'border-[#D8CEBC] bg-[#FBF9F4] hover:border-[#527763]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#173D32] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#245747]" /> Slot 1: Commercial Invoice
            </span>
            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-[#245747]/15 text-[#245747] border border-[#245747]/30">
              Required
            </span>
          </div>
          <p className="text-sm text-[#527763] mb-4">
            Tax invoice containing line items, totals, and GSTINs.
          </p>

          {invoiceFile ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] text-sm">
              <div className="flex items-center gap-2.5 truncate">
                <FileCheck2 className="w-4 h-4 text-[#245747] shrink-0" />
                <span className="text-[#173D32] font-mono text-sm truncate font-medium">{invoiceFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceFile(null)}
                className="text-xs text-[#527763] hover:text-[#813E43] font-semibold ml-2 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-5 border border-dashed border-[#D8CEBC] rounded-lg cursor-pointer hover:border-[#245747] hover:bg-[#E6DDC9]/50 transition">
              <Upload className="w-6 h-6 text-[#527763] mb-2" />
              <span className="text-sm text-[#173D32] font-semibold">Drop invoice or browse</span>
              <span className="text-xs text-[#527763] mt-1">PDF, JPG, PNG &lt; 10MB</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setInvoiceFile(e.target.files[0])}
              />
            </label>
          )}
        </div>

        {/* Slot 2: Signed Purchase Order */}
        <div
          onDragOver={(e) => handleDrag(e, 'po', true)}
          onDragLeave={(e) => handleDrag(e, 'po', false)}
          onDrop={(e) => handleDrop(e, 'po')}
          className={`p-5 rounded-xl border transition-all ${
            dragActive.po
              ? 'border-[#245747] bg-[#E6DDC9]'
              : poFile
              ? 'border-[#245747] bg-[#FBF9F4]'
              : 'border-[#D8CEBC] bg-[#FBF9F4] hover:border-[#527763]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#173D32] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#245747]" /> Slot 2: Signed Purchase Order
            </span>
            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-[#245747]/15 text-[#245747] border border-[#245747]/30">
              Required
            </span>
          </div>
          <p className="text-sm text-[#527763] mb-4">
            PO with procurement head signature or digital sign-off.
          </p>

          {poFile ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] text-sm">
              <div className="flex items-center gap-2.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-[#245747] shrink-0" />
                <span className="text-[#173D32] font-mono text-sm truncate font-medium">{poFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPoFile(null)}
                className="text-xs text-[#527763] hover:text-[#813E43] font-semibold ml-2 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-5 border border-dashed border-[#D8CEBC] rounded-lg cursor-pointer hover:border-[#245747] hover:bg-[#E6DDC9]/50 transition">
              <Upload className="w-6 h-6 text-[#527763] mb-2" />
              <span className="text-sm text-[#173D32] font-semibold">Drop signed PO or browse</span>
              <span className="text-xs text-[#527763] mt-1">PDF, JPG, PNG &lt; 10MB</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setPoFile(e.target.files[0])}
              />
            </label>
          )}
        </div>

        {/* Slot 3: Delivery Receipt */}
        <div
          onDragOver={(e) => handleDrag(e, 'delivery', true)}
          onDragLeave={(e) => handleDrag(e, 'delivery', false)}
          onDrop={(e) => handleDrop(e, 'delivery')}
          className={`p-5 rounded-xl border transition-all ${
            dragActive.delivery
              ? 'border-[#245747] bg-[#E6DDC9]'
              : deliveryFile
              ? 'border-[#245747] bg-[#FBF9F4]'
              : 'border-[#D8CEBC] bg-[#FBF9F4] hover:border-[#527763]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#173D32] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#245747]" /> Slot 3: Delivery Receipt (GRN)
            </span>
            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-[#245747]/15 text-[#245747] border border-[#245747]/30">
              Required
            </span>
          </div>
          <p className="text-sm text-[#527763] mb-4">
            Proof of delivery, received quantity, and warehouse sign-off.
          </p>

          {deliveryFile ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] text-sm">
              <div className="flex items-center gap-2.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-[#245747] shrink-0" />
                <span className="text-[#173D32] font-mono text-sm truncate font-medium">{deliveryFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryFile(null)}
                className="text-xs text-[#527763] hover:text-[#813E43] font-semibold ml-2 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-5 border border-dashed border-[#D8CEBC] rounded-lg cursor-pointer hover:border-[#245747] hover:bg-[#E6DDC9]/50 transition">
              <Upload className="w-6 h-6 text-[#527763] mb-2" />
              <span className="text-sm text-[#173D32] font-semibold">Drop delivery slip or browse</span>
              <span className="text-xs text-[#527763] mt-1">PDF, JPG, PNG &lt; 10MB</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setDeliveryFile(e.target.files[0])}
              />
            </label>
          )}
        </div>
      </div>

      {/* Upload Action Button */}
      {(!submission || !metadata) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmitForm}
            disabled={loading || !invoiceFile || !poFile || !deliveryFile}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#245747] hover:bg-[#173D32] text-[#F0EBDD] font-bold text-[15px] shadow-md transition disabled:opacity-40 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload & Run Multi-Doc Extraction</span>
          </button>
        </div>
      )}

      {/* Real-time SSE Extraction Progress Bar */}
      {streaming && (
        <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#245747] shadow-md space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[#173D32] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#245747]" />
              {streamMessage}
            </span>
            <span className="font-mono text-[#245747] font-bold text-sm">{streamProgress}%</span>
          </div>
          <div className="w-full bg-[#E6DDC9] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#245747] h-2 rounded-full transition-all duration-300"
              style={{ width: `${streamProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Privacy Note Banner: Hashes stay off-chain */}
      {submission && (
        <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#D8CEBC] shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#173D32]">
              <Lock className="w-4 h-4 text-[#245747]" />
              <span>Cryptographic Privacy Guarantee</span>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#245747]/15 text-[#245747] border border-[#245747]/30 font-semibold">
              Files stay off-chain, only hashes are recorded
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {/* Invoice Hash */}
            <div className="p-3 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] flex items-center justify-between gap-2">
              <div className="truncate">
                <div className="text-xs text-[#527763] uppercase font-semibold">Invoice SHA-256</div>
                <div className="text-[#173D32] truncate font-mono text-xs font-semibold">{submission.invoice_hash}</div>
              </div>
              <button
                onClick={() => copyToClipboard(submission.invoice_hash, 'inv')}
                className="text-[#527763] hover:text-[#173D32] shrink-0 p-1 cursor-pointer"
                title="Copy Hash"
              >
                {copiedHash === 'inv' ? <Check className="w-4 h-4 text-[#245747]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* PO Hash */}
            <div className="p-3 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] flex items-center justify-between gap-2">
              <div className="truncate">
                <div className="text-xs text-[#527763] uppercase font-semibold">Signed PO SHA-256</div>
                <div className="text-[#173D32] truncate font-mono text-xs font-semibold">{submission.po_hash}</div>
              </div>
              <button
                onClick={() => copyToClipboard(submission.po_hash, 'po')}
                className="text-[#527763] hover:text-[#173D32] shrink-0 p-1 cursor-pointer"
                title="Copy Hash"
              >
                {copiedHash === 'po' ? <Check className="w-4 h-4 text-[#245747]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Delivery Hash */}
            <div className="p-3 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] flex items-center justify-between gap-2">
              <div className="truncate">
                <div className="text-xs text-[#527763] uppercase font-semibold">Delivery Receipt SHA-256</div>
                <div className="text-[#173D32] truncate font-mono text-xs font-semibold">{submission.delivery_hash}</div>
              </div>
              <button
                onClick={() => copyToClipboard(submission.delivery_hash, 'deliv')}
                className="text-[#527763] hover:text-[#173D32] shrink-0 p-1 cursor-pointer"
                title="Copy Hash"
              >
                {copiedHash === 'deliv' ? <Check className="w-4 h-4 text-[#245747]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side View: Embedded Viewer (Left) vs Parsed Metadata (Right) */}
      {submission && metadata && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Embedded Document Viewer */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between bg-[#FBF9F4] p-2.5 rounded-xl border border-[#D8CEBC]">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setActiveDocTab('invoice')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    activeDocTab === 'invoice'
                      ? 'bg-[#245747] text-[#F0EBDD]'
                      : 'text-[#527763] hover:text-[#173D32]'
                  }`}
                >
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocTab('po')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    activeDocTab === 'po'
                      ? 'bg-[#245747] text-[#F0EBDD]'
                      : 'text-[#527763] hover:text-[#173D32]'
                  }`}
                >
                  Signed PO
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocTab('delivery')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    activeDocTab === 'delivery'
                      ? 'bg-[#245747] text-[#F0EBDD]'
                      : 'text-[#527763] hover:text-[#173D32]'
                  }`}
                >
                  Delivery GRN
                </button>
              </div>

              <a
                href={getSubmissionFileUrl(submission.id, activeDocTab)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#527763] hover:text-[#173D32] flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#E6DDC9] font-medium"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Expand</span>
              </a>
            </div>

            {/* Document Preview Frame */}
            <div className="h-[520px] rounded-xl border border-[#D8CEBC] bg-[#E6DDC9]/30 overflow-hidden shadow-inner flex flex-col items-center justify-center">
              <iframe
                title="Document Preview"
                src={getSubmissionFileUrl(submission.id, activeDocTab)}
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>

          {/* Right Column (7 Cols): Parsed Metadata Table with Confidence Chips */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#D8CEBC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#D8CEBC] pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#245747]" />
                  <h3 className="text-lg font-bold text-[#173D32]">
                    Extracted Metadata &amp; Field Confidence
                  </h3>
                </div>
                <span className="text-xs text-[#527763] font-mono">
                  Engine: PyMuPDF + RegEx Heuristic
                </span>
              </div>

              {/* Invoice Core Fields Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#D8CEBC] text-[#527763] font-bold uppercase tracking-wider text-xs">
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Extracted Value</th>
                      <th className="py-2.5 px-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8CEBC]">
                    {/* Invoice Number */}
                    <tr className={`transition-colors ${highlightedField === 'invoice_number' ? 'bg-[#C5A66B]/20' : ''}`}>
                      <td className="py-2.5 px-3 text-[#527763] font-semibold">Invoice #</td>
                      <td className="py-2.5 px-3 font-semibold text-[#173D32]">
                        <input
                          type="text"
                          value={metadata.invoice.invoice_number || ''}
                          onChange={(e) => setMetadata({
                            ...metadata,
                            invoice: { ...metadata.invoice, invoice_number: e.target.value }
                          })}
                          className="bg-transparent border-b border-[#D8CEBC] focus:border-[#245747] outline-none w-full text-sm font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {getConfidenceBadge(metadata.invoice.confidence_scores?.invoice_number)}
                      </td>
                    </tr>

                    {/* Invoice Date */}
                    <tr className={`transition-colors ${highlightedField === 'invoice_date' ? 'bg-[#C5A66B]/20' : ''}`}>
                      <td className="py-2.5 px-3 text-[#527763] font-semibold">Invoice Date</td>
                      <td className="py-2.5 px-3 text-[#173D32]">
                        <input
                          type="text"
                          value={metadata.invoice.invoice_date || ''}
                          onChange={(e) => setMetadata({
                            ...metadata,
                            invoice: { ...metadata.invoice, invoice_date: e.target.value }
                          })}
                          className="bg-transparent border-b border-[#D8CEBC] focus:border-[#245747] outline-none w-full text-sm font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {getConfidenceBadge(metadata.invoice.confidence_scores?.invoice_date)}
                      </td>
                    </tr>

                    {/* Supplier Name & GSTIN */}
                    <tr className={`transition-colors ${highlightedField === 'supplier_gstin' ? 'bg-[#C5A66B]/20' : ''}`}>
                      <td className="py-2.5 px-3 text-[#527763] font-semibold">Supplier &amp; GSTIN</td>
                      <td className="py-2.5 px-3 text-[#173D32]">
                        <div className="font-semibold">{metadata.invoice.supplier_name}</div>
                        <div className="text-xs text-[#245747] font-mono">{metadata.invoice.supplier_gstin || 'GSTIN missing'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {getConfidenceBadge(metadata.invoice.confidence_scores?.supplier_gstin)}
                      </td>
                    </tr>

                    {/* Buyer Name & GSTIN */}
                    <tr className={`transition-colors ${highlightedField === 'buyer_gstin' ? 'bg-[#C5A66B]/20' : ''}`}>
                      <td className="py-2.5 px-3 text-[#527763] font-semibold">Buyer &amp; GSTIN</td>
                      <td className="py-2.5 px-3 text-[#173D32]">
                        <div className="font-semibold">{metadata.invoice.buyer_name}</div>
                        <div className="text-xs text-[#245747] font-mono">{metadata.invoice.buyer_gstin || 'GSTIN missing'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {getConfidenceBadge(metadata.invoice.confidence_scores?.buyer_gstin)}
                      </td>
                    </tr>

                    {/* PO Reference */}
                    <tr className={`transition-colors ${highlightedField === 'po_number' ? 'bg-[#C5A66B]/20' : ''}`}>
                      <td className="py-2.5 px-3 text-[#527763] font-semibold">PO Number</td>
                      <td className="py-2.5 px-3 text-[#173D32] font-semibold font-mono">
                        {metadata.invoice.po_number || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {getConfidenceBadge(metadata.invoice.confidence_scores?.po_number)}
                      </td>
                    </tr>

                    {/* Invoice Gross Amount */}
                    <tr className={`transition-colors ${highlightedField === 'amount' ? 'bg-[#C5A66B]/20' : ''}`}>
                      <td className="py-2.5 px-3 text-[#527763] font-semibold">Gross Amount</td>
                      <td className="py-2.5 px-3 text-[#245747] font-bold text-base font-mono">
                        ₹{(metadata.invoice.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {getConfidenceBadge(metadata.invoice.confidence_scores?.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Supporting Document Specific Verification Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* PO Verification Badge */}
                <div className={`p-4 rounded-xl border text-sm space-y-1.5 transition-all ${
                  metadata.po.is_signed
                    ? 'bg-[#E6DDC9] border-[#245747]/40'
                    : 'bg-[#813E43]/10 border-[#813E43]/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#173D32] flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-[#245747]" /> Signed PO Status
                    </span>
                    {metadata.po.is_signed ? (
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#245747]/20 text-[#245747] border border-[#245747]/30">
                        Signed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/30">
                        Unsigned
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#527763] font-mono">
                    Ref: {metadata.po.po_number} • ₹{(metadata.po.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className={`text-xs font-semibold ${metadata.po.is_signed ? 'text-[#245747]' : 'text-[#813E43]'}`}>
                    {metadata.po.is_signed ? '✓ Authorised signatory verified' : '✕ Missing authorized signature'}
                  </div>
                </div>

                {/* Delivery Verification Badge */}
                <div className={`p-4 rounded-xl border text-sm space-y-1.5 transition-all ${
                  metadata.delivery.receiver_signoff
                    ? 'bg-[#E6DDC9] border-[#245747]/40'
                    : 'bg-[#813E43]/10 border-[#813E43]/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#173D32] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#245747]" /> Delivery GRN Status
                    </span>
                    {metadata.delivery.receiver_signoff ? (
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#245747]/20 text-[#245747] border border-[#245747]/30">
                        Accepted
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/30">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#527763] font-mono">
                    GRN: {metadata.delivery.receipt_reference} • {metadata.delivery.received_quantity} Units
                  </div>
                  <div className={`text-xs font-semibold ${metadata.delivery.receiver_signoff ? 'text-[#245747]' : 'text-[#813E43]'}`}>
                    {metadata.delivery.receiver_signoff ? '✓ Store Incharge sign-off confirmed' : '✕ Missing warehouse sign-off'}
                  </div>
                </div>
              </div>

              {/* Line Items Preview */}
              {metadata.invoice.line_items?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#D8CEBC]">
                  <div className="text-xs font-bold text-[#527763] uppercase tracking-wider">
                    Extracted Line Items ({metadata.invoice.line_items.length})
                  </div>
                  <div className="divide-y divide-[#D8CEBC] rounded-xl bg-[#E6DDC9]/50 border border-[#D8CEBC]">
                    {metadata.invoice.line_items.map((item, idx) => (
                      <div key={idx} className="p-2.5 text-xs flex items-center justify-between font-mono">
                        <span className="text-[#173D32] truncate font-medium">{item.description}</span>
                        <span className="text-[#527763] shrink-0 ml-2">
                          {item.quantity} × ₹{item.unit_price} = <strong className="text-[#173D32]">₹{item.total}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Confirm and Continue to Verification */}
              <div className="pt-4 border-t border-[#D8CEBC] flex items-center justify-between">
                <div className="text-sm text-[#527763]">
                  Ready for 3-way match, tamper checks, and duplicate detection.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirmVerification) {
                      onConfirmVerification(submission);
                    } else if (setActiveTab) {
                      setActiveTab('reconciliation');
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#173D32] text-[#F0EBDD] font-bold text-sm shadow-md transition cursor-pointer"
                >
                  <span>Confirm and Continue to Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
