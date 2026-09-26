import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DamageReason, DamageRecord } from '../../types/inventory';
import {
  AlertOctagon,
  Plus,
  Search,
  Filter,
  TrendingDown,
  Building2,
  Calendar,
  AlertTriangle,
  X,
  FileText,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const DamageView: React.FC = () => {
  const {
    damageRecords,
    recordDamage,
    products,
    warehouses,
    currentUser,
    getDamageRootCause,
    setSelectedProductId,
    setActiveTab,
  } = useInventory();

  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(5);
  const [warehouseId, setWarehouseId] = useState('wh-north');
  const [locationId, setLocationId] = useState('loc-w2-b');
  const [reason, setReason] = useState<DamageReason>('moisture_water');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');

  const damageRootCause = getDamageRootCause();

  const filteredRecords = damageRecords.filter((d) => {
    if (reasonFilter !== 'all' && d.reason !== reasonFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const p = products.find((x) => x.id === d.productId);
      return (
        d.number.toLowerCase().includes(q) ||
        p?.name.toLowerCase().includes(q) ||
        p?.sku.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalDamagedUnits = filteredRecords.reduce((sum, d) => sum + d.quantity, 0);

  // Aggregations for Charts
  const reasonBreakdown: Record<string, number> = {};
  const warehouseBreakdown: Record<string, number> = {};
  const productBreakdown: Record<string, number> = {};

  filteredRecords.forEach((d) => {
    reasonBreakdown[d.reason] = (reasonBreakdown[d.reason] || 0) + d.quantity;

    const wh = warehouses.find((w) => w.id === d.warehouseId);
    const whName = wh ? wh.name : d.warehouseId;
    warehouseBreakdown[whName] = (warehouseBreakdown[whName] || 0) + d.quantity;

    const p = products.find((x) => x.id === d.productId);
    const pName = p ? p.name : d.productId;
    productBreakdown[pName] = (productBreakdown[pName] || 0) + d.quantity;
  });

  const handleRecordDamage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;

    recordDamage({
      productId,
      quantity: Number(quantity),
      date: new Date().toISOString().substring(0, 10),
      warehouseId,
      locationId,
      reportedBy: currentUser.name,
      reason,
      customReason: reason === 'other' ? customReason : undefined,
      status: 'reported',
      notes,
    });

    setCreateModalOpen(false);
    setNotes('');
  };

  const formatReasonText = (r: DamageReason) => {
    switch (r) {
      case 'moisture_water': return 'Water / Moisture Damage';
      case 'handling_damage': return 'Handling & Forklift Impact';
      case 'physical_damage': return 'Physical Impact / Dropping';
      case 'packaging_failure': return 'Packaging Failure';
      case 'storage_issue': return 'Storage & Overstacking';
      case 'expired_product': return 'Expired Shelf Life';
      case 'manufacturing_defect': return 'Manufacturing Defect';
      case 'transportation_damage': return 'Transit / Freight Damage';
      default: return 'Other Reason';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertOctagon className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Damage Stock Loss & Root Cause Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit damaged inventory write-offs, discover recurring physical hotspots, and inspect root cause evidence
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-rose-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Report Damaged Stock</span>
        </button>
      </div>

      {/* -------------------------------------------------- */}
      {/* INTELLIGENT ROOT CAUSE "WHY IS THIS HAPPENING?"    */}
      {/* -------------------------------------------------- */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 rounded-2xl border border-rose-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Why is Damage Happening?
              </h2>
              <p className="text-xs text-slate-600">
                Data-driven causality diagnosis synthesized from {damageRecords.length} recorded incident audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100/80 px-3 py-1.5 rounded-xl border border-rose-200">
              Total Units Lost: {totalDamagedUnits} units
            </span>
          </div>
        </div>

        {/* Root Cause Diagnosis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/90 rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              Top Incident Driver
            </span>
            <p className="text-base font-black text-slate-900 mt-1">
              {damageRootCause.topReasonLabel}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Accounts for <strong>{damageRootCause.topReasonUnits} units</strong> ({damageRecords.length > 0 ? Math.round((damageRootCause.topReasonUnits / Math.max(1, totalDamagedUnits)) * 100) : 0}% of all loss)
            </p>
          </div>

          <div className="p-4 bg-white/90 rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              High-Risk Facility Hotspot
            </span>
            <p className="text-base font-black text-slate-900 mt-1">
              {damageRootCause.topLocationName}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Located in {damageRootCause.topWarehouseName}
            </p>
          </div>

          <div className="p-4 bg-white/90 rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              Repeated Pattern Frequency
            </span>
            <p className="text-base font-black text-slate-900 mt-1">
              {damageRootCause.repeatedIncidents.length} Location Hotspots
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Multiple correlated events identified at same rack
            </p>
          </div>
        </div>

        {/* Detailed Evidence Narrative */}
        <div className="p-4 bg-white rounded-xl border border-rose-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Audit Evidence & Preventive Recommendations:</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-xs">
            {damageRootCause.evidenceText}
          </p>
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-600">
            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono">
              Action 1: Seal roof joints over Warehouse 2 Rack B
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono">
              Action 2: Operator retraining for forklift aisle turning clearance
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* DAMAGE CHARTS SECTION (Section 18)                 */}
      {/* -------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Damage by Reason */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">1. Damage by Root Cause Reason</h3>
            <span className="text-xs font-mono text-slate-400">Units Lost</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(reasonBreakdown).map(([rKey, qty]) => {
              const pct = Math.round((qty / Math.max(1, totalDamagedUnits)) * 100);
              return (
                <div key={rKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {formatReasonText(rKey as DamageReason)}
                    </span>
                    <span className="font-mono font-bold text-rose-600">
                      {qty} units ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Damage by Warehouse Facility */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">2. Damage by Storage Facility</h3>
            <span className="text-xs font-mono text-slate-400">Distribution</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(warehouseBreakdown).map(([whName, qty]) => {
              const pct = Math.round((qty / Math.max(1, totalDamagedUnits)) * 100);
              return (
                <div key={whName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{whName}</span>
                    <span className="font-mono font-bold text-amber-700">
                      {qty} units ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters and Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident notes or SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
          >
            <option value="all">All Damage Reasons</option>
            <option value="moisture_water">Moisture / Water</option>
            <option value="handling_damage">Handling Damage</option>
            <option value="physical_damage">Physical Damage</option>
            <option value="packaging_failure">Packaging Failure</option>
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['today', '7days', '30days', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition-colors ${
                  dateRange === r ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {r === '7days' ? '7 Days' : r === '30days' ? '30 Days' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Damage Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Damage #</th>
                <th className="py-3 px-3">Product Name & SKU</th>
                <th className="py-3 px-3 text-right">Damaged Qty</th>
                <th className="py-3 px-3">Recorded Date</th>
                <th className="py-3 px-3">Facility / Location</th>
                <th className="py-3 px-3">Reported By</th>
                <th className="py-3 px-3">Damage Reason</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Audit Incident Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredRecords.map((dmg) => {
                const prod = products.find((p) => p.id === dmg.productId);
                const wh = warehouses.find((w) => w.id === dmg.warehouseId);
                const loc = wh?.locations.find((l) => l.id === dmg.locationId);

                return (
                  <tr key={dmg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-rose-600 font-mono">
                      {dmg.number}
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <span
                        className="font-bold text-slate-900 block hover:text-blue-600 cursor-pointer"
                        onClick={() => {
                          if (prod) {
                            setSelectedProductId(prod.id);
                            setActiveTab('products');
                          }
                        }}
                      >
                        {prod?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{prod?.sku}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-rose-600">
                      -{dmg.quantity} {prod?.unit}
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{dmg.date}</td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">
                      <span>{wh?.code}</span> · <span className="text-slate-400">{loc?.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{dmg.reportedBy}</td>
                    <td className="py-3.5 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {formatReasonText(dmg.reason)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <span className="capitalize text-slate-700 font-semibold">{dmg.status}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600 truncate max-w-xs">
                      {dmg.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Damage Record Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">Record Damaged Stock Write-Off</h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDamage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Damaged Product *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} ({p.currentStock} {p.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Damaged Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Root Cause / Damage Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as DamageReason)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="handling_damage">Handling damage / Forklift collision</option>
                  <option value="moisture_water">Water / moisture ingress</option>
                  <option value="physical_damage">Physical impact / Dropping</option>
                  <option value="packaging_failure">Packaging failure / Crushed</option>
                  <option value="transportation_damage">Transit / Freight carrier damage</option>
                  <option value="storage_issue">Storage & stacking overpressure</option>
                  <option value="expired_product">Expired product shelf life</option>
                  <option value="manufacturing_defect">Manufacturing defect</option>
                  <option value="other">Other reason (specify below)</option>
                </select>
              </div>

              {reason === 'other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Reason Specification</label>
                  <input
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe custom damage reason..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility Where Damaged</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specific Rack / Bay</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses
                      .find((w) => w.id === warehouseId)
                      ?.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Incident Report Notes & Evidence *</label>
                <textarea
                  rows={2}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail exact incident notes for ledger and QA..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
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
