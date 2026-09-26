import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Product } from '../../types/inventory';
import {
  ArrowLeft,
  Edit,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertOctagon,
  RefreshCw,
  Building2,
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scan,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ProductMovementChart } from '../charts/ProductMovementChart';
import { StockFlowDemandChart } from '../charts/StockFlowDemandChart';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, onBack }) => {
  const {
    warehouses,
    get30DayMovement,
    getDemandAnalysis,
    getDamageRootCause,
    ledger,
    updateProduct,
    validateReceipt,
    createReceipt,
    createDeliveryOrder,
    validateDelivery,
    createInternalTransfer,
    validateInternalTransfer,
    recordDamage,
    performAdjustment,
    currentUser,
    setActiveTab,
  } = useInventory();

  // Action Modals
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);

  // Form input states
  const [actionQty, setActionQty] = useState<number>(10);
  const [actionWarehouseId, setActionWarehouseId] = useState<string>('wh-main');
  const [actionLocationId, setActionLocationId] = useState<string>('loc-mw-a1');
  const [destWarehouseId, setDestWarehouseId] = useState<string>('wh-prod');
  const [destLocationId, setDestLocationId] = useState<string>('loc-pf-rack');
  const [damageReason, setDamageReason] = useState<any>('handling_damage');
  const [actionNotes, setActionNotes] = useState<string>('');

  // Calculations for this product
  const movement30Days = get30DayMovement(product.id);
  const demandAnalysis = getDemandAnalysis(product.id);
  const damageAnalysis = getDamageRootCause(product.id);

  // Product ledger
  const productLedger = ledger.filter((l) => l.productId === product.id);

  // Flow comparison chart data for this specific product
  const productFlowData = movement30Days.slice(-7).map((d) => ({
    label: d.date.substring(5),
    input: d.input,
    output: d.output,
    demand: d.demand,
    stock: d.stockBalance,
  }));

  // Handle Quick Receive
  const handleQuickReceive = (e: React.FormEvent) => {
    e.preventDefault();
    const rec = createReceipt({
      supplier: product.supplier || 'Standard Supplier Inc.',
      orderDate: new Date().toISOString().substring(0, 10),
      expectedDate: new Date().toISOString().substring(0, 10),
      warehouseId: actionWarehouseId,
      locationId: actionLocationId,
      status: 'ready',
      items: [
        {
          productId: product.id,
          expectedQty: actionQty,
          receivedQty: actionQty,
          unitCost: product.unitCost,
        },
      ],
      notes: actionNotes || 'Quick inbound replenishment',
      createdBy: currentUser.name,
    });
    validateReceipt(rec.id);
    setReceiveModalOpen(false);
  };

  // Handle Quick Deliver
  const handleQuickDeliver = (e: React.FormEvent) => {
    e.preventDefault();
    if (product.currentStock < actionQty) {
      alert(`Cannot deliver ${actionQty} units. Only ${product.currentStock} units available.`);
      return;
    }
    const del = createDeliveryOrder({
      customer: 'Direct Order Customer',
      orderDate: new Date().toISOString().substring(0, 10),
      expectedDispatch: new Date().toISOString().substring(0, 10),
      warehouseId: actionWarehouseId,
      locationId: actionLocationId,
      status: 'ready',
      priority: 'normal',
      items: [
        {
          productId: product.id,
          orderedQty: actionQty,
          pickedQty: actionQty,
          packedQty: actionQty,
          unitPrice: product.unitPrice,
        },
      ],
      notes: actionNotes || 'Direct customer dispatch',
      createdBy: currentUser.name,
    });
    validateDelivery(del.id);
    setDeliverModalOpen(false);
  };

  // Handle Quick Internal Transfer
  const handleQuickTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceQty = product.stockByLocation[actionLocationId] || 0;
    if (sourceQty < actionQty) {
      alert(`Source location only has ${sourceQty} units. Cannot transfer ${actionQty}.`);
      return;
    }
    const trf = createInternalTransfer({
      sourceWarehouseId: actionWarehouseId,
      sourceLocationId: actionLocationId,
      destWarehouseId: destWarehouseId,
      destLocationId: destLocationId,
      productId: product.id,
      quantity: actionQty,
      date: new Date().toISOString().substring(0, 10),
      status: 'in_transit',
      createdBy: currentUser.name,
      notes: actionNotes || 'Direct location rebalance',
    });
    validateInternalTransfer(trf.id);
    setTransferModalOpen(false);
  };

  // Handle Quick Adjustment
  const handleQuickAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const currentLocCount = product.stockByLocation[actionLocationId] || 0;
    performAdjustment({
      productId: product.id,
      warehouseId: actionWarehouseId,
      locationId: actionLocationId,
      recordedQty: currentLocCount,
      physicalQty: actionQty,
      date: new Date().toISOString().substring(0, 10),
      adjustedBy: currentUser.name,
      reason: actionNotes || 'Physical cycle count reconciliation',
    });
    setAdjustModalOpen(false);
  };

  // Handle Quick Damage
  const handleQuickDamage = (e: React.FormEvent) => {
    e.preventDefault();
    const curLocCount = product.stockByLocation[actionLocationId] || 0;
    if (curLocCount < actionQty) {
      alert(`Location only has ${curLocCount} units to report damage for.`);
      return;
    }
    recordDamage({
      productId: product.id,
      quantity: actionQty,
      date: new Date().toISOString().substring(0, 10),
      warehouseId: actionWarehouseId,
      locationId: actionLocationId,
      reportedBy: currentUser.name,
      reason: damageReason,
      notes: actionNotes || 'Damaged unit write-off',
      status: 'reported',
    });
    setDamageModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </button>

        {/* Quick Operations Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReceiveModalOpen(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Receive Stock</span>
          </button>
          <button
            onClick={() => setDeliverModalOpen(true)}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Deliver / Dispatch</span>
          </button>
          <button
            onClick={() => setTransferModalOpen(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-indigo-200"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Internal Transfer</span>
          </button>
          <button
            onClick={() => setAdjustModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Adjust Count</span>
          </button>
          <button
            onClick={() => setDamageModalOpen(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Report Damage</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 1. PRODUCT HEADER (From Section 37)               */}
      {/* -------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
            />
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                <span>SKU: <strong className="text-slate-800 font-bold">{product.sku}</strong></span>
                <span>·</span>
                <span>Barcode: <strong className="text-slate-800">{product.barcode}</strong></span>
                <span>·</span>
                <span className="font-sans font-medium">{product.category}</span>
                <span>·</span>
                <span className="font-sans">Supplier: {product.supplier}</span>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    product.status === 'in_stock'
                      ? 'bg-emerald-100 text-emerald-800'
                      : product.status === 'low_stock'
                      ? 'bg-amber-100 text-amber-800'
                      : product.status === 'out_of_stock'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  Status: {product.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400">
                  Last Updated: {product.lastUpdated}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Cost / Selling Price</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              ${product.unitCost} / <strong className="text-blue-600">${product.unitPrice}</strong>
            </span>
          </div>
        </div>

        {/* -------------------------------------------------- */}
        {/* STOCK SUMMARY ROW (From Section 37)               */}
        {/* -------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Stock</span>
            <span
              className={`text-xl font-black font-mono ${
                product.currentStock <= product.reorderPoint ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {product.currentStock}
            </span>
            <span className="text-[10px] text-slate-500 ml-1">{product.unit}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reorder Point</span>
            <span className="text-xl font-black text-slate-700 font-mono">{product.reorderPoint}</span>
            <span className="text-[10px] text-slate-500 ml-1">{product.unit}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Projected Demand</span>
            <span className="text-xl font-black text-blue-600 font-mono">{product.demandProjected}</span>
            <span className="text-[10px] text-slate-500 ml-1">{product.unit}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incoming Stock</span>
            <span className="text-xl font-black text-emerald-600 font-mono">+{product.incomingPending}</span>
            <span className="text-[10px] text-slate-500 ml-1">pending</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Outgoing</span>
            <span className="text-xl font-black text-amber-600 font-mono">-{product.outgoingPending}</span>
            <span className="text-[10px] text-slate-500 ml-1">orders</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Damaged Units</span>
            <span className="text-xl font-black text-rose-600 font-mono">-{product.damagedUnits}</span>
            <span className="text-[10px] text-slate-500 ml-1">total loss</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 2. STOCK BY LOCATION / WHERE IS THIS STOCK?        */}
      {/* -------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Stock By Location & Physical Storage
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Total Distributed: {product.currentStock} {product.unit}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {warehouses.map((wh) => {
            const locBreakdown = wh.locations
              .map((loc) => ({
                loc,
                qty: product.stockByLocation[loc.id] || 0,
              }))
              .filter((x) => x.qty > 0);

            const whTotal = locBreakdown.reduce((sum, x) => sum + x.qty, 0);

            return (
              <div
                key={wh.id}
                className={`p-4 rounded-xl border ${
                  whTotal > 0 ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-50/30 border-slate-200/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs text-slate-900 mb-2">
                  <span>{wh.name}</span>
                  <span className="font-mono text-blue-600">{whTotal} {product.unit}</span>
                </div>

                {locBreakdown.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No stock currently stored at this facility.</p>
                ) : (
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                    {locBreakdown.map(({ loc, qty }) => (
                      <div key={loc.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-mono text-[11px]">{loc.name} ({loc.code})</span>
                        <span className="font-mono font-bold text-slate-800">{qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 3. 30-DAY STOCK MOVEMENT GRAPH (Section 37)       */}
      {/* -------------------------------------------------- */}
      <ProductMovementChart
        data={movement30Days}
        productName={product.name}
        unit={product.unit}
      />

      {/* -------------------------------------------------- */}
      {/* 4. DEMAND ANALYSIS & REQUIREMENT MATCH             */}
      {/* -------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Demand Analysis & Coverage Calculation
            </h2>
            <p className="text-xs text-slate-500">
              Mathematical relation between available stock + pending incoming vs projected demand
            </p>
          </div>

          <div
            className={`px-3 py-1 rounded-xl border text-xs font-bold ${
              demandAnalysis.matchStatus === 'fully_covered'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : demandAnalysis.matchStatus === 'partially_covered'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : demandAnalysis.matchStatus === 'overstock_risk'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {demandAnalysis.statusLabel}
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block">Available For Sale</span>
            <span className="text-lg font-bold font-mono text-slate-900">{demandAnalysis.availableStock}</span>
            <span className="text-[10px] text-slate-400 ml-1">{product.unit}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block">Incoming Orders</span>
            <span className="text-lg font-bold font-mono text-blue-600">+{demandAnalysis.incomingPending}</span>
            <span className="text-[10px] text-slate-400 ml-1">in transit</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block">Pending Deliveries</span>
            <span className="text-lg font-bold font-mono text-amber-600">-{demandAnalysis.outgoingPending}</span>
            <span className="text-[10px] text-slate-400 ml-1">reserved</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block">Projected Demand</span>
            <span className="text-lg font-bold font-mono text-slate-900">{demandAnalysis.expectedDemand}</span>
            <span className="text-[10px] text-slate-400 ml-1">{product.unit}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block">Coverage Ratio</span>
            <span className="text-lg font-bold font-mono text-emerald-700">
              {demandAnalysis.coveragePercent}%
            </span>
            <span className="text-[10px] text-slate-400 ml-1">fulfillment</span>
          </div>
        </div>

        {/* Insight Box */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
          <p className="font-bold text-blue-900">Demand & Supply Insight:</p>
          <p className="text-blue-800 leading-relaxed">{demandAnalysis.explanation}</p>
          <p className="text-blue-700 text-[11px] font-semibold">Advice: {demandAnalysis.insight}</p>
        </div>

        {/* Input vs Output vs Demand mini-chart */}
        <StockFlowDemandChart
          data={productFlowData}
          matchStatus={demandAnalysis.matchStatus}
          statusLabel={demandAnalysis.statusLabel}
          explanation={demandAnalysis.explanation}
        />
      </div>

      {/* -------------------------------------------------- */}
      {/* 5. DAMAGE ANALYSIS (Why is damage happening?)       */}
      {/* -------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Damage Analysis & Root Cause Audit
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-rose-600">
            {product.damagedUnits} Units Lost
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              Primary Damage Cause
            </span>
            <p className="text-sm font-black text-rose-900 mt-1">
              {damageAnalysis.topReasonLabel}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              {damageAnalysis.topReasonUnits} units lost to this reason
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Most Affected Location
            </span>
            <p className="text-sm font-black text-slate-800 mt-1">
              {damageAnalysis.topLocationName}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {damageAnalysis.topWarehouseName}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Damage Rate
            </span>
            <p className="text-sm font-black text-slate-800 mt-1 font-mono">
              {((product.damagedUnits / Math.max(1, product.currentStock + product.damagedUnits)) * 100).toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">of total handled units</p>
          </div>
        </div>

        {/* Why is this happening? Card */}
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-rose-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Why is this happening?</span>
          </div>
          <p className="text-rose-800 leading-relaxed text-xs">
            {damageAnalysis.evidenceText}
          </p>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* 6. STOCK LEDGER FOR THIS PRODUCT (Section 37)      */}
      {/* -------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Stock Ledger & Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Complete historical transaction log of every stock movement for {product.sku}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {productLedger.length} Movements Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3">Source → Destination</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {productLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 font-sans">
                    No ledger transactions logged for this product.
                  </td>
                </tr>
              ) : (
                productLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600">{entry.timestamp}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.transactionType === 'receipt'
                            ? 'bg-blue-100 text-blue-800'
                            : entry.transactionType === 'delivery'
                            ? 'bg-amber-100 text-amber-800'
                            : entry.transactionType === 'damage'
                            ? 'bg-rose-100 text-rose-800'
                            : entry.transactionType === 'internal_transfer'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {entry.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{entry.referenceNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans truncate max-w-xs">
                      {entry.source} → {entry.destination}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        entry.quantity > 0
                          ? 'text-emerald-600'
                          : entry.quantity < 0
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 font-bold">
                      {entry.afterStock}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{entry.user}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 truncate max-w-xs">
                      {entry.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK RECEIPT MODAL */}
      {receiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Receive Stock: {product.sku}</h3>
              <button onClick={() => setReceiveModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleQuickReceive} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Receive</label>
                <input
                  type="number"
                  min="1"
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Warehouse</label>
                <select
                  value={actionWarehouseId}
                  onChange={(e) => setActionWarehouseId(e.target.value)}
                  className="w-full p-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / PO Reference</label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. PO-889 Express Delivery"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Validate & Increase Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK DELIVER MODAL */}
      {deliverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Dispatch Delivery: {product.sku}</h3>
              <button onClick={() => setDeliverModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleQuickDeliver} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Units to Dispatch</label>
                <input
                  type="number"
                  min="1"
                  max={product.currentStock}
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
                <span className="text-[10px] text-slate-400">Current available: {product.currentStock} units</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Project</label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Acme Corp Plant 2"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeliverModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Validate & Dispatch Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK TRANSFER MODAL */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Internal Transfer: {product.sku}</h3>
              <button onClick={() => setTransferModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleQuickTransfer} className="space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-semibold">
                Note: Internal transfers reallocate stock across locations but maintain total company stock invariant.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source Location</label>
                <select
                  value={actionLocationId}
                  onChange={(e) => setActionLocationId(e.target.value)}
                  className="w-full p-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {warehouses.flatMap((w) =>
                    w.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {w.name} - {loc.name} ({product.stockByLocation[loc.id] || 0} avail)
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination Location</label>
                <select
                  value={destLocationId}
                  onChange={(e) => setDestLocationId(e.target.value)}
                  className="w-full p-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {warehouses.flatMap((w) =>
                    w.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {w.name} - {loc.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADJUSTMENT MODAL */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Inventory Adjustment: {product.sku}</h3>
              <button onClick={() => setAdjustModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleQuickAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Location</label>
                <select
                  value={actionLocationId}
                  onChange={(e) => setActionLocationId(e.target.value)}
                  className="w-full p-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {warehouses.flatMap((w) =>
                    w.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {w.name} - {loc.name} (Recorded: {product.stockByLocation[loc.id] || 0})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Counted Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Difference</label>
                <input
                  type="text"
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Cycle count discrepancy after shift"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK DAMAGE MODAL */}
      {damageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Damaged Units: {product.sku}</h3>
              <button onClick={() => setDamageModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleQuickDamage} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Damaged Units Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Damage Reason *</label>
                <select
                  value={damageReason}
                  onChange={(e) => setDamageReason(e.target.value)}
                  className="w-full p-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="handling_damage">Handling damage / Forklift incident</option>
                  <option value="moisture_water">Water / moisture damage</option>
                  <option value="physical_damage">Physical impact / dropped</option>
                  <option value="packaging_failure">Packaging failure / crushed</option>
                  <option value="storage_issue">Storage & stacking issue</option>
                  <option value="expired_product">Expired product</option>
                  <option value="other">Other reason</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Where Damaged</label>
                <select
                  value={actionLocationId}
                  onChange={(e) => setActionLocationId(e.target.value)}
                  className="w-full p-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {warehouses.flatMap((w) =>
                    w.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {w.name} - {loc.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Incident Report Notes *</label>
                <textarea
                  required
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Describe incident circumstances..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDamageModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Confirm Damage Write-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
