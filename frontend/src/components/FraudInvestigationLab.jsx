import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Play, RotateCcw, AlertTriangle, CheckCircle2, 
  ArrowRight, ShieldAlert, Cpu, Sparkles, TrendingUp, Layers, Lock 
} from 'lucide-react';
import { runFraudSimulation, fetchFraudPreventedCounter } from '../services/api';

const SCENARIOS = [
  {
    id: 'modified-line-item',
    title: '1. Line-Item Rate Inflation',
    badge: 'AMOUNT TAMPERED',
    badgeColor: 'bg-[#C5A66B]/20 text-[#8F7441] border-[#C5A66B]/50',
    desc: 'Inflates unit price from ₹1,20,000 agreed in PO to ₹1,45,000 (+₹2.5L discrepancy).'
  },
  {
    id: 'reused-po',
    title: '2. Reused PO / Claim Recycling',
    badge: 'PO COLLISION',
    badgeColor: 'bg-[#813E43]/20 text-[#813E43] border-[#813E43]/40',
    desc: 'Alters invoice number while referencing previously billed PO-2026-4410.'
  },
  {
    id: 'cross-lender-double-draw',
    title: '3. Cross-Lender Double-Financing',
    badge: 'CONSORTIUM LOCK',
    badgeColor: 'bg-[#173D32] text-[#F0EBDD] border-[#245747]',
    desc: 'Attempts to pledge ₹35L invoice to 2nd lender; blocked by shared registry.'
  },
  {
    id: 'genuine-clean',
    title: '4. Genuine Clean Baseline',
    badge: '100% MATCHED',
    badgeColor: 'bg-[#245747]/15 text-[#245747] border-[#527763]/40',
    desc: 'Pristine 3-way match, 0 discrepancies, low risk score, fast-track approval.'
  }
];

