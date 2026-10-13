import React from 'react';
import { 
  ShieldCheck, ArrowRight, Play, Sparkles, CheckCircle2, 
  Layers, Lock, Database, FileText, AlertTriangle, Cpu, TrendingUp 
} from 'lucide-react';

export default function WelcomeView({ onEnterWorkspace, onLaunchGuidedDemo, onLaunchScenario, metrics }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const pipelineStages = [
    {
      step: '01',
      title: 'Off-Chain Ingestion',
      desc: '3-slot document intake (Invoice, PO, GRN) with SHA-256 hashing & native OCR parsing.',
      icon: FileText
    },
    {
      step: '02',
      title: '3-Way Reconciliation',
      desc: 'Mathematical matching of quantities, unit rates, tax amounts, and delivery confirmations.',
      icon: CheckCircle2
    },
    {
      step: '03',
      title: 'Duplicate Defense',
      desc: 'Deterministic normalized claim fingerprints & cross-lender double-draw prevention.',
      icon: Layers
    },
    {
      step: '04',
      title: 'Explainable Risk',
      desc: '0-100 rubric across 5 pillars with transparent point attribution & human oversight.',
      icon: Cpu
    },
    {
      step: '05',
      title: 'Hybrid Audit Anchor',
      desc: 'Cryptographic SHA-256 hash chain with EVM-ready smart contract commitments.',
      icon: Lock
    }
  ];

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-[#173D32] p-8 md:p-12 border border-[#245747] shadow-2xl overflow-hidden text-[#F0EBDD]">
        {/* Subtle warm ambient highlight */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A66B]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#527763]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#133027] border border-[#C5A66B]/40 text-[#C5A66B] text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>National Hackathon Enterprise Showcase • v2.0 Production</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#F0EBDD] font-mono leading-tight">
            Verify the Invoice.<br />
            <span className="text-[#C5A66B]">
              Trace the Fraud.
            </span><br />
            Accelerate Financing.
          </h1>

          <p className="text-base text-[#E6DDC9] leading-relaxed max-w-2xl">
            InvoiceTrust AI eliminates multi-lender factoring fraud, line-item inflation, and document tampering using 
            deterministic claim fingerprinting, explainable risk rubrics, and a hybrid cryptographic audit architecture.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onEnterWorkspace}
              className="px-6 py-3 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] font-bold text-sm shadow-xl border border-[#C5A66B]/40 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Enter Invoice Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onLaunchGuidedDemo}
              className="px-6 py-3 rounded-xl bg-[#1E4A3D] hover:bg-[#245747] border border-[#527763]/50 text-[#F0EBDD] font-semibold text-sm transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 text-[#C5A66B] fill-[#C5A66B]" />
              <span>Explore Guided Hackathon Tour</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#133027] text-[#C5A66B] border border-[#C5A66B]/30 font-mono">10 Stages</span>
            </button>
          </div>

          {/* Key Metrics Counter Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#245747]">
            <div>
              <div className="text-xs text-[#91A891] font-medium">Fraud Prevented</div>
              <div className="text-xl font-bold font-mono text-[#C5A66B] mt-0.5">
                {formatINR(metrics?.fraud_prevented_amount || 4950000)}
              </div>
              <div className="text-[10px] text-[#E6DDC9]/70">Cumulative exposure saved</div>
            </div>
            <div>
              <div className="text-xs text-[#91A891] font-medium">Audit Proofs</div>
              <div className="text-xl font-bold font-mono text-[#F0EBDD] mt-0.5">
                {metrics?.audit_block_count || 5}+ Blocks
              </div>
              <div className="text-[10px] text-[#E6DDC9]/70">Unbroken SHA-256 chain</div>
            </div>
            <div>
              <div className="text-xs text-[#91A891] font-medium">Collision Detection</div>
              <div className="text-xl font-bold font-mono text-[#C5A66B] mt-0.5">
                100% Deterministic
              </div>
              <div className="text-[10px] text-[#E6DDC9]/70">Normalized fingerprints</div>
            </div>
            <div>
              <div className="text-xs text-[#91A891] font-medium">Avg Verification</div>
              <div className="text-xl font-bold font-mono text-[#F0EBDD] mt-0.5">
                1.4 Seconds
              </div>
              <div className="text-[10px] text-[#E6DDC9]/70">Multi-doc OCR & 3-way match</div>
            </div>
          </div>

        </div>
      </div>

      {/* 5-Stage Interactive Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-mono text-[#173D32] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#245747]" />
              <span>End-to-End Verification Pipeline</span>
            </h2>
            <p className="text-xs text-[#527763]">
              Files remain private and off-chain; cryptographic proofs & state transitions are anchored immutably.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#527763] hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#527763] font-bold">{stage.step}</span>
                  <div className="p-2 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] text-[#173D32]">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#173D32] font-mono">{stage.title}</h3>
                  <p className="text-[11px] text-[#25352E] leading-normal mt-1">{stage.desc}</p>
                </div>
                <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-[10px]">
                  <span className="text-[#527763] font-mono">Stage Active</span>
                  <span className="w-2 h-2 rounded-full bg-[#245747]"></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1-Click Preset Scenario Quick Launch Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-mono text-[#173D32]">
              Instant Hackathon Demo Scenarios (1-Click)
            </h2>
            <p className="text-xs text-[#527763]">
              Jump straight to any specific attack vector or genuine trade transaction.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div 
            onClick={() => onLaunchScenario('scenario_1')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#245747] hover:shadow-md cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#245747]">Scenario 1: Clean Trade</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#245747]/15 text-[#245747] border border-[#527763]/40 font-bold">LOW RISK</span>
            </div>
            <p className="text-xs text-[#25352E]">Apex Microelectronics ₹12.5L clean 3-way match, verified buyer acceptance.</p>
          </div>

          <div 
            onClick={() => onLaunchScenario('scenario_2')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#813E43] hover:shadow-md cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#813E43]">Scenario 2: Duplicate Claim</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#813E43]/15 text-[#813E43] border border-[#813E43]/40 font-bold">FINGERPRINT MATCH</span>
            </div>
            <p className="text-xs text-[#25352E]">Altered invoice number INV-8801-DUP caught by deterministic financial fingerprint.</p>
          </div>

          <div 
            onClick={() => onLaunchScenario('scenario_3')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#C5A66B] hover:shadow-md cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#C5A66B]">Scenario 3: Delivery Shortage</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50 font-bold">QTY MISMATCH</span>
            </div>
            <p className="text-xs text-[#25352E]">Sterling Logistics billed 100 pallet racks, but GRN confirms only 80 delivered.</p>
          </div>

          <div 
            onClick={() => onLaunchScenario('scenario_4')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#C5A66B] hover:shadow-md cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#C5A66B]">Scenario 4: Price Inflation</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50 font-bold">RATE TAMPERED</span>
            </div>
            <p className="text-xs text-[#25352E]">Global Tech ₹14.5L billed vs PO agreed ₹12.0L (₹25,000 unit rate inflation).</p>
          </div>

          <div 
            onClick={() => onLaunchScenario('scenario_5')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#813E43] hover:shadow-md cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#813E43]">Scenario 5: Ledger Tamper Attack</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#813E43]/15 text-[#813E43] border border-[#813E43]/40 font-bold">HASH BREAK</span>
            </div>
            <p className="text-xs text-[#25352E]">Simulate insider database mutation to test cryptographic SHA-256 integrity alarm.</p>
          </div>

          <div 
            onClick={() => onLaunchScenario('scenario_6')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#245747] hover:shadow-md cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#245747]">Scenario 6: Cross-Lender Double Dip</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#527763]/20 text-[#173D32] border border-[#527763]/40 font-bold">LENDER COLLISION</span>
            </div>
            <p className="text-xs text-[#25352E]">Pledging already-financed ₹35L invoice to a second lender rejected at registry tip.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
