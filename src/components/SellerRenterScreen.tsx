import {Check, Edit3, FileText, PlusSquare, Search, Trash2, Truck, X, XCircle} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useState} from 'react';
import {
  AuthAccount,
  AvailabilityFlag,
  BuyerOrder,
  BuyerOrderStatus,
  DepotNode,
  DispatchMission,
  EquipmentCategory,
  EquipmentItem,
  SellerTab,
} from '../types/rescue';
import {formatRs} from '../utils/currency';
import {PerformanceMetrics} from './PerformanceMetrics';

interface SellerRenterScreenProps {
  currentUser: AuthAccount;
  myInventory: EquipmentItem[];
  myOrders: BuyerOrder[];
  myMissions: DispatchMission[];
  myNodes: DepotNode[];
  onToggleAvailability: (id: string) => void;
  onUpdateRates: (
    id: string,
    rates: {
      purchasePrice: number;
      rentalDailyRate: number;
      emergencyHourlyRate: number;
      stockQty: number;
    },
  ) => void;
  onAddEquipment: (item: EquipmentItem) => void;
  onRemoveEquipment: (id: string) => void;
  onAdvanceOrderStatus: (orderId: string, nextStatus: BuyerOrderStatus) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onOpenMission: (missionId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  requestedTab?: {tab: SellerTab; seq: number} | null;
}

const CATEGORY_IMAGES: Record<Exclude<EquipmentCategory, 'ALL'>, string> = {
  POWER: '/src/assets/images/equip_diesel_generator_1794980503104.jpg',
  DEWATERING: '/src/assets/images/equip_dewatering_pump_1794980503840.jpg',
  HYDRAULIC: '/src/assets/images/equip_hydraulic_breaker_1794980503796.jpg',
  LIGHTING: '/src/assets/images/equip_light_tower_1794980504710.jpg',
  CUTTING: '/src/assets/images/equip_plasma_cutter_1794980505133.jpg',
  AIR: '/src/assets/images/equip_air_scrubber_1794980506576.jpg',
};

const SELLER_CANCEL_REASONS = [
  'UNIT HELD ON QA / LOAD-BANK INSPECTION',
  'INSUFFICIENT STOCK IN ASSIGNED DEPOT',
  'COURIER VEHICLE UNAVAILABLE FOR CORRIDOR',
  'BUYER SITE ACCESS UNVERIFIED',
];

export function SellerRenterScreen({
  currentUser,
  myInventory,
  myOrders,
  myMissions,
  myNodes,
  onToggleAvailability,
  onUpdateRates,
  onAddEquipment,
  onRemoveEquipment,
  onAdvanceOrderStatus,
  onCancelOrder,
  onOpenMission,
  searchQuery: externalSearchQuery,
  onSearchChange,
  requestedTab,
}: SellerRenterScreenProps) {
  const [activeTab, setActiveTab] = useState<SellerTab>('inventory');
  const [localSearch, setLocalSearch] = useState('');
  const searchQuery = externalSearchQuery ?? localSearch;
  const setSearchQuery = onSearchChange ?? setLocalSearch;

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab.tab);
    }
  }, [requestedTab]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPurchase, setEditPurchase] = useState('');
  const [editDaily, setEditDaily] = useState('');
  const [editHourly, setEditHourly] = useState('');
  const [editStock, setEditStock] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Seller order cancellation prompt state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState(SELLER_CANCEL_REASONS[0]);

  // New hardware listing form state
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('RIG-PWR-30X');
  const [newCategory, setNewCategory] =
    useState<Exclude<EquipmentCategory, 'ALL'>>('POWER');
  const [newCondition, setNewCondition] = useState<'GRADE-A1' | 'GRADE-A2'>(
    'GRADE-A1',
  );
  const [newAvailability, setNewAvailability] =
    useState<AvailabilityFlag>('IN VEHICLE');
  const [newOutput, setNewOutput] = useState('30 KW CONTINUOUS');
  const [newVoltage, setNewVoltage] = useState('480V 3-PHASE');
  const [newPurchasePrice, setNewPurchasePrice] = useState('465000');
  const [newDailyRate, setNewDailyRate] = useState('11500');
  const [newHourlyRate, setNewHourlyRate] = useState('5200');
  const [newDeposit, setNewDeposit] = useState('50000');
  const [newStock, setNewStock] = useState('2');
  const [newNodeId, setNewNodeId] = useState(
    myNodes[0]?.id || 'node-van-04',
  );
  const [newSummary, setNewSummary] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Compute seller-only slice of an order's line items
  const getSellerSubtotal = (order: BuyerOrder) =>
    order.items
      .filter((i) => i.sellerId === currentUser.id)
      .reduce((s, i) => s + i.unitPrice * i.qty, 0);

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

  const activeMissions = useMemo(
    () =>
      myMissions.filter(
        (m) => m.status !== 'COMPLETED' && m.status !== 'ABORTED',
      ),
    [myMissions],
  );

  const pastSaleOrders = useMemo(
    () => myOrders.filter((o) => o.status === 'DELIVERED'),
    [myOrders],
  );

  const pastSaleMissions = useMemo(
    () => myMissions.filter((m) => m.status === 'COMPLETED'),
    [myMissions],
  );

  const cancelledOrders = useMemo(
    () =>
      myOrders.filter(
        (o) =>
          o.status === 'CANCELLED_BY_BUYER' ||
          o.status === 'CANCELLED_BY_SELLER',
      ),
    [myOrders],
  );

  const cancelledMissions = useMemo(
    () => myMissions.filter((m) => m.status === 'ABORTED'),
    [myMissions],
  );

  const qLower = searchQuery.trim().toLowerCase();

  const matchesItem = (item: EquipmentItem) => {
    if (!qLower) return true;
    return `${item.sku} ${item.name} ${item.category} ${item.nodeCallsign} ${item.availabilityFlag} ${item.primaryOutput} ${item.conditionRating}`
      .toLowerCase()
      .includes(qLower);
  };

  const matchesOrder = (order: BuyerOrder) => {
    if (!qLower) return true;
    const itemText = order.items.map((i) => `${i.sku} ${i.name}`).join(' ');
    return `${order.poNumber} ${order.buyerCompany} ${order.status} ${order.deliveryAddress} ${order.contactName ?? ''} ${order.cancellationReason ?? ''} ${itemText}`
      .toLowerCase()
      .includes(qLower);
  };

  const matchesMission = (m: DispatchMission) => {
    if (!qLower) return true;
    return `${m.missionCode} ${m.buyerName} ${m.status} ${m.dropZoneAddress} ${m.equipment.sku} ${m.equipment.name} ${m.equipment.nodeCallsign}`
      .toLowerCase()
      .includes(qLower);
  };

  const filteredInventory = useMemo(
    () => myInventory.filter(matchesItem),
    [myInventory, qLower],
  );
  const filteredCurrentOrders = useMemo(
    () => currentOrders.filter(matchesOrder),
    [currentOrders, qLower],
  );
  const filteredActiveMissions = useMemo(
    () => activeMissions.filter(matchesMission),
    [activeMissions, qLower],
  );
  const filteredPastSaleOrders = useMemo(
    () => pastSaleOrders.filter(matchesOrder),
    [pastSaleOrders, qLower],
  );
  const filteredPastSaleMissions = useMemo(
    () => pastSaleMissions.filter(matchesMission),
    [pastSaleMissions, qLower],
  );
  const filteredCancelledOrders = useMemo(
    () => cancelledOrders.filter(matchesOrder),
    [cancelledOrders, qLower],
  );
  const filteredCancelledMissions = useMemo(
    () => cancelledMissions.filter(matchesMission),
    [cancelledMissions, qLower],
  );

  const netSettledRevenue = useMemo(() => {
    const salesTotal = pastSaleOrders.reduce(
      (s, o) => s + getSellerSubtotal(o),
      0,
    );
    const rentalTotal = pastSaleMissions.reduce((s, m) => s + m.totalCost, 0);
    return Math.round((salesTotal + rentalTotal) * 0.95);
  }, [pastSaleOrders, pastSaleMissions]);

  const startEditing = (item: EquipmentItem) => {
    setEditingId(item.id);
    setEditPurchase(String(item.purchasePrice));
    setEditDaily(String(item.rentalDailyRate));
    setEditHourly(String(item.emergencyHourlyRate));
    setEditStock(String(item.stockQty));
  };

  const saveEdit = (id: string) => {
    const purchasePrice = Math.max(1000, Number(editPurchase) || 0);
    const rentalDailyRate = Math.max(500, Number(editDaily) || 0);
    const emergencyHourlyRate = Math.max(250, Number(editHourly) || 0);
    const stockQty = Math.max(1, Math.floor(Number(editStock) || 1));
    onUpdateRates(id, {
      purchasePrice,
      rentalDailyRate,
      emergencyHourlyRate,
      stockQty,
    });
    setEditingId(null);
    setStatusNotice('RATES & INVENTORY STOCK UPDATED.');
  };

  const handleCreateUnit = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim() || !newOutput.trim() || !newImage) {
      setFormError(
        'EQUIPMENT NAME, SKU, OUTPUT RATING, AND PRODUCT IMAGE ARE REQUIRED TO PUBLISH.',
      );
      return;
    }
    setFormError(null);
    const node = myNodes.find((n) => n.id === newNodeId) || myNodes[0];
    const purchasePrice = Math.max(5000, Number(newPurchasePrice) || 150000);
    const rentalDailyRate = Math.max(1000, Number(newDailyRate) || 6500);
    const emergencyHourlyRate = Math.max(500, Number(newHourlyRate) || 3000);
    const depositAmount = Math.max(5000, Number(newDeposit) || 25000);
    const stockQty = Math.max(1, Math.floor(Number(newStock) || 1));

    const createdImage = newImagePreview || CATEGORY_IMAGES[newCategory];
    const created: EquipmentItem = {
      id: `eq-vendor-${Date.now()}`,
      sku: newSku.trim().toUpperCase(),
      name: newName.trim().toUpperCase(),
      category: newCategory,
      image: createdImage,
      conditionRating: newCondition,
      availabilityFlag: newAvailability,
      emergencyHourlyRate,
      emergencyDispatchFee: 2200,
      rentalDailyRate,
      rentalWeeklyRate: Math.round(rentalDailyRate * 5.2),
      purchasePrice,
      stockQty,
      sellerId: currentUser.id,
      sellerName: currentUser.companyName,
      depositAmount,
      depositTier: depositAmount >= 30000 ? 'TIER-1 BOND' : 'TIER-2 BOND',
      rating: 4.97,
      lastPingSeconds: 6,
      distanceMiles: node?.distanceMiles ?? 1.0,
      etaMinutes: node?.slaMinutes ?? 22,
      nodeId: node?.id ?? `node-${currentUser.id}`,
      nodeCallsign:
        node?.callsign ??
        `DEPOT // ${currentUser.depotRegion || currentUser.companyName}`,
      courierName: node?.leadTech ?? currentUser.fullName,
      courierPlate: 'IND-4892',
      weightLbs: 340,
      primaryOutput: newOutput.trim().toUpperCase(),
      voltageOrPressure: newVoltage.trim().toUpperCase() || 'INDUSTRIAL GRADE',
      inspectionDate: '2026-11-17',
      summary:
        newSummary.trim() ||
        'Vendor-certified heavy rescue unit staged for immediate sale or rapid emergency dispatch.',
      specs: [
        {label: 'PRIMARY OUTPUT', value: newOutput.trim().toUpperCase()},
        {label: 'INTERFACE', value: newVoltage.trim().toUpperCase()},
        {label: 'CONDITION', value: newCondition},
        {label: 'STAGED NODE', value: node?.callsign ?? 'VAN-UNIT 04'},
        {label: 'SALE PRICE', value: formatRs(purchasePrice)},
        {label: 'DAILY RENT', value: formatRs(rentalDailyRate)},
      ],
      checklist: [
        'Vendor bench load-tested prior to listing',
        'GST invoice & calibration tag attached',
        'Ready for immediate freight or ER courier load-out',
      ],
    };

    onAddEquipment(created);
    setNewName('');
    setNewSummary('');
    setActiveTab('inventory');
    setStatusNotice(`PUBLISHED ${created.sku} TO YOUR SELLER INVENTORY.`);
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 space-y-6">
      {/* Seller & Renter Private Header */}
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-[11px] uppercase tracking-[0.08em] text-[#8E8D88]">
            <span>PRIVATE SELLER & RENTER WORKSPACE</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#C6FF3D]">{currentUser.companyName}</span>
            <span aria-hidden="true">/</span>
            <span>GSTIN {currentUser.gstin}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-[#F4F1EA] leading-none">
            SELLER & RENTER // FLEET, ORDERS & SALES
          </h1>
          <p className="text-sm text-[#8E8D88] max-w-2xl">
            Strictly scoped to your vendor account. Manage only your own inventory, active buyer orders, settled past sales, and order cancellations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-[#2A2A2A] bg-[#131410] divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A2A] font-mono-tabular shrink-0">
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              MY INVENTORY
            </div>
            <div className="text-lg font-bold text-[#F4F1EA]">
              {myInventory.length} SKUs
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              ACTIVE ORDERS
            </div>
            <div className="text-lg font-bold text-[#FF5A1F]">
              {currentOrders.length + activeMissions.length}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              CANCELLATIONS
            </div>
            <div className="text-lg font-bold text-[#FF2E2E]">
              {cancelledOrders.length + cancelledMissions.length}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              NET PAST SALES
            </div>
            <div className="text-lg font-bold text-[#C6FF3D]">
              {formatRs(netSettledRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Seller Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
            }`}
          >
            INVENTORY ({myInventory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
            }`}
          >
            ORDERS ({currentOrders.length + activeMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past_sales')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'past_sales'
                ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
            }`}
          >
            PAST SALES ({pastSaleOrders.length + pastSaleMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cancellations')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'cancellations'
                ? 'bg-[#FF2E2E] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
            }`}
          >
            CANCELLATIONS ({cancelledOrders.length + cancelledMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#F4F1EA] hover:border-[#FF5A1F]'
            }`}
          >
            PERFORMANCE METRICS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 border-2 font-mono-tabular text-xs font-bold uppercase inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#C6FF3D] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#C6FF3D] hover:border-[#C6FF3D]'
            }`}
          >
            <PlusSquare className="w-3.5 h-3.5" />
            LIST HARDWARE
          </button>
        </div>

        {statusNotice && (
          <div className="px-3 py-2 bg-[#C6FF3D]/15 border-2 border-[#C6FF3D] font-mono-tabular text-xs text-[#C6FF3D]">
            {statusNotice}
          </div>
        )}
      </div>

      {/* Synced Inventory & Orders Filter Strip */}
      {(activeTab === 'inventory' ||
        activeTab === 'orders' ||
        activeTab === 'past_sales' ||
        activeTab === 'cancellations') && (
        <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-[#8E8D88] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER YOUR INVENTORY BY SKU / NODE OR ORDERS BY PO# / BUYER..."
              aria-label="Filter seller inventory and orders"
              className="input-tactical w-full h-10 pl-9 pr-9 font-mono-tabular text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear seller search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8D88] hover:text-[#FF2E2E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {qLower && (
            <div className="font-mono-tabular text-[11px] text-[#C6FF3D] uppercase shrink-0">
              ACTIVE FILTER: &quot;{searchQuery.trim()}&quot;
            </div>
          )}
        </div>
      )}

      {/* TAB 4.5: PERFORMANCE METRICS (D3 ANALYTICS) */}
      {activeTab === 'metrics' && (
        <PerformanceMetrics
          sellerId={currentUser.id}
          myInventory={myInventory}
          myOrders={myOrders}
          myMissions={myMissions}
        />
      )}

      {/* TAB 1: SELLER'S OWN INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
          {filteredInventory.length === 0 ? (
            <div className="p-10 text-center space-y-4 font-mono-tabular">
              <div className="text-xs text-[#8E8D88]">
                {myInventory.length === 0
                  ? `NO HARDWARE UNITS LISTED UNDER ${currentUser.companyName} YET.`
                  : 'NO INVENTORY UNITS MATCH YOUR CURRENT SEARCH FILTER.'}
              </div>
              {myInventory.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="btn-dispatch chamfer-tag px-5 py-2.5 text-xs font-bold uppercase cursor-pointer"
                >
                  LIST YOUR FIRST HARDWARE UNIT
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn-secondary-mech px-5 py-2.5 text-xs font-bold uppercase cursor-pointer"
                >
                  CLEAR SEARCH FILTER
                </button>
              )}
            </div>
          ) : (
          <table className="w-full text-left border-collapse font-mono-tabular text-xs">
            <thead>
              <tr className="bg-[#242424] border-b-2 border-[#2A2A2A] text-[10px] uppercase tracking-[0.06em] text-[#8E8D88]">
                <th className="py-3 px-4">YOUR UNIT / SKU</th>
                <th className="py-3 px-4">STAGING FLAG</th>
                <th className="py-3 px-4">STOCK</th>
                <th className="py-3 px-4 text-right">SALE PRICE</th>
                <th className="py-3 px-4 text-right">RENT / DAY</th>
                <th className="py-3 px-4 text-right">ER / HR</th>
                <th className="py-3 px-4 text-right">CONTROLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredInventory.map((item) => {
                const isEditing = editingId === item.id;
                const isInVehicle = item.availabilityFlag === 'IN VEHICLE';

                return (
                  <tr key={item.id} className="hover:bg-[#242424]/50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-10 object-cover border border-[#2A2A2A] shrink-0"
                        />
                        <div>
                          <div className="text-[#F4F1EA] font-bold">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-[#8E8D88]">
                            {item.sku} · {item.nodeCallsign}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleAvailability(item.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase border cursor-pointer ${
                          isInVehicle
                            ? 'bg-halftone-lime text-[#121212] border-[#0D0D0D]'
                            : 'bg-[#131410] text-[#F4F1EA] border-[#F4F1EA]'
                        }`}
                      >
                        {item.availabilityFlag} ↻
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          aria-label="Edit stock quantity"
                          className="input-tactical w-16 h-8 px-2 text-xs"
                        />
                      ) : (
                        <span className="text-[#F4F1EA] font-semibold">
                          {item.stockQty} UNITS
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min={1000}
                          value={editPurchase}
                          onChange={(e) => setEditPurchase(e.target.value)}
                          aria-label="Edit sale price"
                          className="input-tactical w-28 h-8 px-2 text-xs text-right"
                        />
                      ) : (
                        <span className="text-[#FF5A1F] font-bold">
                          {formatRs(item.purchasePrice)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min={500}
                          value={editDaily}
                          onChange={(e) => setEditDaily(e.target.value)}
                          aria-label="Edit daily rental rate"
                          className="input-tactical w-24 h-8 px-2 text-xs text-right"
                        />
                      ) : (
                        <span className="text-[#F4F1EA]">
                          {formatRs(item.rentalDailyRate)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min={250}
                          value={editHourly}
                          onChange={(e) => setEditHourly(e.target.value)}
                          aria-label="Edit emergency hourly rate"
                          className="input-tactical w-24 h-8 px-2 text-xs text-right"
                        />
                      ) : (
                        <span className="text-[#C6FF3D]">
                          {formatRs(item.emergencyHourlyRate)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => saveEdit(item.id)}
                            className="px-2.5 py-1.5 bg-[#C6FF3D] text-[#121212] border border-[#0D0D0D] text-[10px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            SAVE
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="px-2.5 py-1.5 bg-[#131410] text-[#F4F1EA] border border-[#2A2A2A] hover:border-[#F4F1EA] text-[10px] font-semibold uppercase inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            EDIT RATES
                          </button>
                        )}

                        {myInventory.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveEquipment(item.id);
                              setStatusNotice(`REMOVED ${item.sku} FROM YOUR INVENTORY.`);
                            }}
                            aria-label={`Remove ${item.name}`}
                            className="p-1.5 bg-[#131410] text-[#8E8D88] hover:text-[#FF2E2E] border border-[#2A2A2A] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      )}

      {/* TAB 2: SELLER'S CURRENT ORDERS & ACTIVE RENTALS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                ACTIVE INCOMING PURCHASE ORDERS (YOUR HARDWARE ONLY)
              </span>
              <span className="text-[#FF5A1F]">
                {filteredCurrentOrders.length} OPEN
              </span>
            </div>

            {filteredCurrentOrders.length === 0 ? (
              <div className="p-8 text-center font-mono-tabular text-xs text-[#8E8D88]">
                {currentOrders.length === 0
                  ? 'NO ACTIVE PURCHASE ORDERS PENDING FULFILLMENT FOR YOUR INVENTORY.'
                  : 'NO ACTIVE PURCHASE ORDERS MATCH YOUR SEARCH QUERY.'}
              </div>
            ) : (
              <div className="divide-y-2 divide-[#2A2A2A]">
                {filteredCurrentOrders.map((order) => {
                  const sellerItems = order.items.filter(
                    (i) => i.sellerId === currentUser.id,
                  );
                  const sellerAmt = getSellerSubtotal(order);
                  const isCancelling = cancellingOrderId === order.id;

                  return (
                    <div key={order.id} className="p-5 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono-tabular">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-bold text-[#F4F1EA]">
                              {order.poNumber}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-halftone-lime text-[#121212] border border-[#0D0D0D]">
                              {order.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[#8E8D88]">
                              BUYER: {order.buyerCompany}
                            </span>
                          </div>
                          <div className="text-xs text-[#F4F1EA]">
                            {sellerItems
                              .map((i) => `${i.qty}× ${i.name} (${i.sku})`)
                              .join(' · ')}
                          </div>
                          <div className="text-[11px] text-[#8E8D88]">
                            SHIP TO: {order.deliveryAddress}
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

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <div className="text-right mr-3">
                            <div className="text-[10px] text-[#8E8D88]">
                              YOUR SHARE
                            </div>
                            <div className="text-base font-bold text-[#C6FF3D]">
                              {formatRs(sellerAmt)}
                            </div>
                          </div>

                          {order.status === 'PENDING_APPROVAL' && (
                            <button
                              type="button"
                              onClick={() =>
                                onAdvanceOrderStatus(
                                  order.id,
                                  'APPROVED_FOR_RELEASE',
                                )
                              }
                              className="btn-dispatch px-3 py-2 text-[11px] font-bold uppercase cursor-pointer"
                            >
                              APPROVE & RELEASE
                            </button>
                          )}
                          {order.status === 'APPROVED_FOR_RELEASE' && (
                            <button
                              type="button"
                              onClick={() =>
                                onAdvanceOrderStatus(order.id, 'IN_TRANSIT')
                              }
                              className="px-3 py-2 bg-[#C6FF3D] text-[#121212] border-2 border-[#0D0D0D] text-[11px] font-bold uppercase cursor-pointer"
                            >
                              DISPATCH FREIGHT
                            </button>
                          )}
                          {order.status === 'IN_TRANSIT' && (
                            <button
                              type="button"
                              onClick={() =>
                                onAdvanceOrderStatus(order.id, 'DELIVERED')
                              }
                              className="px-3 py-2 bg-[#131410] text-[#C6FF3D] border-2 border-[#C6FF3D] text-[11px] font-bold uppercase cursor-pointer"
                            >
                              MARK DELIVERED
                            </button>
                          )}

                          {!isCancelling && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingOrderId(order.id);
                                setCancelReason(SELLER_CANCEL_REASONS[0]);
                              }}
                              className="px-3 py-2 bg-[#131410] border-2 border-[#FF2E2E] text-[#FF2E2E] text-[11px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              CANCEL
                            </button>
                          )}
                        </div>
                      </div>

                      {isCancelling && (
                        <div className="p-4 bg-[#131410] border-2 border-[#FF2E2E] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono-tabular text-xs">
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[#FF2E2E] font-bold shrink-0">
                              SELLER REASON:
                            </span>
                            <select
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              aria-label="Seller cancellation reason"
                              className="input-tactical h-9 px-3 text-xs flex-1"
                            >
                              {SELLER_CANCEL_REASONS.map((r) => (
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
                                setStatusNotice(
                                  `${order.poNumber} CANCELLED BY SELLER · LOGGED IN CANCELLATIONS.`,
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
                              KEEP
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

          {/* Active Rental & ER Dispatches for Seller's Fleet */}
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C6FF3D]" />
                ACTIVE RENTALS & ER DISPATCHES (YOUR FLEET)
              </span>
              <span className="text-[#C6FF3D]">
                {filteredActiveMissions.length} LIVE
              </span>
            </div>

            {filteredActiveMissions.length === 0 ? (
              <div className="p-6 text-center font-mono-tabular text-xs text-[#8E8D88]">
                {activeMissions.length === 0
                  ? 'NO ACTIVE RENTALS CURRENTLY DISPATCHED FROM YOUR NODES.'
                  : 'NO ACTIVE RENTALS MATCH YOUR SEARCH QUERY.'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-mono-tabular text-xs">
                <thead>
                  <tr className="bg-[#131410] border-b-2 border-[#2A2A2A] text-[10px] uppercase text-[#8E8D88]">
                    <th className="py-3 px-4">MISSION</th>
                    <th className="py-3 px-4">RENTER</th>
                    <th className="py-3 px-4">UNIT</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">RENTAL FEE</th>
                    <th className="py-3 px-4 text-right">CONSOLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredActiveMissions.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-4 font-bold text-[#F4F1EA]">
                        {m.missionCode}
                      </td>
                      <td className="py-3 px-4 text-[#8E8D88]">{m.buyerName}</td>
                      <td className="py-3 px-4 text-[#F4F1EA]">
                        {m.equipment.name}
                      </td>
                      <td className="py-3 px-4 text-[#C6FF3D] font-bold">
                        {m.status}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#F4F1EA]">
                        {formatRs(m.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenMission(m.id)}
                          className="btn-dispatch px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer"
                        >
                          VIEW DISPATCH
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SELLER'S PAST SALES */}
      {activeTab === 'past_sales' && (
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                SETTLED PAST HARDWARE SALES
              </span>
              <span className="text-[#C6FF3D]">
                {filteredPastSaleOrders.length} COMPLETED
              </span>
            </div>

            {filteredPastSaleOrders.length === 0 ? (
              <div className="p-8 text-center font-mono-tabular text-xs text-[#8E8D88]">
                {pastSaleOrders.length === 0
                  ? 'NO COMPLETED HARDWARE SALES RECORDED YET.'
                  : 'NO PAST SALES MATCH YOUR SEARCH QUERY.'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-mono-tabular text-xs">
                <thead>
                  <tr className="bg-[#131410] border-b-2 border-[#2A2A2A] text-[10px] uppercase text-[#8E8D88]">
                    <th className="py-3 px-4">PO NUMBER</th>
                    <th className="py-3 px-4">BUYER</th>
                    <th className="py-3 px-4">SOLD ITEMS</th>
                    <th className="py-3 px-4 text-right">GROSS SALE</th>
                    <th className="py-3 px-4 text-right">PLATFORM FEE (5%)</th>
                    <th className="py-3 px-4 text-right">NET PAYOUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredPastSaleOrders.map((order) => {
                    const sellerItems = order.items.filter(
                      (i) => i.sellerId === currentUser.id,
                    );
                    const gross = getSellerSubtotal(order);
                    const fee = Math.round(gross * 0.05);
                    const net = gross - fee;

                    return (
                      <tr key={order.id}>
                        <td className="py-3.5 px-4 font-bold text-[#F4F1EA]">
                          {order.poNumber}
                          <div className="text-[10px] font-normal text-[#8E8D88]">
                            {order.createdAt}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#F4F1EA]">
                          {order.buyerCompany}
                        </td>
                        <td className="py-3.5 px-4 text-[#8E8D88]">
                          {sellerItems
                            .map((i) => `${i.qty}× ${i.sku}`)
                            .join(', ')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#F4F1EA]">
                          {formatRs(gross)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#8E8D88]">
                          -{formatRs(fee)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#C6FF3D]">
                          {formatRs(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Completed Rental Sales */}
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                COMPLETED RENTAL & ER PAYOUTS
              </span>
              <span className="text-[#8E8D88]">
                {filteredPastSaleMissions.length} MISSIONS
              </span>
            </div>
            {filteredPastSaleMissions.length === 0 ? (
              <div className="p-6 text-center font-mono-tabular text-xs text-[#8E8D88]">
                {pastSaleMissions.length === 0
                  ? 'NO COMPLETED RENTAL MISSIONS YET.'
                  : 'NO COMPLETED RENTALS MATCH YOUR SEARCH QUERY.'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-mono-tabular text-xs">
                <thead>
                  <tr className="bg-[#131410] border-b-2 border-[#2A2A2A] text-[10px] uppercase text-[#8E8D88]">
                    <th className="py-3 px-4">MISSION</th>
                    <th className="py-3 px-4">RENTER</th>
                    <th className="py-3 px-4">UNIT</th>
                    <th className="py-3 px-4 text-right">NET PAYOUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredPastSaleMissions.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-4 font-bold text-[#F4F1EA]">
                        {m.missionCode}
                      </td>
                      <td className="py-3 px-4 text-[#8E8D88]">{m.buyerName}</td>
                      <td className="py-3 px-4 text-[#F4F1EA]">
                        {m.equipment.name}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#C6FF3D]">
                        {formatRs(Math.round(m.totalCost * 0.95))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SELLER CANCELLATIONS LEDGER */}
      {activeTab === 'cancellations' && (
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                CANCELLED BUYER ORDERS (YOUR INVENTORY)
              </span>
              <span className="text-[#FF2E2E]">
                {filteredCancelledOrders.length} CANCELLED POs
              </span>
            </div>

            {filteredCancelledOrders.length === 0 ? (
              <div className="p-8 text-center font-mono-tabular text-xs text-[#8E8D88]">
                {cancelledOrders.length === 0
                  ? 'ZERO ORDER CANCELLATIONS RECORDED FOR YOUR ACCOUNT.'
                  : 'NO CANCELLED ORDERS MATCH YOUR SEARCH QUERY.'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-mono-tabular text-xs">
                <thead>
                  <tr className="bg-[#131410] border-b-2 border-[#2A2A2A] text-[10px] uppercase text-[#8E8D88]">
                    <th className="py-3 px-4">PO NUMBER</th>
                    <th className="py-3 px-4">BUYER</th>
                    <th className="py-3 px-4">UNITS</th>
                    <th className="py-3 px-4">INITIATED BY</th>
                    <th className="py-3 px-4">CANCELLATION REASON</th>
                    <th className="py-3 px-4 text-right">VOIDED VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredCancelledOrders.map((order) => {
                    const sellerItems = order.items.filter(
                      (i) => i.sellerId === currentUser.id,
                    );
                    return (
                      <tr key={order.id}>
                        <td className="py-3.5 px-4 font-bold text-[#F4F1EA]">
                          {order.poNumber}
                          <div className="text-[10px] font-normal text-[#8E8D88]">
                            {order.cancelledAt || order.createdAt}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#F4F1EA]">
                          {order.buyerCompany}
                        </td>
                        <td className="py-3.5 px-4 text-[#8E8D88]">
                          {sellerItems
                            .map((i) => `${i.qty}× ${i.sku}`)
                            .join(', ')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold border border-[#FF2E2E] text-[#FF2E2E]">
                            {order.cancelledBy || 'BUYER'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#F4F1EA]">
                          {order.cancellationReason || 'UNSPECIFIED'}
                          <div className="text-[10px] text-[#C6FF3D] mt-0.5">
                            STOCK RESTORED · REFUND SETTLED
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#8E8D88] line-through">
                          {formatRs(getSellerSubtotal(order))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
            <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#F4F1EA]">
                ABORTED RENTAL & EMERGENCY DISPATCHES
              </span>
              <span className="text-[#FF2E2E]">
                {filteredCancelledMissions.length} ABORTED
              </span>
            </div>

            {filteredCancelledMissions.length === 0 ? (
              <div className="p-6 text-center font-mono-tabular text-xs text-[#8E8D88]">
                {cancelledMissions.length === 0
                  ? 'NO ABORTED RENTALS RECORDED.'
                  : 'NO ABORTED RENTALS MATCH YOUR SEARCH QUERY.'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-mono-tabular text-xs">
                <thead>
                  <tr className="bg-[#131410] border-b-2 border-[#2A2A2A] text-[10px] uppercase text-[#8E8D88]">
                    <th className="py-3 px-4">MISSION</th>
                    <th className="py-3 px-4">RENTER</th>
                    <th className="py-3 px-4">UNIT</th>
                    <th className="py-3 px-4">REASON</th>
                    <th className="py-3 px-4 text-right">VOIDED FEE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredCancelledMissions.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-4 font-bold text-[#F4F1EA]">
                        {m.missionCode}
                      </td>
                      <td className="py-3 px-4 text-[#8E8D88]">{m.buyerName}</td>
                      <td className="py-3 px-4 text-[#F4F1EA]">
                        {m.equipment.name}
                      </td>
                      <td className="py-3 px-4 text-[#FF2E2E]">
                        {m.cancellationReason || 'ABORTED BY SITE ENGINEER'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#8E8D88] line-through">
                        {formatRs(m.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: LIST NEW HARDWARE */}
      {activeTab === 'create' && (
        <form
          onSubmit={handleCreateUnit}
          className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-6 space-y-6"
        >
          <div className="border-b-2 border-[#2A2A2A] pb-3 flex items-center justify-between">
            <div>
              <div className="font-mono-tabular text-[11px] text-[#FF5A1F] uppercase">
                ADD TO {currentUser.companyName} FLEET
              </div>
              <h2 className="font-display text-3xl text-[#F4F1EA] leading-none mt-1">
                STAGE HARDWARE FOR SALE & RENTAL
              </h2>
            </div>
            <span className="font-mono-tabular text-xs text-[#C6FF3D]">
              ALL PRICING IN INR (Rs.)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-tabular">
            <div className="md:col-span-2">
              <label
                htmlFor="new-equip-name"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                EQUIPMENT MODEL & NAME
              </label>
              <input
                id="new-equip-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="E.G. TITAN 30KW SILENT DIESEL GENSET"
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-sku"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                SKU IDENTIFIER
              </label>
              <input
                id="new-equip-sku"
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-cat"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                CATEGORY
              </label>
              <select
                id="new-equip-cat"
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(
                    e.target.value as Exclude<EquipmentCategory, 'ALL'>,
                  )
                }
                className="input-tactical w-full h-11 px-3 text-xs"
              >
                <option value="POWER">POWER & GEN</option>
                <option value="DEWATERING">DEWATERING</option>
                <option value="HYDRAULIC">HYDRAULIC</option>
                <option value="LIGHTING">SITE LIGHTING</option>
                <option value="CUTTING">CUTTING & ARC</option>
                <option value="AIR">AIR & HEPA</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="new-equip-cond"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                INSPECTION GRADE
              </label>
              <select
                id="new-equip-cond"
                value={newCondition}
                onChange={(e) =>
                  setNewCondition(e.target.value as 'GRADE-A1' | 'GRADE-A2')
                }
                className="input-tactical w-full h-11 px-3 text-xs"
              >
                <option value="GRADE-A1">GRADE-A1 (CERTIFIED)</option>
                <option value="GRADE-A2">GRADE-A2 (FIELD TESTED)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="new-equip-avail"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                STAGING STATUS
              </label>
              <select
                id="new-equip-avail"
                value={newAvailability}
                onChange={(e) =>
                  setNewAvailability(e.target.value as AvailabilityFlag)
                }
                className="input-tactical w-full h-11 px-3 text-xs"
              >
                <option value="IN VEHICLE">IN VEHICLE (RAPID ER)</option>
                <option value="DEPOT READY">DEPOT READY</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="new-equip-output"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                PRIMARY OUTPUT SPEC
              </label>
              <input
                id="new-equip-output"
                type="text"
                value={newOutput}
                onChange={(e) => setNewOutput(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-volt"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                VOLTAGE / PRESSURE INTERFACE
              </label>
              <input
                id="new-equip-volt"
                type="text"
                value={newVoltage}
                onChange={(e) => setNewVoltage(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-node"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                YOUR STAGED DEPOT / VAN NODE
              </label>
              <select
                id="new-equip-node"
                value={newNodeId}
                onChange={(e) => setNewNodeId(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              >
                {myNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.callsign}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new-equip-sale"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                OUTRIGHT SALE PRICE (Rs.)
              </label>
              <input
                id="new-equip-sale"
                type="number"
                value={newPurchasePrice}
                onChange={(e) => setNewPurchasePrice(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-daily"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                DAILY RENTAL RATE (Rs.)
              </label>
              <input
                id="new-equip-daily"
                type="number"
                value={newDailyRate}
                onChange={(e) => setNewDailyRate(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-hourly"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                ER HOURLY RATE (Rs.)
              </label>
              <input
                id="new-equip-hourly"
                type="number"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-deposit"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                SECURITY BOND (Rs.)
              </label>
              <input
                id="new-equip-deposit"
                type="number"
                value={newDeposit}
                onChange={(e) => setNewDeposit(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-stock"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                AVAILABLE STOCK QTY
              </label>
              <input
                id="new-equip-stock"
                type="number"
                min={1}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="new-equip-summary"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                TECHNICAL BRIEF & INCLUDED ACCESSORIES
              </label>
              <input
                id="new-equip-summary"
                type="text"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="CABLES, HOSES, FUEL STATUS, AND RIGGING NOTES..."
                className="input-tactical w-full h-11 px-3 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="new-equip-image"
                className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
              >
                PRODUCT IMAGE
              </label>
              <input
                id="new-equip-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNewImage(file);
                    const reader = new FileReader();
                    reader.onload = (e) => setNewImagePreview(e.target?.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setNewImagePreview(null);
                  }
                }}
                className="input-tactical w-full h-11 px-3 text-xs"
                style={{ display: 'none' }}
              />
              <div
                onClick={() => document.getElementById('new-equip-image')?.click()}
                className="relative inline-flex items-center justify-center w-full h-11 px-3 py-2 border-2 border-dashed border-[#2A2A2A] cursor-pointer hover:border-[#C6FF3D] transition-colors"
              >
                {newImagePreview ? (
                  <img
                    src={newImagePreview}
                    alt="Product preview"
                    className="w-8 h-8 object-cover rounded mr-2"
                  />
                ) : (
                  <div className="w-8 h-8 rounded border border-[#2A2A2A] flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#8E8D88]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 5H5m4 0h6m-6 4h6" />
                    </svg>
                  </div>
                )}
                <span className="absolute right-1 top-1 text-xs text-[#8E8D88]">
                  Browse
                  <input
                    id="new-equip-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewImage(file);
                        const reader = new FileReader();
                        reader.onload = (e) => setNewImagePreview(e.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </span>
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-[#FF2E2E]/15 border-2 border-[#FF2E2E] font-mono-tabular text-xs text-[#FF2E2E]">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className="btn-secondary-mech px-5 py-3 font-mono-tabular text-xs font-bold uppercase cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn-dispatch chamfer-tr px-6 py-3 font-mono-tabular text-xs font-bold uppercase cursor-pointer"
            >
              PUBLISH TO MY INVENTORY
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
