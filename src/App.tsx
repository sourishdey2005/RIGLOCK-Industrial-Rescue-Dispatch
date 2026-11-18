import { useEffect, useMemo, useState } from 'react';
import { ActiveDispatchScreen } from './components/ActiveDispatchScreen';
import { BuyerScreen } from './components/BuyerScreen';
import { DepotNodesScreen } from './components/DepotNodesScreen';
import { DispatchStagingDrawer } from './components/DispatchStagingDrawer';
import { MissionLogScreen } from './components/MissionLogScreen';
import { TriageBoardScreen } from './components/TriageBoardScreen';
import { TopBar } from './components/TopBar';
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

function writeStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

// Minimal auth state - use localStorage only (no Clerk/Convex for now)
let storedUser = readStorage('user', null);

function getUser() {
  return storedUser;
}

setTimeout(() => {
  // Simulate loading user from storage after short delay
}, 100);

// ===== Main App Component =====
export default function App() {
  const [user, setUser] = useState(getUser());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, 100);

  // If user is signed in, show the dashboard
  if (user) {
    return (
      <>
        <TopBar />
        <ActiveDispatchScreen />
        <BuyerScreen />
        <DepotNodesScreen />
        <DispatchStagingDrawer />
        <MissionLogScreen />
        <TriageBoardScreen />
      </>
    );
  }

  // Show auth screens if not loaded yet or no user
  if (!isLoaded || !user) {
    return (
      <>
        <TopBar />
        <RegisterScreen />
        <BuyerLoginScreen />
        <SellerLoginScreen />
      </>
    );
  }

  return <div>Loading...</div>;
}

// ===== TopBar with Simple Auth =====
function TopBar() {
  const [user, setUser] = useState(getUser());

  return (
    <header>
      {user ? (
        <>
          <span>Welcome, {user.fullName}</span>
          <a href="/">Dashboard</a>
          <button onClick={() => setUser(null)}>Sign Out</button>
        </>
      ) : (
        <>
          <button onClick={() => setUser({ fullName: 'Buyer', email: 'test@test.com' })}>Sign In as Buyer</button>
          <button onClick={() => setUser({ fullName: 'Seller', email: 'test@test.com' })}>Sign In as Seller</button>
        </>
      )}
    </header>
  );
}