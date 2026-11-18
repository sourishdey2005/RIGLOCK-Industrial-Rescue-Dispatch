import {
  CheckSquare,
  FileText,
  MapPin,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {
  AuthAccount,
  BuyerOrder,
  BuyerOrderItem,
  BuyerTab,
  DispatchMission,
  EquipmentCategory,
  EquipmentItem,
  PaymentMethodType,
  SavedSiteAddress,
} from '../types/rescue';
import {formatRs} from '../utils/currency';
import {CheckoutDrawer} from './CheckoutDrawer';
import {TrustStack} from './TrustStack';

interface BuyerScreenProps {
  currentUser: AuthAccount;
  catalog: EquipmentItem[];
  myOrders: BuyerOrder[];
  myMissions: DispatchMission[];
  onPlaceOrder: (order: BuyerOrder) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onRentUnit: (item: EquipmentItem) => void;
  onOpenMission: (missionId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  requestedTab?: {tab: BuyerTab; seq: number} | null;
}

const CATEGORIES: EquipmentCategory[] = [
  'ALL',
  'POWER',
  'DEWATERING',
  'HYDRAULIC',
  'LIGHTING',
  'CUTTING',
  'AIR',
];

const DELIVERY_TIERS: {
  id: BuyerOrder['deliveryTier'];
  label: string;
  fee: number;
}[] = [
  {id: 'FREIGHT', label: 'SITE FREIGHT', fee: 4500},
  {id: 'ER_DROP', label: 'PRIORITY ER DROP', fee: 9500},
  {id: 'PICKUP', label: 'DEPOT PICKUP', fee: 0},
];

const CANCEL_REASONS = [
  'SITE SPECIFICATION CHANGED',
  'PROJECT SCHEDULE DEFERRED',
  'DUPLICATE REQUISITION ORDER',
  'REQUIRED FASTER DELIVERY WINDOW',
];

export function BuyerScreen({
  currentUser,
  catalog,
  myOrders,
  myMissions,
  onPlaceOrder,
  onCancelOrder,
  onRentUnit,
  onOpenMission,
  searchQuery: externalSearchQuery,
  onSearchChange,
  requestedTab,
}: BuyerScreenProps) {
  const [activeTab, setActiveTab] = useState<BuyerTab>('products');
  const [category, setCategory] = useState<EquipmentCategory>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<
    'ALL' | 'IN VEHICLE' | 'DEPOT READY'
  >('ALL');
  const [sortBy, setSortBy] = useState<
    'nearest' | 'price_asc' | 'price_desc' | 'stock'
  >('nearest');
  const [localSearch, setLocalSearch] = useState('');
  const searchQuery = externalSearchQuery ?? localSearch;
  const setSearchQuery = onSearchChange ?? setLocalSearch;

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab.tab);
    }
  }, [requestedTab]);
  const [cart, setCart] = useState<BuyerOrderItem[]>([]);
  const [deliveryTier, setDeliveryTier] =
    useState<BuyerOrder['deliveryTier']>('FREIGHT');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const defaultSiteAddress: SavedSiteAddress = {
    id: `addr-primary-${currentUser.id}`,
    label: 'PRIMARY REGISTERED SITE',
    recipientName: currentUser.fullName,
    contactPhone: currentUser.phone,
    addressLine: currentUser.siteOrDepotAddress,
    cityState: 'MAHARASHTRA, INDIA',
    postalCode: '400705',
  };

  const [savedAddresses, setSavedAddresses] = useState<SavedSiteAddress[]>(() => {
    try {
      const raw = window.localStorage.getItem(
        `riglock_addresses_${currentUser.id}`,
      );
      if (raw) {
        const parsed = JSON.parse(raw) as SavedSiteAddress[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback below
    }
    return [defaultSiteAddress];
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    () => savedAddresses[0]?.id || defaultSiteAddress.id,
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        `riglock_addresses_${currentUser.id}`,
        JSON.stringify(savedAddresses),
      );
    } catch {
      // ignore storage quota errors
    }
  }, [savedAddresses, currentUser.id]);

  const selectedAddress =
    savedAddresses.find((a) => a.id === selectedAddressId) ?? savedAddresses[0];

  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<BuyerOrder | null>(null);
  const [specModalItem, setSpecModalItem] = useState<EquipmentItem | null>(
    null,
  );
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Cancellation state for buyer's current orders
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);

  const currentOrders = useMemo(
    () =>
      myOrders.filter(
        (o) =>
          o.status === 'PENDING_APPROVAL' ||
          o.status === 'APPROVED_FOR_RELEASE' ||
          o.status === 'IN_TRANSIT',
      ),
    [myOrders],
  );

  const pastOrders = useMemo(
    () =>
      myOrders.filter(
        (o) =>
          o.status === 'DELIVERED' ||
          o.status === 'CANCELLED_BY_BUYER' ||
          o.status === 'CANCELLED_BY_SELLER',
      ),
    [myOrders],
  );

  const currentRentals = useMemo(
    () =>
      myMissions.filter(
        (m) => m.status !== 'COMPLETED' && m.status !== 'ABORTED',
      ),
    [myMissions],
  );

  const pastRentals = useMemo(
    () =>
      myMissions.filter(
        (m) => m.status === 'COMPLETED' || m.status === 'ABORTED',
      ),
    [myMissions],
  );

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = catalog.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false;
      if (
        availabilityFilter !== 'ALL' &&
        item.availabilityFlag !== availabilityFilter
      ) {
        return false;
      }
      if (!q) return true;
      return `${item.sku} ${item.name} ${item.category} ${item.nodeCallsign} ${item.nodeId} ${item.sellerName} ${item.primaryOutput} ${item.voltageOrPressure} ${item.summary}`
        .toLowerCase()
        .includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.purchasePrice - b.purchasePrice;
      if (sortBy === 'price_desc') return b.purchasePrice - a.purchasePrice;
      if (sortBy === 'stock') return b.stockQty - a.stockQty;
      return a.distanceMiles - b.distanceMiles;
    });
  }, [catalog, category, availabilityFilter, sortBy, searchQuery]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.qty, 0),
    [cart],
  );
  const deliveryFee =
    cart.length === 0
      ? 0
      : DELIVERY_TIERS.find((t) => t.id === deliveryTier)?.fee ?? 0;
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount + deliveryFee;

  const totalSpent = useMemo(
    () =>
      myOrders
        .filter((o) => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + o.grandTotal, 0) +
      myMissions
        .filter((m) => m.status === 'COMPLETED')
        .reduce((sum, m) => sum + m.totalCost, 0),
    [myOrders, myMissions],
  );

  const addToCart = (item: EquipmentItem) => {
    if (item.stockQty <= 0) return;
    setOrderNotice(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.equipmentId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.equipmentId === item.id
            ? {
                ...c,
                qty: Math.min(item.stockQty, c.qty + 1),
                unitPrice: item.purchasePrice,
              }
            : c,
        );
      }
      return [
        ...prev,
        {
          equipmentId: item.id,
          sku: item.sku,
          name: item.name,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          qty: 1,
          unitPrice: item.purchasePrice,
        },
      ];
    });
  };

  const updateCartQty = (equipmentId: string, delta: number) => {
    const stockMax =
      catalog.find((i) => i.id === equipmentId)?.stockQty ?? 10;
    setCart((prev) =>
      prev
        .map((line) =>
          line.equipmentId === equipmentId
            ? {...line, qty: Math.min(stockMax, line.qty + delta)}
            : line,
        )
        .filter((line) => line.qty > 0),
    );
  };

  const removeFromCart = (equipmentId: string) => {
    setCart((prev) => prev.filter((line) => line.equipmentId !== equipmentId));
  };

  const handleAddAddress = (addr: SavedSiteAddress) => {
    setSavedAddresses((prev) => [addr, ...prev]);
    setSelectedAddressId(addr.id);
    setOrderNotice(
      `SAVED NEW SITE ADDRESS "${addr.label}" (${addr.contactPhone}).`,
    );
  };

  const handleDeleteAddress = (id: string) => {
    setSavedAddresses((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((a) => a.id !== id);
      if (selectedAddressId === id && next[0]) {
        setSelectedAddressId(next[0].id);
      }
      return next;
    });
  };

  const handleConfirmOrder = (payload: {
    address: SavedSiteAddress;
    deliveryTier: BuyerOrder['deliveryTier'];
    deliveryFee: number;
    paymentMethod: PaymentMethodType;
    deliveryNotes: string;
  }) => {
    if (cart.length === 0) return;
    setFormError(null);
    const poNumber = `PO-2026-${Math.floor(420 + Math.random() * 570)}`;
    const orderTotal = subtotal + gstAmount + payload.deliveryFee;
    const fullAddress = `${payload.address.addressLine}, ${payload.address.cityState} - ${payload.address.postalCode}`;
    const newOrder: BuyerOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      buyerId: currentUser.id,
      buyerCompany: currentUser.companyName,
      gstin: currentUser.gstin,
      deliveryAddress: fullAddress,
      contactName: payload.address.recipientName,
      contactPhone: payload.address.contactPhone,
      postalCode: payload.address.postalCode,
      paymentMethod: payload.paymentMethod,
      deliveryNotes: payload.deliveryNotes || payload.address.gateNotes,
      deliveryTier: payload.deliveryTier,
      deliveryFee: payload.deliveryFee,
      subtotal,
      gstAmount,
      grandTotal: orderTotal,
      status: 'PENDING_APPROVAL',
      createdAt: `2026-11-17 ${new Date().toTimeString().slice(0, 5)} IST`,
      items: cart,
    };
    onPlaceOrder(newOrder);
    setCart([]);
    setCheckoutOpen(false);
    setOrderNotice(
      `${poNumber} ISSUED (${formatRs(orderTotal)}) FOR ${payload.address.label} · MOVED TO YOUR CURRENT ORDERS.`,
    );
    setActiveTab('current');
  };

  const handleReorder = (order: BuyerOrder) => {
    const validLines: BuyerOrderItem[] = [];
    for (const line of order.items) {
      const match = catalog.find((c) => c.id === line.equipmentId);
      if (match && match.stockQty > 0) {
        validLines.push({
          equipmentId: match.id,
          sku: match.sku,
          name: match.name,
          sellerId: match.sellerId,
          sellerName: match.sellerName,
          qty: Math.min(line.qty, match.stockQty),
          unitPrice: match.purchasePrice,
        });
      }
    }
    if (validLines.length > 0) {
      setCart(validLines);
      setOrderNotice('ITEMS STAGED BACK INTO YOUR BUY CART.');
      setActiveTab('products');
    }
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 space-y-6">
      {/* Buyer Account Header */}
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-[11px] uppercase tracking-[0.08em] text-[#8E8D88]">
            <span>PRIVATE BUYER WORKSPACE</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#C6FF3D]">{currentUser.companyName}</span>
            <span aria-hidden="true">/</span>
            <span>GSTIN {currentUser.gstin}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-[#F4F1EA] leading-none">
            BUYER DESK // PRODUCTS & ORDERS
          </h1>
          <p className="text-sm text-[#8E8D88] max-w-2xl">
            Strictly scoped to your buyer account. Browse available products, manage your current orders, cancel unshipped POs, and review past order invoices.
          </p>
        </div>

        {/* Buyer KPI Strip */}
        <div className="grid grid-cols-3 border-2 border-[#2A2A2A] bg-[#131410] divide-x divide-[#2A2A2A] font-mono-tabular shrink-0">
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              CURRENT ORDERS
            </div>
            <div className="text-xl font-bold text-[#FF5A1F]">
              {currentOrders.length + currentRentals.length}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              PAST ORDERS
            </div>
            <div className="text-xl font-bold text-[#F4F1EA]">
              {pastOrders.length + pastRentals.length}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              COMPLETED SPEND
            </div>
            <div className="text-xl font-bold text-[#C6FF3D]">
              {formatRs(totalSpent)}
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
            }`}
          >
            PRODUCTS ({catalog.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'current'
                ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
            }`}
          >
            CURRENT ORDERS ({currentOrders.length + currentRentals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'past'
                ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
            }`}
          >
            PAST ORDERS ({pastOrders.length + pastRentals.length})
          </button>
        </div>

        {orderNotice && (
          <div className="px-3 py-2 bg-[#C6FF3D]/15 border-2 border-[#C6FF3D] font-mono-tabular text-xs text-[#C6FF3D]">
            {orderNotice}
          </div>
        )}
      </div>

      {/* TAB 1: PRODUCTS & REQUISITION CART */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6 relative">
                  <Search
                    aria-hidden="true"
                    className="w-4 h-4 text-[#8E8D88] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SEARCH BY SKU, CATEGORY, NODE, OR MODEL..."
                    aria-label="Search buyer product catalog"
                    className="input-tactical w-full h-11 pl-10 pr-4 font-mono-tabular text-xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={availabilityFilter}
                    onChange={(e) =>
                      setAvailabilityFilter(
                        e.target.value as 'ALL' | 'IN VEHICLE' | 'DEPOT READY',
                      )
                    }
                    aria-label="Filter by staging availability"
                    className="input-tactical w-full h-11 px-3 font-mono-tabular text-xs"
                  >
                    <option value="ALL">STAGING: ALL UNITS</option>
                    <option value="IN VEHICLE">IN VEHICLE (RAPID)</option>
                    <option value="DEPOT READY">DEPOT READY</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as
                          | 'nearest'
                          | 'price_asc'
                          | 'price_desc'
                          | 'stock',
                      )
                    }
                    aria-label="Sort hardware catalog"
                    className="input-tactical w-full h-11 px-3 font-mono-tabular text-xs"
                  >
                    <option value="nearest">SORT: NEAREST NODE</option>
                    <option value="price_asc">BUY PRICE: LOW → HIGH</option>
                    <option value="price_desc">BUY PRICE: HIGH → LOW</option>
                    <option value="stock">AVAILABILITY: HIGH STOCK</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const count =
                      cat === 'ALL'
                        ? catalog.length
                        : catalog.filter((c) => c.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 border-2 font-mono-tabular text-[11px] font-semibold uppercase cursor-pointer transition-colors ${
                          category === cat
                            ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212]'
                            : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
                <span className="font-mono-tabular text-[11px] text-[#8E8D88]">
                  SHOWING {filteredCatalog.length} OF {catalog.length} SKUs
                </span>
              </div>
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-10 text-center space-y-3 font-mono-tabular">
                <div className="text-sm font-bold text-[#F4F1EA]">
                  NO PRODUCTS MATCH YOUR CURRENT FILTER OR SEARCH QUERY
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('ALL');
                    setAvailabilityFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="btn-secondary-mech px-4 py-2 text-xs font-bold uppercase cursor-pointer"
                >
                  RESET CATALOG FILTERS
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredCatalog.map((item) => {
                const inCartQty =
                  cart.find((c) => c.equipmentId === item.id)?.qty ?? 0;
                const isImageBroken = brokenImages[item.id];
                const isInVehicle = item.availabilityFlag === 'IN VEHICLE';

                return (
                  <article
                    key={item.id}
                    className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#242424] border-b-2 border-[#2A2A2A] font-mono-tabular text-[11px]">
                        <span className="font-bold text-[#F4F1EA]">
                          {item.sku} · {item.conditionRating}
                        </span>
                        <span
                          className={`font-semibold ${
                            item.stockQty > 0
                              ? 'text-[#C6FF3D]'
                              : 'text-[#FF2E2E]'
                          }`}
                        >
                          {item.stockQty > 0
                            ? `${item.stockQty} IN STOCK`
                            : 'OUT OF STOCK'}
                        </span>
                      </div>

                      <div className="aspect-[4/3] bg-[#131410] border-b-2 border-[#2A2A2A] overflow-hidden relative">
                        {!isImageBroken ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenImages((prev) => ({
                                ...prev,
                                [item.id]: true,
                              }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-halftone-dark flex flex-col items-center justify-center gap-2 p-4">
                            <Wrench className="w-8 h-8 text-[#FF5A1F]" />
                            <span className="font-mono-tabular text-xs text-[#F4F1EA]">
                              {item.sku}
                            </span>
                          </div>
                        )}
                        <span
                          className={`absolute top-2 left-2 px-2 py-0.5 font-mono-tabular text-[10px] font-bold border border-[#0D0D0D] ${
                            isInVehicle
                              ? 'bg-halftone-lime text-[#121212]'
                              : 'bg-[#131410]/95 text-[#F4F1EA] border-[#2A2A2A]'
                          }`}
                        >
                          {item.availabilityFlag}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#131410]/95 border border-[#2A2A2A] font-mono-tabular text-[10px] font-bold text-[#C6FF3D]">
                          ETA {item.etaMinutes} MIN
                        </span>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#131410]/95 border border-[#2A2A2A] font-mono-tabular text-[10px] text-[#F4F1EA]">
                          SUPPLIER: {item.sellerName}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <h2 className="font-display text-2xl text-[#F4F1EA] leading-tight">
                            {item.name}
                          </h2>
                          <p className="mt-1 text-xs text-[#8E8D88] leading-snug line-clamp-2">
                            {item.summary}
                          </p>
                          <div className="mt-2 font-mono-tabular text-[11px] text-[#F4F1EA]">
                            {item.primaryOutput} · {item.voltageOrPressure}
                          </div>
                          <div className="mt-1 font-mono-tabular text-[10px] text-[#8E8D88]">
                            {item.weightLbs} LBS · QA {item.inspectionDate} ·{' '}
                            {item.nodeCallsign}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 border-2 border-[#2A2A2A] bg-[#131410] divide-x divide-[#2A2A2A] font-mono-tabular">
                          <div className="p-2.5">
                            <div className="text-[9px] text-[#8E8D88] uppercase">
                              BUY PRICE
                            </div>
                            <div className="text-sm font-bold text-[#FF5A1F]">
                              {formatRs(item.purchasePrice)}
                            </div>
                          </div>
                          <div className="p-2.5">
                            <div className="text-[9px] text-[#8E8D88] uppercase">
                              RENT RATE
                            </div>
                            <div className="text-sm font-bold text-[#F4F1EA]">
                              {formatRs(item.rentalDailyRate)}/DAY
                            </div>
                          </div>
                        </div>

                        <TrustStack
                          depositTier={item.depositTier}
                          rating={item.rating}
                          lastPingSeconds={item.lastPingSeconds}
                          distanceMiles={item.distanceMiles}
                          compact
                        />
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        disabled={
                          item.stockQty <= 0 || inCartQty >= item.stockQty
                        }
                        className="flex-1 btn-dispatch py-2.5 px-2.5 font-mono-tabular text-[11px] font-bold uppercase cursor-pointer"
                      >
                        {inCartQty > 0
                          ? `IN CART (${inCartQty}) +1`
                          : 'ADD TO BUY'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRentUnit(item)}
                        className="btn-secondary-mech py-2.5 px-3 font-mono-tabular text-[11px] font-bold uppercase cursor-pointer"
                      >
                        RENT
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecModalItem(item)}
                        aria-label={`Inspect technical specs for ${item.name}`}
                        className="px-2.5 py-2.5 bg-[#131410] border-2 border-[#2A2A2A] hover:border-[#C6FF3D] text-[#C6FF3D] font-mono-tabular text-[11px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>SPECS</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            )}
          </div>

          {/* Sticky Requisition Cart */}
          <aside className="lg:col-span-4 bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard sticky top-20">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#FF5A1F]" />
                BUY REQUISITION CART
              </span>
              <span className="text-[#C6FF3D]">
                {cart.reduce((s, c) => s + c.qty, 0)} UNITS
              </span>
            </div>

            <div className="p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="p-6 bg-[#131410] border-2 border-[#2A2A2A] text-center font-mono-tabular text-xs text-[#8E8D88]">
                  YOUR BUY CART IS EMPTY. SELECT PRODUCTS ON THE LEFT TO STAGE A PURCHASE ORDER.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {cart.map((line) => (
                    <div
                      key={line.equipmentId}
                      className="p-3 bg-[#131410] border-2 border-[#2A2A2A] space-y-2 font-mono-tabular text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[#F4F1EA] font-semibold leading-tight">
                            {line.name}
                          </div>
                          <div className="text-[10px] text-[#8E8D88] mt-0.5">
                            {line.sku} · {formatRs(line.unitPrice)} EA
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.equipmentId)}
                          aria-label={`Remove ${line.name}`}
                          className="text-[#8E8D88] hover:text-[#FF2E2E] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#242424]">
                        <div className="flex items-center border border-[#2A2A2A] bg-[#1A1A1A]">
                          <button
                            type="button"
                            onClick={() => updateCartQty(line.equipmentId, -1)}
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#F4F1EA] hover:bg-[#242424] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-bold text-[#C6FF3D]">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(line.equipmentId, 1)}
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#F4F1EA] hover:bg-[#242424] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-[#F4F1EA]">
                          {formatRs(line.unitPrice * line.qty)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-2 border-t-2 border-[#2A2A2A]">
                {/* Delivery Site & Contact Preview */}
                <div className="p-3 bg-[#131410] border-2 border-[#2A2A2A] space-y-2 font-mono-tabular">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#8E8D88] uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF5A1F]" />
                      SHIP TO SITE ({savedAddresses.length} SAVED)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCheckoutOpen(true)}
                      className="text-[10px] font-bold text-[#C6FF3D] hover:underline uppercase cursor-pointer"
                    >
                      CHANGE / + ADD NEW
                    </button>
                  </div>
                  {selectedAddress && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-[#F4F1EA]">
                        {selectedAddress.label}
                      </div>
                      <div className="text-[10px] text-[#8E8D88] leading-snug">
                        {selectedAddress.addressLine},{' '}
                        {selectedAddress.cityState} —{' '}
                        {selectedAddress.postalCode}
                      </div>
                      <div className="text-[10px] text-[#C6FF3D] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>
                          {selectedAddress.recipientName} ·{' '}
                          {selectedAddress.contactPhone}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-mono-tabular text-[10px] text-[#8E8D88] uppercase mb-1.5">
                    DELIVERY LOGISTICS
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DELIVERY_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setDeliveryTier(tier.id)}
                        className={`p-2 border-2 text-left font-mono-tabular cursor-pointer ${
                          deliveryTier === tier.id
                            ? 'bg-[#242424] border-[#FF5A1F] text-[#F4F1EA]'
                            : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
                        }`}
                      >
                        <div className="text-[9px] font-bold">{tier.label}</div>
                        <div className="text-[10px] text-[#C6FF3D]">
                          {tier.fee === 0 ? 'FREE' : formatRs(tier.fee)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#131410] border-2 border-[#2A2A2A] p-3 space-y-1.5 font-mono-tabular text-xs">
                  <div className="flex justify-between text-[#8E8D88]">
                    <span>SUBTOTAL</span>
                    <span className="text-[#F4F1EA]">{formatRs(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#8E8D88]">
                    <span>GST (18%)</span>
                    <span className="text-[#F4F1EA]">
                      {formatRs(gstAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#8E8D88]">
                    <span>LOGISTICS FEE</span>
                    <span className="text-[#F4F1EA]">
                      {formatRs(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#2A2A2A] pt-2 text-sm font-bold">
                    <span className="text-[#F4F1EA]">PO TOTAL</span>
                    <span className="text-[#C6FF3D]">
                      {formatRs(grandTotal)}
                    </span>
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 bg-[#FF2E2E]/15 border-2 border-[#FF2E2E] font-mono-tabular text-[11px] text-[#FF2E2E]">
                    {formError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (cart.length === 0) {
                      setFormError(
                        'REQUISITION CART IS EMPTY. ADD PRODUCTS FIRST.',
                      );
                      return;
                    }
                    setFormError(null);
                    setCheckoutOpen(true);
                  }}
                  className="w-full btn-dispatch chamfer-tr py-3 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] cursor-pointer"
                >
                  PROCEED TO CHECKOUT & SITE DETAILS
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* TAB 2: BUYER CURRENT ORDERS */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                YOUR CURRENT PURCHASE ORDERS
              </span>
              <span className="text-[#C6FF3D]">
                {currentOrders.length} ACTIVE
              </span>
            </div>

            {currentOrders.length === 0 ? (
              <div className="p-8 text-center font-mono-tabular text-xs text-[#8E8D88]">
                NO ACTIVE PURCHASE ORDERS IN FLIGHT. BROWSE PRODUCTS TO PLACE A NEW ORDER.
              </div>
            ) : (
              <div className="divide-y-2 divide-[#2A2A2A]">
                {currentOrders.map((order) => {
                  const isCancelling = cancellingOrderId === order.id;
                  const canCancel =
                    order.status === 'PENDING_APPROVAL' ||
                    order.status === 'APPROVED_FOR_RELEASE';

                  return (
                    <div key={order.id} className="p-5 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 font-mono-tabular">
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-bold text-[#F4F1EA]">
                              {order.poNumber}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-halftone-lime text-[#121212] border border-[#0D0D0D]">
                              {order.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[#8E8D88]">
                              PLACED {order.createdAt}
                            </span>
                          </div>
                          <div className="text-xs text-[#F4F1EA]">
                            {order.items
                              .map(
                                (i) =>
                                  `${i.qty}× ${i.name} (${i.sku}) — ${i.sellerName}`,
                              )
                              .join(' · ')}
                          </div>
                          <div className="text-[11px] text-[#8E8D88]">
                            DELIVERY: {order.deliveryAddress}
                          </div>
                          {(order.contactName || order.contactPhone) && (
                            <div className="text-[11px] text-[#C6FF3D]">
                              SITE CONTACT: {order.contactName} ·{' '}
                              {order.contactPhone}
                              {order.paymentMethod
                                ? ` · ${order.paymentMethod.replace(/_/g, ' ')}`
                                : ''}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono-tabular">
                          <div className="text-right mr-2">
                            <div className="text-[10px] text-[#8E8D88]">
                              PO TOTAL
                            </div>
                            <div className="text-lg font-bold text-[#FF5A1F]">
                              {formatRs(order.grandTotal)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(order)}
                            className="px-3 py-2 bg-[#131410] border-2 border-[#2A2A2A] hover:border-[#F4F1EA] text-xs font-semibold uppercase cursor-pointer"
                          >
                            INVOICE
                          </button>

                          {canCancel && !isCancelling && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingOrderId(order.id);
                                setCancelReason(CANCEL_REASONS[0]);
                              }}
                              className="px-3 py-2 bg-[#131410] border-2 border-[#FF2E2E] text-[#FF2E2E] text-xs font-bold uppercase inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              CANCEL ORDER
                            </button>
                          )}
                        </div>
                      </div>

                      {isCancelling && (
                        <div className="p-4 bg-[#131410] border-2 border-[#FF2E2E] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono-tabular text-xs">
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[#FF2E2E] font-bold shrink-0">
                              REASON:
                            </span>
                            <select
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              aria-label="Cancellation reason"
                              className="input-tactical h-9 px-3 text-xs flex-1"
                            >
                              {CANCEL_REASONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onCancelOrder(order.id, cancelReason);
                                setCancellingOrderId(null);
                                setOrderNotice(
                                  `${order.poNumber} CANCELLED · MOVED TO PAST ORDERS.`,
                                );
                              }}
                              className="px-3 py-2 bg-[#FF2E2E] border-2 border-[#0D0D0D] text-[#121212] font-bold uppercase cursor-pointer"
                            >
                              CONFIRM CANCEL
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancellingOrderId(null)}
                              className="px-3 py-2 bg-[#242424] border-2 border-[#2A2A2A] text-[#F4F1EA] font-bold uppercase cursor-pointer"
                            >
                              KEEP ORDER
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buyer's Current Active Rentals / ER Dispatches */}
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                YOUR ACTIVE RENTALS & EMERGENCY DISPATCHES
              </span>
              <span className="text-[#C6FF3D]">
                {currentRentals.length} LIVE
              </span>
            </div>

            {currentRentals.length === 0 ? (
              <div className="p-6 text-center font-mono-tabular text-xs text-[#8E8D88]">
                NO ACTIVE RENTAL DISPATCHES CURRENTLY IN FLIGHT.
              </div>
            ) : (
              <div className="divide-y divide-[#2A2A2A]">
                {currentRentals.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-4 font-mono-tabular text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#F4F1EA]">
                        {m.missionCode} · {m.equipment.name}
                      </div>
                      <div className="text-[11px] text-[#8E8D88] mt-0.5">
                        DROP ZONE: {m.dropZoneAddress} · PIN: {m.handoffPin}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#C6FF3D] font-bold">
                        {formatRs(m.totalCost)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenMission(m.id)}
                        className="btn-dispatch px-3 py-1.5 text-[11px] font-bold uppercase cursor-pointer"
                      >
                        TRACK LIVE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BUYER PAST ORDERS (DELIVERED + CANCELLED) */}
      {activeTab === 'past' && (
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                YOUR PAST PURCHASE ORDERS (DELIVERED & CANCELLED)
              </span>
              <span className="text-[#8E8D88]">
                {pastOrders.length} RECORDS
              </span>
            </div>

            <table className="w-full text-left border-collapse font-mono-tabular text-xs">
              <thead>
                <tr className="bg-[#131410] border-b-2 border-[#2A2A2A] text-[10px] uppercase text-[#8E8D88]">
                  <th className="py-3 px-4">PO NUMBER</th>
                  <th className="py-3 px-4">PRODUCTS</th>
                  <th className="py-3 px-4">OUTCOME / REASON</th>
                  <th className="py-3 px-4 text-right">AMOUNT</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {pastOrders.map((order) => {
                  const isCancelled =
                    order.status === 'CANCELLED_BY_BUYER' ||
                    order.status === 'CANCELLED_BY_SELLER';
                  return (
                    <tr key={order.id} className="hover:bg-[#242424]/50">
                      <td className="py-3.5 px-4 font-bold text-[#F4F1EA] whitespace-nowrap">
                        {order.poNumber}
                        <div className="text-[10px] font-normal text-[#8E8D88]">
                          {order.createdAt}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#F4F1EA]">
                        {order.items
                          .map((i) => `${i.qty}× ${i.name}`)
                          .join(', ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold border ${
                            isCancelled
                              ? 'bg-[#131410] text-[#FF2E2E] border-[#FF2E2E]'
                              : 'bg-[#131410] text-[#C6FF3D] border-[#C6FF3D]'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        {order.cancellationReason && (
                          <div className="text-[10px] text-[#8E8D88] mt-1">
                            {order.cancellationReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#F4F1EA] whitespace-nowrap">
                        {formatRs(order.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(order)}
                            className="px-2.5 py-1.5 bg-[#131410] border border-[#2A2A2A] hover:border-[#F4F1EA] text-[10px] font-semibold uppercase inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            INVOICE
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="px-2.5 py-1.5 bg-[#131410] border border-[#C6FF3D] text-[#C6FF3D] text-[10px] font-semibold uppercase inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            BUY AGAIN
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Past Rentals */}
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                YOUR PAST RENTALS & DISPATCHES
              </span>
              <span className="text-[#8E8D88]">
                {pastRentals.length} RECORDS
              </span>
            </div>
            <table className="w-full text-left border-collapse font-mono-tabular text-xs">
              <thead>
                <tr className="bg-[#131410] border-b-2 border-[#2A2A2A] text-[10px] uppercase text-[#8E8D88]">
                  <th className="py-3 px-4">MISSION</th>
                  <th className="py-3 px-4">EQUIPMENT</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {pastRentals.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 px-4 font-bold text-[#F4F1EA]">
                      {m.missionCode}
                    </td>
                    <td className="py-3 px-4 text-[#F4F1EA]">
                      {m.equipment.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold border ${
                          m.status === 'COMPLETED'
                            ? 'text-[#C6FF3D] border-[#C6FF3D]'
                            : 'text-[#FF2E2E] border-[#FF2E2E]'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#F4F1EA]">
                      {formatRs(m.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST Tax Invoice Modal */}
      {invoiceOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Tax Invoice ${invoiceOrder.poNumber}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="w-full max-w-lg bg-[#1A1A1A] border-2 border-[#F4F1EA] shadow-hard p-6 space-y-4 font-mono-tabular text-xs">
            <div className="flex items-center justify-between border-b-2 border-[#2A2A2A] pb-3">
              <div>
                <div className="text-[10px] text-[#FF5A1F] uppercase">
                  RIGLOCK GST TAX INVOICE
                </div>
                <div className="font-display text-3xl text-[#F4F1EA] leading-none mt-1">
                  {invoiceOrder.poNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                className="btn-secondary-mech px-3 py-1.5 text-[11px] font-bold uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-1.5 text-[#8E8D88]">
              <div>
                BUYER:{' '}
                <span className="text-[#F4F1EA] font-semibold">
                  {invoiceOrder.buyerCompany}
                </span>
              </div>
              <div>
                GSTIN:{' '}
                <span className="text-[#F4F1EA]">{invoiceOrder.gstin}</span>
              </div>
              <div>
                DESTINATION:{' '}
                <span className="text-[#F4F1EA]">
                  {invoiceOrder.deliveryAddress}
                </span>
              </div>
              {(invoiceOrder.contactName || invoiceOrder.contactPhone) && (
                <div>
                  RECEIVER CONTACT:{' '}
                  <span className="text-[#C6FF3D]">
                    {invoiceOrder.contactName} · {invoiceOrder.contactPhone}
                  </span>
                </div>
              )}
              {invoiceOrder.paymentMethod && (
                <div>
                  SETTLEMENT TERMS:{' '}
                  <span className="text-[#F4F1EA]">
                    {invoiceOrder.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {invoiceOrder.deliveryNotes && (
                <div>
                  DISPATCH NOTE:{' '}
                  <span className="text-[#F4F1EA]">
                    {invoiceOrder.deliveryNotes}
                  </span>
                </div>
              )}
              {invoiceOrder.cancellationReason && (
                <div className="text-[#FF2E2E]">
                  CANCELLED: {invoiceOrder.cancellationReason}
                </div>
              )}
            </div>

            <div className="border-t border-b border-[#2A2A2A] py-3 space-y-2">
              {invoiceOrder.items.map((line) => (
                <div key={line.sku} className="flex justify-between">
                  <span className="text-[#F4F1EA]">
                    {line.qty}× {line.name}
                  </span>
                  <span className="text-[#F4F1EA] font-semibold">
                    {formatRs(line.unitPrice * line.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[#8E8D88]">
                <span>SUBTOTAL</span>
                <span>{formatRs(invoiceOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#8E8D88]">
                <span>GST (18%)</span>
                <span>{formatRs(invoiceOrder.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-[#8E8D88]">
                <span>LOGISTICS</span>
                <span>{formatRs(invoiceOrder.deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2 text-base font-bold">
                <span className="text-[#F4F1EA]">GRAND TOTAL</span>
                <span className="text-[#C6FF3D]">
                  {formatRs(invoiceOrder.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Specification & QA Checklist Modal */}
      {specModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Technical specifications for ${specModalItem.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-2 border-[#F4F1EA] shadow-hard font-mono-tabular text-xs">
            <div className="px-6 py-4 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-[#FF5A1F] uppercase">
                  {specModalItem.sku} · {specModalItem.category} ·{' '}
                  {specModalItem.conditionRating}
                </div>
                <h2 className="font-display text-3xl text-[#F4F1EA] leading-none mt-1">
                  {specModalItem.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSpecModalItem(null)}
                className="btn-secondary-mech px-3 py-1.5 text-[11px] font-bold uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
                <div className="sm:col-span-5 aspect-[4/3] bg-[#131410] border-2 border-[#2A2A2A] overflow-hidden">
                  <img
                    src={specModalItem.image}
                    alt={specModalItem.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="sm:col-span-7 flex flex-col justify-between gap-3">
                  <p className="font-sans text-sm text-[#F4F1EA] leading-relaxed">
                    {specModalItem.summary}
                  </p>
                  <div className="space-y-1 text-[11px] text-[#8E8D88]">
                    <div>
                      SUPPLIER:{' '}
                      <span className="text-[#F4F1EA] font-semibold">
                        {specModalItem.sellerName}
                      </span>
                    </div>
                    <div>
                      STAGED AT:{' '}
                      <span className="text-[#C6FF3D]">
                        {specModalItem.nodeCallsign}
                      </span>
                    </div>
                    <div>
                      COURIER:{' '}
                      <span className="text-[#F4F1EA]">
                        {specModalItem.courierName} (
                        {specModalItem.courierPlate})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#8E8D88] uppercase mb-2">
                  CALIBRATED HARDWARE SPECIFICATION MATRIX
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 border-2 border-[#2A2A2A] bg-[#131410]">
                  {specModalItem.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="p-3 border-b border-r border-[#2A2A2A]"
                    >
                      <div className="text-[9px] text-[#8E8D88] uppercase">
                        {spec.label}
                      </div>
                      <div className="text-xs font-semibold text-[#F4F1EA] mt-0.5">
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#131410] border-2 border-[#2A2A2A] p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#F4F1EA]">
                    QA & LOAD-BANK VERIFICATION CHECKLIST
                  </span>
                  <span className="text-[#C6FF3D]">
                    INSPECTED {specModalItem.inspectionDate}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {specModalItem.checklist.map((entry) => (
                    <li
                      key={entry}
                      className="flex items-start gap-2 text-xs text-[#F4F1EA]"
                    >
                      <CheckSquare className="w-4 h-4 text-[#C6FF3D] shrink-0 mt-0.5" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t-2 border-[#2A2A2A]">
                <div className="p-3 bg-[#131410] border-2 border-[#2A2A2A]">
                  <div className="text-[9px] text-[#8E8D88]">OUTRIGHT BUY</div>
                  <div className="text-base font-bold text-[#FF5A1F]">
                    {formatRs(specModalItem.purchasePrice)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(specModalItem);
                    setSpecModalItem(null);
                  }}
                  disabled={specModalItem.stockQty <= 0}
                  className="btn-dispatch py-3 px-4 text-xs font-bold uppercase cursor-pointer"
                >
                  ADD TO BUY CART
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = specModalItem;
                    setSpecModalItem(null);
                    onRentUnit(target);
                  }}
                  className="btn-secondary-mech py-3 px-4 text-xs font-bold uppercase cursor-pointer"
                >
                  RENT ({formatRs(specModalItem.rentalDailyRate)}/DAY)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Checkout Drawer with Address & Contact Book */}
      <CheckoutDrawer
        isOpen={checkoutOpen}
        currentUser={currentUser}
        cart={cart}
        savedAddresses={savedAddresses}
        selectedAddressId={selectedAddress?.id || ''}
        onSelectAddress={setSelectedAddressId}
        onAddAddress={handleAddAddress}
        onDeleteAddress={handleDeleteAddress}
        deliveryTier={deliveryTier}
        onChangeDeliveryTier={setDeliveryTier}
        onClose={() => setCheckoutOpen(false)}
        onConfirmOrder={handleConfirmOrder}
      />
    </section>
  );
}
