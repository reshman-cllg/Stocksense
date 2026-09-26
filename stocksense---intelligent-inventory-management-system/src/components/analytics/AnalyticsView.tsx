import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Building2,
  AlertTriangle,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  RefreshCw,
  PieChart,
} from 'lucide-react';
import { StockFlowDemandChart } from '../charts/StockFlowDemandChart';

export const AnalyticsView: React.FC = () => {
  const {
    products,
    warehouses,
    receipts,
    deliveryOrders,
    transfers,
    damageRecords,
    adjustments,
    getDamageRootCause,
    setSelectedProductId,
    setActiveTab,
  } = useInventory();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Inventory Totals
  const totalStock = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuation = products.reduce((acc, p) => acc + p.currentStock * p.unitCost, 0);
  const lowStockCount = products.filter((p) => p.status === 'low_stock').length;
  const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length;

  // Category Breakdown
  const categoryStats: Record<string, { units: number; val: number }> = {};
  products.forEach((p) => {
    if (!categoryStats[p.category]) categoryStats[p.category] = { units: 0, val: 0 };
    categoryStats[p.category].units += p.currentStock;
    categoryStats[p.category].val += p.currentStock * p.unitCost;
  });

  // Warehouse Breakdown
  const warehouseStats = warehouses.map((wh) => {
    const units = products.reduce((sum, p) => {
      const locSum = wh.locations.reduce((lsum, l) => lsum + (p.stockByLocation[l.id] || 0), 0);
      return sum + locSum;
    }, 0);
    const pct = Math.min(100, Math.round((units / wh.capacityUnits) * 100));
    return { wh, units, pct };
  });

  // Demand match sample series
  const weeklyFlowData = [
    { label: 'Week 1', input: 120, output: 95, demand: 105, stock: totalStock - 45 },
    { label: 'Week 2', input: 165, output: 130, demand: 140, stock: totalStock - 20 },
    { label: 'Week 3', input: 140, output: 125, demand: 135, stock: totalStock - 10 },
    { label: 'Week 4', input: 180, output: 155, demand: 160, stock: totalStock },
  ];

  const damageRootCause = getDamageRootCause();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Inventory Analytics & Demand Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predictive stock health, warehouse storage density, supply-demand alignment, and operational KPI velocity
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          {(['7d', '30d', '90d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                timeframe === tf ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock Valuation</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ${Math.round(totalValuation).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Asset inventory basis</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Physical Stock Units</span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {totalStock.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {products.length} catalog items</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment Health</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            94.8%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">On-time dispatch rate</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Products at Reorder Risk</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {lowStockCount + outOfStockCount} items
          </p>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{outOfStockCount} out of stock</p>
        </div>
      </div>

      {/* Prominent Demand vs Stock Flow Interactive Chart */}
      <StockFlowDemandChart
        data={weeklyFlowData}
        matchStatus="fully_covered"
        statusLabel="Demand Fully Covered"
        explanation="Aggregate supply across active warehouses continues to outpace outgoing delivery requests, sustaining a healthy 30-day operating buffer."
      />

      {/* Two Column Grid: Stock by Category & Warehouse Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Stock & Value by Product Category</h3>
            <span className="text-xs font-mono text-slate-500">{Object.keys(categoryStats).length} Categories</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryStats).map(([cat, data]) => {
              const pct = Math.round((data.units / Math.max(1, totalStock)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-mono text-slate-600">
                      <strong>{data.units} units</strong> · ${Math.round(data.val).toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Storage Density */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Warehouse Storage Density & Utilization</h3>
            <span className="text-xs font-mono text-slate-500">{warehouses.length} Facilities</span>
          </div>

          <div className="space-y-3.5">
            {warehouseStats.map(({ wh, units, pct }) => (
              <div key={wh.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{wh.name}</span>
                    <span className="text-slate-400 font-mono ml-1.5">({wh.code})</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {units.toLocaleString()} / {wh.capacityUnits.toLocaleString()} units ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{wh.locations.length} Racks and Storage Bays</span>
                  <span>{wh.capacityUnits - units} units available capacity</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Velocity Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Operational Velocity (Completed vs Scheduled)</h3>
            <p className="text-xs text-slate-500">Logistics throughput across inbound and outbound pipelines</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Inbound Receipts</span>
            <p className="text-xl font-black text-blue-900 mt-1 font-mono">{receipts.length} POs</p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              {receipts.filter((r) => r.status === 'done').length} Completed · {receipts.filter((r) => r.status !== 'done').length} Pending
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Outbound Deliveries</span>
            <p className="text-xl font-black text-amber-900 mt-1 font-mono">{deliveryOrders.length} Orders</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {deliveryOrders.filter((d) => d.status === 'done').length} Dispatched · {deliveryOrders.filter((d) => d.status !== 'done').length} In Queue
            </p>
          </div>

          <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 text-xs">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Internal Transfers</span>
            <p className="text-xl font-black text-indigo-900 mt-1 font-mono">{transfers.length} Transfers</p>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              {transfers.filter((t) => t.status === 'done').length} Settled · Total stock invariant
            </p>
          </div>

          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Damage Loss Audits</span>
            <p className="text-xl font-black text-rose-900 mt-1 font-mono">{damageRecords.length} Incidents</p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Top Cause: {damageRootCause.topReasonLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
