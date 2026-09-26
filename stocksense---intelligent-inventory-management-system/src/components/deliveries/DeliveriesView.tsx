import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DeliveryOrder, DocumentStatus } from '../../types/inventory';
import {
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Package,
  Layers,
  Truck,
  ArrowRight,
} from 'lucide-react';

export const DeliveriesView: React.FC = () => {
  const {
    deliveryOrders,
    createDeliveryOrder,
    validateDelivery,
    products,
    warehouses,
    currentUser,
    setActiveTab,
    setSelectedProductId,
  } = useInventory();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [customer, setCustomer] = useState('');
  const [warehouseId, setWarehouseId] = useState('wh-main');
  const [locationId, setLocationId] = useState('loc-mw-a1');
  const [expectedDispatch, setExpectedDispatch] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [notes, setNotes] = useState('');
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [orderQty, setOrderQty] = useState(10);

  const filteredOrders = deliveryOrders.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.number.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !selectedProdId) return;

    const prod = products.find((p) => p.id === selectedProdId);

    createDeliveryOrder({
      customer,
      orderDate: new Date().toISOString().substring(0, 10),
      expectedDispatch,
      warehouseId,
      locationId,
      status: 'ready',
      priority,
      createdBy: currentUser.name,
      notes,
      items: [
        {
          productId: selectedProdId,
          orderedQty: Number(orderQty),
          pickedQty: Number(orderQty),
          packedQty: Number(orderQty),
          unitPrice: prod?.unitPrice || 50,
        },
      ],
    });

    setCreateModalOpen(false);
    setCustomer('');
    setNotes('');
  };

  const getPriorityBadge = (p: DeliveryOrder['priority']) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">NORMAL</span>;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Dispatched (Done)
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Ready to Dispatch
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
            Picking / Waiting
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
            Delivery Orders & Outbound Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pick, pack, and validate customer shipments with real-time stock deduction and ledger logging
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
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
            placeholder="Search by order # or customer..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'ready', 'waiting', 'done'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Origin Location</th>
                <th className="py-3 px-3">Dispatch Date</th>
                <th className="py-3 px-3 text-right">Items / Units</th>
                <th className="py-3 px-3">Stock Check</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredOrders.map((del) => {
                const wh = warehouses.find((w) => w.id === del.warehouseId);
                const loc = wh?.locations.find((l) => l.id === del.locationId);
                const totalUnits = del.items.reduce((s, i) => s + i.orderedQty, 0);

                // Check stock availability
                let hasSufficientStock = true;
                del.items.forEach((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  if (!prod || prod.currentStock < item.orderedQty) {
                    hasSufficientStock = false;
                  }
                });

                return (
                  <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-amber-600 font-mono">
                      {del.number}
                    </td>
                    <td className="py-3.5 px-3 font-sans font-semibold text-slate-800">
                      {del.customer}
                    </td>
                    <td className="py-3.5 px-3 font-sans">{getPriorityBadge(del.priority)}</td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">
                      <span>{wh?.code}</span> · <span className="text-slate-400">{loc?.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{del.expectedDispatch}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      -{totalUnits} units
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      {hasSufficientStock ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Stock Ready
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Shortage
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-sans">{getStatusBadge(del.status)}</td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      {del.status !== 'done' && del.status !== 'cancelled' ? (
                        <button
                          onClick={() => validateDelivery(del.id)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold">Fulfilled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Delivery Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Create Outbound Delivery Order</h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Consignee *</label>
                <input
                  type="text"
                  required
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g. Tesla Gigafactory Logistics"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product to Dispatch *</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} ({p.currentStock} {p.unit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Ship *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQty}
                    onChange={(e) => setOrderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Facility</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Rack / Shelf</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Dispatch Date</label>
                <input
                  type="date"
                  value={expectedDispatch}
                  onChange={(e) => setExpectedDispatch(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shipping & Carrier Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Forklift palletize, bill to customer freight account #9981"
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Create Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
