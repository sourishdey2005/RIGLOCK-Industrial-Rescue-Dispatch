export type UserRole = 'buyer' | 'seller';

export type AuthView = 'register' | 'buyer-login' | 'seller-login';

export interface AuthAccount {
  id: string;
  role: UserRole;
  fullName: string;
  companyName: string;
  email: string;
  password: string;
  phone: string;
  gstin: string;
  siteOrDepotAddress: string;
  depotRegion?: string;
  createdAt: string;
}

export type ScreenTab =
  | 'triage'
  | 'buyer'
  | 'seller'
  | 'dispatch'
  | 'nodes'
  | 'ledger';

export type BuyerTab = 'products' | 'current' | 'past';

export type SellerTab =
  | 'inventory'
  | 'orders'
  | 'past_sales'
  | 'cancellations'
  | 'metrics'
  | 'create';

export type DispatchMode = 'emergency' | 'rental';

export type EquipmentCategory =
  | 'ALL'
  | 'POWER'
  | 'DEWATERING'
  | 'HYDRAULIC'
  | 'LIGHTING'
  | 'CUTTING'
  | 'AIR';

export type AvailabilityFlag = 'IN VEHICLE' | 'DEPOT READY';

export type MissionStatus =
  | 'VERIFIED'
  | 'LOADED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'ABORTED';

export interface TechSpec {
  label: string;
  value: string;
}

export interface EquipmentItem {
  id: string;
  sku: string;
  name: string;
  category: Exclude<EquipmentCategory, 'ALL'>;
  image: string;
  conditionRating: 'GRADE-A1' | 'GRADE-A2';
  availabilityFlag: AvailabilityFlag;
  emergencyHourlyRate: number;
  emergencyDispatchFee: number;
  rentalDailyRate: number;
  rentalWeeklyRate: number;
  purchasePrice: number;
  stockQty: number;
  sellerId: string;
  sellerName: string;
  depositAmount: number;
  depositTier: string;
  rating: number;
  lastPingSeconds: number;
  distanceMiles: number;
  etaMinutes: number;
  nodeId: string;
  nodeCallsign: string;
  courierName: string;
  courierPlate: string;
  weightLbs: number;
  primaryOutput: string;
  voltageOrPressure: string;
  inspectionDate: string;
  summary: string;
  specs: TechSpec[];
  checklist: string[];
}

export interface DepotNode {
  id: string;
  callsign: string;
  region: string;
  status: 'LIVE NODE' | 'IN VEHICLE';
  coordinates: string;
  mapX: number;
  mapY: number;
  distanceMiles: number;
  rating: number;
  lastPingSeconds: number;
  activeUnits: number;
  slaMinutes: number;
  vehicleType: string;
  depositTier: string;
  sellerId: string;
  leadTech: string;
}

export interface MissionLogEntry {
  id: string;
  timestamp: string;
  source: 'SYSTEM' | 'COURIER' | 'SITE';
  message: string;
}

export interface DispatchMission {
  id: string;
  missionCode: string;
  buyerId: string;
  buyerName: string;
  equipment: EquipmentItem;
  mode: DispatchMode;
  dropZoneAddress: string;
  siteContact: string;
  siteCoordinates: string;
  priorityOverride: boolean;
  etaTotalSeconds: number;
  remainingSeconds: number;
  status: MissionStatus;
  handoffPin: string;
  courierName: string;
  courierPlate: string;
  startedAt: string;
  totalCost: number;
  rentalDays: number;
  cancellationReason?: string;
  logs: MissionLogEntry[];
}

export type BuyerOrderStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED_FOR_RELEASE'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED_BY_BUYER'
  | 'CANCELLED_BY_SELLER';

export interface BuyerOrderItem {
  equipmentId: string;
  sku: string;
  name: string;
  sellerId: string;
  sellerName: string;
  qty: number;
  unitPrice: number;
}

export type PaymentMethodType = 'ESCROW_INR' | 'NET_30_PO' | 'ON_SITE_COD';

export interface SavedSiteAddress {
  id: string;
  label: string;
  recipientName: string;
  contactPhone: string;
  addressLine: string;
  cityState: string;
  postalCode: string;
  gateNotes?: string;
}

export interface BuyerOrder {
  id: string;
  poNumber: string;
  buyerId: string;
  buyerCompany: string;
  gstin: string;
  deliveryAddress: string;
  contactName?: string;
  contactPhone?: string;
  postalCode?: string;
  paymentMethod?: PaymentMethodType;
  deliveryNotes?: string;
  deliveryTier: 'FREIGHT' | 'ER_DROP' | 'PICKUP';
  deliveryFee: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  status: BuyerOrderStatus;
  createdAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: 'BUYER' | 'SELLER';
  items: BuyerOrderItem[];
}