export default function FraudInvestigationLab({ onSelectInvoice, setActiveTab }) {
  const [selectedScenario, setSelectedScenario] = useState('modified-line-item');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [preventedCounter, setPreventedCounter] = useState(4950000);
  const [error, setError] = useState(null);

  const loadCounter = async () => {
    try {
      const data = await fetchFraudPreventedCounter();
      if (data?.fraud_prevented_inr) {
        setPreventedCounter(data.fraud_prevented_inr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCounter();
    handleExecuteSimulation('modified-line-item');
  }, []);

  const handleExecuteSimulation = async (scenarioId) => {
    setIsRunning(true);
    setError(null);
    setSelectedScenario(scenarioId);
    try {
      const res = await runFraudSimulation(scenarioId);
      setSimulationResult(res);
      await loadCounter();
    } catch (err) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 rounded-2xl bg-[#FAF7EE] border border-[#D8CEBC] p-6 shadow-sm text-[#25352E]">
      
      {/* Lab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8CEBC] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#245747] text-[#F0EBDD] shadow-sm">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-mono text-[#173D32]">Fraud Investigation Lab</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6DDC9] text-[#173D32] border border-[#D8CEBC] font-mono font-bold">
                REVERSIBLE ATTACK SUITE
              </span>
            </div>
            <p className="text-xs text-[#527763]">
              Execute live adversarial attack vectors to observe real before-and-after cryptographic diffs.
            </p>
          </div>
        </div>

        {/* Running Prevented Counter Badge */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#527763]/40 text-right shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-[#527763] font-semibold">Fraud Exposure Prevented</div>
          <div className="text-lg font-bold font-mono text-[#C5A66B]">
            {formatINR(preventedCounter)}
          </div>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleExecuteSimulation(sc.id)}
              disabled={isRunning}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#FFFFFF] border-[#245747] shadow-md ring-2 ring-[#245747]/20'
                  : 'bg-[#FAF7EE] border-[#D8CEBC] hover:border-[#527763] hover:bg-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-[#245747] animate-pulse"></span>}
              </div>
              <div className="text-xs font-bold text-[#173D32] font-mono">{sc.title}</div>
              <p className="text-[11px] text-[#527763] mt-1 line-clamp-2 leading-relaxed">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#813E43]/15 border border-[#813E43]/40 text-[#813E43] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#813E43]" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Attack Results View */}
      {simulationResult && (
        <div className="space-y-4 pt-2">
          
          {/* Verdict Banner */}
          <div className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            simulationResult.scenario === 'genuine-clean'
              ? 'bg-[#245747]/10 border-[#245747] text-[#245747]'
              : 'bg-[#813E43]/10 border-[#813E43] text-[#813E43]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                simulationResult.scenario === 'genuine-clean' ? 'bg-[#245747] text-[#F0EBDD]' : 'bg-[#813E43] text-[#F0EBDD]'
              }`}>
                {simulationResult.scenario === 'genuine-clean' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs uppercase font-mono font-bold tracking-wider text-[#527763]">
                  DEFENSE VERDICT: {simulationResult.attack_vector}
                </div>
                <div className="text-sm font-bold text-[#173D32] font-mono mt-0.5">
                  {simulationResult.verdict}
                </div>
              </div>
            </div>

            {simulationResult.fraud_prevented_amount > 0 && (
              <div className="text-right font-mono text-xs">
                <span className="text-[#527763]">Exposure Blocked: </span>
                <span className="font-bold text-[#C5A66B] text-sm">
                  {formatINR(simulationResult.fraud_prevented_amount)}
                </span>
              </div>
            )}
          </div>

          {/* Side-by-Side Before vs After Comparison Diff */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-[#173D32] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#245747]" />
                <span>Side-by-Side Payload Discrepancy Diff</span>
              </h3>
              <span className="text-[11px] text-[#527763]">Original Baseline vs Adversarial Attempt</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#D8CEBC] bg-[#FFFFFF]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#E6DDC9] text-[#173D32] font-mono text-[10px] uppercase border-b border-[#D8CEBC]">
                  <tr>
                    <th className="p-3">Field / Instrument</th>
                    <th className="p-3">Baseline Genuine State</th>
                    <th className="p-3">Adversarial Mutated State</th>
                    <th className="p-3">Calculated Variance</th>
                    <th className="p-3 text-right">Detection Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8CEBC] font-mono text-[#25352E]">
                  {simulationResult.diffs?.map((d, i) => (
                    <tr key={i} className="hover:bg-[#F2ECE1]">
                      <td className="p-3 font-semibold text-[#173D32]">{d.field}</td>
                      <td className="p-3 text-[#527763]">{d.original}</td>
                      <td className="p-3 text-[#C5A66B] font-bold">{d.attack}</td>
                      <td className="p-3 text-[#813E43] font-bold">{d.delta}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'VERIFIED' ? 'bg-[#245747]/15 text-[#245747] border border-[#527763]/40' :
                          d.status === 'COLLISION' ? 'bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/40' :
                          'bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Impact Gauge & Reconciliation Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* Risk Impact Card */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#173D32] flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#245747]" />
                  <span>Explainable Risk Score Delta</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  simulationResult.risk_impact.delta_points > 0 ? 'bg-[#813E43]/20 text-[#813E43]' : 'bg-[#245747]/15 text-[#245747]'
                }`}>
                  {simulationResult.risk_impact.delta_points > 0 ? `+${simulationResult.risk_impact.delta_points} PTS JUMP` : '0 PTS (CLEAN)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <div>
                  <span className="text-[10px] text-[#527763] block font-semibold">Baseline Risk</span>
                  <span className="text-[#245747] font-bold text-base">
                    {simulationResult.risk_impact.baseline_score} / 100 ({simulationResult.risk_impact.baseline_band})
                  </span>
                </div>
                <div className="text-[#527763]">──▶</div>
                <div className="text-right">
                  <span className="text-[10px] text-[#527763] block font-semibold">Under Attack</span>
                  <span className={`font-bold text-base ${simulationResult.risk_impact.attack_score >= 60 ? 'text-[#813E43]' : 'text-[#C5A66B]'}`}>
                    {simulationResult.risk_impact.attack_score} / 100 ({simulationResult.risk_impact.attack_band})
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#E6DDC9] h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    simulationResult.risk_impact.attack_score >= 60 ? 'bg-[#813E43]' :
                    simulationResult.risk_impact.attack_score >= 30 ? 'bg-[#C5A66B]' : 'bg-[#245747]'
                  }`}
                  style={{ width: `${simulationResult.risk_impact.attack_score}%` }}
                />
              </div>
            </div>

            {/* Cryptographic Duplicate / Network Impact Card */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#173D32] flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#173D32]" />
                  <span>Consortium Registry Defense</span>
                </span>
                <span className="text-[10px] text-[#527763] font-mono">SHA-256 Chain</span>
              </div>

              <p className="text-xs text-[#25352E] leading-relaxed pt-1 font-sans">
                {simulationResult.duplicate_impact.message}
              </p>

              <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#527763]">Audit Proof Logged:</span>
                <span className="text-[#245747] font-semibold">BLOCK_APPENDED_SUCCESS</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
