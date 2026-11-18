import {LogOut, Menu, Package, Search, ShoppingBag, X} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  AuthView,
  BuyerOrder,
  DispatchMission,
  EquipmentItem,
  ScreenTab,
  UserRole,
} from '../types/rescue';
import {formatRs} from '../utils/currency';

interface TopBarProps {
  isAuthenticated: boolean;
  role?: UserRole;
  activeScreen: ScreenTab;
  onNavigate: (screen: ScreenTab) => void;
  authView: AuthView;
  onAuthNavigate: (view: AuthView) => void;
  onSignOut: () => void;
  globalSearch?: string;
  onGlobalSearchChange?: (query: string) => void;
  catalog?: EquipmentItem[];
  sellerInventory?: EquipmentItem[];
  sellerOrders?: BuyerOrder[];
  sellerMissions?: DispatchMission[];
  onSelectBuyerResult?: (item: EquipmentItem) => void;
  onViewBuyerCatalog?: (targetScreen: 'buyer' | 'triage') => void;
  onSelectSellerInventory?: (item: EquipmentItem) => void;
  onSelectSellerOrder?: (order: BuyerOrder) => void;
  onSelectSellerMission?: (mission: DispatchMission) => void;
}

const BUYER_NAV: {id: ScreenTab; label: string}[] = [
  {id: 'triage', label: 'Triage Board'},
  {id: 'buyer', label: 'Buyer Desk'},
  {id: 'dispatch', label: 'Active Dispatch'},
  {id: 'ledger', label: 'My Ledger'},
];

const SELLER_NAV: {id: ScreenTab; label: string}[] = [
  {id: 'seller', label: 'Seller & Renter'},
  {id: 'dispatch', label: 'Dispatch Queue'},
  {id: 'nodes', label: 'My Depot Nodes'},
];

const AUTH_NAV: {id: AuthView; label: string}[] = [
  {id: 'register', label: 'Register Account'},
  {id: 'buyer-login', label: 'Buyer Login'},
  {id: 'seller-login', label: 'Seller Login'},
];

