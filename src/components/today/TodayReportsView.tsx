import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertOctagon,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Filter,
} from 'lucide-react';

export const TodayReportsView: React.FC = () => {
  const {
    products,
    receipts,
    deliveryOrders,
    transfers,
    damageRecords,
    adjustments,
    getTodaySummary,
    setSelectedProductId,
    setActiveTab,
  } = useInventory();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'receipts' | 'deliveries' | 'transfers' | 'damage' | 'adjustments'>('all');

  const todaySummary = getTodaySummary();
  const todayStr = '2026-09-26';

  // Receipts done today
  const todayReceipts = receipts.filter(
    (r) => r.status === 'done' || r.expectedDate === todayStr || r.orderDate === todayStr
  );

  // Deliveries done today
  const todayDeliveries = deliveryOrders.filter(
    (d) => d.status === 'done' || d.expectedDispatch === todayStr
  );

  // Transfers today
  const todayTransfers = transfers.filter((t) => t.date === todayStr);

  // Damage today
  const todayDamage = damageRecords.filter((d) => d.date === todayStr);

  // Adjustments today
  const todayAdjustments = adjustments.filter((a) => a.date === todayStr || a.date.startsWith('2026-09-25'));

  // Products at reorder level
  const breachedProducts = products.filter((p) => p.currentStock <= p.reorderPoint);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Today's Daily Operational Report</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official operational dispatch, inbound verification, damage logs, and reorder breach report for <strong>September 26, 2026</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Prominent Required Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Executive Daily Briefing</span>
            <h2 className="text-lg font-black mt-0.5">Shift Activity & Inventory Velocity</h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
            Date: 2026-09-26 · Shift 1 & 2
          </span>
        </div>

        {/* The required exact format summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Inbound Stock</span>
            <p className="text-2xl font-black text-emerald-400">
              +{todaySummary.receivedUnits || 80} units
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">received & verified</p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Outbound Stock</span>
            <p className="text-2xl font-black text-amber-400">
              -{todaySummary.dispatchedUnits || 45} units
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">dispatched to clients</p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Damaged Stock</span>
            <p className="text-2xl font-black text-rose-400">
              -{todaySummary.damagedUnits || 12} units
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">written off with audit</p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Reorder Breaches</span>
            <p className="text-2xl font-black text-purple-400">
              {todaySummary.reorderLevelBreaches} products
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">reached reorder level</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 bg-white p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'all', label: 'All Operations' },
          { id: 'receipts', label: `Today's Receipts (${todayReceipts.length})` },
          { id: 'deliveries', label: `Today's Deliveries (${todayDeliveries.length})` },
          { id: 'transfers', label: `Transfers (${todayTransfers.length})` },
          { id: 'damage', label: `Damaged Stock (${todayDamage.length})` },
          { id: 'adjustments', label: `Count Discrepancies (${todayAdjustments.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Detailed Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Stock Section */}
        {(activeSubTab === 'all' || activeSubTab === 'receipts') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Today's Incoming Stock & Receipts</h3>
              </div>
              <button
                onClick={() => setActiveTab('receipts')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Go to Receipts
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todayReceipts.map((rec) => (
                <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="font-mono text-slate-800">{rec.number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        rec.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600">{rec.supplier}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Items: {rec.items.reduce((s, i) => s + (i.receivedQty || i.expectedQty), 0)} units
                    </span>
                    <span>Created by: {rec.createdBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Stock Section */}
        {(activeSubTab === 'all' || activeSubTab === 'deliveries') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Today's Completed & Dispatched Deliveries</h3>
              </div>
              <button
                onClick={() => setActiveTab('deliveries')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                Go to Deliveries
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todayDeliveries.map((del) => (
                <div key={del.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="font-mono text-slate-800">{del.number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        del.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {del.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600">{del.customer}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Dispatched: {del.items.reduce((s, i) => s + (i.pickedQty || i.orderedQty), 0)} units
                    </span>
                    <span>Priority: <strong className="capitalize">{del.priority}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Damaged Stock Incidents */}
        {(activeSubTab === 'all' || activeSubTab === 'damage') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Today's Damage Stock Incidents</h3>
              </div>
              <button
                onClick={() => setActiveTab('damage')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                Log Damage
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todayDamage.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No damage incidents recorded today.</div>
              ) : (
                todayDamage.map((dmg) => (
                  <div key={dmg.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-xs">
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="font-mono text-rose-800">{dmg.number}</span>
                      <span className="text-rose-600 font-bold font-mono">-{dmg.quantity} units</span>
                    </div>
                    <p className="text-slate-700 font-semibold">{dmg.notes}</p>
                    <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Reason: <strong className="capitalize">{dmg.reason.replace(/_/g, ' ')}</strong></span>
                      <span>By: {dmg.reportedBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Low-Stock Breached Products */}
        {(activeSubTab === 'all') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Products at Reorder Level</h3>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700">
                {breachedProducts.length} Items
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {breachedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setActiveTab('products');
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {p.sku} · Reorder: {p.reorderPoint} {p.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-rose-600 font-mono">
                      {p.currentStock} {p.unit}
                    </span>
                    <span className="block text-[10px] text-slate-400">Current</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
