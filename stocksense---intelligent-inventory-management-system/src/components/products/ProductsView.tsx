import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Product, ProductStatus } from '../../types/inventory';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  X,
  Building2,
  Scan,
} from 'lucide-react';
import { ProductDetailView } from './ProductDetailView';

export const ProductsView: React.FC = () => {
  const {
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    selectedProductId,
    setSelectedProductId,
    currentUser,
    setScannerOpen,
    setActiveTab,
  } = useInventory();

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Raw Materials');
  const [newProdUnit, setNewProdUnit] = useState('pcs');
  const [newProdSupplier, setNewProdSupplier] = useState('');
  const [newProdCost, setNewProdCost] = useState(25);
  const [newProdPrice, setNewProdPrice] = useState(45);
  const [newProdInitialStock, setNewProdInitialStock] = useState(50);
  const [newProdMinStock, setNewProdMinStock] = useState(15);
  const [newProdReorderPoint, setNewProdReorderPoint] = useState(25);
  const [newProdTargetStock, setNewProdTargetStock] = useState(100);
  const [newProdWarehouse, setNewProdWarehouse] = useState('wh-main');
  const [newProdLocation, setNewProdLocation] = useState('loc-mw-a1');
  const [newProdImageUrl, setNewProdImageUrl] = useState(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
  );

  // If a product detail is selected, show ProductDetailView!
  if (selectedProductId) {
    const selectedProd = products.find((p) => p.id === selectedProductId);
    if (selectedProd) {
      return (
        <ProductDetailView
          product={selectedProd}
          onBack={() => setSelectedProductId(null)}
        />
      );
    }
  }

  // Categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

    // Status
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Warehouse
    if (selectedWarehouseId !== 'all') {
      const wh = warehouses.find((w) => w.id === selectedWarehouseId);
      const hasStock = wh?.locations.some((l) => (p.stockByLocation[l.id] || 0) > 0);
      if (!hasStock) return false;
    }

    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku) return;

    createProduct({
      name: newProdName,
      sku: newProdSku.toUpperCase(),
      barcode: newProdBarcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      category: newProdCategory,
      unit: newProdUnit,
      supplier: newProdSupplier || 'Standard Vendor Inc.',
      unitCost: Number(newProdCost),
      unitPrice: Number(newProdPrice),
      initialStock: Number(newProdInitialStock),
      currentStock: Number(newProdInitialStock),
      minStock: Number(newProdMinStock),
      reorderPoint: Number(newProdReorderPoint),
      targetStock: Number(newProdTargetStock),
      imageUrl: newProdImageUrl,
      stockByLocation: {
        [newProdLocation]: Number(newProdInitialStock),
      },
      demandProjected: Math.round(Number(newProdTargetStock) * 0.6),
      recentDemand: Math.round(Number(newProdTargetStock) * 0.5),
      avgDailyOutput: Number((Number(newProdTargetStock) * 0.03).toFixed(1)),
      incomingPending: 0,
      outgoingPending: 0,
    });

    setCreateModalOpen(false);
    // Reset form
    setNewProdName('');
    setNewProdSku('');
    setNewProdBarcode('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    updateProduct(editProduct.id, {
      name: editProduct.name,
      reorderPoint: editProduct.reorderPoint,
      minStock: editProduct.minStock,
      targetStock: editProduct.targetStock,
      unitPrice: editProduct.unitPrice,
      unitCost: editProduct.unitCost,
      category: editProduct.category,
      supplier: editProduct.supplier,
    });
    setEditProduct(null);
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            In Stock
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Low Stock
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Out of Stock
          </span>
        );
      case 'overstocked':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Overstocked
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Product Catalog & Master Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete inventory tracking across SKUs, barcodes, physical storage locations, and replenishment levels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScannerOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Scan className="w-4 h-4 text-blue-600" />
            <span>Scan Barcode</span>
          </button>

          {currentUser.role === 'manager' && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, product name, barcode..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstocked">Overstocked</option>
            </select>

            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          {(search || categoryFilter !== 'all' || statusFilter !== 'all' || selectedWarehouseId !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setSelectedWarehouseId('all');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3">SKU / Barcode</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Current Stock</th>
                  <th className="py-3 px-3 text-right">Min / Reorder</th>
                  <th className="py-3 px-3 text-right">Demand</th>
                  <th className="py-3 px-3">Stock Status</th>
                  <th className="py-3 px-3 text-right">Damaged</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No products match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProductId(p.id)}
                    >
                      {/* Product Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-xs">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{p.supplier}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU / Barcode */}
                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        <span className="font-bold text-slate-800 block">{p.sku}</span>
                        <span className="text-slate-400 text-[10px]">{p.barcode}</span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-600 font-medium">{p.category}</span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span
                          className={`text-sm font-black ${
                            p.currentStock <= 0
                              ? 'text-rose-600'
                              : p.currentStock <= p.reorderPoint
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{p.unit}</span>
                      </td>

                      {/* Min / Reorder */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        <span>{p.minStock}</span> / <span className="font-bold text-slate-700">{p.reorderPoint}</span>
                      </td>

                      {/* Demand */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 font-semibold">
                        {p.demandProjected}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-3">{getStatusBadge(p.status)}</td>

                      {/* Damaged */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {p.damagedUnits > 0 ? (
                          <span className="text-rose-600 font-bold">-{p.damagedUnits}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedProductId(p.id)}
                            title="View Details"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {currentUser.role === 'manager' && (
                            <>
                              <button
                                onClick={() => setEditProduct(p)}
                                title="Edit Product"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                title="Delete Product"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProductId(p.id)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-xs text-xs">
                    {getStatusBadge(p.status)}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span className="font-bold text-slate-800">{p.sku}</span>
                    <span>·</span>
                    <span>{p.category}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {p.name}
                  </h3>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Stock</span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Reorder Point</span>
                      <span className="font-bold text-slate-600 font-mono text-sm">
                        {p.reorderPoint} {p.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Unit Price: ${p.unitPrice}</span>
                <span className="font-bold text-blue-600 group-hover:underline">View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Create New Catalog Product</h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. High-Pressure Hydraulic Valve Assembly"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Product Code *</label>
                  <input
                    type="text"
                    required
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="e.g. MECH-VLV-400"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barcode (EAN-13)</label>
                  <input
                    type="text"
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    placeholder="e.g. 8901234567890"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Machinery & Components">Machinery & Components</option>
                    <option value="Electronics & Networking">Electronics & Networking</option>
                    <option value="Furniture & Fixtures">Furniture & Fixtures</option>
                    <option value="Packaging Supplies">Packaging Supplies</option>
                    <option value="Safety & PPE">Safety & PPE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    placeholder="pcs, units, boxes, kg"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={newProdSupplier}
                    onChange={(e) => setNewProdSupplier(e.target.value)}
                    placeholder="e.g. Apex Industrial Supplies"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdInitialStock}
                    onChange={(e) => setNewProdInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdReorderPoint}
                    onChange={(e) => setNewProdReorderPoint(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Stock Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdTargetStock}
                    onChange={(e) => setNewProdTargetStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Location</label>
                  <select
                    value={newProdLocation}
                    onChange={(e) => setNewProdLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses.flatMap((wh) =>
                      wh.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {wh.code} - {loc.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
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
                  Save Product & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Edit Product: {editProduct.sku}</h2>
              <button
                onClick={() => setEditProduct(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={editProduct.reorderPoint}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, reorderPoint: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Stock</label>
                  <input
                    type="number"
                    value={editProduct.targetStock}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, targetStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.unitCost}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, unitCost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.unitPrice}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, unitPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
