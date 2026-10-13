import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import InvoiceWorkspaceView from './components/InvoiceWorkspaceView';
import ReconciliationView from './components/ReconciliationView';
import DuplicateDetectionView from './components/DuplicateDetectionView';
import FinancingWorkflowView from './components/FinancingWorkflowView';
import AuditLedgerView from './components/AuditLedgerView';
import CrossLenderRegistryView from './components/CrossLenderRegistryView';
import BuyerAcceptancePublicPage from './components/BuyerAcceptancePublicPage';

import { 
  fetchDashboard, fetchInvoices, fetchInvoiceDetails, 
  fetchAuditLedger, verifyAuditChain, resetDemoData 
} from './services/api';

export default function App() {
  const getInitialToken = () => {
    const path = window.location.pathname;
    if (path.startsWith('/accept/')) {
      return path.replace('/accept/', '').trim();
    }
    return null;
  };

  const [activeBuyerToken, setActiveBuyerToken] = useState(getInitialToken);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('inv_001_genuine');
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [auditLedger, setAuditLedger] = useState([]);
  const [auditStatus, setAuditStatus] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [m, invs, audit, aStatus] = await Promise.all([
        fetchDashboard(),
        fetchInvoices(),
        fetchAuditLedger(),
        verifyAuditChain()
      ]);
      setMetrics(m);
      setInvoices(invs);
      setAuditLedger(audit);
      setAuditStatus(aStatus);

      // Load initial selected invoice details
      const idToLoad = selectedInvoiceId || (invs[0]?.id || 'inv_001_genuine');
      if (idToLoad) {
        const details = await fetchInvoiceDetails(idToLoad);
        setInvoiceDetails(details);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Global keyboard shortcut 'r' or 'R' to reset demo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'r') {
        handleResetDemo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectInvoice = async (id, targetTab = 'reconciliation') => {
    setSelectedInvoiceId(id);
    try {
      const details = await fetchInvoiceDetails(id);
      setInvoiceDetails(details);
      setActiveTab(targetTab);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReloadDetails = async (id) => {
    try {
      const [details, m, audit, aStatus, invs] = await Promise.all([
        fetchInvoiceDetails(id),
        fetchDashboard(),
        fetchAuditLedger(),
        verifyAuditChain(),
        fetchInvoices()
      ]);
      setInvoiceDetails(details);
      setMetrics(m);
      setAuditLedger(audit);
      setAuditStatus(aStatus);
      setInvoices(invs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await resetDemoData();
      await loadAllData();
      showToast('Database reset to pristine seed state. All 6 demo scenarios ready.', 'success');
    } catch (err) {
      showToast('Failed to reset demo: ' + err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // 1-Click Preset Scenario Launcher
  const handleLaunchScenario = async (scenarioId) => {
    switch (scenarioId) {
      case 'scenario_1': // Genuine
        await handleSelectInvoice('inv_001_genuine', 'reconciliation');
        showToast('Scenario 1: Genuine invoice loaded. Clean 3-way match & low risk.', 'success');
        break;
      case 'scenario_2': // Duplicate Financing
        await handleSelectInvoice('inv_002_duplicate', 'duplicates');
        showToast('Scenario 2: Duplicate financing claim loaded. Fingerprint collision detected.', 'warning');
        break;
      case 'scenario_3': // Quantity Mismatch
        await handleSelectInvoice('inv_003_qty_mismatch', 'reconciliation');
        showToast('Scenario 3: Delivery shortage loaded (100 invoiced vs 80 delivered).', 'warning');
        break;
      case 'scenario_4': // Amount Manipulation
        await handleSelectInvoice('inv_004_amount_mismatch', 'reconciliation');
        showToast('Scenario 4: Inflated amount loaded (₹14.5L invoice vs ₹12.0L PO).', 'warning');
        break;
      case 'scenario_5': // Audit Tampering
        setActiveTab('audit');
        showToast('Scenario 5: Audit ledger opened. Click "Simulate DB Tampering" to trigger alarm.', 'info');
        break;
      case 'scenario_6': // Competing Lenders
        setActiveTab('registry');
        showToast('Scenario 6: Cross-Lender registry opened. Test double-financing collision.', 'info');
        break;
      default:
        break;
    }
  };

  // If public buyer acceptance route is accessed (/accept/:token)
  if (activeBuyerToken) {
    return (
      <BuyerAcceptancePublicPage
        token={activeBuyerToken}
        onBackToApp={() => {
          setActiveBuyerToken(null);
          window.history.pushState({}, '', '/');
          loadAllData();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F0EBDD] text-[#25352E] font-sans selection:bg-[#C5A66B] selection:text-[#173D32] overflow-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-2xl text-sm font-semibold flex items-center gap-2 animate-bounce ${
          toast.type === 'error' ? 'bg-[#813E43] border-[#813E43] text-[#F0EBDD]' :
          toast.type === 'warning' ? 'bg-[#C5A66B] border-[#B39358] text-[#173D32]' :
          toast.type === 'success' ? 'bg-[#245747] border-[#1C473A] text-[#F0EBDD]' :
          'bg-[#173D32] border-[#C5A66B] text-[#F0EBDD]'
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
        fraudPreventedAmount={metrics?.fraud_prevented_amount || 4950000}
        auditValid={auditStatus?.is_valid !== false}
      />

      {/* Right Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F0EBDD]">
        
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          selectedInvoiceId={selectedInvoiceId}
          invoiceStatus={invoiceDetails?.invoice?.status || 'INGESTED'}
          auditStatus={auditStatus}
          onResetDemo={handleResetDemo}
          onLaunchScenario={handleLaunchScenario}
          isResetting={isResetting}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F0EBDD]">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              invoices={invoices}
              onSelectInvoice={(id) => handleSelectInvoice(id, 'reconciliation')}
              setActiveTab={setActiveTab}
              onLaunchScenario={handleLaunchScenario}
            />
          )}

          {activeTab === 'workspace' && (
            <InvoiceWorkspaceView
              onInvoiceCreated={async (id) => {
                await loadAllData();
                handleSelectInvoice(id, 'reconciliation');
                showToast('Invoice created successfully. Running 3-way reconciliation.', 'success');
              }}
              onConfirmVerification={async (sub) => {
                await loadAllData();
                handleSelectInvoice('inv_001_genuine', 'reconciliation');
                showToast('3-Slot submission confirmed! Proceeding to 3-way verification.', 'success');
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'reconciliation' && (
            <ReconciliationView
              selectedInvoiceId={selectedInvoiceId}
              invoiceDetails={invoiceDetails}
              onReloadDetails={handleReloadDetails}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'duplicates' && (
            <DuplicateDetectionView
              selectedInvoiceId={selectedInvoiceId}
              invoiceDetails={invoiceDetails}
              onReloadDetails={handleReloadDetails}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'workflow' && (
            <FinancingWorkflowView
              selectedInvoiceId={selectedInvoiceId}
              invoiceDetails={invoiceDetails}
              onReloadDetails={handleReloadDetails}
              setActiveTab={setActiveTab}
              onOpenBuyerPortal={(token) => setActiveBuyerToken(token)}
            />
          )}

          {activeTab === 'registry' && (
            <CrossLenderRegistryView />
          )}

          {activeTab === 'audit' && (
            <AuditLedgerView
              auditLedger={auditLedger}
              auditStatus={auditStatus}
              onReloadAudit={async () => {
                const [a, s] = await Promise.all([fetchAuditLedger(), verifyAuditChain()]);
                setAuditLedger(a);
                setAuditStatus(s);
              }}
              onResetDemo={handleResetDemo}
            />
          )}
        </main>

        {/* Footer Bar */}
        <footer className="h-9 border-t border-[#D8CEBC] bg-[#E6DDC9] px-6 flex items-center justify-between text-xs text-[#527763] shrink-0 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-[#173D32] font-bold">InvoiceTrust AI</span>
            <span>— Hybrid Cryptographic Audit Architecture</span>
          </div>
          <div>FastAPI • SQLite • React • Vite • SHA-256 Hash Chain</div>
        </footer>

      </div>

    </div>
  );
}
