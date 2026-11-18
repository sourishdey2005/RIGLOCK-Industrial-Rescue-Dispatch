import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShoppingBag,
  ShieldAlert,
} from 'lucide-react';
import {FormEvent, useState} from 'react';
import {AuthView} from '../types/rescue';

interface BuyerLoginScreenProps {
  notice: string | null;
  onLogin: (email: string, password: string) => string | null;
  onNavigateAuth: (view: AuthView) => void;
  onStartBuyerRegistration: () => void;
}

export function BuyerLoginScreen({
  notice,
  onLogin,
  onNavigateAuth,
  onStartBuyerRegistration,
}: BuyerLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('ENTER YOUR REGISTERED BUYER EMAIL AND PASSWORD.');
      return;
    }
    const err = onLogin(email.trim().toLowerCase(), password);
    setError(err);
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Procurement Gate Briefing (5 cols) */}
        <div className="lg:col-span-5 bg-[#1A1A1A] border-2 border-[#FF5A1F] shadow-hard flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 bg-[#FF5A1F] border-b-2 border-[#0D0D0D] flex items-center justify-between font-mono-tabular text-xs font-bold text-[#121212]">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                PORTAL 01 // BUYER ACCESS
              </span>
              <span>PROCUREMENT GATE</span>
            </div>

            <div className="p-6 space-y-5">
              <h1 className="font-display text-4xl md:text-5xl text-[#F4F1EA] leading-[0.95]">
                BUYER & SITE PROCUREMENT SIGN IN
              </h1>
              <p className="text-sm text-[#8E8D88] leading-relaxed">
                Dedicated sign-in gate for industrial site engineers and procurement buyers. Access your own Triage Board, active purchase orders, GST invoices, and live emergency dispatches.
              </p>

              <div className="space-y-2.5 font-mono-tabular text-xs border-t-2 border-[#2A2A2A] pt-4">
                <div className="text-[#F4F1EA]">
                  01 · BROWSE & BUY INDUSTRIAL HARDWARE IN INR (Rs.)
                </div>
                <div className="text-[#F4F1EA]">
                  02 · STAGE 45-MINUTE EMERGENCY DISPATCH RENTALS
                </div>
                <div className="text-[#F4F1EA]">
                  03 · TRACK LIVE FIELD MAP & CANCEL UNSHIPPED POs
                </div>
              </div>

              <div className="p-3.5 bg-[#131410] border-2 border-[#FF2E2E]/70 flex items-start gap-2.5 font-mono-tabular text-[11px] text-[#F4F1EA]">
                <ShieldAlert className="w-4 h-4 text-[#FF2E2E] shrink-0 mt-0.5" />
                <span>
                  STRICT BUYER PORTAL: Seller & Renter credentials cannot sign into this Buyer gate.
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#131410] border-t-2 border-[#2A2A2A] flex flex-wrap items-center justify-between gap-3 font-mono-tabular text-[11px]">
            <span className="text-[#8E8D88]">NEED A SELLER ACCOUNT?</span>
            <button
              type="button"
              onClick={() => onNavigateAuth('seller-login')}
              className="text-[#C6FF3D] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>OPEN SELLER LOGIN PORTAL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Buyer Credentials Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-bold text-[#FF5A1F] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                BUYER CREDENTIALS VERIFICATION
              </span>
              <span className="text-[#8E8D88]">ROLE: BUYER ONLY</span>
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
                  htmlFor="buyer-login-email"
                  className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
                >
                  REGISTERED BUYER EMAIL
                </label>
                <input
                  id="buyer-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="procurement@company.in"
                  autoComplete="email"
                  className="input-tactical w-full h-12 px-3.5 text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="buyer-login-password"
                  className="block text-[11px] uppercase text-[#8E8D88] mb-1.5"
                >
                  BUYER ACCOUNT PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="buyer-login-password"
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
                className="w-full btn-dispatch chamfer-tr py-3.5 text-xs font-bold uppercase tracking-[0.08em] cursor-pointer"
              >
                SIGN IN TO BUYER WORKSPACE
              </button>

              <div className="pt-4 border-t-2 border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-[#8E8D88]">
                  NEW TO RIGLOCK? REGISTER YOUR BUYER DETAILS FIRST.
                </span>
                <button
                  type="button"
                  onClick={onStartBuyerRegistration}
                  className="btn-secondary-mech px-4 py-2 text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap"
                >
                  REGISTER AS BUYER
                </button>
              </div>
            </form>
          </div>

          {/* Seeded Buyer Reference Strip */}
          <div className="px-6 py-3.5 bg-[#131410] border-t-2 border-[#2A2A2A] font-mono-tabular text-[11px] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[#8E8D88]">
              SEEDED BUYER TEST ACCOUNT:
            </span>
            <span className="text-[#F4F1EA]">
              procurement@meridianinfra.in · Meridian@2026
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
