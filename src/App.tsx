import {useEffect, useMemo, useState} from 'react';
import {ActiveDispatchScreen} from './components/ActiveDispatchScreen';
import {BuyerLoginScreen} from './components/BuyerLoginScreen';
import {BuyerScreen} from './components/BuyerScreen';
import {DepotNodesScreen} from './components/DepotNodesScreen';
import {DispatchStagingDrawer} from './components/DispatchStagingDrawer';
import {MissionLogScreen} from './components/MissionLogScreen';
import {RegisterScreen} from './components/RegisterScreen';
import {SellerLoginScreen} from './components/SellerLoginScreen';
import {SellerRenterScreen} from './components/SellerRenterScreen';
import {TopBar} from './components/TopBar';
import {TriageBoardScreen} from './components/TriageBoardScreen';
import {
  DEPOT_NODES,
  EQUIPMENT_CATALOG,
  INITIAL_BUYER_ORDERS,
  INITIAL_MISSION_LEDGER,
  SEEDED_ACCOUNTS,
} from './data/catalog';
import {
  AuthAccount,
  AuthView,
  BuyerOrder,
  BuyerOrderStatus,
  BuyerTab,
  DepotNode,
  DispatchMission,
  DispatchMode,
  EquipmentItem,
  MissionStatus,
  ScreenTab,
  SellerTab,
  UserRole,
} from './types/rescue';

