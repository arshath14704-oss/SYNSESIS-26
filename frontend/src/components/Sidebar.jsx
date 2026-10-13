import React from 'react';
import { 
  LayoutDashboard, FileText, CheckCircle2, Copy, ShieldAlert, 
  DollarSign, Building2, Layers, RotateCcw, ShieldCheck, 
  Shield, ChevronRight, Lock
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onResetDemo,
  isResetting,
  fraudPreventedAmount = 4950000,
  auditValid = true
}) {
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      desc: 'Executive analytics & telemetry'
    },
    {
      id: 'workspace',
      label: 'Invoice Workspace',
      icon: FileText,
      desc: '3-slot ingestion & OCR intake',
      badge: '3-SLOT'
    },
    {
      id: 'reconciliation',
      label: 'Verification & Reconcile',
      icon: CheckCircle2,
      desc: '3-way match & itemized deltas'
    },
    {
      id: 'duplicates',
      label: 'Duplicate Investigation',
      icon: Copy,
      desc: 'Fingerprints & Fraud Lab',
      badge: 'LAB'
    },
    {
      id: 'workflow',
      label: 'Financing Workflow',
      icon: DollarSign,
      desc: 'Human approvals & buyer portal'
    },
    {
      id: 'registry',
      label: 'Cross-Lender Registry',
      icon: Building2,
      desc: 'Consortium double-draw defense'
    },
    {
      id: 'audit',
      label: 'Audit & Trust Centre',
      icon: Lock,
      desc: 'SHA-256 chain & hybrid anchor'
    }
  ];

  return (
    <aside className="w-68 bg-[#173D32] border-r border-[#1F493C] flex flex-col shrink-0 min-h-screen text-[#E6DDC9] select-none shadow-xl">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1F493C] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#245747] border border-[#C5A66B]/50 flex items-center justify-center text-[#C5A66B] shadow-md">
          <Shield className="w-5 h-5 fill-[#C5A66B]/20 text-[#C5A66B]" />
        </div>
        <div>
          <div className="font-bold text-[#F0EBDD] tracking-tight text-base flex items-center gap-1.5">
            <span>InvoiceTrust AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#133027] text-[#C5A66B] border border-[#C5A66B]/40 font-bold">v2.0</span>
          </div>
          <div className="text-xs text-[#91A891]">Verify • Trace • Accelerate</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="text-xs uppercase font-bold tracking-wider text-[#91A891]/80 px-2 py-1.5">
          NAVIGATION
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full px-3.5 py-3 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-[#245747] text-[#F0EBDD] font-bold border-l-4 border-l-[#C5A66B] border-[#527763]/40 shadow-sm'
                  : 'text-[#E6DDC9]/80 hover:text-[#F0EBDD] hover:bg-[#1E4A3D] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-[#C5A66B]' : 'text-[#91A891] group-hover:text-[#E6DDC9]'
                }`} />
                <div className="truncate">
                  <div className="text-[15px] font-semibold truncate leading-tight">{item.label}</div>
                  <div className={`text-xs truncate font-normal mt-0.5 ${
                    isActive ? 'text-[#E6DDC9]/90' : 'text-[#91A891]'
                  }`}>{item.desc}</div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                  isActive 
                    ? 'bg-[#C5A66B] text-[#173D32]' 
                    : 'bg-[#1E4A3D] text-[#E6DDC9] border border-[#527763]/40'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Fraud Prevented Mini Widget */}
      <div className="p-4 border-t border-[#1F493C] space-y-2.5">
        <div className="p-3.5 rounded-xl bg-[#133027] border border-[#527763]/40">
          <div className="flex items-center justify-between text-xs text-[#91A891] font-semibold">
            <span>FRAUD PREVENTED</span>
            <span className="w-2 h-2 rounded-full bg-[#C5A66B]"></span>
          </div>
          <div className="text-xl font-bold font-mono text-[#C5A66B] mt-1">
            {formatINR(fraudPreventedAmount)}
          </div>
          <div className="text-xs text-[#91A891] mt-0.5">Cumulative exposure saved</div>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={onResetDemo}
          disabled={isResetting}
          className="w-full py-2.5 px-3 rounded-xl bg-[#1E4A3D] hover:bg-[#245747] border border-[#527763]/40 text-sm font-semibold text-[#E6DDC9] hover:text-[#F0EBDD] transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-[#C5A66B]' : ''}`} />
          <span>{isResetting ? 'Resetting DB...' : 'Reset Demo State (R)'}</span>
        </button>
      </div>

    </aside>
  );
}
