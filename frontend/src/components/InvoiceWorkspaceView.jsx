import React, { useState } from 'react';
import { Layers, FileText } from 'lucide-react';
import SMEDashboardView from './SMEDashboardView';
import UploadView from './UploadView';

export default function InvoiceWorkspaceView({ 
  onInvoiceCreated, 
  onConfirmVerification, 
  setActiveTab 
}) {
  const [activeMode, setActiveMode] = useState('sme_package'); // 'sme_package' | 'single_invoice'

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Top Workspace Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8CEBC] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[30px] font-bold tracking-tight text-[#173D32] leading-tight">
              Invoice Ingestion & Document Workspace
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#245747]/15 text-[#245747] border border-[#527763]/40 font-bold">
              OFF-CHAIN PRIVACY
            </span>
          </div>
          <p className="text-base text-[#527763] mt-1">
            Ingest trade documents with off-chain SHA-256 hashing, native OCR extraction, and multi-document package bundling.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1.5 rounded-xl bg-[#E6DDC9] border border-[#D8CEBC]">
          <button
            onClick={() => setActiveMode('sme_package')}
            className={`px-4 py-2 rounded-lg text-[15px] font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeMode === 'sme_package'
                ? 'bg-[#245747] text-[#F0EBDD] shadow-md font-bold'
                : 'text-[#173D32] hover:text-[#000000]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3-Slot Trade Package (Invoice + PO + GRN)</span>
          </button>

          <button
            onClick={() => setActiveMode('single_invoice')}
            className={`px-4 py-2 rounded-lg text-[15px] font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeMode === 'single_invoice'
                ? 'bg-[#245747] text-[#F0EBDD] shadow-md font-bold'
                : 'text-[#173D32] hover:text-[#000000]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Single Invoice Intake</span>
          </button>
        </div>
      </div>

      {/* Sub-view Content */}
      {activeMode === 'sme_package' ? (
        <SMEDashboardView
          onConfirmVerification={onConfirmVerification}
          setActiveTab={setActiveTab}
        />
      ) : (
        <UploadView
          onInvoiceCreated={onInvoiceCreated}
          setActiveTab={setActiveTab}
        />
      )}

    </div>
  );
}