const STORAGE_KEYS = {
  accounts: 'riglock_accounts_v1',
  session: 'riglock_session_v1',
  catalog: 'riglock_catalog_v1',
  orders: 'riglock_orders_v1',
  missions: 'riglock_missions_v1',
  nodes: 'riglock_nodes_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatClockTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export default function App() {
  const [accounts, setAccounts] = useState<AuthAccount[]>(() =>
    readStorage<AuthAccount[]>(STORAGE_KEYS.accounts, SEEDED_ACCOUNTS),
  );
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(() =>
    readStorage<AuthAccount | null>(STORAGE_KEYS.session, null),
  );
  const [authView, setAuthView] = useState<AuthView>('register');
  const [registerRole, setRegisterRole] = useState<UserRole>('buyer');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [activeScreen, setActiveScreen] = useState<ScreenTab>(() =>
    currentUser?.role === 'seller' ? 'seller' : 'buyer',
  );
  const [mode, setMode] = useState<DispatchMode>('emergency');
  const [catalog, setCatalog] = useState<EquipmentItem[]>(() => {
    const stored = readStorage<EquipmentItem[]>(
      STORAGE_KEYS.catalog,
      EQUIPMENT_CATALOG,
    );
    const storedIds = new Set(stored.map((item) => item.id));
    const missingDefaults = EQUIPMENT_CATALOG.filter(
      (item) => !storedIds.has(item.id),
    );
    return missingDefaults.length > 0 ? [...stored, ...missingDefaults] : stored;
  });
  const [orders, setOrders] = useState<BuyerOrder[]>(() =>
    readStorage<BuyerOrder[]>(STORAGE_KEYS.orders, INITIAL_BUYER_ORDERS),
  );
  const [nodes, setNodes] = useState<DepotNode[]>(() =>
    readStorage<DepotNode[]>(STORAGE_KEYS.nodes, DEPOT_NODES),
  );
  const [missions, setMissions] = useState<DispatchMission[]>(() =>
    readStorage<DispatchMission[]>(
      STORAGE_KEYS.missions,
      INITIAL_MISSION_LEDGER,
    ),
  );

  const [stagingEquipment, setStagingEquipment] =
    useState<EquipmentItem | null>(null);
  const [nodeFilter, setNodeFilter] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [buyerTabIntent, setBuyerTabIntent] = useState<{
    tab: BuyerTab;
    seq: number;
  } | null>(null);
  const [sellerTabIntent, setSellerTabIntent] = useState<{
    tab: SellerTab;
    seq: number;
  } | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string>(
    INITIAL_MISSION_LEDGER[0].id,
  );

  // Sync state to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.accounts,
        JSON.stringify(accounts),
      );
      window.localStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify(currentUser),
      );
      window.localStorage.setItem(
        STORAGE_KEYS.catalog,
        JSON.stringify(catalog),
      );
      window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
      window.localStorage.setItem(
        STORAGE_KEYS.missions,
        JSON.stringify(missions),
      );
      window.localStorage.setItem(STORAGE_KEYS.nodes, JSON.stringify(nodes));
    } catch {
      // Ignore storage quota errors
    }
  }, [accounts, currentUser, catalog, orders, missions, nodes]);

  // Strict Buyer-isolated views for authenticated buyer
  const myBuyerOrders = useMemo(() => {
    if (!currentUser || currentUser.role !== 'buyer') return [];
    return orders.filter((o) => o.buyerId === currentUser.id);
  }, [orders, currentUser]);

  const myBuyerMissions = useMemo(() => {
    if (!currentUser || currentUser.role !== 'buyer') return [];
    return missions.filter((m) => m.buyerId === currentUser.id);
  }, [missions, currentUser]);

  // Strict Seller-isolated views for authenticated seller
  const mySellerInventory = useMemo(() => {
    if (!currentUser || currentUser.role !== 'seller') return [];
    return catalog.filter((item) => item.sellerId === currentUser.id);
  }, [catalog, currentUser]);

  const mySellerOrders = useMemo(() => {
    if (!currentUser || currentUser.role !== 'seller') return [];
    return orders.filter((o) =>
      o.items.some((line) => line.sellerId === currentUser.id),
    );
  }, [orders, currentUser]);

  const mySellerMissions = useMemo(() => {
    if (!currentUser || currentUser.role !== 'seller') return [];
    return missions.filter((m) => m.equipment.sellerId === currentUser.id);
  }, [missions, currentUser]);

  const mySellerNodes = useMemo(() => {
    if (!currentUser || currentUser.role !== 'seller') return [];
    return nodes.filter((n) => n.sellerId === currentUser.id);
  }, [nodes, currentUser]);

  const visibleMissions =
    currentUser?.role === 'seller' ? mySellerMissions : myBuyerMissions;

  const activeMission = useMemo(() => {
    const exact = visibleMissions.find((m) => m.id === activeMissionId);
    if (exact) return exact;
    return (
      visibleMissions.find(
        (m) => m.status !== 'COMPLETED' && m.status !== 'ABORTED',
      ) ??
      visibleMissions[0] ??
      null
    );
  }, [visibleMissions, activeMissionId]);

  // Live 1-second countdown ticker for active in-flight missions
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => {
      setMissions((prev) =>
        prev.map((m) => {
          if (
            m.id !== activeMissionId ||
            m.status === 'COMPLETED' ||
            m.status === 'ABORTED' ||
            m.status === 'ARRIVED'
          ) {
            return m;
          }
          const decrement = m.priorityOverride ? 2 : 1;
          const nextRemaining = Math.max(0, m.remainingSeconds - decrement);
          if (nextRemaining === 0) {
            return {
              ...m,
              remainingSeconds: 0,
              status: 'ARRIVED',
              logs: [
                ...m.logs,
                {
                  id: `log-arr-${Date.now()}`,
                  timestamp: formatClockTime(),
                  source: 'COURIER',
                  message: `UNIT ARRIVED AT DROP ZONE. PRESENT HANDOFF PIN ${m.handoffPin}.`,
                },
              ],
            };
          }
          return {...m, remainingSeconds: nextRemaining};
        }),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeMissionId, currentUser]);

  // Registration & Role-Locked Login Handlers
  const handleRegisterAccount = (account: AuthAccount) => {
    setAccounts((prev) => [account, ...prev]);

    if (account.role === 'seller') {
      const starterNode: DepotNode = {
        id: `node-${account.id}`,
        callsign: `DEPOT // ${account.depotRegion || account.companyName}`,
        region: account.siteOrDepotAddress,
        status: 'LIVE NODE',
        coordinates: '19.0760° N, 72.8777° E',
        mapX: 48,
        mapY: 46,
        distanceMiles: 1.5,
        rating: 4.95,
        lastPingSeconds: 5,
        activeUnits: 0,
        slaMinutes: 25,
        vehicleType: '24/7 STAGING DEPOT',
        depositTier: 'TIER-1 BOND',
        sellerId: account.id,
        leadTech: account.fullName,
      };
      setNodes((prev) => [starterNode, ...prev]);
    }

    setAuthNotice(
      `REGISTRATION COMPLETE FOR ${account.email.toUpperCase()} (${
        account.role === 'buyer' ? 'BUYER' : 'SELLER & RENTER'
      }). ENTER YOUR EMAIL AND PASSWORD TO SIGN IN.`,
    );
    setAuthView(account.role === 'buyer' ? 'buyer-login' : 'seller-login');
  };

  const handlePortalLogin = (
    expectedRole: UserRole,
    email: string,
    password: string,
  ): string | null => {
    const found = accounts.find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase(),
    );

    if (!found) {
      return 'NO ACCOUNT REGISTERED WITH THIS EMAIL. PLEASE REGISTER FIRST AND CHOOSE YOUR ACCOUNT ROLE.';
    }

    if (found.role !== expectedRole) {
      return expectedRole === 'buyer'
        ? 'ACCESS DENIED: THIS EMAIL IS REGISTERED AS A SELLER & RENTER ACCOUNT. YOU CANNOT SIGN INTO THE BUYER PORTAL WITH SELLER CREDENTIALS.'
        : 'ACCESS DENIED: THIS EMAIL IS REGISTERED AS A BUYER ACCOUNT. YOU CANNOT SIGN INTO THE SELLER PORTAL WITH BUYER CREDENTIALS.';
    }

    if (found.password !== password) {
      return 'INVALID PASSWORD. CHECK YOUR CREDENTIALS AND TRY AGAIN.';
    }

    setAuthNotice(null);
    setCurrentUser(found);
    setStagingEquipment(null);
    setNodeFilter(null);
    setGlobalSearchQuery('');
    setActiveScreen(found.role === 'buyer' ? 'buyer' : 'seller');
    return null;
  };

  const handleSignOut = () => {
    const prevRole = currentUser?.role ?? 'buyer';
    setCurrentUser(null);
    setStagingEquipment(null);
    setNodeFilter(null);
    setGlobalSearchQuery('');
    setAuthNotice('SIGNED OUT SAFELY. AUTHENTICATE WITH YOUR ROLE PORTAL.');
    setAuthView(prevRole === 'seller' ? 'seller-login' : 'buyer-login');
  };

  const handleConfirmDispatch = (payload: {
    equipment: EquipmentItem;
    mode: DispatchMode;
    dropZoneAddress: string;
    siteContact: string;
    rentalDays: number;
    priorityOverride: boolean;
    totalCost: number;
  }) => {
    if (!currentUser || currentUser.role !== 'buyer') return;

    const randomNum = Math.floor(910 + Math.random() * 85);
    const pinA = Math.floor(100 + Math.random() * 899);
    const pinB = Math.floor(1 + Math.random() * 8);
    const missionCode = `OP-${randomNum}-ALPHA`;
    const etaMins = payload.priorityOverride
      ? Math.max(10, payload.equipment.etaMinutes - 6)
      : payload.equipment.etaMinutes;
    const totalWindowSeconds = 45 * 60;
    const initialRemaining = etaMins * 60;

    const newMission: DispatchMission = {
      id: `mis-${Date.now()}`,
      missionCode,
      buyerId: currentUser.id,
      buyerName: currentUser.companyName,
      equipment: payload.equipment,
      mode: payload.mode,
      dropZoneAddress: payload.dropZoneAddress,
      siteContact: payload.siteContact,
      siteCoordinates: '37.7749° N, 122.4194° W',
      priorityOverride: payload.priorityOverride,
      etaTotalSeconds: totalWindowSeconds,
      remainingSeconds: initialRemaining,
      status: 'VERIFIED',
      handoffPin: `${pinA}-${pinB}`,
      courierName: payload.equipment.courierName,
      courierPlate: payload.equipment.courierPlate,
      startedAt: `${formatClockTime()} IST`,
      totalCost: payload.totalCost,
      rentalDays: payload.rentalDays,
      logs: [
        {
          id: `log-init-${Date.now()}`,
          timestamp: formatClockTime(),
          source: 'SYSTEM',
          message: `${missionCode} LOCKED · ${payload.equipment.sku} ASSIGNED TO ${payload.equipment.nodeCallsign}`,
        },
        {
          id: `log-prep-${Date.now() + 1}`,
          timestamp: formatClockTime(),
          source: 'COURIER',
          message: `TELEMETRY CONFIRMED BY ${payload.equipment.courierName} (${payload.equipment.courierPlate}). PREPARING ROLL-OUT.`,
        },
      ],
    };

    setMissions((prev) => [newMission, ...prev]);
    setActiveMissionId(newMission.id);
    setStagingEquipment(null);
    setActiveScreen('dispatch');
  };

  const handleAdvanceStage = () => {
    if (!activeMission) return;
    const order: MissionStatus[] = [
      'VERIFIED',
      'LOADED',
      'EN_ROUTE',
      'ARRIVED',
      'COMPLETED',
    ];
    const currentIdx = order.indexOf(activeMission.status);
    if (currentIdx === -1 || currentIdx >= order.length - 1) return;

    const nextStatus = order[currentIdx + 1];
    const stageMessage: Record<MissionStatus, string> = {
      VERIFIED: 'HARDWARE QA CHECKLIST SIGNED OFF.',
      LOADED: `UNIT SECURED ON ${activeMission.courierPlate}. ROLLING OUT TO SITE.`,
      EN_ROUTE: `COURIER EN ROUTE VIA EXPRESS CORRIDOR TO ${activeMission.dropZoneAddress}.`,
      ARRIVED: `ON SITE AT DROP ZONE. AWAITING HANDOFF PIN ${activeMission.handoffPin}.`,
      COMPLETED: `HANDOFF PIN ${activeMission.handoffPin} VERIFIED. EQUIPMENT DEPLOYED ON SITE.`,
      ABORTED: 'DISPATCH ABORTED.',
    };

    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMission.id) return m;
        const nextRemaining =
          nextStatus === 'ARRIVED' || nextStatus === 'COMPLETED'
            ? 0
            : nextStatus === 'EN_ROUTE'
            ? Math.min(m.remainingSeconds, 14 * 60)
            : m.remainingSeconds;
        return {
          ...m,
          status: nextStatus,
          remainingSeconds: nextRemaining,
          logs: [
            ...m.logs,
            {
              id: `log-stg-${Date.now()}`,
              timestamp: formatClockTime(),
              source: nextStatus === 'COMPLETED' ? 'SYSTEM' : 'COURIER',
              message: stageMessage[nextStatus],
            },
          ],
        };
      }),
    );
  };

  const handleToggleOverride = () => {
    if (!activeMission) return;
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMission.id) return m;
        const nextOverride = !m.priorityOverride;
        return {
          ...m,
          priorityOverride: nextOverride,
          remainingSeconds: nextOverride
            ? Math.max(120, Math.floor(m.remainingSeconds * 0.72))
            : m.remainingSeconds,
          logs: [
            ...m.logs,
            {
              id: `log-ovr-${Date.now()}`,
              timestamp: formatClockTime(),
              source: 'SYSTEM',
              message: nextOverride
                ? 'TIER-0 EMERGENCY OVERRIDE ENGAGED · PRIORITY ROUTING ACTIVE.'
                : 'EMERGENCY OVERRIDE DISENGAGED · RETURNED TO STANDARD ER SLA.',
            },
          ],
        };
      }),
    );
  };

  const handleAbortMission = () => {
    if (!activeMission || !currentUser) return;
    setMissions((prev) =>
      prev.map((m) =>
        m.id === activeMission.id
          ? {
              ...m,
              status: 'ABORTED',
              cancellationReason: `ABORTED BY ${currentUser.role.toUpperCase()}`,
              logs: [
                ...m.logs,
                {
                  id: `log-abt-${Date.now()}`,
                  timestamp: formatClockTime(),
                  source: 'SITE',
                  message: `DISPATCH ABORTED BY ${currentUser.role.toUpperCase()}. BOND RELEASED.`,
                },
              ],
            }
          : m,
      ),
    );
  };

  const handleSendSiteNote = (note: string) => {
    if (!activeMission) return;
    setMissions((prev) =>
      prev.map((m) =>
        m.id === activeMission.id
          ? {
              ...m,
              logs: [
                ...m.logs,
                {
                  id: `log-note-${Date.now()}`,
                  timestamp: formatClockTime(),
                  source: 'SITE',
                  message: note,
                },
              ],
            }
          : m,
      ),
    );
  };

  const handleInspectNodeInventory = (nodeId: string) => {
    if (!currentUser) return;
    setNodeFilter(nodeId);
    setActiveScreen(currentUser.role === 'buyer' ? 'triage' : 'seller');
  };

  // Buyer places PO -> decrement stock
  const handlePlaceBuyerOrder = (order: BuyerOrder) => {
    setOrders((prev) => [order, ...prev]);
    setCatalog((prev) =>
      prev.map((item) => {
        const orderedLine = order.items.find((l) => l.equipmentId === item.id);
        if (!orderedLine) return item;
        return {
          ...item,
          stockQty: Math.max(0, item.stockQty - orderedLine.qty),
        };
      }),
    );
  };

  // Buyer or Seller cancels PO -> restore stock and record cancellation reason
  const handleCancelOrder = (
    orderId: string,
    reason: string,
    cancelledBy: 'BUYER' | 'SELLER',
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const status: BuyerOrderStatus =
      cancelledBy === 'BUYER' ? 'CANCELLED_BY_BUYER' : 'CANCELLED_BY_SELLER';

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              cancelledBy,
              cancellationReason: reason,
              cancelledAt: `2026-11-17 ${formatClockTime().slice(0, 5)} IST`,
            }
          : o,
      ),
    );

    setCatalog((prev) =>
      prev.map((item) => {
        const line = targetOrder.items.find((l) => l.equipmentId === item.id);
        if (!line) return item;
        return {...item, stockQty: item.stockQty + line.qty};
      }),
    );
  };

  const handleRentFromBuyer = (item: EquipmentItem) => {
    setMode('rental');
    setStagingEquipment(item);
  };

  // Seller & Renter handlers scoped strictly to authenticated seller
  const handleToggleAvailability = (id: string) => {
    if (!currentUser || currentUser.role !== 'seller') return;
    setCatalog((prev) =>
      prev.map((item) =>
        item.id === id && item.sellerId === currentUser.id
          ? {
              ...item,
              availabilityFlag:
                item.availabilityFlag === 'IN VEHICLE'
                  ? 'DEPOT READY'
                  : 'IN VEHICLE',
            }
          : item,
      ),
    );
  };

  const handleUpdateRates = (
    id: string,
    rates: {
      purchasePrice: number;
      rentalDailyRate: number;
      emergencyHourlyRate: number;
      stockQty: number;
    },
  ) => {
    if (!currentUser || currentUser.role !== 'seller') return;
    setCatalog((prev) =>
      prev.map((item) =>
        item.id === id && item.sellerId === currentUser.id
          ? {
              ...item,
              purchasePrice: rates.purchasePrice,
              rentalDailyRate: rates.rentalDailyRate,
              rentalWeeklyRate: Math.round(rates.rentalDailyRate * 5.2),
              emergencyHourlyRate: rates.emergencyHourlyRate,
              stockQty: rates.stockQty,
            }
          : item,
      ),
    );
  };

  const handleAddEquipment = (item: EquipmentItem) => {
    setCatalog((prev) => [item, ...prev]);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === item.nodeId ? {...n, activeUnits: n.activeUnits + 1} : n,
      ),
    );
  };

  const handleRemoveEquipment = (id: string) => {
    if (!currentUser || currentUser.role !== 'seller') return;
    setCatalog((prev) =>
      prev.filter(
        (item) => !(item.id === id && item.sellerId === currentUser.id),
      ),
    );
  };

  const handleAdvanceOrderStatus = (
    orderId: string,
    nextStatus: BuyerOrderStatus,
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? {...o, status: nextStatus} : o)),
    );
  };

  // Unauthenticated Portal View (Registration + Separate Buyer & Seller Login Screens)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-tactical-grid text-[#F4F1EA] flex flex-col">
        <TopBar
          isAuthenticated={false}
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          authView={authView}
          onAuthNavigate={(view) => {
            setAuthNotice(null);
            setAuthView(view);
          }}
          onSignOut={handleSignOut}
        />

        <main className="flex-1">
          {authView === 'register' && (
            <RegisterScreen
              key={registerRole}
              initialRole={registerRole}
              existingEmails={accounts.map((a) => a.email.toLowerCase())}
              onRegister={handleRegisterAccount}
              onNavigateAuth={(view) => {
                setAuthNotice(null);
                setAuthView(view);
              }}
            />
          )}

          {authView === 'buyer-login' && (
            <BuyerLoginScreen
              notice={authNotice}
              onLogin={(email, password) =>
                handlePortalLogin('buyer', email, password)
              }
              onNavigateAuth={(view) => {
                setAuthNotice(null);
                setAuthView(view);
              }}
              onStartBuyerRegistration={() => {
                setAuthNotice(null);
                setRegisterRole('buyer');
                setAuthView('register');
              }}
            />
          )}

          {authView === 'seller-login' && (
            <SellerLoginScreen
              notice={authNotice}
              onLogin={(email, password) =>
                handlePortalLogin('seller', email, password)
              }
              onNavigateAuth={(view) => {
                setAuthNotice(null);
                setAuthView(view);
              }}
              onStartSellerRegistration={() => {
                setAuthNotice(null);
                setRegisterRole('seller');
                setAuthView('register');
              }}
            />
          )}
        </main>

        <footer className="border-t-2 border-[#2A2A2A] bg-[#131410] mt-12">
          <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-tabular text-[11px] text-[#8E8D88]">
            <div>
              RIGLOCK INDUSTRIAL RESCUE DISPATCH · ROLE-LOCKED ACCESS PORTALS
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="hover:text-[#F4F1EA] cursor-pointer uppercase"
              >
                Register Account
              </button>
              <button
                type="button"
                onClick={() => setAuthView('buyer-login')}
                className="hover:text-[#FF5A1F] cursor-pointer uppercase"
              >
                Buyer Login
              </button>
              <button
                type="button"
                onClick={() => setAuthView('seller-login')}
                className="hover:text-[#C6FF3D] cursor-pointer uppercase"
              >
                Seller Login
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-tactical-grid text-[#F4F1EA] flex flex-col">
      <TopBar
        isAuthenticated
        role={role}
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        authView={authView}
        onAuthNavigate={setAuthView}
        onSignOut={handleSignOut}
        globalSearch={globalSearchQuery}
        onGlobalSearchChange={setGlobalSearchQuery}
        catalog={role === 'buyer' ? catalog : undefined}
        sellerInventory={role === 'seller' ? mySellerInventory : undefined}
        sellerOrders={role === 'seller' ? mySellerOrders : undefined}
        sellerMissions={role === 'seller' ? mySellerMissions : undefined}
        onSelectBuyerResult={(item) => {
          setGlobalSearchQuery(item.sku);
          setActiveScreen('buyer');
          setBuyerTabIntent({tab: 'products', seq: Date.now()});
        }}
        onViewBuyerCatalog={(target) => {
          setActiveScreen(target);
          if (target === 'buyer') {
            setBuyerTabIntent({tab: 'products', seq: Date.now()});
          }
        }}
        onSelectSellerInventory={(item) => {
          setGlobalSearchQuery(item.sku);
          setActiveScreen('seller');
          setSellerTabIntent({tab: 'inventory', seq: Date.now()});
        }}
        onSelectSellerOrder={(order) => {
          const tab: SellerTab =
            order.status === 'DELIVERED'
              ? 'past_sales'
              : order.status === 'CANCELLED_BY_BUYER' ||
                  order.status === 'CANCELLED_BY_SELLER'
                ? 'cancellations'
                : 'orders';
          setGlobalSearchQuery(order.poNumber);
          setActiveScreen('seller');
          setSellerTabIntent({tab, seq: Date.now()});
        }}
        onSelectSellerMission={(mission) => {
          const tab: SellerTab =
            mission.status === 'COMPLETED'
              ? 'past_sales'
              : mission.status === 'ABORTED'
                ? 'cancellations'
                : 'orders';
          setGlobalSearchQuery(mission.missionCode);
          setActiveScreen('seller');
          setSellerTabIntent({tab, seq: Date.now()});
        }}
      />

      {/* Authenticated Account Context Strip (Strictly Role-Locked) */}
      <div className="bg-[#1A1A1A] border-b-2 border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono-tabular text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-2 py-0.5 font-bold border border-[#0D0D0D] ${
                role === 'buyer'
                  ? 'bg-[#FF5A1F] text-[#121212]'
                  : 'bg-halftone-lime text-[#121212]'
              }`}
            >
              {role === 'buyer' ? 'BUYER ACCOUNT' : 'SELLER & RENTER ACCOUNT'}
            </span>
            <span className="text-[#F4F1EA] font-semibold">
              {currentUser.companyName} · {currentUser.fullName}
            </span>
            <span className="text-[#8E8D88]">
              {currentUser.email} · GSTIN {currentUser.gstin}
            </span>
          </div>

          <span className="text-[#8E8D88] uppercase">
            {role === 'buyer'
              ? 'ISOLATED BUYER SESSION'
              : 'ISOLATED SELLER SESSION'}
          </span>
        </div>
      </div>

      <main className="flex-1">
        {role === 'buyer' && activeScreen === 'triage' && (
          <TriageBoardScreen
            catalog={catalog}
            mode={mode}
            onModeChange={setMode}
            onSelectEquipment={(item) => setStagingEquipment(item)}
            nodeFilter={nodeFilter}
            onClearNodeFilter={() => setNodeFilter(null)}
            searchQuery={globalSearchQuery}
            onSearchChange={setGlobalSearchQuery}
          />
        )}

        {role === 'buyer' && activeScreen === 'buyer' && (
          <BuyerScreen
            currentUser={currentUser}
            catalog={catalog}
            myOrders={myBuyerOrders}
            myMissions={myBuyerMissions}
            onPlaceOrder={handlePlaceBuyerOrder}
            onCancelOrder={(orderId, reason) =>
              handleCancelOrder(orderId, reason, 'BUYER')
            }
            onRentUnit={handleRentFromBuyer}
            onOpenMission={(missionId) => {
              setActiveMissionId(missionId);
              setActiveScreen('dispatch');
            }}
            searchQuery={globalSearchQuery}
            onSearchChange={setGlobalSearchQuery}
            requestedTab={buyerTabIntent}
          />
        )}

        {role === 'buyer' && activeScreen === 'ledger' && (
          <MissionLogScreen
            missions={myBuyerMissions}
            onRedispatch={(eq) => {
              setStagingEquipment(eq);
            }}
            onOpenActiveDispatch={(missionId) => {
              setActiveMissionId(missionId);
              setActiveScreen('dispatch');
            }}
          />
        )}

        {role === 'seller' && activeScreen === 'seller' && (
          <SellerRenterScreen
            currentUser={currentUser}
            myInventory={mySellerInventory}
            myOrders={mySellerOrders}
            myMissions={mySellerMissions}
            myNodes={mySellerNodes}
            onToggleAvailability={handleToggleAvailability}
            onUpdateRates={handleUpdateRates}
            onAddEquipment={handleAddEquipment}
            onRemoveEquipment={handleRemoveEquipment}
            onAdvanceOrderStatus={handleAdvanceOrderStatus}
            onCancelOrder={(orderId, reason) =>
              handleCancelOrder(orderId, reason, 'SELLER')
            }
            onOpenMission={(missionId) => {
              setActiveMissionId(missionId);
              setActiveScreen('dispatch');
            }}
            searchQuery={globalSearchQuery}
            onSearchChange={setGlobalSearchQuery}
            requestedTab={sellerTabIntent}
          />
        )}

        {role === 'seller' && activeScreen === 'nodes' && (
          <DepotNodesScreen
            nodes={mySellerNodes}
            onInspectNodeInventory={handleInspectNodeInventory}
          />
        )}

        {activeScreen === 'dispatch' && (
          <ActiveDispatchScreen
            mission={activeMission}
            onAdvanceStage={handleAdvanceStage}
            onToggleOverride={handleToggleOverride}
            onAbortMission={handleAbortMission}
            onSendSiteNote={handleSendSiteNote}
            onReturnToBoard={() =>
              setActiveScreen(role === 'buyer' ? 'triage' : 'seller')
            }
          />
        )}
      </main>

      <footer className="border-t-2 border-[#2A2A2A] bg-[#131410] mt-12">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-tabular text-[11px] text-[#8E8D88]">
          <div>
            RIGLOCK INDUSTRIAL RESCUE DISPATCH · AUTHENTICATED AS{' '}
            {currentUser.companyName}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {role === 'buyer' ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveScreen('triage')}
                  className="hover:text-[#F4F1EA] cursor-pointer uppercase"
                >
                  Triage Board
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('buyer')}
                  className="hover:text-[#F4F1EA] cursor-pointer uppercase"
                >
                  Buyer Desk
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('ledger')}
                  className="hover:text-[#F4F1EA] cursor-pointer uppercase"
                >
                  My Ledger
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveScreen('seller')}
                  className="hover:text-[#F4F1EA] cursor-pointer uppercase"
                >
                  Seller & Renter
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('nodes')}
                  className="hover:text-[#F4F1EA] cursor-pointer uppercase"
                >
                  My Depot Nodes
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {stagingEquipment && role === 'buyer' && (
        <DispatchStagingDrawer
          key={stagingEquipment.id}
          equipment={stagingEquipment}
          mode={mode}
          defaultAddress={currentUser.siteOrDepotAddress}
          defaultContact={`${currentUser.fullName} · ${currentUser.phone}`}
          onClose={() => setStagingEquipment(null)}
          onConfirmDispatch={handleConfirmDispatch}
        />
      )}
    </div>
  );
}
