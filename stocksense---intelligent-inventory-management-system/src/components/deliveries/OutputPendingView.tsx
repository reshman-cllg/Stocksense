import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Truck,
  Building2,
} from 'lucide-react';

export const OutputPendingView: React.FC = () => {
  const {
    deliveryOrders,
    products,
    warehouses,
    validateDelivery,
    setSelectedProductId,
    setActiveTab,
  } = useInventory();

  // Filter pending deliveries (not done and not cancelled)
  const pendingOrders = deliveryOrders.filter(
    (d) => d.status === 'ready' || d.status === 'waiting' || d.status === 'draft'
  );

  // Flatten items for clear table view
  const pendingRows = pendingOrders.flatMap((order) => {
    return order.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const wh = warehouses.find((w) => w.id === order.warehouseId);
      const available = prod ? prod.currentStock : 0;
      const required = item.orderedQty;
      const isShortage = available < required;
      const shortageAmount = required - available;

      return {
        order,
        item,
        prod,
        wh,
        available,
        required,
        isShortage,
        shortageAmount,
      };
    });
  });

  const totalPendingUnits = pendingRows.reduce((sum, r) => sum + r.required, 0);
  const totalShortagesCount = pendingRows.filter((r) => r.isShortage).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Output Pending & Staging Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock reservation audit comparing available physical inventory against upcoming dispatch obligations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200">
            Pending Dispatch: <span className="font-mono text-indigo-900">{totalPendingUnits}</span> units
          </div>
          {totalShortagesCount > 0 && (
            <div className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 animate-pulse">
              Shortages: <span className="font-mono text-rose-900">{totalShortagesCount}</span> orders
            </div>
          )}
        </div>
      </div>

      {/* Prominent Shortage Alert Banner if shortages exist */}
      {totalShortagesCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Critical Stock Shortages Detected in Pending Outbound Queue</h3>
            <p className="leading-relaxed">
              Certain delivery orders exceed current available on-hand stock. Fulfill these backorders by validating pending supplier receipts or scheduling an internal warehouse transfer from another facility.
            </p>
          </div>
        </div>
      )}

      {/* Output Pending Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-right">Required Qty</th>
                <th className="py-3 px-3 text-right">Available Stock</th>
                <th className="py-3 px-3">Fulfillment Status</th>
                <th className="py-3 px-3">Origin Facility</th>
                <th className="py-3 px-3">Expected Dispatch</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {pendingRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No outbound deliveries pending dispatch. All orders are up to date!
                  </td>
                </tr>
              ) : (
                pendingRows.map(({ order, item, prod, wh, available, required, isShortage, shortageAmount }, idx) => (
                  <tr
                    key={`${order.id}-${idx}`}
                    className={`hover:bg-slate-50 transition-colors ${
                      isShortage ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-amber-700">
                      {order.number}
                    </td>
                    <td
                      className="py-3.5 px-3 font-sans font-semibold text-slate-900 cursor-pointer hover:text-blue-600"
                      onClick={() => {
                        if (prod) {
                          setSelectedProductId(prod.id);
                          setActiveTab('products');
                        }
                      }}
                    >
                      {prod?.name || 'Unknown Product'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-bold">{prod?.sku || '—'}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      {required} {prod?.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold">
                      <span className={isShortage ? 'text-rose-600' : 'text-emerald-700'}>
                        {available} {prod?.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      {isShortage ? (
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span>Shortage: -{shortageAmount} {prod?.unit}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ready for Pick</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">
                      {wh?.name || 'Main Facility'}
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">{order.expectedDispatch}</td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      {isShortage ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveTab('receipts')}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Receive PO
                          </button>
                          <button
                            onClick={() => setActiveTab('transfers')}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Transfer
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => validateDelivery(order.id)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Order</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
