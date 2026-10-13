import React from 'react';
import { 
  ShieldCheck, ShieldAlert, RotateCcw, 
  Lock, ChevronDown, CheckCircle2 
} from 'lucide-react';

export default function Header({
  activeTab,
  selectedInvoiceId,
  invoiceStatus,
  auditStatus,
  onResetDemo,
  onLaunchScenario,
  isResetting
}) {
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Executive Fraud & Financing Dashboard';
      case 'workspace': return 'Invoice Workspace & Multi-Doc Ingestion';
      case 'reconciliation': return '3-Way Evidence Reconciliation Engine';
      case 'duplicates': return 'Duplicate Investigation & Fraud Lab';
      case 'workflow': return 'Financing Approvals & Buyer Acceptance Portal';
      case 'registry': return 'Cross-Lender Duplicate Financing Registry';
      case 'audit': return 'Tamper-Evident Cryptographic Audit Centre';
      default: return 'InvoiceTrust AI Platform';
    }
  };

  const isChainValid = auditStatus?.is_valid !== false;

  return (
    <header className="h-16 border-b border-[#1F493C] bg-[#173D32] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-md">
      
      {/* Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-[#C5A66B] uppercase tracking-wider">
          {activeTab}
        </span>
        <span className="text-[#527763]">/</span>
        <h2 className="text-base font-bold text-[#F0EBDD] truncate max-w-md">
          {getTabTitle(activeTab)}
        </h2>

        {/* Selected Target Invoice Indicator */}
        {selectedInvoiceId && (
          <div className="hidden xl:flex items-center gap-2 ml-3 px-3 py-1 rounded-lg bg-[#133027] border border-[#245747] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#C5A66B]"></span>
            <span className="text-[#91A891]">Active Invoice:</span>
            <strong className="text-[#F0EBDD] font-mono">{selectedInvoiceId}</strong>
            <span className="text-[#527763]">|</span>
            <span className="text-[#C5A66B] font-semibold">{invoiceStatus}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Preset Selector Dropdown */}
        <div className="relative group">
          <button className="px-3.5 py-2 rounded-lg bg-[#245747] border border-[#527763]/50 hover:bg-[#2A6553] text-[15px] font-semibold text-[#F0EBDD] flex items-center gap-2 transition cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-[#C5A66B]"></span>
            <span>Demo Scenarios</span>
            <ChevronDown className="w-4 h-4 text-[#E6DDC9]" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-72 rounded-xl bg-[#173D32] border border-[#527763] shadow-2xl p-2 hidden group-hover:block z-50">
            <div className="text-xs uppercase font-bold text-[#91A891] px-2.5 py-1">
              Select Demo Scenario:
            </div>
            <button
              onClick={() => onLaunchScenario('scenario_1')}
              className="w-full p-2.5 rounded-lg text-left text-sm hover:bg-[#245747] text-[#F0EBDD] transition flex items-center justify-between cursor-pointer"
            >
              <span>1. Clean Trade (INV-8801)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#245747] text-[#91A891] border border-[#527763] font-mono font-bold">LOW</span>
            </button>
            <button
              onClick={() => onLaunchScenario('scenario_2')}
              className="w-full p-2.5 rounded-lg text-left text-sm hover:bg-[#245747] text-[#F0EBDD] transition flex items-center justify-between cursor-pointer"
            >
              <span>2. Duplicate Claim (INV-8801-DUP)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#813E43]/40 text-[#F0EBDD] border border-[#813E43] font-mono font-bold">DUP</span>
            </button>
            <button
              onClick={() => onLaunchScenario('scenario_3')}
              className="w-full p-2.5 rounded-lg text-left text-sm hover:bg-[#245747] text-[#F0EBDD] transition flex items-center justify-between cursor-pointer"
            >
              <span>3. Shortage Mismatch (INV-9104)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C5A66B]/20 text-[#C5A66B] border border-[#C5A66B]/40 font-mono font-bold">QTY</span>
            </button>
            <button
              onClick={() => onLaunchScenario('scenario_4')}
              className="w-full p-2.5 rounded-lg text-left text-sm hover:bg-[#245747] text-[#F0EBDD] transition flex items-center justify-between cursor-pointer"
            >
              <span>4. Price Inflation (INV-9502)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C5A66B]/20 text-[#C5A66B] border border-[#C5A66B]/40 font-mono font-bold">RATE</span>
            </button>
            <button
              onClick={() => onLaunchScenario('scenario_5')}
              className="w-full p-2.5 rounded-lg text-left text-sm hover:bg-[#245747] text-[#F0EBDD] transition flex items-center justify-between cursor-pointer"
            >
              <span>5. Database Tamper Attack</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#813E43]/40 text-[#F0EBDD] border border-[#813E43] font-mono font-bold">TAMPER</span>
            </button>
            <button
              onClick={() => onLaunchScenario('scenario_6')}
              className="w-full p-2.5 rounded-lg text-left text-sm hover:bg-[#245747] text-[#F0EBDD] transition flex items-center justify-between cursor-pointer"
            >
              <span>6. Cross-Lender Double Dip</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#527763]/30 text-[#E6DDC9] border border-[#527763] font-mono font-bold">COLLISION</span>
            </button>
          </div>
        </div>

        {/* Ledger Integrity Indicator Badge */}
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
          isChainValid
            ? 'bg-[#245747]/70 border-[#527763] text-[#91A891]'
            : 'bg-[#813E43] border-[#813E43] text-[#F0EBDD] animate-pulse'
        }`}>
          {isChainValid ? <ShieldCheck className="w-4 h-4 text-[#91A891]" /> : <ShieldAlert className="w-4 h-4 text-[#F0EBDD]" />}
          <span>{isChainValid ? 'LEDGER INTACT' : 'TAMPER DETECTED'}</span>
        </div>

        {/* Reset Demo Quick Button */}
        <button
          onClick={onResetDemo}
          disabled={isResetting}
          className="p-2 rounded-lg bg-[#1E4A3D] hover:bg-[#245747] border border-[#527763]/50 text-[#E6DDC9] hover:text-[#F0EBDD] transition cursor-pointer"
          title="Reset database to pristine seed state (Shortcut: R)"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-[#C5A66B]' : ''}`} />
        </button>

      </div>

    </header>
  );
}
