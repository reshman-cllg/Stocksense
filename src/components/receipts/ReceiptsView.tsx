import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DocumentStatus, Receipt } from '../../types/inventory';
import {
  ArrowDownLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileSpreadsheet,
  Building2,
  Package,
} from 'lucide-react';

export const ReceiptsView: React.FC = () => {
  const {
    receipts,
    createReceipt,
    validateReceipt,
    products,
    warehouses,
    currentUser,
    setSelectedProductId,
    setActiveTab,
  } = useInventory();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeReceiptDetail, setActiveReceiptDetail] = useState<Receipt | null>(null);

  // New receipt form state
  const [supplier, setSupplier] = useState('');
  const [warehouseId, setWarehouseId] = useState('wh-main');
  const [locationId, setLocationId] = useState('loc-mw-a1');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().substring(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [expectedQty, setExpectedQty] = useState(50);
  const [unitCost, setUnitCost] = useState(30);

  // Filter receipts
  const filteredReceipts = receipts.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        r.number.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !selectedProdId) return;

    createReceipt({
      supplier,
      warehouseId,
      locationId,
      orderDate: new Date().toISOString().substring(0, 10),
      expectedDate,
      status: 'ready',
      createdBy: currentUser.name,
      notes,
      items: [
        {
          productId: selectedProdId,
          expectedQty: Number(expectedQty),
          receivedQty: Number(expectedQty),
          unitCost: Number(unitCost),
        },
      ],
    });

    setCreateModalOpen(false);
    setSupplier('');
    setNotes('');
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            Ready for Validation
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
            Waiting Transit
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
            Draft
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Receipts & Incoming Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vendor purchase order receiving, quality inspection intake, and automated stock increases
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Receipt</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt # or supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'ready', 'waiting', 'done'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Destination Facility</th>
                <th className="py-3 px-3">Expected Date</th>
                <th className="py-3 px-3 text-right">Items / Units</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Logged By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredReceipts.map((rec) => {
                const wh = warehouses.find((w) => w.id === rec.warehouseId);
                const loc = wh?.locations.find((l) => l.id === rec.locationId);
                const totalUnits = rec.items.reduce(
                  (sum, i) => sum + (i.receivedQty || i.expectedQty),
                  0
                );

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-600 font-mono">
                      {rec.number}
                    </td>
                    <td className="py-3.5 px-3 font-sans font-semibold text-slate-800">
                      {rec.supplier}
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">
                      <span>{wh?.code}</span> · <span className="text-slate-400">{loc?.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{rec.expectedDate}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      +{totalUnits} units
                    </td>
                    <td className="py-3.5 px-3 font-sans">{getStatusBadge(rec.status)}</td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{rec.createdBy}</td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      {rec.status !== 'done' && rec.status !== 'cancelled' ? (
                        <button
                          onClick={() => {
                            validateReceipt(rec.id);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          Validate Intake
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Stock Added
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Receipt Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Create New Inbound Receipt</h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. Apex Industrial Metallurgy Corp"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product to Receive *</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} (Current: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expectedQty}
                    onChange={(e) => setExpectedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Facility</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Storage Location</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses
                      .find((w) => w.id === warehouseId)
                      ?.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PO Notes / Cargo Waybill</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standard sea freight shipment container #44"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Create Inbound PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
