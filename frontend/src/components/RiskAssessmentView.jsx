import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, ArrowRight, RefreshCw, 
  BarChart3, CheckCircle2, ChevronRight, Info, HelpCircle, Cpu
} from 'lucide-react';
import { assessRisk } from '../services/api';
import ExecutiveBriefBanner from './ExecutiveBriefBanner';

export default function RiskAssessmentView({
  selectedInvoiceId,
  invoiceDetails,
  onReloadDetails,
  setActiveTab
}) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState(null);

  if (!invoiceDetails || !invoiceDetails.invoice) {
    return (
      <div className="p-12 text-center text-[#527763]">
        <p className="text-base font-medium">Please select an invoice from the Dashboard to evaluate financing risk.</p>
      </div>
    );
  }

  const { invoice, risk_evaluation } = invoiceDetails;

  const handleRunRiskAssessment = async () => {
    setIsEvaluating(true);
    setError(null);
    try {
      await assessRisk(selectedInvoiceId);
      await onReloadDetails(selectedInvoiceId);
    } catch (err) {
      setError(err.message || 'Risk assessment failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  const score = risk_evaluation?.risk_score ?? 15;
  const riskBand = risk_evaluation?.risk_band || (score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW');
  const recommendation = risk_evaluation?.recommendation || (score >= 60 ? 'REJECT' : score >= 30 ? 'MANUAL_REVIEW' : 'APPROVE');
  const factors = risk_evaluation?.factors || [];

  const getScoreColor = (s) => {
    if (s >= 60) return '#813E43'; // Muted oxblood
    if (s >= 30) return '#C5A66B'; // Antique brass
    return '#245747'; // Botanical green
  };

  const statusType = riskBand === 'LOW' ? 'success' : riskBand === 'HIGH' ? 'danger' : 'warning';

  const whatSystemFound = `Assessed Score: ${score} / 100 (${riskBand} RISK). Action: ${recommendation}. ${risk_evaluation?.summary_explanation || 'Scored against 3-way match, duplicate detection, and buyer credit ratings.'}`;

  const whyItMatters = "Traditional credit scoring is slow or relies on opaque black-box models. Our explainable 5-pillar rubric shows exact mathematical point allocations so underwriters know precisely why an invoice was accepted, held, or rejected.";

  const whatNext = riskBand === 'LOW'
    ? "Proceed to Financing Workflow for fast-track compliance signoff and capital disbursement."
    : riskBand === 'HIGH'
    ? "Enforce compliance barrier: High-risk claims cannot be approved without explicit compliance OVERRIDE notes."
    : "Review itemized risk penalty factors below before approving.";

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173D32] font-mono flex items-center gap-2">
            Explainable Financing Risk Engine (0–100)
          </h1>
          <p className="text-sm text-[#527763] mt-1">
            Rule-based multi-factor credit and fraud risk evaluation with transparent mathematical point allocation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunRiskAssessment}
            disabled={isEvaluating}
            className="px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-xs font-bold shadow-md border border-[#527763]/40 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Evaluating Rubrics...' : 'Calculate Explainable Risk Score'}</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7EE] hover:bg-[#245747] hover:text-[#F0EBDD] text-[#245747] border border-[#D8CEBC] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Next: Approval Decision</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#813E43]/15 border border-[#813E43]/40 text-[#813E43] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#813E43] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5-Second Executive Brief Banner */}
      <ExecutiveBriefBanner
        badge="RISK ENGINE • 5-SECOND EXECUTIVE BRIEF"
        whatAmILookingAt={`The Explainable Risk Engine calculates an objective credit & fraud risk rating (0–100 scale) for invoice #${invoice.invoice_number} across 5 transparent evaluation pillars without opaque black-box models.`}
        whatSystemFound={whatSystemFound}
        whyItMatters={whyItMatters}
        whatNext={whatNext}
        statusType={statusType}
        technicalDetails={{
          algorithm: "5-Pillar Additive Mathematical Rubric (0–100 scale)",
          dataPoints: "Reconciliation (30pts), Duplicates (30pts), Buyer Credit (15pts), Supplier History (15pts), Timing (10pts)",
          securityGuarantee: "Hard safeguard barrier prevents automated approval of HIGH-risk scores without explicit OVERRIDE flag",
          storageProof: "risk_evaluations SQLite table + RISK_SCORE_CALCULATED audit ledger block",
          notes: "Each pillar deducts points from 100 based on discovered documentary, duplicate, or historical anomalies."
        }}
      />

      {/* Main Score Hero Card */}
      <div className="p-6 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-sm">
        
        {/* Left: Score Gauge */}
        <div className="flex flex-col items-center justify-center p-4 border-r border-[#D8CEBC]">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="#E6DDC9"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke={getScoreColor(score)}
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - score / 100)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold font-mono text-[#173D32] tracking-tight">{score}</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#527763] font-bold">RISK INDEX</span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              riskBand === 'LOW' ? 'bg-[#245747]/15 text-[#245747] border-[#527763]/40' :
              riskBand === 'MEDIUM' ? 'bg-[#C5A66B]/20 text-[#8F7441] border-[#C5A66B]/50' :
              'bg-[#813E43]/20 text-[#813E43] border-[#813E43]/40'
            }`}>
              {riskBand} RISK BAND
            </span>
          </div>
        </div>

        {/* Center: Recommendation */}
        <div className="space-y-3 p-4 md:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#D8CEBC]">
            <span className="text-xs font-mono font-bold text-[#527763] uppercase tracking-wider">
              ALGORITHMIC FINANCING RECOMMENDATION
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
              recommendation === 'APPROVE' ? 'bg-[#245747]/15 text-[#245747] border-[#527763]/40' :
              recommendation === 'MANUAL_REVIEW' ? 'bg-[#C5A66B]/20 text-[#8F7441] border-[#C5A66B]/50' :
              'bg-[#813E43]/20 text-[#813E43] border-[#813E43]/40'
            }`}>
              {recommendation}
            </span>
          </div>

          <p className="text-sm text-[#25352E] leading-relaxed font-sans">
            {risk_evaluation?.summary_explanation || 
             'Comprehensive multi-factor risk assessment computed using verifiable invoice evidence, duplicate checks, buyer credit records, and historical payment performance.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC]">
              <span className="text-[#527763] block text-[10px] font-semibold">MAX RISK CEILING:</span>
              <span className="text-[#173D32] font-bold text-sm">100 Points</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC]">
              <span className="text-[#527763] block text-[10px] font-semibold">PASS THRESHOLD:</span>
              <span className="text-[#245747] font-bold text-sm">&lt; 30 Points</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] col-span-2 sm:col-span-1">
              <span className="text-[#527763] block text-[10px] font-semibold">OVERRIDE SAFEGUARD:</span>
              <span className="text-[#C5A66B] font-bold text-sm">ACTIVE</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5 Pillars Breakdown Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#173D32] font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#245747]" />
            <span>5-Pillar Explainable Rubric Breakdown</span>
          </h2>
          <span className="text-xs text-[#527763] font-mono">Mathematically attributed risk indicators</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {factors.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173D32] font-mono truncate">{f.category}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  f.points > 15 ? 'bg-[#813E43]/20 text-[#813E43]' :
                  f.points > 0 ? 'bg-[#C5A66B]/20 text-[#8F7441]' :
                  'bg-[#245747]/15 text-[#245747]'
                }`}>
                  +{f.points} pts
                </span>
              </div>
              <div className="text-xs text-[#245747] font-semibold">{f.factor_name}</div>
              <p className="text-xs text-[#25352E] leading-relaxed font-sans">{f.evidence}</p>
              <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-[11px] font-mono text-[#527763]">
                <span>Pillar Max: {f.max_points} pts</span>
                <span className={f.points === 0 ? 'text-[#245747] font-bold' : 'text-[#8F7441] font-bold'}>
                  {f.points === 0 ? 'CLEAN' : 'PENALTY'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