export function TopBar({
  isAuthenticated,
  role,
  activeScreen,
  onNavigate,
  authView,
  onAuthNavigate,
  onSignOut,
  globalSearch = '',
  onGlobalSearchChange,
  catalog = [],
  sellerInventory = [],
  sellerOrders = [],
  sellerMissions = [],
  onSelectBuyerResult,
  onViewBuyerCatalog,
  onSelectSellerInventory,
  onSelectSellerOrder,
  onSelectSellerMission,
}: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const navItems = role === 'seller' ? SELLER_NAV : BUYER_NAV;
  const trimmedQuery = globalSearch.trim().toLowerCase();

  // Keyboard shortcuts: '/' or Ctrl/Cmd+K to focus global search; Escape to close
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        desktopInputRef.current?.blur();
        mobileInputRef.current?.blur();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input =
          desktopInputRef.current && desktopInputRef.current.offsetParent !== null
            ? desktopInputRef.current
            : mobileInputRef.current;
        input?.focus();
        setDropdownOpen(true);
      } else if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        const input =
          desktopInputRef.current && desktopInputRef.current.offsetParent !== null
            ? desktopInputRef.current
            : mobileInputRef.current;
        input?.focus();
        setDropdownOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  // Close dropdown on click outside
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  // Buyer live matches (SKU, category, node name, unit name, supplier)
  const buyerMatches = useMemo(() => {
    if (!isAuthenticated || role !== 'buyer' || !trimmedQuery) return [];
    return catalog.filter((item) =>
      `${item.sku} ${item.category} ${item.nodeCallsign} ${item.nodeId} ${item.name} ${item.sellerName} ${item.primaryOutput}`
        .toLowerCase()
        .includes(trimmedQuery),
    );
  }, [isAuthenticated, role, trimmedQuery, catalog]);

  // Seller live matches across inventory, purchase orders, and rental missions
  const sellerMatches = useMemo(() => {
    if (!isAuthenticated || role !== 'seller' || !trimmedQuery) {
      return {
        inventory: [] as EquipmentItem[],
        orders: [] as BuyerOrder[],
        missions: [] as DispatchMission[],
      };
    }

    const inventory = sellerInventory.filter((item) =>
      `${item.sku} ${item.name} ${item.category} ${item.nodeCallsign} ${item.primaryOutput} ${item.availabilityFlag}`
        .toLowerCase()
        .includes(trimmedQuery),
    );

    const orders = sellerOrders.filter((order) => {
      const itemsText = order.items
        .map((i) => `${i.sku} ${i.name}`)
        .join(' ');
      return `${order.poNumber} ${order.buyerCompany} ${order.status} ${order.deliveryAddress} ${order.contactName ?? ''} ${itemsText}`
        .toLowerCase()
        .includes(trimmedQuery);
    });

    const missions = sellerMissions.filter((m) =>
      `${m.missionCode} ${m.buyerName} ${m.status} ${m.dropZoneAddress} ${m.equipment.sku} ${m.equipment.name} ${m.equipment.nodeCallsign}`
        .toLowerCase()
        .includes(trimmedQuery),
    );

    return {inventory, orders, missions};
  }, [
    isAuthenticated,
    role,
    trimmedQuery,
    sellerInventory,
    sellerOrders,
    sellerMissions,
  ]);

  const handleScreenNav = (screen: ScreenTab) => {
    onNavigate(screen);
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleAuthNav = (view: AuthView) => {
    onAuthNavigate(view);
    setMobileMenuOpen(false);
  };

  const handleQueryInput = (val: string) => {
    onGlobalSearchChange?.(val);
    setDropdownOpen(val.trim().length > 0);
  };

  const handleClearSearch = () => {
    onGlobalSearchChange?.('');
    setDropdownOpen(false);
  };

  const totalSellerMatches =
    sellerMatches.inventory.length +
    sellerMatches.orders.length +
    sellerMatches.missions.length;

  const showDropdown = isAuthenticated && dropdownOpen && trimmedQuery.length > 0;

  return (
    <header
      ref={searchWrapperRef}
      className="sticky top-0 z-40 bg-[#131410] border-b-2 border-[#2A2A2A]"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4 xl:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() =>
            isAuthenticated
              ? handleScreenNav(role === 'seller' ? 'seller' : 'buyer')
              : handleAuthNav('register')
          }
          className="font-display text-3xl leading-none tracking-[0.06em] text-[#F4F1EA] hover:text-[#FF5A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C6FF3D]"
        >
          RIGLOCK
        </button>

        {/* Zone 2: Primary Navigation Links */}
        {isAuthenticated ? (
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-5 xl:gap-6 shrink-0"
          >
            {navItems.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScreenNav(item.id)}
                  className={`relative py-2 font-mono-tabular text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#C6FF3D] ${
                    isActive
                      ? 'text-[#F4F1EA]'
                      : 'text-[#8E8D88] hover:text-[#F4F1EA]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 bottom-0 h-[3px] bg-[#FF5A1F]"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        ) : (
          <nav
            aria-label="Portal Authentication Navigation"
            className="hidden lg:flex items-center gap-7"
          >
            {AUTH_NAV.map((item) => {
              const isActive = authView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAuthNav(item.id)}
                  className={`relative py-2 font-mono-tabular text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#C6FF3D] ${
                    isActive
                      ? 'text-[#F4F1EA]'
                      : 'text-[#8E8D88] hover:text-[#F4F1EA]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 right-0 bottom-0 h-[3px] ${
                        item.id === 'seller-login'
                          ? 'bg-[#C6FF3D]'
                          : 'bg-[#FF5A1F]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 2.5: Global Tactical Search Bar (Authenticated Desktop/Tablet) */}
        {isAuthenticated && onGlobalSearchChange && (
          <div className="hidden md:block relative flex-1 max-w-sm">
            <div className="relative flex items-center">
              <Search
                aria-hidden="true"
                className="w-3.5 h-3.5 text-[#8E8D88] absolute left-3 pointer-events-none"
              />
              <input
                ref={desktopInputRef}
                type="text"
                value={globalSearch}
                onChange={(e) => handleQueryInput(e.target.value)}
                onFocus={() => {
                  if (trimmedQuery.length > 0) setDropdownOpen(true);
                }}
                placeholder={
                  role === 'seller'
                    ? 'SEARCH INVENTORY, SKU, OR PO...'
                    : 'SEARCH SKU, CATEGORY, OR NODE...'
                }
                aria-label={
                  role === 'seller'
                    ? 'Global search across seller inventory and orders'
                    : 'Global search across equipment catalog by SKU, category, or node name'
                }
                className="input-tactical w-full h-9 pl-9 pr-14 font-mono-tabular text-[11px] bg-[#1A1A1A] border-2 border-[#2A2A2A] focus:border-[#FF5A1F]"
              />
              {globalSearch ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear global search"
                  className="absolute right-2 p-1 text-[#8E8D88] hover:text-[#FF2E2E] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 px-1.5 py-0.5 bg-[#131410] border border-[#2A2A2A] font-mono-tabular text-[9px] text-[#8E8D88]"
                >
                  /
                </span>
              )}
            </div>
          </div>
        )}

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setDropdownOpen(false);
                onSignOut();
              }}
              className="btn-secondary-mech px-4 py-2 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                handleAuthNav(
                  authView === 'register' ? 'buyer-login' : 'register',
                )
              }
              className="btn-dispatch chamfer-tag px-4 py-2 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {authView === 'register' ? 'Buyer Portal' : 'Register Account'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            className="lg:hidden flex items-center justify-center w-10 h-10 bg-[#1A1A1A] border-2 border-[#2A2A2A] text-[#F4F1EA] cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Global Search Strip (< md) */}
      {isAuthenticated && onGlobalSearchChange && (
        <div className="md:hidden border-t-2 border-[#2A2A2A] bg-[#131410] px-4 py-2">
          <div className="relative flex items-center">
            <Search
              aria-hidden="true"
              className="w-3.5 h-3.5 text-[#8E8D88] absolute left-3 pointer-events-none"
            />
            <input
              ref={mobileInputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => handleQueryInput(e.target.value)}
              onFocus={() => {
                if (trimmedQuery.length > 0) setDropdownOpen(true);
              }}
              placeholder={
                role === 'seller'
                  ? 'SEARCH INVENTORY, SKU, OR PO...'
                  : 'SEARCH SKU, CATEGORY, OR NODE...'
              }
              aria-label={
                role === 'seller'
                  ? 'Global search across seller inventory and orders'
                  : 'Global search across equipment catalog'
              }
              className="input-tactical w-full h-9 pl-9 pr-9 font-mono-tabular text-[11px] bg-[#1A1A1A] border-2 border-[#2A2A2A]"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear mobile search"
                className="absolute right-2 p-1 text-[#8E8D88] hover:text-[#FF2E2E] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Search Quick-Jump Dropdown */}
      {showDropdown && (
        <div
          role="region"
          aria-label="Global Search Results"
          className="absolute left-0 right-0 z-50 border-b-2 border-[#FF5A1F] bg-[#131410] shadow-hard"
        >
          <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-4 space-y-3 font-mono-tabular">
            {role === 'buyer' ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-b border-[#2A2A2A] pb-2">
                  <span className="text-[#8E8D88] uppercase">
                    EQUIPMENT CATALOG MATCHES FOR{' '}
                    <span className="text-[#F4F1EA] font-bold">
                      &quot;{globalSearch.trim()}&quot;
                    </span>
                  </span>
                  <span className="text-[#C6FF3D] font-bold">
                    {buyerMatches.length} FOUND
                  </span>
                </div>

                {buyerMatches.length === 0 ? (
                  <div className="p-4 bg-[#1A1A1A] border-2 border-[#2A2A2A] text-xs text-[#8E8D88]">
                    NO HARDWARE UNITS MATCH THIS SKU, CATEGORY, OR NODE NAME.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {buyerMatches.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectBuyerResult?.(item);
                          setDropdownOpen(false);
                        }}
                        className="p-3 bg-[#1A1A1A] border-2 border-[#2A2A2A] hover:border-[#FF5A1F] text-left flex items-start justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 bg-[#242424] text-[#FF5A1F] font-bold border border-[#2A2A2A]">
                              {item.sku}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#131410] text-[#C6FF3D] border border-[#2A2A2A]">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-[#F4F1EA] truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-[#8E8D88] truncate">
                            NODE: {item.nodeCallsign}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-[#F4F1EA]">
                            {formatRs(item.purchasePrice)}
                          </div>
                          <div className="text-[10px] text-[#C6FF3D]">
                            {formatRs(item.rentalDailyRate)}/DAY
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2A2A2A] text-[11px]">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onViewBuyerCatalog?.('buyer');
                        setDropdownOpen(false);
                      }}
                      className="btn-dispatch px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      FILTER IN BUYER DESK ({buyerMatches.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onViewBuyerCatalog?.('triage');
                        setDropdownOpen(false);
                      }}
                      className="btn-secondary-mech px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      FILTER IN TRIAGE BOARD
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(false)}
                    className="text-[10px] text-[#8E8D88] hover:text-[#F4F1EA] uppercase cursor-pointer"
                  >
                    CLOSE [ESC]
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-b border-[#2A2A2A] pb-2">
                  <span className="text-[#8E8D88] uppercase">
                    SELLER INVENTORY & ORDER MATCHES FOR{' '}
                    <span className="text-[#F4F1EA] font-bold">
                      &quot;{globalSearch.trim()}&quot;
                    </span>
                  </span>
                  <span className="text-[#C6FF3D] font-bold">
                    {totalSellerMatches} FOUND
                  </span>
                </div>

                {totalSellerMatches === 0 ? (
                  <div className="p-4 bg-[#1A1A1A] border-2 border-[#2A2A2A] text-xs text-[#8E8D88]">
                    NO UNITS IN YOUR INVENTORY OR PURCHASE ORDERS MATCH THIS QUERY.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Seller Inventory Matches */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-[#FF5A1F] font-bold uppercase flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        YOUR INVENTORY ({sellerMatches.inventory.length})
                      </div>
                      {sellerMatches.inventory.length === 0 ? (
                        <div className="p-3 bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] text-[#8E8D88]">
                          NO MATCHING INVENTORY SKUs.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {sellerMatches.inventory.slice(0, 4).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                onSelectSellerInventory?.(item);
                                setDropdownOpen(false);
                              }}
                              className="w-full p-2.5 bg-[#1A1A1A] border-2 border-[#2A2A2A] hover:border-[#FF5A1F] text-left flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-[#F4F1EA] truncate">
                                  {item.sku} · {item.name}
                                </div>
                                <div className="text-[10px] text-[#8E8D88] truncate">
                                  {item.category} · {item.nodeCallsign} ·{' '}
                                  {item.stockQty} IN STOCK
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-[#FF5A1F]">
                                  {formatRs(item.purchasePrice)}
                                </div>
                                <div className="text-[10px] text-[#C6FF3D]">
                                  {item.availabilityFlag}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Seller Orders & Rental Matches */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-[#C6FF3D] font-bold uppercase flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        YOUR ORDERS & RENTALS (
                        {sellerMatches.orders.length +
                          sellerMatches.missions.length}
                        )
                      </div>
                      {sellerMatches.orders.length === 0 &&
                      sellerMatches.missions.length === 0 ? (
                        <div className="p-3 bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] text-[#8E8D88]">
                          NO MATCHING PURCHASE ORDERS OR RENTALS.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {sellerMatches.orders.slice(0, 3).map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => {
                                onSelectSellerOrder?.(order);
                                setDropdownOpen(false);
                              }}
                              className="w-full p-2.5 bg-[#1A1A1A] border-2 border-[#2A2A2A] hover:border-[#C6FF3D] text-left flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-[#F4F1EA] truncate">
                                  {order.poNumber} · {order.buyerCompany}
                                </div>
                                <div className="text-[10px] text-[#8E8D88] truncate">
                                  {order.status.replace(/_/g, ' ')} ·{' '}
                                  {order.items.map((i) => i.sku).join(', ')}
                                </div>
                              </div>
                              <div className="text-xs font-bold text-[#C6FF3D] shrink-0">
                                {formatRs(order.grandTotal)}
                              </div>
                            </button>
                          ))}

                          {sellerMatches.missions.slice(0, 2).map((mission) => (
                            <button
                              key={mission.id}
                              type="button"
                              onClick={() => {
                                onSelectSellerMission?.(mission);
                                setDropdownOpen(false);
                              }}
                              className="w-full p-2.5 bg-[#1A1A1A] border-2 border-[#2A2A2A] hover:border-[#C6FF3D] text-left flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-[#F4F1EA] truncate">
                                  {mission.missionCode} · {mission.buyerName}
                                </div>
                                <div className="text-[10px] text-[#8E8D88] truncate">
                                  RENTAL ({mission.status}) ·{' '}
                                  {mission.equipment.sku}
                                </div>
                              </div>
                              <div className="text-xs font-bold text-[#C6FF3D] shrink-0">
                                {formatRs(mission.totalCost)}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-[#2A2A2A]">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(false)}
                    className="text-[10px] text-[#8E8D88] hover:text-[#F4F1EA] uppercase cursor-pointer"
                  >
                    CLOSE [ESC]
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t-2 border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 flex flex-col gap-1"
        >
          {isAuthenticated
            ? navItems.map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleScreenNav(item.id)}
                    className={`w-full text-left px-3 py-2.5 font-mono-tabular text-xs font-semibold uppercase tracking-[0.08em] border-2 cursor-pointer ${
                      isActive
                        ? 'bg-[#242424] border-[#FF5A1F] text-[#F4F1EA]'
                        : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })
            : AUTH_NAV.map((item) => {
                const isActive = authView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAuthNav(item.id)}
                    className={`w-full text-left px-3 py-2.5 font-mono-tabular text-xs font-semibold uppercase tracking-[0.08em] border-2 cursor-pointer ${
                      isActive
                        ? 'bg-[#242424] border-[#FF5A1F] text-[#F4F1EA]'
                        : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
        </nav>
      )}
    </header>
  );
}
