import React, { useState, useEffect } from 'react';
import { 
  Layers, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, 
  Lock, Bug
} from 'lucide-react';
import { verifyAuditChain, tamperAuditBlock, fetchAnchorStatus } from '../services/api';

export default function AuditLedgerView({
  auditLedger,
  auditStatus,
  onReloadAudit,
  onResetDemo
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [localStatus, setLocalStatus] = useState(auditStatus);
  const [tamperMessage, setTamperMessage] = useState(null);
  const [anchorInfo, setAnchorInfo] = useState(null);

  useEffect(() => {
    async function loadAnchor() {
      try {
        const info = await fetchAnchorStatus();
        setAnchorInfo(info);
      } catch (err) {
        console.error(err);
      }
    }
    loadAnchor();
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    setTamperMessage(null);
    try {
      const res = await verifyAuditChain();
      setLocalStatus(res);
      await onReloadAudit();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamper = async () => {
    setIsTampering(true);
    try {
      const res = await tamperAuditBlock(2); // Deliberately tamper with Block #2
      setTamperMessage(res.attack_result.message);
      setLocalStatus(res.verification_result);
      await onReloadAudit();
    } finally {
      setIsTampering(false);
    }
  };

  const currentStatus = localStatus || auditStatus;
  const isTampered = currentStatus?.is_valid === false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn text-[#25352E]">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight text-[#173D32] leading-tight">
            Tamper-Evident SHA-256 Hybrid Audit Ledger
          </h1>
          <p className="text-base text-[#527763] mt-1">
            Immutable cryptographic hash-chain ledger. Off-chain documents are anchored via canonical serialized hashes.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-bold shadow-md border border-[#527763]/40 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Auditing Hashes...' : 'Verify Ledger Integrity'}</span>
          </button>

          <button
            onClick={handleTamper}
            disabled={isTampering}
            className="px-4 py-2.5 rounded-xl bg-[#813E43]/15 hover:bg-[#813E43]/25 border border-[#813E43]/40 text-[#813E43] text-[15px] font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            title="Deliberately modify a historical database row to demonstrate cryptographic tamper detection"
          >
            <Bug className="w-4 h-4 text-[#813E43]" />
            <span>Simulate DB Tampering</span>
          </button>

          {isTampered && (
            <button
              onClick={onResetDemo}
              className="px-4 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-bold transition cursor-pointer shadow-md"
            >
              Restore Integrity (Reset)
            </button>
          )}
        </div>
      </div>

      {tamperMessage && (
        <div className="p-4 rounded-xl bg-[#C5A66B]/20 border border-[#C5A66B]/50 text-[#8F7441] text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#C5A66B] shrink-0" />
          <span>{tamperMessage}</span>
        </div>
      )}

      {/* Verification Status Alert Banner */}
      <div className={`p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
        isTampered
          ? 'bg-[#813E43]/10 border-[#813E43] text-[#813E43]'
          : 'bg-[#245747]/10 border-[#245747] text-[#245747]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            isTampered ? 'bg-[#813E43] text-[#F0EBDD]' : 'bg-[#245747] text-[#F0EBDD]'
          }`}>
            {isTampered ? <ShieldAlert className="w-8 h-8 animate-bounce" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#527763]">Cryptographic Proof Status</div>
            <div className={`text-[22px] font-bold font-mono ${isTampered ? 'text-[#813E43]' : 'text-[#245747]'}`}>
              {isTampered 
                ? `LEDGER INTEGRITY BREACHED: CORRUPTED BLOCK #${currentStatus.corrupted_block_id}` 
                : `CRYPTOGRAPHIC INTEGRITY INTACT (${auditLedger.length} BLOCKS VERIFIED)`}
            </div>
            {isTampered && currentStatus?.error_message && (
              <p className="text-sm text-[#813E43] mt-1 font-mono font-semibold">
                {currentStatus.error_message}
              </p>
            )}
          </div>
        </div>

        <div className="text-right font-mono text-sm text-[#527763]">
          <div>Genesis Hash: <strong className="text-[#173D32]">0000...0000</strong></div>
          <div>Latest Tip: <strong className="text-[#245747]">{auditLedger[auditLedger.length - 1]?.current_hash?.slice(0, 12)}...</strong></div>
        </div>
      </div>

      {/* Hybrid Blockchain Anchoring Status Card */}
      <div className="p-6 rounded-2xl bg-[#173D32] border border-[#245747] space-y-4 shadow-xl text-[#F0EBDD]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#245747] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#C5A66B]" />
            <h2 className="text-[20px] font-bold text-[#F0EBDD] font-mono">Hybrid Blockchain Anchoring Layer</h2>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-[#133027] text-[#C5A66B] border border-[#C5A66B]/40 font-mono font-bold">
            {anchorInfo?.network || 'LOCAL_APPEND_ONLY_SIMULATION'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-mono">
          <div className="p-4 rounded-xl bg-[#133027] border border-[#245747]">
            <span className="text-[#91A891] text-xs block">SMART CONTRACT:</span>
            <span className="text-[#F0EBDD] font-bold text-base">InvoiceLifecycle.sol</span>
            <span className="text-xs text-[#C5A66B] block mt-0.5">EVM Bytecode Ready</span>
          </div>

          <div className="p-4 rounded-xl bg-[#133027] border border-[#245747]">
            <span className="text-[#91A891] text-xs block">COMMITMENT SCHEME:</span>
            <span className="text-[#F0EBDD] font-bold truncate block">SHA-256(ID+Hash+State)</span>
            <span className="text-xs text-[#91A891] block mt-0.5">Canonical 32-Byte Anchor</span>
          </div>

          <div className="p-4 rounded-xl bg-[#133027] border border-[#245747]">
            <span className="text-[#91A891] text-xs block">SIMULATED HEIGHT:</span>
            <span className="text-[#C5A66B] font-bold text-lg">#{anchorInfo?.latest_block_height || 1042}</span>
            <span className="text-xs text-[#91A891] block mt-0.5">Sync Tip Height</span>
          </div>

          <div className="p-4 rounded-xl bg-[#133027] border border-[#245747]">
            <span className="text-[#91A891] text-xs block">DATA INTEGRITY:</span>
            <span className="text-[#E6DDC9] font-bold">OFF-CHAIN PRIVACY</span>
            <span className="text-xs text-[#91A891] block mt-0.5">Zero Sensitive Data On-Chain</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#133027] border border-[#245747] text-sm text-[#E6DDC9] flex items-center justify-between">
          <span>
            <strong className="text-[#F0EBDD] font-bold">Honesty Label:</strong> Anchored commitments operate locally in append-only JSON format (<code className="text-[#C5A66B]">data/anchors.json</code>) during offline testing; hot-swappable with Hardhat/Ethereum RPC.
          </span>
          <span className="font-mono text-[#C5A66B] text-xs shrink-0 ml-2 font-bold">contract_ready</span>
        </div>
      </div>

      {/* Hash Chain Block Explorer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#173D32] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#245747]" />
            <span>Chronological SHA-256 Hash-Chain Timeline</span>
          </h2>
          <span className="text-sm text-[#527763]">Each block's hash is computed over canonical JSON payload + previous hash</span>
        </div>

        <div className="space-y-3">
          {auditLedger.map((block) => {
            const isCorrupted = isTampered && currentStatus?.corrupted_block_id === block.block_id;
            return (
              <div
                key={block.block_id}
                className={`p-4 rounded-xl border transition-all ${
                  isCorrupted
                    ? 'bg-[#813E43]/15 border-2 border-[#813E43] shadow-md'
                    : 'bg-[#FAF7EE] border-[#D8CEBC] hover:border-[#527763] shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CEBC] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#245747]/15 text-[#245747] border border-[#527763]/40 text-xs font-mono font-bold">
                      Block #{block.block_id}
                    </span>
                    <span className="text-sm font-bold text-[#173D32] font-mono">{block.event_type}</span>
                    {block.invoice_id && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[#E6DDC9] text-[#173D32] font-mono font-semibold">
                        Ref: {block.invoice_id}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#527763]">
                    {block.timestamp}
                  </div>
                </div>

                {/* Hashes Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                  <div>
                    <span className="text-[#527763] text-xs block font-semibold">Previous Block Hash Pointer:</span>
                    <span className="text-[#25352E] break-all bg-[#FFFFFF] px-2.5 py-1.5 rounded block border border-[#D8CEBC] mt-0.5">
                      {block.prev_hash}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#527763] text-xs block font-semibold">Current Block Hash (Canonical SHA-256):</span>
                    <span className={`break-all px-2.5 py-1.5 rounded block border mt-0.5 font-bold ${
                      isCorrupted 
                        ? 'bg-[#813E43]/20 text-[#813E43] border-[#813E43]' 
                        : 'bg-[#FFFFFF] text-[#245747] border-[#D8CEBC]'
                    }`}>
                      {block.current_hash}
                    </span>
                  </div>
                </div>

                {/* Metadata JSON preview */}
                <div className="mt-2.5 pt-2 border-t border-[#D8CEBC] text-xs text-[#527763]">
                  <span className="text-[#527763] text-xs block font-semibold">Canonical Metadata Payload:</span>
                  <div className="font-mono bg-[#FFFFFF] p-2.5 rounded border border-[#D8CEBC] mt-0.5 text-[#25352E] overflow-x-auto text-xs">
                    {JSON.stringify(block.metadata)}
                  </div>
                </div>

                {isCorrupted && (
                  <div className="mt-2.5 p-3 rounded-lg bg-[#813E43]/20 text-[#813E43] text-sm font-semibold flex items-center gap-2 border border-[#813E43]/40">
                    <AlertTriangle className="w-5 h-5 text-[#813E43] shrink-0" />
                    <span>Database anomaly: Payload was tampered with after hash calculation! Cryptographic validation failed.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
