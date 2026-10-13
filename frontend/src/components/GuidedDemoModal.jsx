import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, CheckCircle2, Play, 
  RotateCcw, Sparkles, Shield, Layers, HelpCircle, ArrowRight
} from 'lucide-react';

const DEMO_STAGES = [
  {
    step: 1,
    tab: 'dashboard',
    title: 'Platform Overview & Telemetry',
    talkingPoints: [
      'Welcome to InvoiceTrust AI: the AI-powered invoice financing fraud mitigation engine.',
      'Notice the live KPI counter showing ₹49.5L+ in cumulative fraud prevented.',
      'The architecture pairs off-chain document privacy with tamper-evident cryptographic audit proofs.'
    ],
    highlight: 'Real-time financial telemetry dashboard backed by persistent SQLite.'
  },
  {
    step: 2,
    tab: 'workspace',
    title: 'Multi-Document Ingestion (Invoice, PO, Delivery)',
    talkingPoints: [
      'SMEs upload 3 critical trade documents: Commercial Invoice, Signed PO, and Delivery Receipt (GRN).',
      'The engine computes off-chain SHA-256 hashes immediately before OCR extraction.',
      'Notice the sample package loader for Apex Microelectronics & Tata Consumer Electronics.'
    ],
    highlight: 'Multi-document drag-and-drop intake with real-time SSE extraction progress.'
  },
  {
    step: 3,
    tab: 'workspace',
    title: 'Off-Chain Storage & Cryptographic Hashing',
    talkingPoints: [
      'Sensitive business documents stay OFF-chain in secure local storage.',
      'Only cryptographic hashes, timestamps, and state transitions are broadcast to the ledger.',
      'Guarantees corporate privacy and GDPR/DPDP Act compliance for trade secrets.'
    ],
    highlight: 'Privacy-preserving off-chain document hashing architecture.'
  },
  {
    step: 4,
    tab: 'reconciliation',
    title: '3-Way Evidence Reconciliation Engine',
    talkingPoints: [
      'Cross-checks Invoice line items vs PO line items vs Delivery Receipt received quantities.',
      'Catches quantity shortages (e.g. 100 billed vs 80 delivered) and price inflations.',
      'Generates an exportable, printable Official Audit Certificate with SHA-256 proof.'
    ],
    highlight: 'Automatic detection of itemized commercial discrepancies.'
  },
  {
    step: 5,
    tab: 'duplicates',
    title: 'Deterministic Duplicate Claim Detection',
    talkingPoints: [
      'Fraudsters often alter invoice numbers (e.g. INV-8801 to INV-8801-DUP) to evade hash checks.',
      'InvoiceTrust AI computes a normalized canonical claim fingerprint (Supplier + Buyer + Amount + PO).',
      'Instant collision detection flags recycling fraud even when file bytes or invoice IDs change.'
    ],
    highlight: 'Multi-tier duplicate detection: File SHA-256, Normalized Fingerprint, and PO reuse.'
  },
  {
    step: 6,
    tab: 'duplicates',
    title: 'Fraud Investigation Lab & Entity Map',
    talkingPoints: [
      'Explore the interactive entity relationship graph connecting Supplier, Invoice, Buyer, and Lenders.',
      'The Fraud Lab allows live, reversible execution of 4 attack scenarios.',
      'Observe real before/after diffs, delta calculations, and risk score adjustments.'
    ],
    highlight: 'Interactive graph visualization with reversible attack scenario simulations.'
  },
  {
    step: 7,
    tab: 'risk',
    title: 'Explainable 0–100 Risk Engine',
    talkingPoints: [
      'No black-box decisions. Risk score (0-100) is evaluated across 5 transparent pillars.',
      'Pillars: 3-Way Reconciliation, Duplicate Claim, Buyer Creditworthiness, Supplier History, Timing Anomaly.',
      'Points are attributed with explicit mathematical breakdowns and compliance recommendations.'
    ],
    highlight: '0-100 rubric with clear LOW / MEDIUM / HIGH risk bands and factors.'
  },
  {
    step: 8,
    tab: 'workflow',
    title: 'Human-in-the-Loop & Buyer Verification Portal',
    talkingPoints: [
      'High-risk invoices cannot be approved without explicit compliance override notes.',
      'Lenders generate cryptographic buyer acceptance links with QR codes.',
      'Corporate buyers verify delivery directly via the public portal (/accept/:token).'
    ],
    highlight: 'Role-based authorization and cryptographic dual-party signoff.'
  },
  {
    step: 9,
    tab: 'registry',
    title: 'Cross-Lender Registry & Double-Draw Blocker',
    talkingPoints: [
      'Demonstrates a simulated consortium fraud network between competing factoring desks.',
      'Attempting to finance an already pledged invoice at a second lender triggers an immediate collision block.',
      'Protects institutional lenders from syndicated double-dipping fraud.'
    ],
    highlight: 'Multi-lender shared registry with immediate lock on pledged receivables.'
  },
  {
    step: 10,
    tab: 'audit',
    title: 'Tamper-Evident SHA-256 Hash Chain & Hybrid Anchoring',
    talkingPoints: [
      'Every event is permanently committed to an unbroken SHA-256 hash chain.',
      'Click "Simulate DB Tampering" to watch the cryptographic validator pinpoint corrupted block #2.',
      'Hybrid anchoring architecture records canonical state commitments to Solidity contract.'
    ],
    highlight: 'Cryptographic hash-chain proof with instant tamper detection.'
  }
];

