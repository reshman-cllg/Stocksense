import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Search,
  Scan,
  Bell,
  Building2,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Package,
  X,
  ExternalLink,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    setScannerOpen,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    currentUser,
    switchUserRole,
    products,
    setSelectedProductId,
    setActiveTab,
  } = useInventory();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for global instant search
  const searchResults = searchInput.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchInput.toLowerCase()) ||
          p.barcode.includes(searchInput.trim()) ||
          p.category.toLowerCase().includes(searchInput.toLowerCase())
      )
    : [];

  const handleSelectSearchResult = (prodId: string) => {
    setSelectedProductId(prodId);
    setActiveTab('products');
    setSearchFocused(false);
    setSearchInput('');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Search & Scanner Area */}
      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search by SKU, product name, barcode, or category..."
            className="w-full pl-9 pr-12 py-2 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400 transition-all font-medium"
          />
          {searchInput ? (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-10 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            onClick={() => setScannerOpen(true)}
            title="Scan SKU / Barcode"
            className="absolute right-2 px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors text-[11px] font-semibold"
          >
            <Scan className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline font-mono">Scan</span>
          </button>
        </div>

        {/* Instant Search Results Dropdown */}
        {searchFocused && searchInput.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50 p-2 space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
              <span>Matching Products ({searchResults.length})</span>
              <span className="font-mono text-[10px]">ESC to close</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching product, SKU, or barcode found for "{searchInput}"
              </div>
            ) : (
              searchResults.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSelectSearchResult(prod.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                        {prod.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>{prod.sku}</span>
                        <span>·</span>
                        <span>{prod.barcode}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs font-bold text-slate-800">
                      {prod.currentStock} {prod.unit}
                    </span>
                    <p className="text-[10px] text-slate-400 capitalize">{prod.status.replace('_', ' ')}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Warehouse Selector, Notifications, Role, User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Warehouse Selector */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 hover:bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Warehouses ({warehouses.length})</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-md">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new alerts or notifications.
                  </div>
                ) : (
                  notifications.slice(0, 7).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.productId) {
                          setSelectedProductId(n.productId);
                          setActiveTab('products');
                          setNotifOpen(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.severity === 'critical' ? (
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : n.severity === 'warning' ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : n.severity === 'success' ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu with Role Switcher */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-left"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
              <div className="flex items-center gap-1">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    currentUser.role === 'manager' ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}
                />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {currentUser.role === 'manager' ? 'Inventory Mgr' : 'Warehouse Staff'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
              </div>

              {/* Role Toggle for Hackathon Evaluators */}
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Simulate Role Access
                </span>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      switchUserRole('manager');
                      setProfileOpen(false);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      currentUser.role === 'manager'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Manager</span>
                  </button>
                  <button
                    onClick={() => {
                      switchUserRole('staff');
                      setProfileOpen(false);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      currentUser.role === 'staff'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Staff</span>
                  </button>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Account Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
