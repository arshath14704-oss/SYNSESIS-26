import React from 'react';
import { 
  ShieldCheck, AlertTriangle, RefreshCw, Layers, CheckCircle2, 
  XCircle, Zap, ShieldAlert, Database, FileCheck, ArrowRight
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  auditStatus,
  onResetDemo,
  onLaunchScenario,
  isResetting
}) {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Banner: Branding + System Status + 1-Click Scenario Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">InvoiceTrust</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">AI 2.0</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Verify the Invoice. Trace the Fraud. Accelerate the Financing.
              </p>
            </div>
          </div>

          {/* Center Status Indicators */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Backend Health */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">FastAPI Engine:</span>
              <span className="text-emerald-400 font-mono">Active</span>
            </div>

            {/* Cryptographic Hash Chain Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs transition-all ${
              auditStatus?.is_valid === false 
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' 
                : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
            }`}>
              {auditStatus?.is_valid === false ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-semibold text-rose-400">Audit Ledger: TAMPERED</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Audit Chain: <strong className="text-emerald-400 font-mono">Intact (SHA-256)</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Right Actions: Demo Scenarios Dropdown & Reset */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>6 Demo Scenarios</span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 hidden group-hover:block transition z-50">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Select Hackathon Demo Preset
                </div>
                <button
                  onClick={() => onLaunchScenario('scenario_1')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-200 flex items-center justify-between group/item"
                >
                  <div>
                    <div className="font-semibold text-emerald-400">1. Genuine Invoice</div>
                    <div className="text-[11px] text-slate-400">Clean 3-way match, low risk (12/100)</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-60 group-hover/item:opacity-100" />
                </button>
                <button
                  onClick={() => onLaunchScenario('scenario_2')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-200 flex items-center justify-between group/item"
                >
                  <div>
                    <div className="font-semibold text-rose-400">2. Duplicate Financing</div>
                    <div className="text-[11px] text-slate-400">Same claim with altered invoice #</div>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-rose-400 opacity-60 group-hover/item:opacity-100" />
                </button>
                <button
                  onClick={() => onLaunchScenario('scenario_3')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-200 flex items-center justify-between group/item"
                >
                  <div>
                    <div className="font-semibold text-amber-400">3. Delivery Qty Mismatch</div>
                    <div className="text-[11px] text-slate-400">100 invoiced vs 80 delivered</div>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-400 opacity-60 group-hover/item:opacity-100" />
                </button>
                <button
                  onClick={() => onLaunchScenario('scenario_4')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-200 flex items-center justify-between group/item"
                >
                  <div>
                    <div className="font-semibold text-amber-400">4. Amount Manipulation</div>
                    <div className="text-[11px] text-slate-400">14.5L invoice vs 12.0L PO</div>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-400 opacity-60 group-hover/item:opacity-100" />
                </button>
                <button
                  onClick={() => onLaunchScenario('scenario_5')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-200 flex items-center justify-between group/item"
                >
                  <div>
                    <div className="font-semibold text-rose-400">5. Audit Tamper Attack</div>
                    <div className="text-[11px] text-slate-400">Mutates DB & proves SHA-256 fail</div>
                  </div>
                  <ShieldAlert className="w-4 h-4 text-rose-400 opacity-60 group-hover/item:opacity-100" />
                </button>
                <button
                  onClick={() => onLaunchScenario('scenario_6')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-200 flex items-center justify-between group/item"
                >
                  <div>
                    <div className="font-semibold text-purple-400">6. Competing Lenders</div>
                    <div className="text-[11px] text-slate-400">Cross-lender double-draw collision</div>
                  </div>
                  <Database className="w-4 h-4 text-purple-400 opacity-60 group-hover/item:opacity-100" />
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition disabled:opacity-50"
              title="Reset database to clean seed state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Executive Dashboard' },
            { id: 'sme', label: 'SME Dashboard' },
            { id: 'upload', label: 'Upload & Extraction' },
            { id: 'reconciliation', label: '3-Way Reconciliation' },
            { id: 'duplicates', label: 'Duplicate Fingerprint' },
            { id: 'workflow', label: 'Financing Workflow' },
            { id: 'audit', label: 'Tamper-Evident Ledger' },
            { id: 'registry', label: 'Cross-Lender Registry' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
