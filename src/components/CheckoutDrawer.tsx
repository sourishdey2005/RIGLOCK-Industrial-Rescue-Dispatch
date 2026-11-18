import {
  Check,
  CreditCard,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
import {FormEvent, useState} from 'react';
import {
  AuthAccount,
  BuyerOrder,
  BuyerOrderItem,
  PaymentMethodType,
  SavedSiteAddress,
} from '../types/rescue';
import {formatRs} from '../utils/currency';

interface CheckoutDrawerProps {
  isOpen: boolean;
  currentUser: AuthAccount;
  cart: BuyerOrderItem[];
  savedAddresses: SavedSiteAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onAddAddress: (addr: SavedSiteAddress) => void;
  onDeleteAddress: (id: string) => void;
  deliveryTier: BuyerOrder['deliveryTier'];
  onChangeDeliveryTier: (tier: BuyerOrder['deliveryTier']) => void;
  onClose: () => void;
  onConfirmOrder: (payload: {
    address: SavedSiteAddress;
    deliveryTier: BuyerOrder['deliveryTier'];
    deliveryFee: number;
    paymentMethod: PaymentMethodType;
    deliveryNotes: string;
  }) => void;
}

const DELIVERY_TIERS: {
  id: BuyerOrder['deliveryTier'];
  label: string;
  eta: string;
  fee: number;
}[] = [
  {id: 'FREIGHT', label: 'SITE FREIGHT', eta: '24–48 HR FLATBED', fee: 4500},
  {id: 'ER_DROP', label: 'PRIORITY ER DROP', eta: 'SAME-DAY RIG', fee: 9500},
  {id: 'PICKUP', label: 'DEPOT PICKUP', eta: 'DIRECT WILL-CALL', fee: 0},
];

const PAYMENT_OPTIONS: {
  id: PaymentMethodType;
  label: string;
  detail: string;
}[] = [
  {
    id: 'ESCROW_INR',
    label: 'CORPORATE UPI / RTGS ESCROW',
    detail: 'Instant GST bond settlement',
  },
  {
    id: 'NET_30_PO',
    label: 'NET-30 VERIFIED PO',
    detail: 'B2B GSTIN credit line',
  },
  {
    id: 'ON_SITE_COD',
    label: 'ON-SITE GATE RECEIPT',
    detail: 'Pay upon physical inspection',
  },
];

export function CheckoutDrawer({
  isOpen,
  currentUser,
  cart,
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  onDeleteAddress,
  deliveryTier,
  onChangeDeliveryTier,
  onClose,
  onConfirmOrder,
}: CheckoutDrawerProps) {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState(currentUser.fullName);
  const [contactPhone, setContactPhone] = useState(currentUser.phone);
  const [addressLine, setAddressLine] = useState('');
  const [cityState, setCityState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [gateNotes, setGateNotes] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>('ESCROW_INR');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedAddress =
    savedAddresses.find((a) => a.id === selectedAddressId) ?? savedAddresses[0];

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const deliveryFee =
    DELIVERY_TIERS.find((t) => t.id === deliveryTier)?.fee ?? 0;
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount + deliveryFee;

  const handleSaveNewAddress = (e: FormEvent) => {
    e.preventDefault();
    if (
      !label.trim() ||
      !recipientName.trim() ||
      !contactPhone.trim() ||
      !addressLine.trim() ||
      !cityState.trim() ||
      !postalCode.trim()
    ) {
      setAddressError(
        'SITE LABEL, RECIPIENT NAME, CONTACT NO., ADDRESS, CITY/STATE, AND PIN CODE ARE REQUIRED.',
      );
      return;
    }
    if (contactPhone.replace(/\D/g, '').length < 10) {
      setAddressError('ENTER A VALID 10+ DIGIT CONTACT PHONE NUMBER.');
      return;
    }
    if (!/^[A-Za-z0-9\-\s]{5,8}$/.test(postalCode.trim())) {
      setAddressError('ENTER A VALID POSTAL / PIN CODE.');
      return;
    }

    setAddressError(null);
    const created: SavedSiteAddress = {
      id: `addr-${Date.now()}`,
      label: label.trim().toUpperCase(),
      recipientName: recipientName.trim().toUpperCase(),
      contactPhone: contactPhone.trim(),
      addressLine: addressLine.trim().toUpperCase(),
      cityState: cityState.trim().toUpperCase(),
      postalCode: postalCode.trim().toUpperCase(),
      gateNotes: gateNotes.trim() ? gateNotes.trim().toUpperCase() : undefined,
    };

    onAddAddress(created);
    setLabel('');
    setAddressLine('');
    setCityState('');
    setPostalCode('');
    setGateNotes('');
    setShowNewAddressForm(false);
  };

  const handleFinalSubmit = () => {
    if (cart.length === 0) {
      setCheckoutError('REQUISITION CART IS EMPTY.');
      return;
    }
    if (!selectedAddress) {
      setCheckoutError('SELECT OR ADD A DELIVERY ADDRESS & CONTACT NO.');
      return;
    }
    setCheckoutError(null);
    onConfirmOrder({
      address: selectedAddress,
      deliveryTier,
      deliveryFee,
      paymentMethod,
      deliveryNotes: deliveryNotes.trim().toUpperCase(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Purchase Order Checkout Console"
      className="fixed inset-0 z-50 flex justify-end bg-black/80"
    >
      <div className="w-full max-w-3xl bg-[#131410] border-l-2 border-[#2A2A2A] h-full overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#1A1A1A] border-b-2 border-[#2A2A2A]">
            <div>
              <div className="font-mono-tabular text-[11px] text-[#FF5A1F] font-bold uppercase tracking-[0.08em]">
                PURCHASE ORDER CHECKOUT // {currentUser.companyName}
              </div>
              <h2 className="font-display text-3xl text-[#F4F1EA] leading-none mt-1">
                SITE DELIVERY, CONTACT & SETTLEMENT
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close checkout drawer"
              className="btn-secondary-mech w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 font-mono-tabular text-xs">
            {/* Step 1: Saved Delivery Addresses & Site Contacts */}
            <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2 font-bold text-[#F4F1EA]">
                  <MapPin className="w-4 h-4 text-[#FF5A1F]" />
                  <span>1. SELECT DELIVERY SITE ADDRESS & CONTACT NO.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAddressForm((prev) => !prev);
                    setAddressError(null);
                  }}
                  className="px-3 py-1.5 bg-[#131410] border-2 border-[#C6FF3D] text-[#C6FF3D] hover:bg-[#C6FF3D] hover:text-[#121212] text-[11px] font-bold uppercase inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {showNewAddressForm
                      ? 'HIDE NEW ADDRESS FORM'
                      : 'ADD NEW ADDRESS & CONTACT'}
                  </span>
                </button>
              </div>

              {/* New Address & Contact Form */}
              {showNewAddressForm && (
                <form
                  onSubmit={handleSaveNewAddress}
                  className="p-4 bg-[#131410] border-2 border-[#C6FF3D] space-y-3"
                >
                  <div className="text-[11px] font-bold text-[#C6FF3D] uppercase">
                    REGISTER NEW DELIVERY SITE & ON-SITE RECEIVER
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="addr-label"
                        className="block text-[10px] text-[#8E8D88] mb-1"
                      >
                        SITE LABEL
                      </label>
                      <input
                        id="addr-label"
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="E.G. METRO SHAFT 7"
                        className="input-tactical w-full h-10 px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="addr-recipient"
                        className="block text-[10px] text-[#8E8D88] mb-1"
                      >
                        SITE CONTACT NAME
                      </label>
                      <input
                        id="addr-recipient"
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="E.G. ENG. R. SHARMA"
                        className="input-tactical w-full h-10 px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="addr-phone"
                        className="block text-[10px] text-[#8E8D88] mb-1"
                      >
                        CONTACT PHONE NO.
                      </label>
                      <input
                        id="addr-phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98200 11223"
                        className="input-tactical w-full h-10 px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label
                        htmlFor="addr-line"
                        className="block text-[10px] text-[#8E8D88] mb-1"
                      >
                        PLOT / STREET / ACCESS GATE ADDRESS
                      </label>
                      <input
                        id="addr-line"
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="PLOT 14, CHAKAN PHASE II, GATE 4"
                        className="input-tactical w-full h-10 px-3 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label
                        htmlFor="addr-city"
                        className="block text-[10px] text-[#8E8D88] mb-1"
                      >
                        CITY & STATE
                      </label>
                      <input
                        id="addr-city"
                        type="text"
                        value={cityState}
                        onChange={(e) => setCityState(e.target.value)}
                        placeholder="PUNE, MAHARASHTRA"
                        className="input-tactical w-full h-10 px-3 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="addr-pin"
                        className="block text-[10px] text-[#8E8D88] mb-1"
                      >
                        PIN CODE
                      </label>
                      <input
                        id="addr-pin"
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="410501"
                        className="input-tactical w-full h-10 px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="addr-notes"
                      className="block text-[10px] text-[#8E8D88] mb-1"
                    >
                      UNLOADING / GATE SECURITY NOTES (OPTIONAL)
                    </label>
                    <input
                      id="addr-notes"
                      type="text"
                      value={gateNotes}
                      onChange={(e) => setGateNotes(e.target.value)}
                      placeholder="FORKLIFT AVAILABLE AT BAY 2 · CALL 15 MIN BEFORE ARRIVAL"
                      className="input-tactical w-full h-10 px-3 text-xs"
                    />
                  </div>

                  {addressError && (
                    <div className="p-2.5 bg-[#FF2E2E]/15 border-2 border-[#FF2E2E] text-[11px] text-[#FF2E2E]">
                      {addressError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="btn-secondary-mech px-4 py-2 text-[11px] font-bold uppercase cursor-pointer"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#C6FF3D] text-[#121212] border-2 border-[#0D0D0D] text-[11px] font-bold uppercase cursor-pointer"
                    >
                      SAVE & USE THIS ADDRESS
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Address Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => {
                  const isSelected = addr.id === selectedAddress?.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => onSelectAddress(addr.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectAddress(addr.id);
                        }
                      }}
                      className={`p-3.5 border-2 cursor-pointer transition-colors flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#242424] border-[#FF5A1F]'
                          : 'bg-[#131410] border-[#2A2A2A] hover:border-[#8E8D88]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#F4F1EA] flex items-center gap-1.5">
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#FF5A1F]" />
                            )}
                            {addr.label}
                          </span>
                          {savedAddresses.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAddress(addr.id);
                              }}
                              aria-label={`Delete address ${addr.label}`}
                              className="text-[#8E8D88] hover:text-[#FF2E2E] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-[#F4F1EA]">
                          {addr.addressLine}
                        </div>
                        <div className="text-[11px] text-[#8E8D88]">
                          {addr.cityState} — PIN {addr.postalCode}
                        </div>
                        {addr.gateNotes && (
                          <div className="text-[10px] text-[#C6FF3D]">
                            NOTE: {addr.gateNotes}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#8E8D88]">
                        <span className="inline-flex items-center gap-1 text-[#F4F1EA]">
                          <User className="w-3 h-3 text-[#FF5A1F]" />
                          {addr.recipientName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#C6FF3D]">
                          <Phone className="w-3 h-3" />
                          {addr.contactPhone}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Delivery Logistics Tier */}
            <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-[#F4F1EA]">
                <Truck className="w-4 h-4 text-[#FF5A1F]" />
                <span>2. FREIGHT & DISPATCH LOGISTICS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DELIVERY_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onChangeDeliveryTier(tier.id)}
                    className={`p-3 border-2 text-left cursor-pointer ${
                      deliveryTier === tier.id
                        ? 'bg-[#242424] border-[#FF5A1F] text-[#F4F1EA]'
                        : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{tier.label}</div>
                    <div className="text-[10px] text-[#8E8D88] mt-0.5">
                      {tier.eta}
                    </div>
                    <div className="text-xs font-bold text-[#C6FF3D] mt-1.5">
                      {tier.fee === 0 ? 'FREE' : formatRs(tier.fee)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Settlement Method & Gate Notes */}
            <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4 space-y-4">
              <div className="flex items-center gap-2 font-bold text-[#F4F1EA]">
                <CreditCard className="w-4 h-4 text-[#C6FF3D]" />
                <span>3. PAYMENT SETTLEMENT & PO INSTRUCTIONS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`p-3 border-2 text-left cursor-pointer ${
                      paymentMethod === opt.id
                        ? 'bg-[#242424] border-[#C6FF3D] text-[#F4F1EA]'
                        : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{opt.label}</div>
                    <div className="text-[10px] text-[#8E8D88] mt-1">
                      {opt.detail}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label
                  htmlFor="po-delivery-notes"
                  className="block text-[10px] uppercase text-[#8E8D88] mb-1"
                >
                  PO REFERENCE / DISPATCH INSTRUCTIONS (OPTIONAL)
                </label>
                <input
                  id="po-delivery-notes"
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="E.G. INTERNAL REF #MTR-44 · HYDRAULIC TAIL-LIFT TRUCK REQUIRED"
                  className="input-tactical w-full h-10 px-3 text-xs"
                />
              </div>
            </div>

            {/* Step 4: Itemized Order Review */}
            <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4 space-y-3">
              <div className="font-bold text-[#F4F1EA]">
                4. PURCHASE ORDER LINE ITEMS ({cart.length})
              </div>
              <div className="divide-y divide-[#2A2A2A] bg-[#131410] border border-[#2A2A2A]">
                {cart.map((line) => (
                  <div
                    key={line.equipmentId}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-[#F4F1EA] font-semibold">
                        {line.qty}× {line.name}
                      </div>
                      <div className="text-[10px] text-[#8E8D88]">
                        {line.sku} · SUPPLIER: {line.sellerName}
                      </div>
                    </div>
                    <span className="font-bold text-[#F4F1EA] whitespace-nowrap">
                      {formatRs(line.unitPrice * line.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Checkout Summary & Submit Footer */}
        <div className="sticky bottom-0 bg-[#1A1A1A] border-t-2 border-[#2A2A2A] p-5 space-y-3 font-mono-tabular">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-[9px] text-[#8E8D88]">SUBTOTAL</div>
              <div className="font-semibold text-[#F4F1EA]">
                {formatRs(subtotal)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[#8E8D88]">GST (18%)</div>
              <div className="font-semibold text-[#F4F1EA]">
                {formatRs(gstAmount)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[#8E8D88]">LOGISTICS</div>
              <div className="font-semibold text-[#F4F1EA]">
                {deliveryFee === 0 ? 'FREE' : formatRs(deliveryFee)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-[#8E8D88]">PO GRAND TOTAL</div>
              <div className="text-base font-bold text-[#C6FF3D]">
                {formatRs(grandTotal)}
              </div>
            </div>
          </div>

          {checkoutError && (
            <div className="p-2.5 bg-[#FF2E2E]/15 border-2 border-[#FF2E2E] text-[11px] text-[#FF2E2E]">
              {checkoutError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#2A2A2A]">
            <div className="flex items-center gap-2 text-[11px] text-[#8E8D88]">
              <ShieldCheck className="w-4 h-4 text-[#C6FF3D] shrink-0" />
              <span>
                SHIPPING TO:{' '}
                <strong className="text-[#F4F1EA]">
                  {selectedAddress?.label}
                </strong>{' '}
                ({selectedAddress?.contactPhone})
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary-mech px-4 py-3 text-xs font-bold uppercase cursor-pointer"
              >
                BACK TO CART
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="btn-dispatch chamfer-tr px-6 py-3 text-xs font-bold uppercase tracking-[0.06em] cursor-pointer"
              >
                CONFIRM & ISSUE PO · {formatRs(grandTotal)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
