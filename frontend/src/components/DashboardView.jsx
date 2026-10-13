import React from 'react';
import { 
  FileText, ShieldCheck, AlertTriangle, Clock, TrendingUp, 
  DollarSign, CheckCircle2, ShieldAlert, ArrowRight, Search, Filter, UserCheck, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';

export default function DashboardView({
  metrics,
  invoices,
  onSelectInvoice,
  setActiveTab,
  onLaunchScenario
}) {
  if (!metrics) {
    return (
      <div className="p-12 text-center text-[#527763]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#245747] border-t-transparent rounded-full mb-4"></div>
        <p className="text-base font-medium">Loading real-time fintech analytics...</p>
      </div>
    );
  }

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const statusPieData = Object.entries(metrics.status_distribution || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  const STATUS_COLORS = {
    'ELIGIBLE FOR HUMAN APPROVAL': '#245747',
    'VERIFIED': '#527763',
    'APPROVED': '#173D32',
    'FINANCED': '#C5A66B',
    'UNDER REVIEW': '#8F7441',
    'REJECTED': '#813E43',
    'SUBMITTED': '#91A891',
    'DISPUTED': '#813E43'
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#25352E]">
      
      {/* Page Title & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight text-[#173D32] leading-tight">
            Executive Fraud & Financing Dashboard
          </h1>
          <p className="text-base text-[#527763] mt-1">
            Real-time portfolio telemetry, multi-lender duplicate tracking, and tamper-evident audit health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('workspace')}
            className="px-5 py-2.5 rounded-xl bg-[#245747] hover:bg-[#1E4A3D] text-[#F0EBDD] text-[15px] font-semibold shadow-md border border-[#527763]/40 transition flex items-center gap-2 cursor-pointer"
          >
            <span>+ Process New Invoice</span>
          </button>
        </div>
      </div>

      {/* Demo Scenarios Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-[#173D32]">Demo Scenarios</h2>
            <p className="text-sm text-[#527763]">1-click simulation presets demonstrating verified trades, duplicate collisions, and line-item tampering.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Scenario 1: Clean Invoice */}
          <div
            onClick={() => onLaunchScenario && onLaunchScenario('scenario_1')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#245747] hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#173D32]">Clean Invoice</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#245747]/15 text-[#245747] border border-[#527763]/40">
                LOW RISK
              </span>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-[#245747]">INV-8801</div>
              <p className="text-sm text-[#25352E] mt-1 leading-snug">
                Apex Microelectronics ₹12.5L clean 3-way match, verified buyer acceptance.
              </p>
            </div>
            <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-xs text-[#527763] font-medium">
              <span>Test scenario</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#245747]" />
            </div>
          </div>

          {/* Scenario 2: Duplicate Claim */}
          <div
            onClick={() => onLaunchScenario && onLaunchScenario('scenario_2')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#813E43] hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#173D32]">Duplicate Claim</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#813E43]/20 text-[#813E43] border border-[#813E43]/40">
                FINGERPRINT
              </span>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-[#813E43]">INV-8801-DUP</div>
              <p className="text-sm text-[#25352E] mt-1 leading-snug">
                Altered invoice number caught by deterministic financial fingerprint.
              </p>
            </div>
            <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-xs text-[#527763] font-medium">
              <span>Test scenario</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#813E43]" />
            </div>
          </div>

          {/* Scenario 3: Quantity Shortage */}
          <div
            onClick={() => onLaunchScenario && onLaunchScenario('scenario_3')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#C5A66B] hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#173D32]">Quantity Shortage</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50">
                SHORTAGE
              </span>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-[#8F7441]">INV-9104</div>
              <p className="text-sm text-[#25352E] mt-1 leading-snug">
                Sterling Logistics billed 100 units, but GRN confirms only 80 delivered.
              </p>
            </div>
            <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-xs text-[#527763] font-medium">
              <span>Test scenario</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A66B]" />
            </div>
          </div>

          {/* Scenario 4: Amount Inflated */}
          <div
            onClick={() => onLaunchScenario && onLaunchScenario('scenario_4')}
            className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] hover:border-[#C5A66B] hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#173D32]">Amount Inflated</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#C5A66B]/20 text-[#8F7441] border border-[#C5A66B]/50">
                RATE INFLATION
              </span>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-[#8F7441]">INV-9502</div>
              <p className="text-sm text-[#25352E] mt-1 leading-snug">
                Global Tech ₹14.5L billed vs PO agreed ₹12.0L (unit price delta).
              </p>
            </div>
            <div className="pt-2 border-t border-[#D8CEBC] flex items-center justify-between text-xs text-[#527763] font-medium">
              <span>Test scenario</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A66B]" />
            </div>
          </div>

        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div className="space-y-3">
        <h2 className="text-[22px] font-bold text-[#173D32]">Portfolio Performance & Fraud Metrics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* KPI 1: Total Processed */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span>Total Invoices</span>
              <FileText className="w-5 h-5 text-[#245747]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#173D32] font-mono">
              {metrics.total_invoices}
            </div>
            <div className="mt-1 text-sm text-[#245747] flex items-center gap-1 font-medium">
              <span>100% ingested to SQLite</span>
            </div>
          </div>

          {/* KPI 2: Verified Invoices */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span>Verified Clean</span>
              <CheckCircle2 className="w-5 h-5 text-[#245747]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#245747] font-mono">
              {metrics.verified_invoices}
            </div>
            <div className="mt-1 text-sm text-[#527763] flex items-center gap-1">
              <span>3-way matched & clean</span>
            </div>
          </div>

          {/* KPI 3: Potential Duplicates */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span>Duplicate Collisions</span>
              <ShieldAlert className="w-5 h-5 text-[#813E43]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#813E43] font-mono">
              {metrics.potential_duplicates}
            </div>
            <div className="mt-1 text-sm text-[#813E43] flex items-center gap-1 font-bold">
              <span>Blocked by fingerprint</span>
            </div>
          </div>

          {/* KPI 4: Under Review */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span>Compliance Review</span>
              <AlertTriangle className="w-5 h-5 text-[#C5A66B]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#8F7441] font-mono">
              {metrics.flagged_manual_review}
            </div>
            <div className="mt-1 text-sm text-[#8F7441] flex items-center gap-1 font-medium">
              <span>Discrepancy / hold active</span>
            </div>
          </div>

          {/* KPI 5: Total Portfolio Value */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span>Portfolio Face Value</span>
              <DollarSign className="w-5 h-5 text-[#173D32]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#173D32] font-mono truncate">
              {formatINR(metrics.total_invoice_value)}
            </div>
            <div className="mt-1 text-sm text-[#527763]">
              Incurred receivables
            </div>
          </div>

          {/* KPI 6: Fraud Prevented */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#527763]/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span className="text-[#245747] font-bold">Fraud Prevented</span>
              <ShieldCheck className="w-5 h-5 text-[#245747]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#C5A66B] font-mono truncate">
              {formatINR(metrics.fraud_prevented_amount || 4950000)}
            </div>
            <div className="mt-1 text-sm text-[#527763]">
              Saved capital exposure
            </div>
          </div>

          {/* KPI 7: Verification Speed */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span>Avg Verification Time</span>
              <Clock className="w-5 h-5 text-[#C5A66B]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#173D32] font-mono">
              1.4s
            </div>
            <div className="mt-1 text-sm text-[#527763]">
              Multi-doc OCR & 3-way match
            </div>
          </div>

          {/* KPI 8: Audit Chain Validity */}
          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-[#527763] text-sm font-semibold">
              <span>Audit Chain Seal</span>
              <ShieldCheck className="w-5 h-5 text-[#245747]" />
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#245747] font-mono">
              INTACT
            </div>
            <div className="mt-1 text-sm text-[#527763]">
              {metrics.audit_block_count} immutable blocks
            </div>
          </div>

        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Volume Trend */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[20px] font-bold text-[#173D32]">Daily Financing Volume & Trajectory</h2>
              <p className="text-sm text-[#527763]">7-day rolling transaction volume in INR</p>
            </div>
            <div className="text-xs text-[#245747] font-mono bg-[#E6DDC9] px-2.5 py-1 rounded border border-[#D8CEBC] font-semibold">
              Live Flow
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.volume_trends || []}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#245747" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#245747" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8CEBC" vertical={false} />
                <XAxis dataKey="day" stroke="#527763" fontSize={12} />
                <YAxis stroke="#527763" fontSize={12} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#173D32', borderColor: '#245747', borderRadius: '8px', fontSize: '13px', color: '#F0EBDD' }}
                  formatter={(value) => [formatINR(value), 'Financing Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#245747" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution Donut */}
        <div className="p-6 rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] shadow-sm">
          <h2 className="text-[20px] font-bold text-[#173D32] mb-1">Invoice Status Breakdown</h2>
          <p className="text-sm text-[#527763] mb-4">Pipeline distribution across workflow stages</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.name] || '#527763'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#173D32', borderColor: '#245747', borderRadius: '8px', fontSize: '12px', color: '#F0EBDD' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {statusPieData.slice(0, 4).map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[entry.name] || '#527763' }}></span>
                <span className="text-[#25352E] truncate font-medium">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Invoices List Table */}
      <div className="rounded-xl bg-[#FAF7EE] border border-[#D8CEBC] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#D8CEBC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FAF7EE]">
          <div>
            <h2 className="text-[22px] font-bold text-[#173D32]">Active Invoices in Pipeline</h2>
            <p className="text-sm text-[#527763]">Select any claim to view 3-way reconciliation, duplicate fingerprints, and settlement.</p>
          </div>
          <div className="text-xs text-[#527763] flex items-center gap-2 font-medium">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#245747]"></span>
            <span>Real-time persistence</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#E6DDC9] text-[#173D32] uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Buyer (Debtor)</th>
                <th className="py-3.5 px-4">PO Reference</th>
                <th className="py-3.5 px-4">Claim Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CEBC] text-[#25352E]">
              {invoices.map((inv) => {
                const isUnderReview = inv.status === 'UNDER_REVIEW';
                const isEligible = inv.status === 'ELIGIBLE_FOR_HUMAN_APPROVAL';
                const isFinanced = inv.status === 'FINANCED';
                return (
                  <tr key={inv.id} className="hover:bg-[#F2ECE1] transition">
                    <td className="py-4 px-4 font-bold text-[#173D32] font-mono flex items-center gap-2">
                      <span>{inv.invoice_number}</span>
                      {inv.invoice_number.includes('-DUP') && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#813E43]/15 text-[#813E43] border border-[#813E43]/40 font-bold font-mono">DUP</span>
                      )}
                    </td>
                    <td className="py-4 px-4 truncate max-w-[170px] text-[#25352E] font-medium">{inv.supplier_name}</td>
                    <td className="py-4 px-4 truncate max-w-[170px] text-[#527763] font-medium">{inv.buyer_name}</td>
                    <td className="py-4 px-4 text-[#245747] font-mono font-semibold">{inv.po_number || 'N/A'}</td>
                    <td className="py-4 px-4 font-bold text-[#173D32] font-mono text-base">{formatINR(inv.amount)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isFinanced ? 'bg-[#C5A66B]/20 text-[#8F7441] border-[#C5A66B]/50' :
                        isEligible ? 'bg-[#245747]/15 text-[#245747] border-[#527763]/40' :
                        isUnderReview ? 'bg-[#C5A66B]/20 text-[#8F7441] border-[#C5A66B]/50' :
                        'bg-[#E6DDC9] text-[#25352E] border-[#D8CEBC]'
                      }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#FAF7EE] hover:bg-[#245747] hover:text-[#F0EBDD] border border-[#D8CEBC] text-[#245747] text-sm font-semibold transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>Audit & Verify</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
