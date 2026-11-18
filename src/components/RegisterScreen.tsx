import {
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserPlus,
} from 'lucide-react';
import {FormEvent, useState} from 'react';
import {AuthAccount, AuthView, UserRole} from '../types/rescue';

interface RegisterScreenProps {
  initialRole: UserRole;
  existingEmails: string[];
  onRegister: (account: AuthAccount) => void;
  onNavigateAuth: (view: AuthView) => void;
}

export function RegisterScreen({
  initialRole,
  existingEmails,
  onRegister,
  onNavigateAuth,
}: RegisterScreenProps) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [siteOrDepotAddress, setSiteOrDepotAddress] = useState('');
  const [depotRegion, setDepotRegion] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (
      !fullName.trim() ||
      !companyName.trim() ||
      !phone.trim() ||
      !gstin.trim() ||
      !siteOrDepotAddress.trim() ||
      !normalizedEmail ||
      !password
    ) {
      setError('ALL REQUIRED ACCOUNT DETAILS & CREDENTIALS MUST BE COMPLETED.');
      return;
    }

    if (role === 'seller' && !depotRegion.trim()) {
      setError('OPERATING REGION / CORRIDOR IS REQUIRED FOR SELLER & RENTER ACCOUNTS.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('ENTER A VALID WORK EMAIL ADDRESS.');
      return;
    }

    if (existingEmails.includes(normalizedEmail)) {
      setError(
        'THIS EMAIL IS ALREADY REGISTERED. EACH EMAIL IS LOCKED TO ONE ACCOUNT ROLE. SIGN IN USING THE MATCHING PORTAL.',
      );
      return;
    }

    if (password.length < 6) {
      setError('PASSWORD MUST BE AT LEAST 6 CHARACTERS.');
      return;
    }

    if (password !== confirmPassword) {
      setError('PASSWORD AND CONFIRM PASSWORD DO NOT MATCH.');
      return;
    }

    setError(null);
    const nowTime = new Date().toTimeString().slice(0, 5);
    const newAccount: AuthAccount = {
      id: `${role}-${Date.now()}`,
      role,
      fullName: fullName.trim().toUpperCase(),
      companyName: companyName.trim().toUpperCase(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      gstin: gstin.trim().toUpperCase(),
      siteOrDepotAddress: siteOrDepotAddress.trim().toUpperCase(),
      depotRegion:
        role === 'seller' ? depotRegion.trim().toUpperCase() : undefined,
      createdAt: `2026-11-17 ${nowTime} IST`,
    };

    onRegister(newAccount);
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Briefing & Role Isolation Rules (5 cols) */}
        <div className="lg:col-span-5 bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard">
          <div className="px-5 py-3.5 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
            <span className="font-bold text-[#F4F1EA]">
              STEP 01 // ACCOUNT REGISTRATION
            </span>
            <span className="text-[#C6FF3D] font-semibold">ROLE LOCKED</span>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-4xl md:text-5xl text-[#F4F1EA] leading-[0.95]">
                REGISTER & CHOOSE YOUR WORKSPACE ROLE
              </h1>
              <p className="text-sm text-[#8E8D88] leading-relaxed">
                RIGLOCK enforces strict credential separation between procurement buyers and fleet sellers. Register your organization details, select a role, and then sign in through that role&apos;s dedicated portal.
              </p>
            </div>

            <div className="space-y-3 font-mono-tabular text-xs">
              <div className="p-4 bg-[#131410] border-2 border-[#FF5A1F]">
                <div className="flex items-center gap-2 font-bold text-[#FF5A1F]">
                  <ShoppingBag className="w-4 h-4" />
                  <span>BUYER ACCOUNT SCOPE</span>
                </div>
                <p className="mt-1.5 text-[#8E8D88] leading-relaxed">
                  Browse products, issue GST purchase orders, stage emergency dispatch rentals, track live courier telemetry, and view or cancel your own orders.
                </p>
              </div>

              <div className="p-4 bg-[#131410] border-2 border-[#C6FF3D]">
                <div className="flex items-center gap-2 font-bold text-[#C6FF3D]">
                  <Truck className="w-4 h-4" />
                  <span>SELLER & RENTER ACCOUNT SCOPE</span>
                </div>
                <p className="mt-1.5 text-[#8E8D88] leading-relaxed">
                  Publish equipment inventory, adjust INR rates, process incoming buyer POs, manage cancellations, inspect depot nodes, and monitor D3 revenue analytics.
                </p>
              </div>

              <div className="p-3.5 bg-[#131410] border-2 border-[#2A2A2A] flex items-start gap-2.5 text-[11px] text-[#F4F1EA]">
                <ShieldCheck className="w-4 h-4 text-[#C6FF3D] shrink-0 mt-0.5" />
                <span>
                  CROSS-PORTAL ISOLATION: A Buyer email & password cannot sign into the Seller Login screen, and a Seller email & password cannot sign into the Buyer Login screen.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#2A2A2A] space-y-2.5">
              <div className="font-mono-tabular text-[11px] text-[#8E8D88] uppercase">
                ALREADY REGISTERED? OPEN YOUR ROLE PORTAL:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateAuth('buyer-login')}
                  className="py-2.5 px-3 bg-[#131410] border-2 border-[#FF5A1F] text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-[#121212] font-mono-tabular text-xs font-bold uppercase cursor-pointer transition-colors"
                >
                  BUYER LOGIN PORTAL
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateAuth('seller-login')}
                  className="py-2.5 px-3 bg-[#131410] border-2 border-[#C6FF3D] text-[#C6FF3D] hover:bg-[#C6FF3D] hover:text-[#121212] font-mono-tabular text-xs font-bold uppercase cursor-pointer transition-colors"
                >
                  SELLER LOGIN PORTAL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Registration Form (7 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard"
        >
          <div
            className={`px-6 py-4 border-b-2 border-[#0D0D0D] flex items-center justify-between font-mono-tabular ${
              role === 'buyer'
                ? 'bg-[#FF5A1F] text-[#121212]'
                : 'bg-[#C6FF3D] text-[#121212]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <UserPlus className="w-4 h-4" />
              <span>
                NEW {role === 'buyer' ? 'BUYER' : 'SELLER & RENTER'} REGISTRATION
              </span>
            </div>
            <span className="text-[11px] font-bold uppercase">
              CREDENTIAL SETUP
            </span>
          </div>

          <div className="p-6 space-y-5 font-mono-tabular">
            {/* Role Selector */}
            <div>
              <div className="text-[11px] uppercase text-[#8E8D88] mb-2">
                1. CHOOSE ACCOUNT TYPE (PERMANENT PER EMAIL)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole('buyer');
                    setError(null);
                  }}
                  aria-pressed={role === 'buyer'}
                  className={`p-4 border-2 text-left cursor-pointer transition-colors ${
                    role === 'buyer'
                      ? 'bg-[#242424] border-[#FF5A1F] text-[#F4F1EA]'
                      : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FF5A1F]">
                      BUYER
                    </span>
                    <ShoppingBag className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <div className="text-[11px] mt-1">
                    PROCUREMENT · BUY & RENT HARDWARE
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('seller');
                    setError(null);
                  }}
                  aria-pressed={role === 'seller'}
                  className={`p-4 border-2 text-left cursor-pointer transition-colors ${
                    role === 'seller'
                      ? 'bg-[#242424] border-[#C6FF3D] text-[#F4F1EA]'
                      : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C6FF3D]">
                      SELLER & RENTER
                    </span>
                    <Truck className="w-4 h-4 text-[#C6FF3D]" />
                  </div>
                  <div className="text-[11px] mt-1">
                    FLEET VENDOR · LIST UNITS & FULFILL POs
                  </div>
                </button>
              </div>
            </div>

            {/* Organization & Contact Details */}
            <div className="pt-2 border-t-2 border-[#2A2A2A] space-y-4">
              <div className="flex items-center gap-2 text-[11px] uppercase text-[#F4F1EA] font-bold">
                <Building2 className="w-3.5 h-3.5 text-[#FF5A1F]" />
                <span>2. ENTER ORGANIZATION & PROFILE DETAILS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                  >
                    AUTHORIZED REPRESENTATIVE NAME
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.G. ARJUN DESHMUKH"
                    className="input-tactical w-full h-11 px-3 text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-company"
                    className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                  >
                    {role === 'buyer'
                      ? 'BUYER COMPANY / SITE ENTITY'
                      : 'VENDOR / FLEET COMPANY NAME'}
                  </label>
                  <input
                    id="reg-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={
                      role === 'buyer'
                        ? 'E.G. BHARAT TUNNEL INFRA LTD'
                        : 'E.G. WESTERN RIGGING & POWER'
                    }
                    className="input-tactical w-full h-11 px-3 text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                  >
                    DIRECT CONTACT PHONE
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="input-tactical w-full h-11 px-3 text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-gstin"
                    className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                  >
                    GSTIN / TAX REGISTRATION NO.
                  </label>
                  <input
                    id="reg-gstin"
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="27AABCU9603R1ZM"
                    className="input-tactical w-full h-11 px-3 text-xs"
                  />
                </div>

                <div className={role === 'seller' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                  <label
                    htmlFor="reg-address"
                    className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                  >
                    {role === 'buyer'
                      ? 'PRIMARY SITE DELIVERY ADDRESS'
                      : 'DEPOT YARD / DISPATCH BASE ADDRESS'}
                  </label>
                  <input
                    id="reg-address"
                    type="text"
                    value={siteOrDepotAddress}
                    onChange={(e) => setSiteOrDepotAddress(e.target.value)}
                    placeholder={
                      role === 'buyer'
                        ? 'PLOT 42, NAVA SHEVA PORT GATE 4'
                        : 'YARD 11, TALOJA INDUSTRIAL CORRIDOR'
                    }
                    className="input-tactical w-full h-11 px-3 text-xs"
                  />
                </div>

                {role === 'seller' && (
                  <div>
                    <label
                      htmlFor="reg-region"
                      className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                    >
                      OPERATING DEPOT CORRIDOR / REGION
                    </label>
                    <input
                      id="reg-region"
                      type="text"
                      value={depotRegion}
                      onChange={(e) => setDepotRegion(e.target.value)}
                      placeholder="E.G. NAVI MUMBAI CORRIDOR"
                      className="input-tactical w-full h-11 px-3 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Login Credentials Setup */}
            <div className="pt-2 border-t-2 border-[#2A2A2A] space-y-4">
              <div className="text-[11px] uppercase text-[#F4F1EA] font-bold">
                3. SET LOGIN CREDENTIALS (EMAIL & PASSWORD)
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                >
                  WORK EMAIL ADDRESS
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.in"
                  className="input-tactical w-full h-11 px-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                  >
                    PASSWORD (MIN 6 CHARACTERS)
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ENTER PASSWORD"
                      className="input-tactical w-full h-11 pl-3 pr-10 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8D88] hover:text-[#F4F1EA] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-confirm-password"
                    className="block text-[10px] uppercase text-[#8E8D88] mb-1.5"
                  >
                    CONFIRM PASSWORD
                  </label>
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="RE-ENTER PASSWORD"
                    className="input-tactical w-full h-11 px-3 text-xs"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 bg-[#FF2E2E]/15 border-2 border-[#FF2E2E] text-xs text-[#FF2E2E]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`w-full chamfer-tr py-3.5 font-mono-tabular text-xs font-bold uppercase tracking-[0.08em] cursor-pointer border-2 border-[#0D0D0D] shadow-hard-sm ${
                role === 'buyer'
                  ? 'bg-[#FF5A1F] text-[#121212] hover:bg-[#ff6d38]'
                  : 'bg-[#C6FF3D] text-[#121212] hover:bg-[#d4ff66]'
              }`}
            >
              {role === 'buyer'
                ? 'REGISTER BUYER ACCOUNT & PROCEED TO BUYER LOGIN'
                : 'REGISTER SELLER ACCOUNT & PROCEED TO SELLER LOGIN'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