export default function GuidedDemoModal({ isOpen, onClose, onSelectTab, onResetDemo }) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStep < DEMO_STAGES.length) {
        handleStepChange(currentStep + 1);
      }
      if (e.key === 'ArrowLeft' && currentStep > 1) {
        handleStepChange(currentStep - 1);
      }
      if (e.key.toLowerCase() === 'r') {
        onResetDemo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const stage = DEMO_STAGES[currentStep - 1];

  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
    const targetTab = DEMO_STAGES[newStep - 1].tab;
    onSelectTab(targetTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn text-[#25352E]">
      <div className="bg-[#FAF7EE] border-2 border-[#173D32] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#245747] flex items-center justify-between bg-[#173D32] text-[#F0EBDD]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#245747] border border-[#C5A66B]/40 text-[#C5A66B]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-[#C5A66B]">GUIDED HACKATHON TOUR</div>
              <div className="text-sm font-bold text-[#F0EBDD]">Stage {currentStep} of {DEMO_STAGES.length}: {stage.title}</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#E6DDC9] hover:text-[#FFFFFF] hover:bg-[#245747] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 flex-1">
          {/* Highlight chip */}
          <div className="p-3 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] text-[#173D32] text-xs font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#245747] shrink-0" />
            <span className="font-semibold">{stage.highlight}</span>
          </div>

          {/* Talking Points List */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold uppercase text-[#527763] tracking-wider font-mono">Presenter Talking Points:</div>
            <ul className="space-y-2.5">
              {stage.talkingPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#25352E]">
                  <CheckCircle2 className="w-4 h-4 text-[#245747] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step Indicator Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {DEMO_STAGES.map((s) => (
              <button
                key={s.step}
                onClick={() => handleStepChange(s.step)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  s.step === currentStep ? 'w-6 bg-[#245747]' : 'w-2 bg-[#D8CEBC] hover:bg-[#527763]'
                }`}
                title={`Stage ${s.step}: ${s.title}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#D8CEBC] bg-[#E6DDC9] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#527763] font-mono">
            <span>Shortcut: [← Prev] [→ Next] [R Reset]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-3 py-1.5 rounded-lg bg-[#FAF7EE] hover:bg-[#FFFFFF] border border-[#D8CEBC] disabled:opacity-40 disabled:cursor-not-allowed text-xs text-[#173D32] transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < DEMO_STAGES.length ? (
              <button
                onClick={() => handleStepChange(currentStep + 1)}
                className="px-4 py-1.5 rounded-lg bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-sm border border-[#527763]/40"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-[#173D32] hover:bg-[#133027] text-[#C5A66B] font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>Finish Tour</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
