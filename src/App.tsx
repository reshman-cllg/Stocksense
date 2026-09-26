import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TodayReportsView } from './components/today/TodayReportsView';
import { ProductsView } from './components/products/ProductsView';
import { ReceiptsView } from './components/receipts/ReceiptsView';
import { DeliveriesView } from './components/deliveries/DeliveriesView';
import { OutputPendingView } from './components/deliveries/OutputPendingView';
import { TransfersView } from './components/transfers/TransfersView';
import { DamageView } from './components/damage/DamageView';
import { AdjustmentsView } from './components/adjustments/AdjustmentsView';
import { StockLedgerView } from './components/ledger/StockLedgerView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { BarcodeScannerModal } from './components/scanner/BarcodeScannerModal';
import { AuthModalOrView } from './components/auth/AuthModalOrView';
import { Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useInventory();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  if (!isAuthenticated) {
    return <AuthModalOrView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'today':
        return <TodayReportsView />;
      case 'products':
        return <ProductsView />;
      case 'receipts':
        return <ReceiptsView />;
      case 'deliveries':
        return <DeliveriesView />;
      case 'output_pending':
        return <OutputPendingView />;
      case 'transfers':
        return <TransfersView />;
      case 'damage':
        return <DamageView />;
      case 'adjustments':
        return <AdjustmentsView />;
      case 'ledger':
        return <StockLedgerView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <div className="relative flex items-center">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden ml-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <Navbar />
          </div>
        </div>

        {/* Viewport Content Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Barcode Scanner Modal */}
      <BarcodeScannerModal />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}
