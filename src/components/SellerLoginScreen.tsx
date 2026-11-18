import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldAlert,
  Truck,
  Warehouse,
} from 'lucide-react';
import {FormEvent, useState} from 'react';
import {AuthView} from '../types/rescue';

interface SellerLoginScreenProps {
  notice: string | null;
  onLogin: (email: string, password: string) => string | null;
  onNavigateAuth: (view: AuthView) => void;
  onStartSellerRegistration: () => void;
}

export function SellerLoginScreen({
  notice,
  onLogin,
  onNavigateAuth,
  onStartSellerRegistration,
}: SellerLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('ENTER YOUR REGISTERED SELLER EMAIL AND PASSWORD.');
      return;
    }
    const err = onLogin(email.trim().toLowerCase(), password);
    setError(err);
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 space-y-6">
      {/* Distinct Halftone Safety-Lime Vendor Portal Masthead */}
      <div className="bg-halftone-lime border-2 border-[#0D0D0D] shadow-hard px-6 py-4 flex flex-wrap items-center justify-between gap-4 font-mono-tabular text-[#121212]">
        <div className="flex items-center gap-3">
          <Warehouse className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-[0.08em]">
            PORTAL 02 // SELLER & RENTER PARTNER TERMINAL
          </span>
        </div>
        <span className="px-2.5 py-1 bg-[#131410] text-[#C6FF3D] text-[10px] font-bold uppercase">
          VENDOR FLEET AUTHENTICATION ONLY
        </span>
      </div>

      {/* Distinct Reversed 2-Column Layout: Form Left (7 cols), Vendor Operations Briefing Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Seller Login Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border-2 border-[#C6FF3D] shadow-hard flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#C6FF3D] flex items-center gap-2">
                <Truck className="w-4 h-4" />
                SELLER & RENTER CREDENTIALS
              </span>
              <span className="text-[#8E8D88]">ROLE: SELLER ONLY</span>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 md:p-8 space-y-5 font-mono-tabular"
            >
              {notice && (
                <div className="p-3.5 bg-[#C6FF3D]/15 border-2 border-[#C6FF3D] text-xs text-[#C6FF3D]">
                  {notice}
                </div>
              )}

              <div>
                <label
                  htmlFor="seller-login-email"
                  className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
                >
                  REGISTERED VENDOR / SELLER EMAIL
                </label>
                <input
                  id="seller-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="dispatch@fleetpartner.in"
                  autoComplete="email"
                  className="input-tactical w-full h-12 px-3.5 text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="seller-login-password"
                  className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
                >
                  SELLER ACCOUNT PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="seller-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="ENTER YOUR PASSWORD"
                    autoComplete="current-password"
                    className="input-tactical w-full h-12 pl-3.5 pr-11 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8D88] hover:text-[#F4F1EA] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3.5 bg-[#FF2E2E]/15 border-2 border-[#FF2E2E] text-xs text-[#FF2E2E]"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#121212] border-2 border-[#0D0D0D] shadow-hard chamfer-tr py-3.5 text-xs font-bold uppercase tracking-[0.08em] cursor-pointer transition-colors"
              >
                SIGN IN TO SELLER & RENTER WORKSPACE
              </button>

              <div className="pt-4 border-t-2 border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-[#8E8D88]">
                  NEW FLEET PARTNER? REGISTER YOUR DEPOT & SELLER ROLE FIRST.
                </span>
                <button
                  type="button"
                  onClick={onStartSellerRegistration}
                  className="btn-secondary-mech px-4 py-2 text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap"
                >
                  REGISTER AS SELLER
                </button>
              </div>
            </form>
          </div>

          <div className="px-6 py-3.5 bg-[#131410] border-t-2 border-[#2A2A2A] font-mono-tabular text-[11px] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[#8E8D88]">
              SEEDED SELLER TEST ACCOUNT:
            </span>
            <span className="text-[#C6FF3D]">
              dispatch@kowalskirigging.in · Kowalski@2026
            </span>
          </div>
        </div>

        {/* Right Vendor Operations Briefing (5 cols) */}
        <div className="lg:col-span-5 bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard flex flex-col justify-between">
          <div className="p-6 space-y-5">
            <div className="font-mono-tabular text-[11px] text-[#C6FF3D] uppercase tracking-[0.08em]">
              SUPPLIER & FLEET CONSOLE
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-[#F4F1EA] leading-[0.95]">
              SELLER FLEET, ORDERS & METRICS SIGN IN
            </h1>
            <p className="text-sm text-[#8E8D88] leading-relaxed">
              Dedicated terminal for equipment vendors, depot operators, and emergency fleet renters. Inspect only your own SKUs, incoming orders, settled sales, cancellations, and D3 performance charts.
            </p>

            <div className="grid grid-cols-2 gap-3 font-mono-tabular text-xs pt-2">
              <div className="p-3 bg-[#131410] border-2 border-[#2A2A2A]">
                <div className="text-[10px] text-[#8E8D88]">INVENTORY</div>
                <div className="text-[#F4F1EA] font-bold mt-1">
                  INR RATES & STOCK
                </div>
              </div>
              <div className="p-3 bg-[#131410] border-2 border-[#2A2A2A]">
                <div className="text-[10px] text-[#8E8D88]">FULFILLMENT</div>
                <div className="text-[#F4F1EA] font-bold mt-1">
                  PO RELEASE & FREIGHT
                </div>
              </div>
              <div className="p-3 bg-[#131410] border-2 border-[#2A2A2A]">
                <div className="text-[10px] text-[#8E8D88]">ANALYTICS</div>
                <div className="text-[#C6FF3D] font-bold mt-1">
                  D3 REVENUE & SLA
                </div>
              </div>
              <div className="p-3 bg-[#131410] border-2 border-[#2A2A2A]">
                <div className="text-[10px] text-[#8E8D88]">CANCELLATIONS</div>
                <div className="text-[#FF2E2E] font-bold mt-1">
                  AUDIT & STOCK RESTORE
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#131410] border-2 border-[#FF2E2E]/70 flex items-start gap-2.5 font-mono-tabular text-[11px] text-[#F4F1EA]">
              <ShieldAlert className="w-4 h-4 text-[#FF2E2E] shrink-0 mt-0.5" />
              <span>
                STRICT SELLER PORTAL: Buyer credentials cannot sign into this Seller & Renter gate.
              </span>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#131410] border-t-2 border-[#2A2A2A] flex flex-wrap items-center justify-between gap-3 font-mono-tabular text-[11px]">
            <span className="text-[#8E8D88]">LOOKING TO BUY OR RENT?</span>
            <button
              type="button"
              onClick={() => onNavigateAuth('buyer-login')}
              className="text-[#FF5A1F] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>OPEN BUYER LOGIN PORTAL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
