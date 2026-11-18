import {LogOut, Menu, X} from 'lucide-react';
import {useState} from 'react';
import {AuthView, ScreenTab, UserRole} from '../types/rescue';

interface TopBarProps {
  isAuthenticated: boolean;
  role?: UserRole;
  activeScreen: ScreenTab;
  onNavigate: (screen: ScreenTab) => void;
  authView: AuthView;
  onAuthNavigate: (view: AuthView) => void;
  onSignOut: () => void;
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
}: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = role === 'seller' ? SELLER_NAV : BUYER_NAV;

  const handleScreenNav = (screen: ScreenTab) => {
    onNavigate(screen);
    setMobileMenuOpen(false);
  };

  const handleAuthNav = (view: AuthView) => {
    onAuthNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#131410] border-b-2 border-[#2A2A2A]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
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

        {/* Zone 2: Concise single-line navigation links */}
        {isAuthenticated ? (
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7"
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

        {/* Zone 3: 1 primary action + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
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
