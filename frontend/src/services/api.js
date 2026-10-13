const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard metrics');
  return res.json();
}

export async function fetchInvoices(status = null) {
  const url = status ? `${API_BASE}/invoices?status=${encodeURIComponent(status)}` : `${API_BASE}/invoices`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load invoices');
  return res.json();
}

export async function fetchInvoiceDetails(id) {
  const res = await fetch(`${API_BASE}/invoices/${id}`);
  if (!res.ok) throw new Error('Failed to load invoice details');
  return res.json();
}

export async function fetchPresetInvoice(scenarioKey) {
  const res = await fetch(`${API_BASE}/invoices/preset/${scenarioKey}`);
  if (!res.ok) throw new Error('Failed to load preset invoice');
  return res.json();
}

export async function uploadInvoiceFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/invoices/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function createInvoice(invoiceData) {
  const res = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Creation failed' }));
    throw new Error(err.detail || 'Creation failed');
  }
  return res.json();
}

export async function verifyInvoice(id) {
  const res = await fetch(`${API_BASE}/invoices/${id}/verify`, { method: 'POST' });
  if (!res.ok) throw new Error('Verification failed');
  return res.json();
}

export async function checkDuplicates(id) {
  const res = await fetch(`${API_BASE}/invoices/${id}/duplicate-check`, { method: 'POST' });
  if (!res.ok) throw new Error('Duplicate check failed');
  return res.json();
}

export async function assessRisk(id) {
  const res = await fetch(`${API_BASE}/invoices/${id}/risk-assessment`, { method: 'POST' });
  if (!res.ok) throw new Error('Risk assessment failed');
  return res.json();
}

export async function submitDecision(id, decision, notes = '', reviewerId = 'COMPLIANCE_OFFICER_01') {
  const res = await fetch(`${API_BASE}/invoices/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision,
      reviewer_notes: notes,
      reviewer_id: reviewerId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Decision failed' }));
    throw new Error(err.detail || 'Decision rejected');
  }
  return res.json();
}

export async function fetchAuditLedger() {
  const res = await fetch(`${API_BASE}/audit`);
  if (!res.ok) throw new Error('Failed to load audit ledger');
  return res.json();
}

export async function verifyAuditChain() {
  const res = await fetch(`${API_BASE}/audit/verify`);
  if (!res.ok) throw new Error('Failed to verify audit chain');
  return res.json();
}

export async function resetDemoData() {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo data');
  return res.json();
}

export async function tamperAuditBlock(blockId = null) {
  const res = await fetch(`${API_BASE}/demo/tamper-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ block_id: blockId }),
  });
  if (!res.ok) throw new Error('Tampering simulation failed');
  return res.json();
}

export async function fetchFinancingClaims() {
  const res = await fetch(`${API_BASE}/financing-registry`);
  if (!res.ok) throw new Error('Failed to load financing claims');
  return res.json();
}

export async function submitFinancingClaim(claimData) {
  const res = await fetch(`${API_BASE}/financing-registry/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claimData),
  });
  if (!res.ok) throw new Error('Failed to submit financing claim');
  return res.json();
}

export async function createAcceptanceLink(invoiceId) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/acceptance-link`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate link' }));
    throw new Error(err.detail || 'Failed to generate link');
  }
  return res.json();
}

export async function fetchAcceptanceStatus(invoiceId) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/acceptance`);
  if (!res.ok) throw new Error('Failed to load acceptance status');
  return res.json();
}

export async function fetchPublicAcceptance(token) {
  const res = await fetch(`${API_BASE}/accept/${token}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch invoice' }));
    const error = new Error(err.detail || 'Failed to fetch invoice');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function submitBuyerDecision(token, decision, note = '') {
  const res = await fetch(`${API_BASE}/accept/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Submission failed' }));
    const error = new Error(err.detail || 'Submission failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// SME Dashboard Submissions API
export async function createSubmission(formData) {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Submission upload failed' }));
    throw new Error(err.detail || 'Submission upload failed');
  }
  return res.json();
}

export async function loadSampleSubmission() {
  const res = await fetch(`${API_BASE}/submissions/load-sample`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to preload sample set' }));
    throw new Error(err.detail || 'Failed to preload sample set');
  }
  return res.json();
}

export async function fetchSubmission(id) {
  const res = await fetch(`${API_BASE}/submissions/${id}`);
  if (!res.ok) throw new Error('Failed to load submission');
  return res.json();
}

export function getSubmissionFileUrl(id, docType) {
  return `${API_BASE}/submissions/${id}/files/${docType}`;
}

export async function runFraudSimulation(scenario) {
  const res = await fetch(`${API_BASE}/fraud-sim/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Simulation failed' }));
    throw new Error(err.detail || 'Simulation failed');
  }
  return res.json();
}

export async function fetchFraudPreventedCounter() {
  const res = await fetch(`${API_BASE}/fraud-sim/prevented-counter`);
  if (!res.ok) throw new Error('Failed to load fraud counter');
  return res.json();
}

export async function fetchAnchorStatus() {
  const res = await fetch(`${API_BASE}/fraud-sim/anchor-status`);
  if (!res.ok) throw new Error('Failed to load anchor status');
  return res.json();
}

export async function fetchBlockchainAnchors() {
  const res = await fetch(`${API_BASE}/fraud-sim/anchors`);
  if (!res.ok) throw new Error('Failed to load anchors');
  return res.json();
}

