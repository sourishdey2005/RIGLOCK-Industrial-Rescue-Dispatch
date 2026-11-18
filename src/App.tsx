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
import { useUser } from '@clerk/clerk-react';

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

// ===== Clerk Auth State =====
let clerkUser: any = null;
let isClarkLoaded = false;

function initializeClerk() {
  // Clerk will manage auth state; we sync to localStorage for backward compat
  const storedUser = readStorage('clerk_user', null);
  if (storedUser) {
    clerkUser = storedUser;
    isClarkLoaded = true;
  }
}

// ===== Main App Component =====
export default function App() {
  const { isLoaded, user, setSession } = useUser();

  // Sync Clerk user to localStorage when it changes
  useEffect(() => {
    if (user) {
      writeStorage('clerk_user', {
        id: user.id,
        email: user.emailAddress,
        fullName: user.fullName,
        role: user.publicMetadata?.role || 'buyer',
      });
    }
    clerkUser = user || null;
    isClarkLoaded = isLoaded;
  }, [user, isLoaded]);

  // Wait for Clerk to load before rendering
  if (!isLoaded && !clerkUser) {
    return <div>Loading Clerk...</div>;
  }

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

  // If Clerk is loaded but no user, show auth screens
  if (isClarkLoaded) {
    return (
      <>
        <TopBar />
        <RegisterScreen />
        <BuyerLoginScreen />
        <SellerLoginScreen />
      </>
    );
  }

  // Fallback - initialize Clerk
  initializeClerk();
  return <div>Loading...</div>;
}

// ===== TopBar with Clerk Integration =====
function TopBar() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <header>
      {user ? (
        <>
          <span>Welcome, {user.fullName}</span>
          <span>({user.emailAddress})</span>
          <a href="/">Dashboard</a>
          <button onClick={() => setSession({})}>Sign Out</button>
        </>
      ) : (
        <>
          <button onClick={() => setSession({})}>Continue as Guest</button>
        </>
      )}
    </header>
  );
}

// Keep existing screens that don't depend on auth state
// BuyerLoginScreen, SellerLoginScreen, RegisterScreen remain as-is
// but they'll be replaced by Clerk modals when isClarkLoaded is true

// Export for use in other files
export { clerkUser, isClarkLoaded };