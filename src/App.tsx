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

// ===== HARDCODED CONFIGURATION (no .env needed) =====
// All values hardcoded directly in code - no environment variables required

// Clerk Configuration - Hardcoded
const HARDCODED_CLERK_PUBLISHABLE_KEY = 'pk_test_c2FmZS1mYWxjb24tNDExNC5jbGVyay5hY2NvdW50cy5kZXYk';
// Note: CLERK_SECRET_KEY is server-side only, we handle it differently

// Convex Configuration - Hardcoded  
const HARDCODED_CONVEX_URL = 'https://woozy-sandpiper-867.convex.cloud';
// Using production Convex URL directly - no environment variables

// API Base URL - Hardcoded
const HARDCODED_API_BASE_URL = 'https://woozy-sandpiper-867.convex.cloud';

// ===== App State =====
let storedUser = localStorage.getItem('riglock_user');
storedUser = storedUser ? JSON.parse(storedUser) : null;

function setStoredUser(user: any) {
  storedUser = user;
  localStorage.setItem('riglock_user', JSON.stringify(user));
}

// ===== Main App Component =====
export default function App() {
  const [user, setUser] = useState<any>(storedUser);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate app loading - set loaded after 500ms
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // If user is signed in, show the dashboard
  if (user && isLoaded) {
    return (
      <>
        <TopBar user={user} setUser={setUser} />
        <ActiveDispatchScreen />
        <BuyerScreen />
        <DepotNodesScreen />
        <DispatchStagingDrawer />
        <MissionLogScreen />
        <TriageBoardScreen />
      </>
    );
  }

  // Show auth/sign-in screen if not loaded or no user
  if (!isLoaded || !user) {
    return (
      <>
        <TopBar user={null} setUser={setUser} />
        <RegisterScreen />
        <BuyerLoginScreen />
        <SellerLoginScreen />
      </>
    );
  }

  return <div style={{ padding: '20px' }}>RIGLOCK Industrial Rescue Dispatch</div>;
}

// ===== TopBar Component =====
function TopBar({ user, setUser }: { user: any; setUser: any }) {
  return (
    <header style={{ padding: '10px 20px', background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {user ? (
        <>
          <span>Welcome, {user.fullName || 'User'}</span>
          <span>({user.email || ''})</span>
          <a href="/" style={{ marginLeft: '15px' }}>Dashboard</a>
          <button onClick={() => setUser(null)} style={{ padding: '5px 10px' }}>Sign Out</button>
        </>
      ) : (
        <>
          <button onClick={() => setUser({ fullName: 'Buyer Tester', email: 'buyer@test.com' })} style={{ padding: '5px 10px' }}>Sign In as Buyer</button>
          <button onClick={() => setUser({ fullName: 'Seller Tester', email: 'seller@test.com' })} style={{ padding: '5px 10px' }}>Sign In as Seller</button>
        </>
      )}
    </header>
  );
}