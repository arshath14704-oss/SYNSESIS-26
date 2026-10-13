import React, { useState } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, 
  Shield, RefreshCw
} from 'lucide-react';
import { uploadInvoiceFile, createInvoice } from '../services/api';

export default function UploadView({ onInvoiceCreated, setActiveTab }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  // Form editable state
  const [formData, setFormData] = useState({
    invoice_number: '',
    supplier_name: '',
    buyer_name: '',
    supplier_gstin: '',
    buyer_gstin: '',
    po_number: '',
    invoice_date: '2026-10-01',
    due_date: '2026-11-15',
    amount: 1000000,
    tax_amount: 180000,
    currency: 'INR',
    line_items: []
  });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadInvoiceFile(file);
      setExtractedData(res);
      setFormData({
        invoice_number: res.invoice_number,
        supplier_name: res.supplier_name,
        buyer_name: res.buyer_name,
        supplier_gstin: res.supplier_gstin || '',
        buyer_gstin: res.buyer_gstin || '',
        po_number: res.po_number || '',
        invoice_date: res.invoice_date,
        due_date: res.due_date || '',
        amount: res.amount,
        tax_amount: res.tax_amount || 0,
        currency: res.currency || 'INR',
        line_items: res.line_items || []
      });
    } catch (err) {
      setError(err.message || 'Extraction failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFieldChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'amount' || field === 'tax_amount' ? parseFloat(val) || 0 : val
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createInvoice({
        ...formData,
        file_name: file ? file.name : `${formData.invoice_number}.pdf`,
      });
      onInvoiceCreated(created.id);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#25352E]">
      
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold text-[#173D32]">
          Single Commercial Invoice Intake
        </h2>
        <p className="text-base text-[#527763] mt-1">
          Upload PDF/JPG invoice instruments for OCR field extraction, validation, and SHA-256 off-chain hashing.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="p-8 rounded-2xl bg-[#FAF7EE] border-2 border-dashed border-[#C5BBA4] hover:border-[#245747] transition text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#E6DDC9] border border-[#D8CEBC] flex items-center justify-center">
          <Upload className="w-7 h-7 text-[#245747]" />
        </div>
        <div>
          <label className="cursor-pointer">
            <span className="text-base font-bold text-[#245747] hover:underline">Click to upload invoice file</span>
            <span className="text-base text-[#527763]"> or drag and drop</span>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.json" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </label>
          <p className="text-sm text-[#527763] mt-1">Supports PDF, PNG, JPG, or JSON (Max 10MB)</p>
        </div>

        {file && (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-sm text-[#25352E]">
            <FileText className="w-4 h-4 text-[#245747]" />
            <span className="font-mono font-medium">{file.name} ({(file.size/1024).toFixed(1)} KB)</span>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="ml-2 px-3 py-1 rounded-lg bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] font-semibold text-xs transition"
            >
              {isUploading ? 'Extracting...' : 'Extract Fields'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#813E43]/15 border border-[#813E43]/40 text-[#813E43] text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#813E43] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Fields Form */}
      {(extractedData || formData.invoice_number) && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#D8CEBC] pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#245747]" />
              <h3 className="text-[20px] font-bold text-[#173D32]">Extracted Commercial Parameters</h3>
            </div>
            <div className="text-sm text-[#527763] flex items-center gap-1.5">
              <span>Source Engine:</span>
              <span className="font-mono text-[#245747] font-bold px-2 py-0.5 rounded bg-[#E6DDC9] border border-[#D8CEBC] text-xs">
                {extractedData?.extraction_source || 'AI_OCR'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Invoice Number</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#25352E] text-base font-mono focus:border-[#245747] focus:outline-none"
              />
            </div>

            {/* PO Number */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Purchase Order (PO #)</label>
              <input
                type="text"
                value={formData.po_number}
                onChange={(e) => handleFieldChange('po_number', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#25352E] text-base font-mono focus:border-[#245747] focus:outline-none"
              />
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Supplier Entity</label>
              <input
                type="text"
                value={formData.supplier_name}
                onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#25352E] text-base focus:border-[#245747] focus:outline-none"
              />
            </div>

            {/* Buyer Name */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Buyer (Corporate Debtor)</label>
              <input
                type="text"
                value={formData.buyer_name}
                onChange={(e) => handleFieldChange('buyer_name', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#25352E] text-base focus:border-[#245747] focus:outline-none"
              />
            </div>

            {/* Supplier GSTIN */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Supplier GSTIN</label>
              <input
                type="text"
                value={formData.supplier_gstin}
                onChange={(e) => handleFieldChange('supplier_gstin', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#25352E] text-base font-mono focus:border-[#245747] focus:outline-none"
              />
            </div>

            {/* Buyer GSTIN */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Buyer GSTIN</label>
              <input
                type="text"
                value={formData.buyer_gstin}
                onChange={(e) => handleFieldChange('buyer_gstin', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#25352E] text-base font-mono focus:border-[#245747] focus:outline-none"
              />
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Invoice Date</label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#25352E] text-base font-mono focus:border-[#245747] focus:outline-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-[#173D32] mb-1">Total Amount (₹ INR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] text-[#173D32] font-bold text-base font-mono focus:border-[#245747] focus:outline-none"
              />
            </div>

          </div>

          {/* Submit Action Button */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] font-bold text-[15px] shadow-md border border-[#527763]/40 transition flex items-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Ingesting into Database...' : 'Submit to Security Pipeline & Verify'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
