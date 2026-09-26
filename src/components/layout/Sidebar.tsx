import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertOctagon,
  Clock,
  SlidersHorizontal,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onLogout,
}) => {
  const {
    activeTab,
    setActiveTab,
    setSelectedProductId,
    products,
    receipts,
    deliveryOrders,
    damageRecords,
    currentUser,
    switchUserRole,
  } = useInventory();

  // Compute live badges
  const pendingReceiptsCount = receipts.filter((r) => r.status !== 'done' && r.status !== 'cancelled').length;
  const pendingDeliveriesCount = deliveryOrders.filter((d) => d.status !== 'done' && d.status !== 'cancelled').length;
  const lowStockCount = products.filter((p) => p.currentStock <= p.reorderPoint).length;
  const outputPendingCount = deliveryOrders.filter((d) => d.status === 'ready' || d.status === 'waiting').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? `${lowStockCount} alerts` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'today',
      label: "Today's Reports",
      icon: CalendarCheck,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: products.length.toString(),
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'receipts',
      label: 'Receipts / Incoming',
      icon: ArrowDownLeft,
      badge: pendingReceiptsCount > 0 ? pendingReceiptsCount.toString() : undefined,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'deliveries',
      label: 'Delivery Orders',
      icon: ArrowUpRight,
      badge: pendingDeliveriesCount > 0 ? pendingDeliveriesCount.toString() : undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'output_pending',
      label: 'Output Pending',
      icon: Clock,
      badge: outputPendingCount > 0 ? outputPendingCount.toString() : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'transfers',
      label: 'Internal Transfers',
      icon: ArrowLeftRight,
    },
    {
      id: 'damage',
      label: 'Damage Stock',
      icon: AlertOctagon,
      badge: damageRecords.length > 0 ? `${damageRecords.length}` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'adjustments',
      label: 'Inventory Adjustments',
      icon: SlidersHorizontal,
    },
    {
      id: 'ledger',
      label: 'Stock Ledger',
      icon: FileSpreadsheet,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setSelectedProductId(null);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-base font-extrabold text-white tracking-tight leading-none block">
                  Stock<span className="text-blue-400">Sense</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Intelligent IMS
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white items-center justify-center transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-110'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Role Area */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 space-y-2">
          {!collapsed ? (
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    {currentUser.role === 'manager' ? (
                      <ShieldCheck className="w-3 h-3 text-indigo-400 inline" />
                    ) : (
                      <UserCheck className="w-3 h-3 text-emerald-400 inline" />
                    )}
                    <span className="capitalize">{currentUser.role}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  switchUserRole(currentUser.role === 'manager' ? 'staff' : 'manager')
                }
                title="Toggle role"
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold px-1.5 py-1 bg-blue-950/60 rounded-md border border-blue-800/50 hover:bg-blue-900/60 transition-colors"
              >
                Switch
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
              />
            </div>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl text-xs font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
