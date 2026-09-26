export type UserRole = 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  warehouseId?: string;
}

export interface Location {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  type: 'rack' | 'shelf' | 'bin' | 'floor';
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  capacityUnits: number;
  locations: Location[];
}

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  supplier: string;
  unitCost: number;
  unitPrice: number;
  initialStock: number;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  targetStock: number;
  imageUrl: string;
  status: ProductStatus;
  stockByLocation: Record<string, number>; // locationId -> quantity
  demandProjected: number; // expected demand in upcoming period
  recentDemand: number; // demand in past 30 days
  avgDailyOutput: number;
  incomingPending: number;
  outgoingPending: number;
  damagedUnits: number;
  lastUpdated: string;
}

export type DocumentStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'cancelled';

export interface ReceiptItem {
  productId: string;
  expectedQty: number;
  receivedQty: number;
  unitCost: number;
}

export interface Receipt {
  id: string;
  number: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  warehouseId: string;
  locationId: string;
  status: DocumentStatus;
  items: ReceiptItem[];
  notes?: string;
  createdBy: string;
}

export interface DeliveryItem {
  productId: string;
  orderedQty: number;
  pickedQty: number;
  packedQty: number;
  unitPrice: number;
}

export interface DeliveryOrder {
  id: string;
  number: string;
  customer: string;
  orderDate: string;
  expectedDispatch: string;
  dispatchedDate?: string;
  warehouseId: string;
  locationId: string;
  status: DocumentStatus;
  items: DeliveryItem[];
  notes?: string;
  priority: 'normal' | 'high' | 'urgent';
  createdBy: string;
}

export interface InternalTransfer {
  id: string;
  number: string;
  sourceWarehouseId: string;
  sourceLocationId: string;
  destWarehouseId: string;
  destLocationId: string;
  productId: string;
  quantity: number;
  date: string;
  status: 'draft' | 'in_transit' | 'done' | 'cancelled';
  createdBy: string;
  notes?: string;
}

export type DamageReason =
  | 'physical_damage'
  | 'handling_damage'
  | 'transportation_damage'
  | 'packaging_failure'
  | 'moisture_water'
  | 'expired_product'
  | 'manufacturing_defect'
  | 'storage_issue'
  | 'other';

export interface DamageRecord {
  id: string;
  number: string;
  productId: string;
  quantity: number;
  date: string;
  warehouseId: string;
  locationId: string;
  reportedBy: string;
  reason: DamageReason;
  customReason?: string;
  status: 'reported' | 'investigated' | 'written_off';
  notes: string;
}

export interface InventoryAdjustment {
  id: string;
  number: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  recordedQty: number;
  physicalQty: number;
  differenceQty: number;
  date: string;
  adjustedBy: string;
  reason: string;
  notes?: string;
}

export type TransactionType = 'receipt' | 'delivery' | 'internal_transfer' | 'adjustment' | 'damage';

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  transactionType: TransactionType;
  referenceNumber: string;
  source: string;
  destination: string;
  quantity: number; // positive or negative as applicable
  beforeStock: number;
  afterStock: number;
  user: string;
  warehouseId: string;
  locationId: string;
  reason?: string;
}

export interface NotificationItem {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'critical' | 'pending_delivery' | 'pending_receipt' | 'damage_alert' | 'repeated_damage' | 'adjustment' | 'transfer';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  productId?: string;
  orderId?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface StockMovementPoint {
  date: string;
  input: number;
  output: number;
  damage: number;
  demand: number;
  stockBalance: number;
}
