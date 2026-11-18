import {AlertTriangle, CheckSquare, ShieldCheck, X} from 'lucide-react';
import {FormEvent, useState} from 'react';
import {DispatchMode, EquipmentItem} from '../types/rescue';
import {TrustStack} from './TrustStack';
import {formatRs} from '../utils/currency';

interface DispatchStagingDrawerProps {
  equipment: EquipmentItem | null;
  mode: DispatchMode;
  defaultAddress?: string;
  defaultContact?: string;
  onClose: () => void;
  onConfirmDispatch: (payload: {
    equipment: EquipmentItem;
    mode: DispatchMode;
    dropZoneAddress: string;
    siteContact: string;
    rentalDays: number;
    priorityOverride: boolean;
    totalCost: number;
  }) => void;
}

export function DispatchStagingDrawer({
  equipment,
  mode,
  defaultAddress,
  defaultContact,
  onClose,
  onConfirmDispatch,
}: DispatchStagingDrawerProps) {
  const [dropZoneAddress, setDropZoneAddress] = useState(
    defaultAddress || '440 TERRY FRANCOIS BLVD, GATE 3 (SUB-BASEMENT VAULT)',
  );
  const [siteContact, setSiteContact] = useState(
    defaultContact || 'ENG. H. MERCER · +91 98201 44120',
  );
  const [rentalDays, setRentalDays] = useState(3);
  const [priorityOverride, setPriorityOverride] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!equipment) return null;

  const priorityFee = 3500;
  const scheduledDropFee = 2500;

  const baseCost =
    mode === 'emergency'
      ? equipment.emergencyHourlyRate * 3 +
        equipment.emergencyDispatchFee +
        (priorityOverride ? priorityFee : 0)
      : equipment.rentalDailyRate * rentalDays + scheduledDropFee;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dropZoneAddress.trim() || !siteContact.trim()) {
      setValidationError(
        'DROP-ZONE ADDRESS AND SITE CONTACT ARE REQUIRED FOR DISPATCH LOCK.',
      );
      return;
    }
    setValidationError('');
    onConfirmDispatch({
      equipment,
      mode,
      dropZoneAddress: dropZoneAddress.trim().toUpperCase(),
      siteContact: siteContact.trim().toUpperCase(),
      rentalDays,
      priorityOverride,
      totalCost: baseCost,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Stage dispatch for ${equipment.name}`}
      className="fixed inset-0 z-50 flex justify-end bg-black/80"
    >
      <div className="w-full max-w-2xl bg-[#131410] border-l-2 border-[#2A2A2A] h-full overflow-y-auto flex flex-col justify-between">
        {/* Top Drawer Header */}
        <div>
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#1A1A1A] border-b-2 border-[#2A2A2A]">
            <div>
              <div className="font-mono-tabular text-[11px] text-[#FF5A1F] font-bold uppercase tracking-[0.08em]">
                {mode === 'emergency'
                  ? 'MISSION STAGING // ER DISPATCH'
                  : 'RENTAL STAGING // PROJECT FLEET'}
              </div>
              <h2 className="font-display text-3xl text-[#F4F1EA] leading-none mt-1">
                {equipment.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close staging console"
              className="btn-secondary-mech w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Hardware Overview & Trust Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4">
              <div className="sm:col-span-2 aspect-[4/3] bg-[#131410] border-2 border-[#2A2A2A] overflow-hidden">
                <img
                  src={equipment.image}
                  alt={equipment.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:col-span-3 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono-tabular text-xs">
                    <span className="text-[#C6FF3D] font-semibold">
                      {equipment.sku}
                    </span>
                    <span className="text-[#8E8D88]">
                      {equipment.nodeCallsign}
                    </span>
                  </div>
                  <p className="text-sm text-[#F4F1EA] leading-snug">
                    {equipment.summary}
                  </p>
                </div>

                <div className="font-mono-tabular text-[11px] text-[#8E8D88] flex flex-wrap gap-x-4 gap-y-1">
                  <span>COURIER: {equipment.courierName}</span>
                  <span>UNIT: {equipment.courierPlate}</span>
                  <span>WEIGHT: {equipment.weightLbs} LBS</span>
                </div>
              </div>
            </div>

            <TrustStack
              depositTier={equipment.depositTier}
              rating={equipment.rating}
              lastPingSeconds={equipment.lastPingSeconds}
              distanceMiles={equipment.distanceMiles}
            />

            {/* Technical Specs Matrix */}
            <div className="space-y-2">
              <div className="font-mono-tabular text-xs font-semibold uppercase tracking-[0.08em] text-[#8E8D88]">
                CALIBRATED HARDWARE SPECIFICATIONS
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 border-2 border-[#2A2A2A] bg-[#1A1A1A]">
                {equipment.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="p-3 border-b border-r border-[#2A2A2A] font-mono-tabular"
                  >
                    <div className="text-[10px] text-[#8E8D88] uppercase">
                      {spec.label}
                    </div>
                    <div className="text-xs font-semibold text-[#F4F1EA] mt-0.5">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-Dispatch Checklist */}
            <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4 space-y-2.5">
              <div className="flex items-center justify-between font-mono-tabular text-xs">
                <span className="font-semibold text-[#F4F1EA]">
                  QA & LOAD-BANK VERIFICATION
                </span>
                <span className="text-[#C6FF3D]">
                  INSPECTED {equipment.inspectionDate}
                </span>
              </div>
              <ul className="space-y-1.5">
                {equipment.checklist.map((entry) => (
                  <li
                    key={entry}
                    className="flex items-start gap-2 text-xs text-[#F4F1EA]"
                  >
                    <CheckSquare className="w-4 h-4 text-[#C6FF3D] shrink-0 mt-0.5" />
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dispatch Form */}
            <form
              id="dispatch-staging-form"
              onSubmit={handleSubmit}
              className="space-y-4 bg-[#1A1A1A] border-2 border-[#2A2A2A] p-4"
            >
              <div className="font-mono-tabular text-xs font-semibold uppercase tracking-[0.08em] text-[#FF5A1F]">
                DROP-ZONE COORDINATES & SITE ACCESS
              </div>

              <div>
                <label
                  htmlFor="drop-zone-address"
                  className="block font-mono-tabular text-[11px] uppercase text-[#8E8D88] mb-1.5"
                >
                  SITE STREET ADDRESS / ACCESS GATE
                </label>
                <input
                  id="drop-zone-address"
                  type="text"
                  value={dropZoneAddress}
                  onChange={(e) => setDropZoneAddress(e.target.value)}
                  placeholder="ENTER SITE ADDRESS & GATE NUMBER..."
                  className="input-tactical w-full h-11 px-3 font-mono-tabular text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="site-contact"
                  className="block font-mono-tabular text-[11px] uppercase text-[#8E8D88] mb-1.5"
                >
                  ON-SITE ENGINEER / RADIO CONTACT
                </label>
                <input
                  id="site-contact"
                  type="text"
                  value={siteContact}
                  onChange={(e) => setSiteContact(e.target.value)}
                  placeholder="NAME & DIRECT PHONE NUMBER..."
                  className="input-tactical w-full h-11 px-3 font-mono-tabular text-xs"
                />
              </div>

              {mode === 'rental' ? (
                <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
                  <div>
                    <div className="font-mono-tabular text-xs font-semibold text-[#F4F1EA]">
                      RENTAL DURATION (DAYS)
                    </div>
                    <div className="font-mono-tabular text-[11px] text-[#8E8D88]">
                      {formatRs(equipment.rentalDailyRate)}/DAY · SCHEDULED DROP (+{formatRs(scheduledDropFee)})
                    </div>
                  </div>
                  <div className="flex items-center border-2 border-[#2A2A2A] bg-[#131410]">
                    <button
                      type="button"
                      onClick={() => setRentalDays((d) => Math.max(1, d - 1))}
                      className="w-10 h-10 font-mono-tabular text-base font-bold text-[#F4F1EA] hover:bg-[#242424] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-mono-tabular text-sm font-bold text-[#C6FF3D]">
                      {rentalDays}D
                    </span>
                    <button
                      type="button"
                      onClick={() => setRentalDays((d) => Math.min(30, d + 1))}
                      className="w-10 h-10 font-mono-tabular text-base font-bold text-[#F4F1EA] hover:bg-[#242424] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-[#2A2A2A]">
                  <button
                    type="button"
                    onClick={() => setPriorityOverride((prev) => !prev)}
                    aria-pressed={priorityOverride}
                    className={`w-full p-3 border-2 flex items-center justify-between cursor-pointer transition-colors ${
                      priorityOverride
                        ? 'bg-[#FF2E2E]/15 border-[#FF2E2E] text-[#F4F1EA]'
                        : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-mono-tabular text-xs font-semibold">
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          priorityOverride ? 'text-[#FF2E2E]' : 'text-[#8E8D88]'
                        }`}
                      />
                      TIER-0 PRIORITY OVERRIDE (DIRECT EXPEDITE · +{formatRs(priorityFee)})
                    </span>
                    <span className="font-mono-tabular text-xs font-bold">
                      {priorityOverride ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>
                </div>
              )}

              {validationError && (
                <div className="p-3 bg-[#FF2E2E]/15 border-2 border-[#FF2E2E] font-mono-tabular text-xs text-[#FF2E2E]">
                  {validationError}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sticky Cost & Confirm Footer */}
        <div className="sticky bottom-0 bg-[#1A1A1A] border-t-2 border-[#2A2A2A] p-5 space-y-4">
          <div className="flex items-center justify-between font-mono-tabular text-xs">
            <span className="flex items-center gap-1.5 text-[#8E8D88]">
              <ShieldCheck className="w-4 h-4 text-[#C6FF3D]" />
              SECURITY HOLD: {formatRs(equipment.depositAmount)} ({equipment.depositTier})
            </span>
            <span className="text-[#F4F1EA] font-bold text-base">
              EST. TOTAL: {formatRs(baseCost)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-mech py-3 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              form="dispatch-staging-form"
              className="sm:col-span-2 btn-dispatch chamfer-tr py-3 font-mono-tabular text-xs font-bold uppercase tracking-[0.08em] cursor-pointer"
            >
              {mode === 'emergency'
                ? `CONFIRM ER DISPATCH · ETA ${
                    priorityOverride
                      ? Math.max(10, equipment.etaMinutes - 6)
                      : equipment.etaMinutes
                  } MIN`
                : `LOCK IN ${rentalDays}-DAY RENTAL DISPATCH`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
