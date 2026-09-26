import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Package,
  Layers,
  AlertTriangle,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingDown,
  Clock,
  DollarSign,
  Building2,
  Filter,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { StockFlowDemandChart } from '../charts/StockFlowDemandChart';

export const DashboardView: React.FC = () => {
  const {
    products,
    receipts,
    deliveryOrders,
    transfers,
    damageRecords,
    adjustments,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    setActiveTab,
    setSelectedProductId,
    getDamageRootCause,
    getLowStockAlerts,
    ledger,
  } = useInventory();

  // Dynamic filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');

  // Filter products according to global warehouse selector and local filters
  const filteredProducts = products.filter((prod) => {
    // Warehouse filter
    if (selectedWarehouseId !== 'all') {
      const wh = warehouses.find((w) => w.id === selectedWarehouseId);
      const hasStockInWh = wh?.locations.some(
        (loc) => (prod.stockByLocation[loc.id] || 0) > 0
      );
      if (!hasStockInWh) return false;
    }
    // Category filter
    if (categoryFilter !== 'all' && prod.category !== categoryFilter) return false;
    // Stock status filter
    if (stockStatusFilter !== 'all' && prod.status !== stockStatusFilter) return false;

    return true;
  });

  // Calculate 10 KPIs
  const totalProducts = filteredProducts.length;
  const totalStockUnits = filteredProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockCount = filteredProducts.filter((p) => p.status === 'low_stock').length;
  const outOfStockCount = filteredProducts.filter((p) => p.status === 'out_of_stock').length;

  const pendingReceipts = receipts.filter(
    (r) =>
      r.status !== 'done' &&
      r.status !== 'cancelled' &&
      (selectedWarehouseId === 'all' || r.warehouseId === selectedWarehouseId)
  );
  const pendingReceiptUnits = pendingReceipts.reduce(
    (sum, r) => sum + r.items.reduce((acc, i) => acc + (i.expectedQty - (i.receivedQty || 0)), 0),
    0
  );

  const pendingDeliveries = deliveryOrders.filter(
    (d) =>
      d.status !== 'done' &&
      d.status !== 'cancelled' &&
      (selectedWarehouseId === 'all' || d.warehouseId === selectedWarehouseId)
  );
  const pendingDeliveryUnits = pendingDeliveries.reduce(
    (sum, d) => sum + d.items.reduce((acc, i) => acc + (i.orderedQty - (i.pickedQty || 0)), 0),
    0
  );

  const scheduledTransfers = transfers.filter(
    (t) =>
      t.status !== 'done' &&
      t.status !== 'cancelled' &&
      (selectedWarehouseId === 'all' ||
        t.sourceWarehouseId === selectedWarehouseId ||
        t.destWarehouseId === selectedWarehouseId)
  );

  const totalDamagedUnits = damageRecords.reduce((sum, d) => {
    if (selectedWarehouseId !== 'all' && d.warehouseId !== selectedWarehouseId) return sum;
    return sum + d.quantity;
  }, 0);

  const pendingOutputOrders = deliveryOrders.filter(
    (d) => d.status === 'ready' || d.status === 'waiting'
  );

  const totalStockValuation = filteredProducts.reduce(
    (sum, p) => sum + p.currentStock * p.unitCost,
    0
  );

  // Demand Analysis and Flow Data for aggregate chart
  const aggregateInput = 520;
  const aggregateOutput = 415;
  const aggregateDemand = 460;
  const aggregateCurrent = totalStockUnits;

  const flowChartData = [
    { label: 'Week 1', input: 95, output: 82, demand: 88, stock: aggregateCurrent - 60 },
    { label: 'Week 2', input: 140, output: 105, demand: 110, stock: aggregateCurrent - 25 },
    { label: 'Week 3', input: 110, output: 98, demand: 115, stock: aggregateCurrent - 13 },
    { label: 'Week 4', input: 175, output: 130, demand: 147, stock: aggregateCurrent },
  ];

  // Coverage ratio for total inventory flow
  const supplySum = aggregateCurrent + pendingReceiptUnits;
  const demandSum = aggregateDemand + pendingDeliveryUnits;
  const coverageRatio = supplySum / Math.max(1, demandSum);

  let matchStatus: 'fully_covered' | 'partially_covered' | 'not_covered' | 'overstock_risk' =
    'fully_covered';
  let matchLabel = 'Demand Fully Covered';
  let matchExplanation =
    'Current inventory (1,018 units) plus awaiting receipts (180 units) reliably covers active dispatches and forecasted monthly demand.';

  if (coverageRatio < 0.7) {
    matchStatus = 'not_covered';
    matchLabel = 'Demand Not Covered';
    matchExplanation =
      'Immediate replenishment required! Inventory buffers fall below upcoming demand projections.';
  } else if (coverageRatio < 1.0) {
    matchStatus = 'partially_covered';
    matchLabel = 'Demand Partially Covered';
    matchExplanation =
      'Supply meets immediate dispatches but leaves thin safety stock. Expediting pending receipts advised.';
  } else if (coverageRatio > 1.6) {
    matchStatus = 'overstock_risk';
    matchLabel = 'Overstock Risk';
    matchExplanation =
      'Stock levels exceed projected 60-day turnover. Consider reducing inbound purchase order frequencies.';
  }

  // Root cause analysis for damage
  const damageAnalysis = getDamageRootCause();
  const lowStockAlerts = getLowStockAlerts();

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Top Banner & Dynamic Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Inventory Overview
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time multi-warehouse logistics, stock ledger tracking, and demand fulfillment
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('receipts')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200/60"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>New Receipt</span>
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200/60"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>New Delivery</span>
            </button>
            <button
              onClick={() => setActiveTab('damage')}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200/60"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Report Damage</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Warehouse Filter */}
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Warehouse: All Facilities</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Category: All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Stock Status: All</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="overstocked">Overstocked</option>
          </select>

          {/* Document Type Shortcut */}
          <select
            value={docTypeFilter}
            onChange={(e) => {
              setDocTypeFilter(e.target.value);
              if (e.target.value !== 'all') {
                setActiveTab(e.target.value);
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Document Type: All</option>
            <option value="receipts">Receipts</option>
            <option value="deliveries">Delivery Orders</option>
            <option value="transfers">Internal Transfers</option>
            <option value="adjustments">Adjustments</option>
            <option value="damage">Damage Records</option>
          </select>

          {(categoryFilter !== 'all' || stockStatusFilter !== 'all' || selectedWarehouseId !== 'all') && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setStockStatusFilter('all');
                setSelectedWarehouseId('all');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 10 Clickable KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Total Products */}
        <div
          onClick={() => setActiveTab('products')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Products</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
            {totalProducts}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Catalog items tracked</p>
        </div>

        {/* KPI 2: Total Stock Units */}
        <div
          onClick={() => setActiveTab('products')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Units</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
            {totalStockUnits.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Aggregated across racks</p>
        </div>

        {/* KPI 3: Low Stock Items */}
        <div
          onClick={() => {
            setStockStatusFilter('low_stock');
            setActiveTab('products');
          }}
          className={`p-4 rounded-2xl border hover:shadow-md transition-all cursor-pointer group ${
            lowStockCount > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-800">{lowStockCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-1 font-medium">Reorder level reached</p>
        </div>

        {/* KPI 4: Out of Stock Items */}
        <div
          onClick={() => {
            setStockStatusFilter('out_of_stock');
            setActiveTab('products');
          }}
          className={`p-4 rounded-2xl border hover:shadow-md transition-all cursor-pointer group ${
            outOfStockCount > 0
              ? 'bg-rose-50/60 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-800">{outOfStockCount}</p>
          <p className="text-[11px] text-rose-700/80 mt-1 font-medium">0 available units</p>
        </div>

        {/* KPI 5: Pending Receipts */}
        <div
          onClick={() => setActiveTab('receipts')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending In</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
            +{pendingReceiptUnits}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{pendingReceipts.length} purchase orders</p>
        </div>

        {/* KPI 6: Pending Deliveries */}
        <div
          onClick={() => setActiveTab('deliveries')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Out</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
            -{pendingDeliveryUnits}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{pendingDeliveries.length} orders scheduled</p>
        </div>

        {/* KPI 7: Internal Transfers Scheduled */}
        <div
          onClick={() => setActiveTab('transfers')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Transfers</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
            {scheduledTransfers.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Inter-location movements</p>
        </div>

        {/* KPI 8: Damaged Stock */}
        <div
          onClick={() => setActiveTab('damage')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Damaged Stock</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700">{totalDamagedUnits}</p>
          <p className="text-[11px] text-slate-400 mt-1">Units written off</p>
        </div>

        {/* KPI 9: Pending Output */}
        <div
          onClick={() => setActiveTab('output_pending')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Output Pending</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
            {pendingOutputOrders.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting dispatch packing</p>
        </div>

        {/* KPI 10: Stock Value ($) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ${Math.round(totalStockValuation).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cost basis inventory</p>
        </div>
      </div>

      {/* Prominent Section: Stock Flow vs Demand */}
      <StockFlowDemandChart
        data={flowChartData}
        matchStatus={matchStatus}
        statusLabel={matchLabel}
        explanation={matchExplanation}
      />

      {/* Actionable Low Stock Alerts Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Actionable Stock Alerts</h3>
              <p className="text-xs text-slate-500">Critical reorder triggers & recommended inventory flows</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {lowStockAlerts.length} Alerts Active
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {lowStockAlerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              All inventory levels are currently above reorder safety thresholds.
            </div>
          ) : (
            lowStockAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  alert.level === 'out'
                    ? 'bg-rose-50/80 border-rose-200'
                    : alert.level === 'critical'
                    ? 'bg-amber-50/80 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        alert.level === 'out'
                          ? 'bg-rose-600 text-white'
                          : alert.level === 'critical'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {alert.level === 'out' ? 'Stockout' : alert.level === 'critical' ? 'Critical' : 'Low Stock'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">{alert.sku}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">{alert.message}</p>
                  <p className="text-[11px] text-slate-600">
                    <strong className="text-slate-700">Recommended Action:</strong> {alert.recommendedAction}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedProductId(alert.productId);
                      setActiveTab('products');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    View Product
                  </button>
                  <button
                    onClick={() => setActiveTab('receipts')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>Receive</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Two Column Grid: Why is Damage Happening? & Stock By Warehouse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why is Damage Happening? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Why is Damage Happening?</h3>
                  <p className="text-xs text-slate-500">Evidence-based root cause analysis</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('damage')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Full Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Evidence summary */}
            <div className="mt-4 p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Primary Root Cause: {damageAnalysis.topReasonLabel}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800">
                {damageAnalysis.evidenceText}
              </p>
            </div>

            {/* Repeated Incident Alerts */}
            {damageAnalysis.repeatedIncidents.length > 0 && (
              <div className="mt-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Identified Location Hotspots
                </span>
                {damageAnalysis.repeatedIncidents.map((spot, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{spot.locationName}</p>
                      <p className="text-[10px] text-slate-500">
                        {spot.count} separate incidents · Cause: {spot.reason}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-rose-600">
                      -{spot.units} units lost
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Historical analysis across {damageRecords.length} recorded events</span>
            <button
              onClick={() => setActiveTab('damage')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Log New Incident
            </button>
          </div>
        </div>

        {/* Stock by Warehouse Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Stock by Warehouse Facility</h3>
                  <p className="text-xs text-slate-500">Capacity utilization and storage allocation</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {warehouses.length} Facilities
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {warehouses.map((wh) => {
                // Calculate stock inside this warehouse
                const whStock = products.reduce((acc, p) => {
                  const locSum = wh.locations.reduce(
                    (lacc, loc) => lacc + (p.stockByLocation[loc.id] || 0),
                    0
                  );
                  return acc + locSum;
                }, 0);

                const capacityPct = Math.min(100, Math.round((whStock / wh.capacityUnits) * 100));

                return (
                  <div
                    key={wh.id}
                    onClick={() => {
                      setSelectedWarehouseId(wh.id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedWarehouseId === wh.id
                        ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div>
                        <span className="font-bold text-slate-900">{wh.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-1.5">({wh.code})</span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="font-bold text-slate-900">{whStock.toLocaleString()}</span>
                        <span className="text-slate-400"> / {wh.capacityUnits.toLocaleString()} units</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, capacityPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>{wh.locations.length} Racks & Storage Areas</span>
                      <span>{capacityPct}% Capacity</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total network capacity: 60,000 units</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Manage Warehouses
            </button>
          </div>
        </div>
      </div>

      {/* Recent Operations Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Inventory Operations</h3>
            <p className="text-xs text-slate-500">Live operational events logged into immutable audit ledger</p>
          </div>
          <button
            onClick={() => setActiveTab('ledger')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Complete Stock Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {ledger.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    entry.transactionType === 'receipt'
                      ? 'bg-blue-100 text-blue-700'
                      : entry.transactionType === 'delivery'
                      ? 'bg-amber-100 text-amber-700'
                      : entry.transactionType === 'damage'
                      ? 'bg-rose-100 text-rose-700'
                      : entry.transactionType === 'internal_transfer'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {entry.transactionType === 'receipt' && <ArrowDownLeft className="w-4 h-4" />}
                  {entry.transactionType === 'delivery' && <ArrowUpRight className="w-4 h-4" />}
                  {entry.transactionType === 'damage' && <AlertOctagon className="w-4 h-4" />}
                  {entry.transactionType === 'internal_transfer' && <ArrowLeftRight className="w-4 h-4" />}
                  {entry.transactionType === 'adjustment' && <RefreshCw className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {entry.productName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{entry.sku}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 font-mono text-slate-600">
                      {entry.referenceNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {entry.source} → {entry.destination} · {entry.user}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-mono font-bold ${
                    entry.quantity > 0
                      ? 'text-emerald-600'
                      : entry.quantity < 0
                      ? 'text-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                </span>
                <p className="text-[10px] font-mono text-slate-400">{entry.timestamp.substring(11)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
