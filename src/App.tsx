import { useEffect, useState } from 'react';
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

// ===== HARDCODED CONFIGURATION (no .env needed) =====
const HARDCODED_CLERK_PUBLISHABLE_KEY = 'pk_test_c2FmZS1mYWxjb24tNDExNC5jbGVyay5hY2NvdW50cy5kZXYk';
const HARDCODED_CONVEX_URL = 'https://woozy-sandpiper-867.convex.cloud';
const HARDCODED_API_BASE_URL = 'https://woozy-sandpiper-867.convex.cloud';

// ===== Safe localStorage Helper =====
function safeLocalStorageGet(key: string, fallback: any = null) {
  try {
    if (typeof window === 'undefined') return fallback;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeLocalStorageSet(key: string, value: any) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage errors
  }
}

// ===== App State Initialization =====
const storedUser = safeLocalStorageGet('riglock_user');
const storedCatalog = safeLocalStorageGet('riglock_catalog', EQUIPMENT_CATALOG);

// ===== Main App Component =====
export default function App() {
  const [user, setUser] = useState<any>(storedUser);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe loading - always complete within 1 second max
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle errors gracefully
  useEffect(() => {
    if (error) {
      console.error('App error:', error);
    }
  }, [error]);

  // If error occurred, show fallback
  if (!isLoaded) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
      <h2>RIGLOCK Industrial Rescue Dispatch</h2>
      <p>Loading application...</p>
    </div>;
  }

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

  // Final fallback
  return <div style={{ padding: '20px' }}>RIGLOCK Industrial Rescue Dispatch</div>;
}

// ===== TopBar Component =====
function TopBar({ user, setUser }: { user: any; setUser: any }) {
  // Safely render user info
  const userName = user?.fullName || 'User';
  const userEmail = user?.email || '';

  return (
    <header
      style={{
        padding: '10px 20px',
        background: '#f5f5f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #ddd',
      }}
    >
      {user ? (
        <>
          <span>Welcome, {userName}</span>
          <span>({userEmail})</span>
          <a href="/" style={{ marginLeft: '15px' }}>Dashboard</a>
          <button
            onClick={() => setUser(null)}
            style={{ padding: '5px 10px' }}
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setUser({ fullName: 'Buyer Tester', email: 'buyer@test.com' })}
            style={{ padding: '5px 10px' }}
          >
            Sign In as Buyer
          </button>
          <button
            onClick={() => setUser({ fullName: 'Seller Tester', email: 'seller@test.com' })}
            style={{ padding: '5px 10px' }}
          >
            Sign In as Seller
          </button>
        </>
      )}
    </header>
  );
}