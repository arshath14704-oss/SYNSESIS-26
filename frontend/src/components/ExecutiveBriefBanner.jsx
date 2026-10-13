import React, { useState } from 'react';
import { 
  Sparkles, HelpCircle, ChevronDown, ChevronUp, AlertTriangle, 
  CheckCircle2, ShieldAlert, ArrowRight, Code2, Lock, Cpu, Database
} from 'lucide-react';

export default function ExecutiveBriefBanner({
  badge = "5-SECOND EXECUTIVE BRIEF",
  whatAmILookingAt,
  whatSystemFound,
  whyItMatters,
  whatNext,
  statusType = "info", // "success" | "warning" | "danger" | "info"
  actionButton = null,
  technicalDetails = null
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTheme = () => {
    switch (statusType) {
      case 'success':
        return {
          border: 'border-[#527763]',
          bg: 'bg-[#FAF7EE]',
          badgeBg: 'bg-[#245747] text-[#F0EBDD] border-[#527763]',
          accent: 'text-[#245747]',
          icon: CheckCircle2
        };
      case 'warning':
        return {
          border: 'border-[#C5A66B]',
          bg: 'bg-[#FAF7EE]',
          badgeBg: 'bg-[#C5A66B]/20 text-[#8F7441] border-[#C5A66B]',
          accent: 'text-[#C5A66B]',
          icon: AlertTriangle
        };
      case 'danger':
        return {
          border: 'border-[#813E43]',
          bg: 'bg-[#FAF7EE]',
          badgeBg: 'bg-[#813E43]/20 text-[#813E43] border-[#813E43]',
          accent: 'text-[#813E43]',
          icon: ShieldAlert
        };
      default:
        return {
          border: 'border-[#527763]/40',
          bg: 'bg-[#FAF7EE]',
          badgeBg: 'bg-[#245747]/10 text-[#173D32] border-[#527763]/30',
          accent: 'text-[#245747]',
          icon: Sparkles
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div className={`rounded-2xl border-2 ${theme.border} ${theme.bg} p-5 shadow-md transition-all text-[#25352E]`}>
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8CEBC]">
        <div className="flex items-center gap-2.5">
          <span className={`p-1.5 rounded-lg bg-[#E6DDC9] border border-[#D8CEBC] ${theme.accent}`}>
            <Icon className="w-4 h-4" />
          </span>
          <span className={`text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
            {badge}
          </span>
        </div>

        {technicalDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs text-[#527763] hover:text-[#173D32] font-mono transition cursor-pointer self-start sm:self-auto font-semibold"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Hide Technical Details' : 'Deep Dive for Hackathon Judges'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 4 Core Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
        
        {/* Q1: What am I looking at? */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-1.5 shadow-sm">
          <div className="text-[11px] font-mono font-bold text-[#527763] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#245747]"></span>
            <span>1. What am I looking at?</span>
          </div>
          <p className="text-[#25352E] text-xs leading-relaxed font-sans">
            {whatAmILookingAt}
          </p>
        </div>

        {/* Q2: What did the system find? */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-1.5 shadow-sm">
          <div className={`text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme.accent}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusType === 'danger' ? 'bg-[#813E43]' : statusType === 'warning' ? 'bg-[#C5A66B]' : 'bg-[#245747]'}`}></span>
            <span>2. What did the system find?</span>
          </div>
          <p className="text-[#173D32] text-xs font-bold leading-relaxed font-sans">
            {whatSystemFound}
          </p>
        </div>

        {/* Q3: Why does it matter? */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-1.5 shadow-sm">
          <div className="text-[11px] font-mono font-bold text-[#527763] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A66B]"></span>
            <span>3. Why does it matter?</span>
          </div>
          <p className="text-[#25352E] text-xs leading-relaxed font-sans">
            {whyItMatters}
          </p>
        </div>

        {/* Q4: What should I do next? */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D8CEBC] space-y-2 flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-mono font-bold text-[#527763] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#245747]"></span>
              <span>4. What should I do next?</span>
            </div>
            <p className="text-[#245747] text-xs font-bold leading-relaxed mt-1 font-sans">
              {whatNext}
            </p>
          </div>
          {actionButton && (
            <div className="pt-1">
              {actionButton}
            </div>
          )}
        </div>

      </div>

      {/* Expandable Technical Details for Judges */}
      {isExpanded && technicalDetails && (
        <div className="mt-4 pt-4 border-t border-[#D8CEBC] space-y-3 bg-[#E6DDC9]/40 p-4 rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#173D32]">
            <Code2 className="w-4 h-4 text-[#245747]" />
            <span>JUDGES & AUDITORS TECHNICAL ARCHITECTURE REFERENCE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {technicalDetails.algorithm && (
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D8CEBC]">
                <span className="text-[10px] text-[#527763] uppercase block font-semibold">ALGORITHM / PROTOCOL</span>
                <span className="text-[#173D32] font-bold mt-0.5 block">{technicalDetails.algorithm}</span>
              </div>
            )}
            {technicalDetails.dataPoints && (
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D8CEBC]">
                <span className="text-[10px] text-[#527763] uppercase block font-semibold">DATA ATTRIBUTION</span>
                <span className="text-[#245747] font-bold mt-0.5 block">{technicalDetails.dataPoints}</span>
              </div>
            )}
            {technicalDetails.securityGuarantee && (
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D8CEBC]">
                <span className="text-[10px] text-[#527763] uppercase block font-semibold">SECURITY GUARANTEE</span>
                <span className="text-[#173D32] font-bold mt-0.5 block">{technicalDetails.securityGuarantee}</span>
              </div>
            )}
            {technicalDetails.storageProof && (
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D8CEBC]">
                <span className="text-[10px] text-[#527763] uppercase block font-semibold">STORAGE & LEDGER ANCHOR</span>
                <span className="text-[#C5A66B] font-bold mt-0.5 block truncate">{technicalDetails.storageProof}</span>
              </div>
            )}
          </div>

          {technicalDetails.notes && (
            <p className="text-[11px] text-[#25352E] font-mono bg-[#FAF7EE] p-3 rounded-lg border border-[#D8CEBC] leading-relaxed">
              <strong className="text-[#173D32]">Auditor Notes:</strong> {technicalDetails.notes}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
