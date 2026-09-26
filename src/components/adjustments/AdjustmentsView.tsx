import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  SlidersHorizontal,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  Building2,
  X,
  FileCheck,
} from 'lucide-react';

export const AdjustmentsView: React.FC = () => {
  const {
    adjustments,
    performAdjustment,
    products,
    warehouses,
    currentUser,
  } = useInventory();

  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState('wh-main');
  const [locationId, setLocationId] = useState('loc-mw-a1');
  const [physicalQty, setPhysicalQty] = useState(50);
  const [reason, setReason] = useState('Routine cycle count audit');
  const [notes, setNotes] = useState('');

  const selectedProd = products.find((p) => p.id === productId);
  const recordedQty = selectedProd?.stockByLocation[locationId] || 0;
  const difference = physicalQty - recordedQty;

  const filteredAdjustments = adjustments.filter((a) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const p = products.find((x) => x.id === a.productId);
      return (
        a.number.toLowerCase().includes(q) ||
        p?.name.toLowerCase().includes(q) ||
        p?.sku.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    performAdjustment({
      productId,
      warehouseId,
      locationId,
      recordedQty,
      physicalQty: Number(physicalQty),
      date: new Date().toISOString().substring(0, 10),
      adjustedBy: currentUser.name,
      reason,
      notes,
    });

    setCreateModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventory Adjustments & Physical Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile physical cycle counts against recorded system inventory with automated ledger delta logs
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Adjustment</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search adjustments by adjustment #, product, or reason..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Adjustment #</th>
                <th className="py-3 px-3">Product Name & SKU</th>
                <th className="py-3 px-3">Facility Location</th>
                <th className="py-3 px-3 text-right">Recorded Qty</th>
                <th className="py-3 px-3 text-right">Physical Count</th>
                <th className="py-3 px-3 text-right">Difference</th>
                <th className="py-3 px-3">Audit Date</th>
                <th className="py-3 px-3">Auditor</th>
                <th className="py-3 px-4">Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredAdjustments.map((adj) => {
                const prod = products.find((p) => p.id === adj.productId);
                const wh = warehouses.find((w) => w.id === adj.warehouseId);
                const loc = wh?.locations.find((l) => l.id === adj.locationId);

                return (
                  <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {adj.number}
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <span className="font-bold text-slate-900 block">{prod?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{prod?.sku}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">
                      <span>{wh?.code}</span> · <span className="text-slate-400">{loc?.name}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      {adj.recordedQty} {prod?.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      {adj.physicalQty} {prod?.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold">
                      <span
                        className={
                          adj.differenceQty > 0
                            ? 'text-emerald-600'
                            : adj.differenceQty < 0
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }
                      >
                        {adj.differenceQty > 0 ? `+${adj.differenceQty}` : adj.differenceQty} {prod?.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{adj.date}</td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">{adj.adjustedBy}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-600 truncate max-w-xs">
                      {adj.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Adjustment Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-slate-800" />
                <h2 className="text-base font-bold text-slate-900">Apply Inventory Stock Adjustment</h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse Facility</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => {
                      setWarehouseId(e.target.value);
                      const w = warehouses.find((x) => x.id === e.target.value);
                      if (w && w.locations[0]) setLocationId(w.locations[0].id);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specific Rack Location</label>
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

              {/* Recorded vs Physical Comparison Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Recorded Count</span>
                  <span className="text-base font-black font-mono text-slate-800">
                    {recordedQty}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Physical Count</span>
                  <span className="text-base font-black font-mono text-blue-600">
                    {physicalQty}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Delta Difference</span>
                  <span
                    className={`text-base font-black font-mono ${
                      difference > 0
                        ? 'text-emerald-600'
                        : difference < 0
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {difference > 0 ? `+${difference}` : difference}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter Physical Counted Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={physicalQty}
                  onChange={(e) => setPhysicalQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Reason *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Discrepancy identified in monthly cycle count"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Manager Authorization Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Audit verified by Warehouse Supervisor"
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
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Commit Adjustment & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
