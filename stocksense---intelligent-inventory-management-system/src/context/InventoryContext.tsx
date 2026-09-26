import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Warehouse,
  Location,
  Product,
  Receipt,
  DeliveryOrder,
  InternalTransfer,
  DamageRecord,
  InventoryAdjustment,
  StockLedgerEntry,
  NotificationItem,
  StockMovementPoint,
  UserRole,
} from '../types/inventory';
import {
  INITIAL_WAREHOUSES,
  INITIAL_PRODUCTS,
  INITIAL_RECEIPTS,
  INITIAL_DELIVERY_ORDERS,
  INITIAL_TRANSFERS,
  INITIAL_DAMAGE_RECORDS,
  INITIAL_ADJUSTMENTS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';

export type DemandMatchStatus = 'fully_covered' | 'partially_covered' | 'not_covered' | 'overstock_risk';

export interface DemandAnalysisResult {
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  incomingPending: number;
  outgoingPending: number;
  expectedDemand: number;
  coverageRatio: number;
  coveragePercent: number;
  matchStatus: DemandMatchStatus;
  statusLabel: string;
  explanation: string;
  insight: string;
  reorderAlert: boolean;
}

export interface DamageRootCause {
  topReasonKey: string;
  topReasonLabel: string;
  topReasonCount: number;
  topReasonUnits: number;
  topLocationName: string;
  topWarehouseName: string;
  repeatedIncidents: { locationName: string; count: number; units: number; reason: string }[];
  evidenceText: string;
}

interface InventoryContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  warehouses: Warehouse[];
  products: Product[];
  receipts: Receipt[];
  deliveryOrders: DeliveryOrder[];
  transfers: InternalTransfer[];
  damageRecords: DamageRecord[];
  adjustments: InventoryAdjustment[];
  ledger: StockLedgerEntry[];
  notifications: NotificationItem[];
  
  // Navigation & selection
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Actions
  createProduct: (product: Omit<Product, 'id' | 'status' | 'damagedUnits' | 'lastUpdated'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  createReceipt: (data: Omit<Receipt, 'id' | 'number'>) => Receipt;
  validateReceipt: (id: string) => boolean;
  
  createDeliveryOrder: (data: Omit<DeliveryOrder, 'id' | 'number'>) => DeliveryOrder;
  validateDelivery: (id: string) => boolean;
  
  createInternalTransfer: (data: Omit<InternalTransfer, 'id' | 'number'>) => InternalTransfer;
  validateInternalTransfer: (id: string) => boolean;
  
  recordDamage: (data: Omit<DamageRecord, 'id' | 'number'>) => DamageRecord;
  
  performAdjustment: (data: Omit<InventoryAdjustment, 'id' | 'number' | 'differenceQty'>) => InventoryAdjustment;
  
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'locations'>) => Warehouse;
  addLocation: (warehouseId: string, location: Omit<Location, 'id' | 'warehouseId'>) => Location;
  
  switchUserRole: (role: UserRole) => void;
  resetDemoData: () => void;
  
  // Analytical helpers
  get30DayMovement: (productId: string) => StockMovementPoint[];
  getDemandAnalysis: (productId: string) => DemandAnalysisResult;
  getDamageRootCause: (productId?: string) => DamageRootCause;
  getTodaySummary: () => {
    receivedUnits: number;
    dispatchedUnits: number;
    damagedUnits: number;
    transfersCount: number;
    adjustmentsCount: number;
    reorderLevelBreaches: number;
    pendingReceiptsCount: number;
    pendingDeliveriesCount: number;
  };
  getLowStockAlerts: () => {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    reorderPoint: number;
    level: 'critical' | 'warning' | 'out';
    message: string;
    recommendedAction: string;
  }[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_PREFIX = 'stocksense_data_v2_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

const DEFAULT_USER: User = {
  id: 'usr-1',
  name: 'David Vance',
  email: 'd.vance@stocksense.logistics',
  role: 'manager',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  warehouseId: 'wh-main',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => loadFromStorage('currentUser', DEFAULT_USER));
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadFromStorage('warehouses', INITIAL_WAREHOUSES));
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('products', INITIAL_PRODUCTS));
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadFromStorage('receipts', INITIAL_RECEIPTS));
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(() => loadFromStorage('deliveryOrders', INITIAL_DELIVERY_ORDERS));
  const [transfers, setTransfers] = useState<InternalTransfer[]>(() => loadFromStorage('transfers', INITIAL_TRANSFERS));
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>(() => loadFromStorage('damageRecords', INITIAL_DAMAGE_RECORDS));
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>(() => loadFromStorage('adjustments', INITIAL_ADJUSTMENTS));
  const [ledger, setLedger] = useState<StockLedgerEntry[]>(() => loadFromStorage('ledger', INITIAL_LEDGER_ENTRIES));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadFromStorage('notifications', INITIAL_NOTIFICATIONS));

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Save changes to storage
  useEffect(() => { saveToStorage('currentUser', currentUser); }, [currentUser]);
  useEffect(() => { saveToStorage('warehouses', warehouses); }, [warehouses]);
  useEffect(() => { saveToStorage('products', products); }, [products]);
  useEffect(() => { saveToStorage('receipts', receipts); }, [receipts]);
  useEffect(() => { saveToStorage('deliveryOrders', deliveryOrders); }, [deliveryOrders]);
  useEffect(() => { saveToStorage('transfers', transfers); }, [transfers]);
  useEffect(() => { saveToStorage('damageRecords', damageRecords); }, [damageRecords]);
  useEffect(() => { saveToStorage('adjustments', adjustments); }, [adjustments]);
  useEffect(() => { saveToStorage('ledger', ledger); }, [ledger]);
  useEffect(() => { saveToStorage('notifications', notifications); }, [notifications]);

  // Status calculator for product
  const computeProductStatus = (current: number, reorder: number, target: number): Product['status'] => {
    if (current <= 0) return 'out_of_stock';
    if (current <= reorder) return 'low_stock';
    if (current > target * 1.25) return 'overstocked';
    return 'in_stock';
  };

  const addLedgerEntry = (entry: Omit<StockLedgerEntry, 'id' | 'timestamp'>) => {
    const newEntry: StockLedgerEntry = {
      ...entry,
      id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setLedger((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const createNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Product management
  const createProduct = (productData: Omit<Product, 'id' | 'status' | 'damagedUnits' | 'lastUpdated'>) => {
    const id = `prod-${Date.now()}`;
    const status = computeProductStatus(productData.currentStock, productData.reorderPoint, productData.targetStock);
    const newProduct: Product = {
      ...productData,
      id,
      status,
      damagedUnits: 0,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Initial stock ledger if initial stock > 0
    if (productData.initialStock > 0) {
      addLedgerEntry({
        productId: id,
        productName: newProduct.name,
        sku: newProduct.sku,
        transactionType: 'adjustment',
        referenceNumber: `INIT-${newProduct.sku}`,
        source: 'Initial Opening Inventory',
        destination: 'Master Warehouse',
        quantity: productData.initialStock,
        beforeStock: 0,
        afterStock: productData.currentStock,
        user: currentUser.name,
        warehouseId: 'wh-main',
        locationId: 'loc-mw-a1',
        reason: 'Initial catalog creation',
      });
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const currentStock = updates.currentStock !== undefined ? updates.currentStock : p.currentStock;
        const reorderPoint = updates.reorderPoint !== undefined ? updates.reorderPoint : p.reorderPoint;
        const targetStock = updates.targetStock !== undefined ? updates.targetStock : p.targetStock;
        const status = computeProductStatus(currentStock, reorderPoint, targetStock);
        return {
          ...p,
          ...updates,
          status,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Receipts / Incoming Stock
  const createReceipt = (data: Omit<Receipt, 'id' | 'number'>) => {
    const seq = receipts.length + 1;
    const number = `REC-2026-${String(seq).padStart(3, '0')}`;
    const newReceipt: Receipt = {
      ...data,
      id: `rec-${Date.now()}`,
      number,
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    return newReceipt;
  };

  const validateReceipt = (id: string): boolean => {
    const target = receipts.find((r) => r.id === id);
    if (!target || target.status === 'done') return false;

    // Update each product's stock & location
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const item = target.items.find((i) => i.productId === prod.id);
        if (!item) return prod;

        const qtyToAdd = item.receivedQty || item.expectedQty;
        const newTotal = prod.currentStock + qtyToAdd;
        const currentLocQty = prod.stockByLocation[target.locationId] || 0;
        const updatedLocationStock = {
          ...prod.stockByLocation,
          [target.locationId]: currentLocQty + qtyToAdd,
        };

        const newIncoming = Math.max(0, prod.incomingPending - (item.expectedQty || qtyToAdd));
        const status = computeProductStatus(newTotal, prod.reorderPoint, prod.targetStock);

        // Add ledger entry
        addLedgerEntry({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          transactionType: 'receipt',
          referenceNumber: target.number,
          source: target.supplier,
          destination: `Warehouse Location (${target.locationId})`,
          quantity: qtyToAdd,
          beforeStock: prod.currentStock,
          afterStock: newTotal,
          user: currentUser.name,
          warehouseId: target.warehouseId,
          locationId: target.locationId,
          reason: `Receipt ${target.number} validated`,
        });

        return {
          ...prod,
          currentStock: newTotal,
          stockByLocation: updatedLocationStock,
          incomingPending: newIncoming,
          status,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );

    // Update receipt status
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'done',
              receivedDate: new Date().toISOString().substring(0, 10),
            }
          : r
      )
    );

    createNotification({
      type: 'pending_receipt',
      title: 'Receipt Validated',
      message: `Receipt ${target.number} has been validated and stock added to inventory.`,
      severity: 'success',
    });

    return true;
  };

  // Delivery Orders / Outgoing Stock
  const createDeliveryOrder = (data: Omit<DeliveryOrder, 'id' | 'number'>) => {
    const seq = deliveryOrders.length + 1;
    const number = `DEL-2026-${String(seq).padStart(3, '0')}`;
    const newDelivery: DeliveryOrder = {
      ...data,
      id: `del-${Date.now()}`,
      number,
    };
    setDeliveryOrders((prev) => [newDelivery, ...prev]);
    return newDelivery;
  };

  const validateDelivery = (id: string): boolean => {
    const target = deliveryOrders.find((d) => d.id === id);
    if (!target || target.status === 'done') return false;

    // Check availability
    let hasShortage = false;
    for (const item of target.items) {
      const prod = products.find((p) => p.id === item.productId);
      const neededQty = item.pickedQty || item.orderedQty;
      if (!prod || prod.currentStock < neededQty) {
        hasShortage = true;
        break;
      }
    }

    if (hasShortage) {
      createNotification({
        type: 'critical',
        title: 'Delivery Shortage Warning',
        message: `Delivery ${target.number} could not be fully dispatched due to insufficient available stock.`,
        severity: 'critical',
      });
    }

    // Deduct stock
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const item = target.items.find((i) => i.productId === prod.id);
        if (!item) return prod;

        const qtyToReduce = item.pickedQty || item.orderedQty;
        const newTotal = Math.max(0, prod.currentStock - qtyToReduce);
        const currentLocQty = prod.stockByLocation[target.locationId] || 0;
        const updatedLocationStock = {
          ...prod.stockByLocation,
          [target.locationId]: Math.max(0, currentLocQty - qtyToReduce),
        };

        const newOutgoing = Math.max(0, prod.outgoingPending - (item.orderedQty || qtyToReduce));
        const status = computeProductStatus(newTotal, prod.reorderPoint, prod.targetStock);

        addLedgerEntry({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          transactionType: 'delivery',
          referenceNumber: target.number,
          source: `Warehouse Location (${target.locationId})`,
          destination: target.customer,
          quantity: -qtyToReduce,
          beforeStock: prod.currentStock,
          afterStock: newTotal,
          user: currentUser.name,
          warehouseId: target.warehouseId,
          locationId: target.locationId,
          reason: `Delivery ${target.number} fulfilled for ${target.customer}`,
        });

        // Trigger alert if low stock breached
        if (newTotal <= prod.reorderPoint) {
          createNotification({
            type: newTotal <= 0 ? 'out_of_stock' : 'low_stock',
            title: newTotal <= 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
            message: `${prod.name} has only ${newTotal} ${prod.unit} remaining after delivery ${target.number}. Reorder level is ${prod.reorderPoint}.`,
            productId: prod.id,
            severity: newTotal <= 0 ? 'critical' : 'warning',
          });
        }

        return {
          ...prod,
          currentStock: newTotal,
          stockByLocation: updatedLocationStock,
          outgoingPending: newOutgoing,
          status,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );

    setDeliveryOrders((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'done',
              dispatchedDate: new Date().toISOString().substring(0, 10),
            }
          : d
      )
    );

    createNotification({
      type: 'pending_delivery',
      title: 'Delivery Order Completed',
      message: `Delivery ${target.number} dispatched to ${target.customer}. Stock reduced and ledger updated.`,
      severity: 'success',
    });

    return true;
  };

  // Internal Transfers (Total company stock invariant!)
  const createInternalTransfer = (data: Omit<InternalTransfer, 'id' | 'number'>) => {
    const seq = transfers.length + 1;
    const number = `TRF-2026-${String(seq).padStart(3, '0')}`;
    const newTransfer: InternalTransfer = {
      ...data,
      id: `trf-${Date.now()}`,
      number,
    };
    setTransfers((prev) => [newTransfer, ...prev]);
    return newTransfer;
  };

  const validateInternalTransfer = (id: string): boolean => {
    const target = transfers.find((t) => t.id === id);
    if (!target || target.status === 'done') return false;

    const prod = products.find((p) => p.id === target.productId);
    if (!prod) return false;

    const sourceQty = prod.stockByLocation[target.sourceLocationId] || 0;
    if (sourceQty < target.quantity) {
      createNotification({
        type: 'critical',
        title: 'Transfer Failed: Insufficient Stock at Source',
        message: `Only ${sourceQty} ${prod.unit} available at source location. Cannot transfer ${target.quantity}.`,
        severity: 'critical',
      });
      return false;
    }

    // Update locations only; total stock remains unchanged!
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== target.productId) return p;

        const curSource = p.stockByLocation[target.sourceLocationId] || 0;
        const curDest = p.stockByLocation[target.destLocationId] || 0;

        const updatedLocations = {
          ...p.stockByLocation,
          [target.sourceLocationId]: Math.max(0, curSource - target.quantity),
          [target.destLocationId]: curDest + target.quantity,
        };

        addLedgerEntry({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          transactionType: 'internal_transfer',
          referenceNumber: target.number,
          source: `Location ${target.sourceLocationId}`,
          destination: `Location ${target.destLocationId}`,
          quantity: target.quantity,
          beforeStock: p.currentStock,
          afterStock: p.currentStock, // Invariant!
          user: currentUser.name,
          warehouseId: target.sourceWarehouseId,
          locationId: target.sourceLocationId,
          reason: target.notes || 'Internal stock relocation',
        });

        return {
          ...p,
          stockByLocation: updatedLocations,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );

    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'done' } : t))
    );

    createNotification({
      type: 'transfer',
      title: 'Internal Transfer Completed',
      message: `Transferred ${target.quantity} units of ${prod.name} successfully. Company stock invariant maintained.`,
      severity: 'info',
    });

    return true;
  };

  // Damage Stock Module
  const recordDamage = (data: Omit<DamageRecord, 'id' | 'number'>) => {
    const seq = damageRecords.length + 1;
    const number = `DMG-2026-${String(seq).padStart(3, '0')}`;
    const newRecord: DamageRecord = {
      ...data,
      id: `dmg-${Date.now()}`,
      number,
    };

    setDamageRecords((prev) => [newRecord, ...prev]);

    // Reduce stock from location and total, increase damagedUnits count
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== data.productId) return p;

        const newTotal = Math.max(0, p.currentStock - data.quantity);
        const curLocQty = p.stockByLocation[data.locationId] || 0;
        const newLocQty = Math.max(0, curLocQty - data.quantity);

        const status = computeProductStatus(newTotal, p.reorderPoint, p.targetStock);

        addLedgerEntry({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          transactionType: 'damage',
          referenceNumber: number,
          source: `Location (${data.locationId})`,
          destination: 'Scrap & Damage Loss',
          quantity: -data.quantity,
          beforeStock: p.currentStock,
          afterStock: newTotal,
          user: data.reportedBy || currentUser.name,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          reason: `Damage recorded: ${data.reason} - ${data.notes}`,
        });

        return {
          ...p,
          currentStock: newTotal,
          damagedUnits: p.damagedUnits + data.quantity,
          stockByLocation: {
            ...p.stockByLocation,
            [data.locationId]: newLocQty,
          },
          status,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );

    // Check for repeated damage in the same location
    const priorInSameLoc = damageRecords.filter((d) => d.locationId === data.locationId);
    if (priorInSameLoc.length >= 1) {
      createNotification({
        type: 'repeated_damage',
        title: 'Repeated Damage Hotspot Warning',
        message: `Multiple damage incidents detected at location ${data.locationId}. Total occurrences: ${priorInSameLoc.length + 1}.`,
        severity: 'warning',
      });
    } else {
      createNotification({
        type: 'damage_alert',
        title: 'Damaged Stock Recorded',
        message: `${data.quantity} units written off as damaged due to ${data.reason.replace(/_/g, ' ')}.`,
        severity: 'warning',
      });
    }

    return newRecord;
  };

  // Inventory Adjustments
  const performAdjustment = (data: Omit<InventoryAdjustment, 'id' | 'number' | 'differenceQty'>) => {
    const diff = data.physicalQty - data.recordedQty;
    const seq = adjustments.length + 1;
    const number = `ADJ-2026-${String(seq).padStart(3, '0')}`;

    const newAdj: InventoryAdjustment = {
      ...data,
      id: `adj-${Date.now()}`,
      number,
      differenceQty: diff,
    };

    setAdjustments((prev) => [newAdj, ...prev]);

    // Apply difference to product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== data.productId) return p;

        const newTotal = Math.max(0, p.currentStock + diff);
        const updatedLocations = {
          ...p.stockByLocation,
          [data.locationId]: data.physicalQty,
        };

        const status = computeProductStatus(newTotal, p.reorderPoint, p.targetStock);

        addLedgerEntry({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          transactionType: 'adjustment',
          referenceNumber: number,
          source: 'Physical Cycle Count Audit',
          destination: `Location (${data.locationId})`,
          quantity: diff,
          beforeStock: p.currentStock,
          afterStock: newTotal,
          user: data.adjustedBy || currentUser.name,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          reason: `Count reconciliation: ${data.reason}`,
        });

        return {
          ...p,
          currentStock: newTotal,
          stockByLocation: updatedLocations,
          status,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );

    createNotification({
      type: 'adjustment',
      title: 'Stock Adjustment Applied',
      message: `Adjustment ${number} applied. Difference: ${diff >= 0 ? `+${diff}` : diff} units.`,
      severity: 'info',
    });

    return newAdj;
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Settings: Add warehouse & location
  const addWarehouse = (data: Omit<Warehouse, 'id' | 'locations'>) => {
    const id = `wh-${Date.now()}`;
    const newWh: Warehouse = {
      ...data,
      id,
      locations: [
        { id: `loc-${id}-main`, warehouseId: id, name: 'Default Rack 1', code: `${data.code}-R1`, type: 'rack' },
      ],
    };
    setWarehouses((prev) => [...prev, newWh]);
    return newWh;
  };

  const addLocation = (warehouseId: string, locationData: Omit<Location, 'id' | 'warehouseId'>) => {
    const id = `loc-${Date.now()}`;
    const newLoc: Location = {
      ...locationData,
      id,
      warehouseId,
    };
    setWarehouses((prev) =>
      prev.map((wh) => (wh.id === warehouseId ? { ...wh, locations: [...wh.locations, newLoc] } : wh))
    );
    return newLoc;
  };

  const switchUserRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      name: role === 'manager' ? 'David Vance' : 'Marcus Chen',
      email: role === 'manager' ? 'd.vance@stocksense.logistics' : 'm.chen@stocksense.logistics',
    }));
  };

  const resetDemoData = () => {
    localStorage.clear();
    setWarehouses(INITIAL_WAREHOUSES);
    setProducts(INITIAL_PRODUCTS);
    setReceipts(INITIAL_RECEIPTS);
    setDeliveryOrders(INITIAL_DELIVERY_ORDERS);
    setTransfers(INITIAL_TRANSFERS);
    setDamageRecords(INITIAL_DAMAGE_RECORDS);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setLedger(INITIAL_LEDGER_ENTRIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(DEFAULT_USER);
    setSelectedWarehouseId('all');
    setSelectedProductId(null);
  };

  // 30-day stock movement calculation
  const get30DayMovement = (productId: string): StockMovementPoint[] => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return [];

    const days: StockMovementPoint[] = [];
    const now = new Date('2026-09-26');

    // Aggregate transactions by date
    const prodLedger = ledger.filter((l) => l.productId === productId);

    let runningStock = Math.max(5, prod.currentStock);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);

      // Find ledger events on this date
      const dayEntries = prodLedger.filter((l) => l.timestamp.startsWith(dateStr));
      let dayInput = 0;
      let dayOutput = 0;
      let dayDamage = 0;

      for (const entry of dayEntries) {
        if (entry.transactionType === 'receipt') dayInput += entry.quantity;
        if (entry.transactionType === 'delivery') dayOutput += Math.abs(entry.quantity);
        if (entry.transactionType === 'damage') dayDamage += Math.abs(entry.quantity);
      }

      // If no explicit ledger events for historical days, simulate a consistent baseline
      if (dayEntries.length === 0) {
        const seedVal = (i * 7 + (prod.name.length * 3)) % 11;
        if (seedVal > 7) {
          dayOutput = Math.max(1, Math.round(prod.avgDailyOutput * (0.8 + (seedVal % 5) * 0.1)));
        }
        if (i === 14 || i === 28) {
          dayInput = Math.round(prod.targetStock * 0.4);
        }
      }

      const dayDemand = Math.round(prod.avgDailyOutput * (0.9 + (i % 4) * 0.15) + (i % 3));
      runningStock = Math.max(0, runningStock + dayInput - dayOutput - dayDamage);

      days.push({
        date: dateStr,
        input: dayInput,
        output: dayOutput,
        damage: dayDamage,
        demand: dayDemand,
        stockBalance: runningStock,
      });
    }

    // Normalize final day's stock balance to match actual currentStock
    if (days.length > 0) {
      days[days.length - 1].stockBalance = prod.currentStock;
    }

    return days;
  };

  // Demand Analysis and Requirement Matching
  const getDemandAnalysis = (productId: string): DemandAnalysisResult => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      return {
        currentStock: 0,
        availableStock: 0,
        reservedStock: 0,
        incomingPending: 0,
        outgoingPending: 0,
        expectedDemand: 0,
        coverageRatio: 0,
        coveragePercent: 0,
        matchStatus: 'not_covered',
        statusLabel: 'No Data',
        explanation: 'Product not found.',
        insight: 'No data',
        reorderAlert: false,
      };
    }

    const availableStock = Math.max(0, prod.currentStock - prod.outgoingPending);
    const supplyPotential = prod.currentStock + prod.incomingPending;
    const demandRequirement = Math.max(1, prod.demandProjected + prod.outgoingPending);
    const coverageRatio = supplyPotential / demandRequirement;
    const coveragePercent = Math.min(250, Math.round(coverageRatio * 100));

    let matchStatus: DemandMatchStatus = 'fully_covered';
    let statusLabel = 'Demand Fully Covered';
    let explanation = 'Current inventory plus expected incoming stock is sufficient to meet projected demand.';
    let insight = 'Stock velocity matches current dispatch expectations.';

    if (coverageRatio >= 1.5) {
      matchStatus = 'overstock_risk';
      statusLabel = 'Overstock Risk';
      explanation = `Current stock (${prod.currentStock}) plus incoming (${prod.incomingPending}) significantly exceeds expected demand (${prod.demandProjected}). Consider pausing further replenishment.`;
      insight = 'Holding costs may increase if buffer exceeds 150% of monthly demand.';
    } else if (coverageRatio >= 1.0) {
      matchStatus = 'fully_covered';
      statusLabel = 'Demand Fully Covered';
      explanation = `Current inventory (${prod.currentStock}) plus incoming orders (${prod.incomingPending}) satisfies expected demand (${demandRequirement}).`;
      insight = 'Inventory health is balanced. Standard dispatch buffer maintained.';
    } else if (coverageRatio >= 0.65) {
      matchStatus = 'partially_covered';
      statusLabel = 'Demand Partially Covered';
      explanation = `Projected demand (${demandRequirement}) exceeds available supply (${supplyPotential}) by ${demandRequirement - supplyPotential} units. Additional replenishment PO recommended.`;
      insight = 'Incoming deliveries must arrive on schedule to prevent line shortages.';
    } else {
      matchStatus = 'not_covered';
      statusLabel = 'Demand Not Covered';
      explanation = `Critical supply shortage! Available stock and incoming orders cannot fulfill upcoming demand. Expedited PO required immediately.`;
      insight = 'High stockout probability within next 5 to 7 operational days.';
    }

    return {
      currentStock: prod.currentStock,
      availableStock,
      reservedStock: prod.outgoingPending,
      incomingPending: prod.incomingPending,
      outgoingPending: prod.outgoingPending,
      expectedDemand: prod.demandProjected,
      coverageRatio: Number(coverageRatio.toFixed(2)),
      coveragePercent,
      matchStatus,
      statusLabel,
      explanation,
      insight,
      reorderAlert: prod.currentStock <= prod.reorderPoint,
    };
  };

  // "Why is damage happening?" root cause analytics
  const getDamageRootCause = (productId?: string): DamageRootCause => {
    const records = productId
      ? damageRecords.filter((d) => d.productId === productId)
      : damageRecords;

    if (records.length === 0) {
      return {
        topReasonKey: 'none',
        topReasonLabel: 'No Recorded Damage',
        topReasonCount: 0,
        topReasonUnits: 0,
        topLocationName: 'None',
        topWarehouseName: 'None',
        repeatedIncidents: [],
        evidenceText: 'No damage events logged in the selected window.',
      };
    }

    const reasonUnits: Record<string, { count: number; units: number }> = {};
    const locUnits: Record<string, { count: number; units: number }> = {};

    records.forEach((r) => {
      if (!reasonUnits[r.reason]) reasonUnits[r.reason] = { count: 0, units: 0 };
      reasonUnits[r.reason].count += 1;
      reasonUnits[r.reason].units += r.quantity;

      if (!locUnits[r.locationId]) locUnits[r.locationId] = { count: 0, units: 0 };
      locUnits[r.locationId].count += 1;
      locUnits[r.locationId].units += r.quantity;
    });

    let topReasonKey = '';
    let topReasonMaxUnits = -1;
    for (const [key, val] of Object.entries(reasonUnits)) {
      if (val.units > topReasonMaxUnits) {
        topReasonMaxUnits = val.units;
        topReasonKey = key;
      }
    }

    let topLocKey = '';
    let topLocMaxUnits = -1;
    for (const [key, val] of Object.entries(locUnits)) {
      if (val.units > topLocMaxUnits) {
        topLocMaxUnits = val.units;
        topLocKey = key;
      }
    }

    // Resolve location & warehouse name
    let topLocName = topLocKey;
    let topWhName = 'Unknown Warehouse';
    warehouses.forEach((wh) => {
      const found = wh.locations.find((l) => l.id === topLocKey);
      if (found) {
        topLocName = found.name;
        topWhName = wh.name;
      }
    });

    const formatReason = (key: string) => {
      switch (key) {
        case 'moisture_water': return 'Water / Moisture Ingress';
        case 'handling_damage': return 'Improper Handling / Forklift Impact';
        case 'physical_damage': return 'Physical Impact / Dropping';
        case 'packaging_failure': return 'Packaging / Strapping Failure';
        case 'storage_issue': return 'Storage & Overstacking Issue';
        default: return key.replace(/_/g, ' ');
      }
    };

    // Find repeated locations
    const repeated = Object.entries(locUnits)
      .filter(([_, data]) => data.count >= 2)
      .map(([locId, data]) => {
        let name = locId;
        warehouses.forEach((w) => {
          const l = w.locations.find((x) => x.id === locId);
          if (l) name = `${w.code} - ${l.name}`;
        });
        return {
          locationName: name,
          count: data.count,
          units: data.units,
          reason: formatReason(topReasonKey),
        };
      });

    // Evidence narrative based purely on recorded data
    let evidenceText = `${formatReason(topReasonKey)} accounts for ${topReasonMaxUnits} damaged units across ${records.length} incidents. `;
    if (topLocKey) {
      evidenceText += `Hotspot location "${topLocName}" in ${topWhName} registered ${locUnits[topLocKey]?.count || 0} incidents. `;
      if (topReasonKey === 'moisture_water') {
        evidenceText += `Inspection logs indicate recurrent condensation and perimeter humidity near Rack B. Repairing roof seals will protect future batches.`;
      } else if (topReasonKey === 'handling_damage') {
        evidenceText += `Operator incident reports attribute damages to forklift mast collisions and tight pallet clearances.`;
      }
    }

    return {
      topReasonKey,
      topReasonLabel: formatReason(topReasonKey),
      topReasonCount: reasonUnits[topReasonKey]?.count || 0,
      topReasonUnits: topReasonMaxUnits,
      topLocationName: topLocName,
      topWarehouseName: topWhName,
      repeatedIncidents: repeated,
      evidenceText,
    };
  };

  // Today's summary
  const getTodaySummary = () => {
    const todayStr = '2026-09-26'; // Application date
    const todayLedger = ledger.filter((l) => l.timestamp.startsWith(todayStr));

    let receivedUnits = 0;
    let dispatchedUnits = 0;
    let damagedUnits = 0;

    todayLedger.forEach((entry) => {
      if (entry.transactionType === 'receipt') receivedUnits += entry.quantity;
      if (entry.transactionType === 'delivery') dispatchedUnits += Math.abs(entry.quantity);
      if (entry.transactionType === 'damage') damagedUnits += Math.abs(entry.quantity);
    });

    const transfersCount = transfers.filter((t) => t.date === todayStr).length;
    const adjustmentsCount = adjustments.filter((a) => a.date === todayStr).length;
    const reorderLevelBreaches = products.filter((p) => p.currentStock <= p.reorderPoint).length;
    const pendingReceiptsCount = receipts.filter((r) => r.status === 'draft' || r.status === 'waiting' || r.status === 'ready').length;
    const pendingDeliveriesCount = deliveryOrders.filter((d) => d.status === 'draft' || d.status === 'waiting' || d.status === 'ready').length;

    return {
      receivedUnits,
      dispatchedUnits,
      damagedUnits,
      transfersCount,
      adjustmentsCount,
      reorderLevelBreaches,
      pendingReceiptsCount,
      pendingDeliveriesCount,
    };
  };

  // Intelligent actionable low-stock alerts
  const getLowStockAlerts = () => {
    const alerts: ReturnType<InventoryContextType['getLowStockAlerts']> = [];

    products.forEach((prod) => {
      if (prod.currentStock <= 0) {
        alerts.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          currentStock: 0,
          reorderPoint: prod.reorderPoint,
          level: 'out',
          message: `Out of Stock: ${prod.name} (${prod.sku}) currently has 0 available units. Pending customer backorders exist.`,
          recommendedAction: 'Expedite Purchase Receipt immediately or allocate safety buffer.',
        });
      } else if (prod.currentStock <= prod.reorderPoint * 0.5) {
        alerts.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          currentStock: prod.currentStock,
          reorderPoint: prod.reorderPoint,
          level: 'critical',
          message: `Critical Stock Alert: ${prod.name} has only ${prod.currentStock} ${prod.unit} remaining against a reorder point of ${prod.reorderPoint}.`,
          recommendedAction: 'Issue immediate replenishment order or execute internal warehouse transfer.',
        });
      } else if (prod.currentStock <= prod.reorderPoint) {
        alerts.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          currentStock: prod.currentStock,
          reorderPoint: prod.reorderPoint,
          level: 'warning',
          message: `Low Stock Alert: ${prod.name} has ${prod.currentStock} ${prod.unit} remaining. Reorder level is ${prod.reorderPoint} ${prod.unit}.`,
          recommendedAction: 'Validate awaiting receipts or place vendor purchase order.',
        });
      }
    });

    return alerts;
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        warehouses,
        products,
        receipts,
        deliveryOrders,
        transfers,
        damageRecords,
        adjustments,
        ledger,
        notifications,
        selectedWarehouseId,
        setSelectedWarehouseId,
        activeTab,
        setActiveTab,
        selectedProductId,
        setSelectedProductId,
        scannerOpen,
        setScannerOpen,
        searchQuery,
        setSearchQuery,
        createProduct,
        updateProduct,
        deleteProduct,
        createReceipt,
        validateReceipt,
        createDeliveryOrder,
        validateDelivery,
        createInternalTransfer,
        validateInternalTransfer,
        recordDamage,
        performAdjustment,
        markNotificationRead,
        dismissNotification,
        clearAllNotifications,
        addWarehouse,
        addLocation,
        switchUserRole,
        resetDemoData,
        get30DayMovement,
        getDemandAnalysis,
        getDamageRootCause,
        getTodaySummary,
        getLowStockAlerts,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
