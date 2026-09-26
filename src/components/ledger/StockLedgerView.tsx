import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { TransactionType } from '../../types/inventory';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertOctagon,
  RefreshCw,
  Calendar,
} from 'lucide-react';

export const StockLedgerView: React.FC = () => {
  const { ledger, warehouses, products, setSelectedProductId, setActiveTab } = useInventory();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  const filteredLedger = ledger.filter((entry) => {
    if (typeFilter !== 'all' && entry.transactionType !== typeFilter) return false;
    if (warehouseFilter !== 'all' && entry.warehouseId !== warehouseFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        entry.referenceNumber.toLowerCase().includes(q) ||
        entry.productName.toLowerCase().includes(q) ||
        entry.sku.toLowerCase().includes(q) ||
        entry.user.toLowerCase().includes(q) ||
        entry.source.toLowerCase().includes(q) ||
        entry.destination.toLowerCase().includes(q) ||
        entry.reason?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = [
      'Timestamp',
      'Transaction Type',
      'Reference Number',
      'SKU',
      'Product Name',
      'Source',
      'Destination',
      'Quantity Delta',
      'Before Stock',
      'After Stock',
      'Operator',
      'Audit Reason',
    ];

    const rows = filteredLedger.map((e) => [
      `"${e.timestamp}"`,
      `"${e.transactionType}"`,
      `"${e.referenceNumber}"`,
      `"${e.sku}"`,
      `"${e.productName.replace(/"/g, '""')}"`,
      `"${e.source.replace(/"/g, '""')}"`,
      `"${e.destination.replace(/"/g, '""')}"`,
      e.quantity,
      e.beforeStock,
      e.afterStock,
      `"${e.user}"`,
      `"${(e.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockSense_Stock_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'receipt':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />;
      case 'delivery':
        return <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />;
      case 'internal_transfer':
        return <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />;
      case 'damage':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />;
      case 'adjustment':
        return <RefreshCw className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Master Stock Ledger & Transaction Audit
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit record of every receipt, delivery, transfer, adjustment, and write-off with before/after state
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference #, SKU, product, user, or reason..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">All Transaction Types</option>
              <option value="receipt">Receipt (Inbound)</option>
              <option value="delivery">Delivery (Outbound)</option>
              <option value="internal_transfer">Internal Transfer</option>
              <option value="adjustment">Count Adjustment</option>
              <option value="damage">Damage Write-Off</option>
            </select>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
          <span>Showing {filteredLedger.length} ledger transactions</span>
          {(search || typeFilter !== 'all' || warehouseFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setWarehouseFilter('all');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Ref Number</th>
                <th className="py-3 px-3">Product Name & SKU</th>
                <th className="py-3 px-3">Movement: Source → Destination</th>
                <th className="py-3 px-3 text-right">Delta Qty</th>
                <th className="py-3 px-3 text-right">Before → After</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-4">Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No ledger transactions found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <span className="inline-flex items-center gap-1.5 font-bold capitalize text-slate-800">
                        {getTypeIcon(entry.transactionType)}
                        <span>{entry.transactionType.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 font-mono">
                      {entry.referenceNumber}
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <span
                        className="font-bold text-slate-900 block hover:text-blue-600 cursor-pointer truncate max-w-xs"
                        onClick={() => {
                          setSelectedProductId(entry.productId);
                          setActiveTab('products');
                        }}
                      >
                        {entry.productName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{entry.sku}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-600 truncate max-w-xs">
                      <span className="text-slate-700">{entry.source}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="text-slate-900 font-medium">{entry.destination}</span>
                    </td>
                    <td
                      className={`py-3.5 px-3 text-right font-bold text-sm ${
                        entry.quantity > 0
                          ? 'text-emerald-600'
                          : entry.quantity < 0
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      <span>{entry.beforeStock}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="font-bold text-slate-900">{entry.afterStock}</span>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-600">{entry.user}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-500 truncate max-w-xs">
                      {entry.reason || '—'}
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
