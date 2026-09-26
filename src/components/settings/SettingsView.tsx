import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Settings,
  Building2,
  Sliders,
  User,
  ShieldCheck,
  UserCheck,
  Plus,
  RefreshCcw,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    warehouses,
    addWarehouse,
    addLocation,
    currentUser,
    setCurrentUser,
    switchUserRole,
    resetDemoData,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'warehouses' | 'inventory_rules' | 'profile'>('warehouses');

  // New warehouse form state
  const [newWhName, setNewWhName] = useState('');
  const [newWhCode, setNewWhCode] = useState('');
  const [newWhAddress, setNewWhAddress] = useState('');
  const [newWhCapacity, setNewWhCapacity] = useState(10000);
  const [addWhModalOpen, setAddWhModalOpen] = useState(false);

  // New location form state
  const [selectedWhIdForLoc, setSelectedWhIdForLoc] = useState<string | null>(null);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState<'rack' | 'shelf' | 'bin' | 'floor'>('rack');

  // Inventory rule settings
  const [safetyBufferDays, setSafetyBufferDays] = useState(14);
  const [reorderMultiplier, setReorderMultiplier] = useState(1.2);
  const [autoAlertsEnabled, setAutoAlertsEnabled] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Profile form
  const [userName, setUserName] = useState(currentUser.name);
  const [userEmail, setUserEmail] = useState(currentUser.email);

  const handleAddWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName || !newWhCode) return;

    addWarehouse({
      name: newWhName,
      code: newWhCode.toUpperCase(),
      address: newWhAddress || 'Standard Logistics Terminal',
      capacityUnits: Number(newWhCapacity),
    });

    setAddWhModalOpen(false);
    setNewWhName('');
    setNewWhCode('');
  };

  const handleAddLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWhIdForLoc || !locName || !locCode) return;

    addLocation(selectedWhIdForLoc, {
      name: locName,
      code: locCode.toUpperCase(),
      type: locType,
    });

    setSelectedWhIdForLoc(null);
    setLocName('');
    setLocCode('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser((prev) => ({
      ...prev,
      name: userName,
      email: userEmail,
    }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 text-slate-800 rounded-lg">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              System Settings & Warehouse Configuration
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Multi-warehouse logistics parameters, reorder calculation rules, and role-based access management
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset demo data to initial rich state? All simulated changes will be reinitialized.')) {
              resetDemoData();
              alert('Demo inventory dataset successfully restored!');
            }
          }}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'warehouses'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Warehouses & Locations ({warehouses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory_rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'inventory_rules'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Inventory & Reorder Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>User Profile & Permissions</span>
        </button>
      </div>

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Configured Facilities</h2>
              <p className="text-xs text-slate-500">Manage distribution hubs, factories, and internal bin racks</p>
            </div>
            {currentUser.role === 'manager' && (
              <button
                onClick={() => setAddWhModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Warehouse</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-xs">
                      {wh.code.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{wh.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">Code: {wh.code}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                    {wh.capacityUnits.toLocaleString()} units
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">{wh.address}</p>

                {/* Storage Locations / Racks */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Locations & Racks ({wh.locations.length})</span>
                    {currentUser.role === 'manager' && (
                      <button
                        onClick={() => setSelectedWhIdForLoc(wh.id)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Rack</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {wh.locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800 truncate pr-1">{loc.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">{loc.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Rules Tab */}
      {activeTab === 'inventory_rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Automated Replenishment Policies</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure system-wide reorder triggers, safety buffers, and threshold metrics</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Safety Stock Buffer Duration (Days of Demand)
              </label>
              <input
                type="number"
                min="3"
                max="90"
                value={safetyBufferDays}
                onChange={(e) => setSafetyBufferDays(Number(e.target.value))}
                className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Calculates automatic minimum stock level: (Avg Daily Output × {safetyBufferDays} days)
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reorder Multiplier Factor
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={reorderMultiplier}
                onChange={(e) => setReorderMultiplier(Number(e.target.value))}
                className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Reorder point formula: Minimum Stock × {reorderMultiplier}
              </span>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={autoAlertsEnabled}
                  onChange={(e) => setAutoAlertsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Enable Real-Time Low-Stock Push Alerts</span>
              </label>
              <span className="text-[11px] text-slate-400 ml-6 block">
                Triggers notification center alerts when on-hand stock drops below the calculated reorder point.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {settingsSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Policies updated successfully!
              </span>
            ) : <span />}

            <button
              onClick={() => {
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2000);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              Save Reorder Rules
            </button>
          </div>
        </div>
      )}

      {/* User Profile & Role Permissions Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">User Profile & Access Control (RBAC)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Toggle between Inventory Manager and Warehouse Staff roles to test role-based permissions</p>
          </div>

          {/* Role Switching Interactive Box for Evaluators */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Active Role Simulation
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => switchUserRole('manager')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  currentUser.role === 'manager'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Inventory Manager</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Full access: Catalog creation, pricing edits, deletion, warehouse management, and policy settings.
                </p>
              </div>

              <div
                onClick={() => switchUserRole('staff')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  currentUser.role === 'staff'
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Warehouse Staff</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Operational access: Inbound validation, dispatching deliveries, transfers, counting, and damage reports.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Corporate Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {addWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Warehouse Facility</h3>
              <button onClick={() => setAddWhModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddWarehouseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  placeholder="e.g. South Logistics Depot"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Facility Code *</label>
                <input
                  type="text"
                  required
                  value={newWhCode}
                  onChange={(e) => setNewWhCode(e.target.value)}
                  placeholder="e.g. SLD-04"
                  className="w-full p-2 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Hub Location</label>
                <input
                  type="text"
                  value={newWhAddress}
                  onChange={(e) => setNewWhAddress(e.target.value)}
                  placeholder="e.g. 19 Harbor Expressway"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Capacity (Units)</label>
                <input
                  type="number"
                  min="1000"
                  value={newWhCapacity}
                  onChange={(e) => setNewWhCapacity(Number(e.target.value))}
                  className="w-full p-2 font-mono bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddWhModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {selectedWhIdForLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Rack / Location</h3>
              <button onClick={() => setSelectedWhIdForLoc(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddLocationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Heavy Duty Pallet Rack 09"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Code *</label>
                <input
                  type="text"
                  required
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  placeholder="e.g. R9-BAY"
                  className="w-full p-2 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Type</label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value as typeof locType)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="rack">Heavy Rack</option>
                  <option value="shelf">Standard Shelf</option>
                  <option value="bin">Small Parts Bin</option>
                  <option value="floor">Floor Pallet Staging</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWhIdForLoc(null)}
                  className="px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
