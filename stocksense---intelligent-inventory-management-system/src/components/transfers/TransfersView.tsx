import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  X,
  Layers,
} from 'lucide-react';

export const TransfersView: React.FC = () => {
  const {
    transfers,
    createInternalTransfer,
    validateInternalTransfer,
    products,
    warehouses,
    currentUser,
  } = useInventory();

  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('wh-main');
  const [sourceLocationId, setSourceLocationId] = useState('loc-mw-a2');
  const [destWarehouseId, setDestWarehouseId] = useState('wh-prod');
  const [destLocationId, setDestLocationId] = useState('loc-pf-rack');
  const [quantity, setQuantity] = useState(15);
  const [notes, setNotes] = useState('');

  const selectedProd = products.find((p) => p.id === productId);
  const sourceAvailable = selectedProd?.stockByLocation[sourceLocationId] || 0;

  const filteredTransfers = transfers.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const p = products.find((x) => x.id === t.productId);
      return (
        t.number.toLowerCase().includes(q) ||
        p?.name.toLowerCase().includes(q) ||
        p?.sku.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;

    if (sourceAvailable < quantity) {
      alert(`Source location only has ${sourceAvailable} units. Cannot transfer ${quantity} units.`);
      return;
    }

    createInternalTransfer({
      sourceWarehouseId,
      sourceLocationId,
      destWarehouseId,
      destLocationId,
      productId,
      quantity: Number(quantity),
      date: new Date().toISOString().substring(0, 10),
      status: 'in_transit',
      createdBy: currentUser.name,
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
            Internal Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Warehouse-to-warehouse and rack-to-rack inventory movements preserving total company stock balance
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Stock Invariance Notice */}
      <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-indigo-900">Company Stock Invariant Guarantee</h3>
          <p className="leading-relaxed">
            Internal transfers adjust source and destination location allocations while leaving company-wide stock totals unchanged. Every movement is logged with dual before/after ledger timestamps.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transfers by transfer #, SKU, or product..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Transfer #</th>
                <th className="py-3 px-3">Product Name & SKU</th>
                <th className="py-3 px-3">Source Location</th>
                <th className="py-3 px-3">Destination Location</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3">Transfer Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredTransfers.map((trf) => {
                const prod = products.find((p) => p.id === trf.productId);
                const sWh = warehouses.find((w) => w.id === trf.sourceWarehouseId);
                const sLoc = sWh?.locations.find((l) => l.id === trf.sourceLocationId);
                const dWh = warehouses.find((w) => w.id === trf.destWarehouseId);
                const dLoc = dWh?.locations.find((l) => l.id === trf.destLocationId);

                return (
                  <tr key={trf.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-indigo-600 font-mono">
                      {trf.number}
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <span className="font-bold text-slate-900 block">{prod?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{prod?.sku}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">
                      <span>{sWh?.code}</span> · <span className="text-slate-500">{sLoc?.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">
                      <span>{dWh?.code}</span> · <span className="text-slate-500">{dLoc?.name}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      {trf.quantity} {prod?.unit}
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{trf.date}</td>
                    <td className="py-3.5 px-3 font-sans">
                      {trf.status === 'done' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          <Clock className="w-3 h-3" /> In Transit
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{trf.createdBy}</td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      {trf.status !== 'done' ? (
                        <button
                          onClick={() => validateInternalTransfer(trf.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          Confirm Intake
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold">Ledger Updated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Schedule Internal Stock Transfer</h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product to Move *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} (Total: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Transfer *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Available at current source: <strong>{sourceAvailable} {selectedProd?.unit}</strong>
                </span>
              </div>

              {/* Source selection */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Warehouse</label>
                  <select
                    value={sourceWarehouseId}
                    onChange={(e) => {
                      setSourceWarehouseId(e.target.value);
                      const w = warehouses.find((x) => x.id === e.target.value);
                      if (w && w.locations[0]) setSourceLocationId(w.locations[0].id);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Rack / Bay</label>
                  <select
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses
                      .find((w) => w.id === sourceWarehouseId)
                      ?.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({selectedProd?.stockByLocation[loc.id] || 0} in stock)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Destination selection */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Warehouse</label>
                  <select
                    value={destWarehouseId}
                    onChange={(e) => {
                      setDestWarehouseId(e.target.value);
                      const w = warehouses.find((x) => x.id === e.target.value);
                      if (w && w.locations[0]) setDestLocationId(w.locations[0].id);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Rack / Bay</label>
                  <select
                    value={destLocationId}
                    onChange={(e) => setDestLocationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses
                      .find((w) => w.id === destWarehouseId)
                      ?.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Purpose / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Line 2 assembly staging"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Schedule Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
