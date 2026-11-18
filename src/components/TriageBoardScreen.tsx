import {Search, SlidersHorizontal, Wrench} from 'lucide-react';
import {useMemo, useState} from 'react';
import {
  DispatchMode,
  EquipmentCategory,
  EquipmentItem,
} from '../types/rescue';
import {TrustStack} from './TrustStack';
import {formatRs} from '../utils/currency';

interface TriageBoardScreenProps {
  catalog: EquipmentItem[];
  mode: DispatchMode;
  onModeChange: (mode: DispatchMode) => void;
  onSelectEquipment: (item: EquipmentItem) => void;
  nodeFilter: string | null;
  onClearNodeFilter: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const CATEGORIES: {id: EquipmentCategory; label: string}[] = [
  {id: 'ALL', label: 'ALL HARDWARE'},
  {id: 'POWER', label: 'POWER & GEN'},
  {id: 'DEWATERING', label: 'DEWATERING'},
  {id: 'HYDRAULIC', label: 'HYDRAULIC'},
  {id: 'LIGHTING', label: 'SITE LIGHTING'},
  {id: 'CUTTING', label: 'CUTTING & ARC'},
  {id: 'AIR', label: 'AIR & HEPA'},
];

const RADII = [5, 15, 30] as const;

export function TriageBoardScreen({
  catalog,
  mode,
  onModeChange,
  onSelectEquipment,
  nodeFilter,
  onClearNodeFilter,
  searchQuery: externalSearchQuery,
  onSearchChange,
}: TriageBoardScreenProps) {
  const [category, setCategory] = useState<EquipmentCategory>('ALL');
  const [localSearch, setLocalSearch] = useState('');
  const searchQuery = externalSearchQuery ?? localSearch;
  const setSearchQuery = onSearchChange ?? setLocalSearch;
  const [radiusMiles, setRadiusMiles] = useState<(typeof RADII)[number]>(15);
  const [onlyInVehicle, setOnlyInVehicle] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((item) => {
      if (nodeFilter && item.nodeId !== nodeFilter) return false;
      if (category !== 'ALL' && item.category !== category) return false;
      if (item.distanceMiles > radiusMiles) return false;
      if (onlyInVehicle && item.availabilityFlag !== 'IN VEHICLE') return false;
      if (q) {
        const hay = `${item.sku} ${item.name} ${item.category} ${item.nodeCallsign} ${item.nodeId} ${item.sellerName} ${item.primaryOutput} ${item.voltageOrPressure} ${item.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [catalog, category, searchQuery, radiusMiles, onlyInVehicle, nodeFilter]);

  const inVehicleCount = useMemo(
    () => catalog.filter((i) => i.availabilityFlag === 'IN VEHICLE').length,
    [catalog],
  );

  const resetFilters = () => {
    setCategory('ALL');
    setSearchQuery('');
    setRadiusMiles(30);
    setOnlyInVehicle(false);
    onClearNodeFilter();
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 space-y-6">
      {/* Operational Header & Split-Flap Mode Switch */}
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-[11px] uppercase tracking-[0.08em] text-[#8E8D88]">
              <span>SECTOR: BAY METRO GRID</span>
              <span aria-hidden="true">/</span>
              <span className="text-[#C6FF3D]">
                {inVehicleCount} UNITS IN VEHICLE
              </span>
              <span aria-hidden="true">/</span>
              <span>45-MIN ER SLA</span>
            </div>
            <h1 className="font-display text-4xl md:text-[52px] leading-[0.95] text-[#F4F1EA] uppercase">
              {mode === 'emergency'
                ? 'IMMEDIATE HARDWARE DISPATCH'
                : 'STAGED PROJECT RENTAL FLEET'}
            </h1>
            <p className="text-sm md:text-[15px] text-[#8E8D88] leading-relaxed">
              {mode === 'emergency'
                ? 'Verified industrial gear staged in nearby response vans and 24/7 depots for rapid 45-minute site drop.'
                : 'Lock multi-day or weekly project rates with guaranteed load-bank verification and scheduled dock delivery.'}
            </p>
          </div>

          {/* Physical Split-Flap Mode Toggle */}
          <div className="shrink-0 flex flex-col gap-2">
            <span className="font-mono-tabular text-[10px] uppercase tracking-[0.1em] text-[#8E8D88]">
              DISPATCH PROTOCOL MODE
            </span>
            <div
              role="group"
              aria-label="Dispatch Mode Switch"
              className="grid grid-cols-2 border-2 border-[#0D0D0D] bg-[#131410] shadow-hard"
            >
              <button
                type="button"
                onClick={() => onModeChange('emergency')}
                aria-pressed={mode === 'emergency'}
                className={`relative px-4 py-3 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-2 border-r-2 border-[#0D0D0D] transition-colors ${
                  mode === 'emergency'
                    ? 'bg-[#FF5A1F] text-[#121212]'
                    : 'bg-[#1A1A1A] text-[#8E8D88] hover:text-[#F4F1EA]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-2 h-2 border border-[#0D0D0D] ${
                    mode === 'emergency' ? 'bg-[#C6FF3D]' : 'bg-[#2A2A2A]'
                  }`}
                />
                <span>EMERGENCY: NOW</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('rental')}
                aria-pressed={mode === 'rental'}
                className={`relative px-4 py-3 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-2 transition-colors ${
                  mode === 'rental'
                    ? 'bg-[#F4F1EA] text-[#121212]'
                    : 'bg-[#1A1A1A] text-[#8E8D88] hover:text-[#F4F1EA]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-2 h-2 border border-[#0D0D0D] ${
                    mode === 'rental' ? 'bg-[#FF5A1F]' : 'bg-[#2A2A2A]'
                  }`}
                />
                <span>PROJECT: RENTAL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search, Radius & Filter Toolbar */}
        <div className="mt-6 pt-5 border-t-2 border-[#2A2A2A] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-[#8E8D88] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH BY SKU, VOLTAGE, GPM, OR TOOL NAME..."
                aria-label="Search hardware catalog"
                className="input-tactical w-full h-11 pl-10 pr-4 font-mono-tabular text-xs"
              />
            </div>

            {/* Radius Selector */}
            <div className="md:col-span-3 flex items-stretch border-2 border-[#2A2A2A] bg-[#131410]">
              <span className="px-3 flex items-center font-mono-tabular text-[10px] text-[#8E8D88] uppercase border-r border-[#2A2A2A] whitespace-nowrap">
                RADIUS
              </span>
              <div className="grid grid-cols-3 flex-1 divide-x divide-[#2A2A2A]">
                {RADII.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusMiles(r)}
                    className={`font-mono-tabular text-xs font-semibold cursor-pointer transition-colors ${
                      radiusMiles === r
                        ? 'bg-[#242424] text-[#C6FF3D]'
                        : 'text-[#8E8D88] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {r} MI
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Van Toggle */}
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={() => setOnlyInVehicle((prev) => !prev)}
                aria-pressed={onlyInVehicle}
                className={`w-full h-11 px-3 border-2 font-mono-tabular text-xs font-semibold uppercase tracking-[0.05em] flex items-center justify-between cursor-pointer transition-colors ${
                  onlyInVehicle
                    ? 'bg-[#242424] border-[#C6FF3D] text-[#C6FF3D]'
                    : 'bg-[#131410] border-[#2A2A2A] text-[#F4F1EA] hover:border-[#8E8D88]'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  IN-VEHICLE ONLY
                </span>
                <span>{onlyInVehicle ? 'ON' : 'ALL'}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3.5 py-2 border-2 font-mono-tabular text-[11px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                      : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA] hover:border-[#8E8D88]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            {nodeFilter && (
              <button
                type="button"
                onClick={onClearNodeFilter}
                className="ml-auto px-3 py-2 border-2 border-[#C6FF3D] bg-[#131410] font-mono-tabular text-[11px] font-semibold text-[#C6FF3D] uppercase cursor-pointer"
              >
                CLEAR NODE FILTER ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Equipment Triage Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-12 text-center space-y-4">
          <div className="font-display text-3xl text-[#F4F1EA]">
            NO HARDWARE UNITS MATCH CURRENT TRIAGE PARAMETERS
          </div>
          <p className="text-sm text-[#8E8D88] max-w-md mx-auto">
            Expand your geodesic search radius or clear category and vehicle filters to inspect all regional depot inventory.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-dispatch px-6 py-3 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] cursor-pointer"
          >
            RESET TRIAGE FILTERS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isInVehicle = item.availabilityFlag === 'IN VEHICLE';
            const isImageBroken = brokenImages[item.id];

            return (
              <article
                key={item.id}
                className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard flex flex-col justify-between"
              >
                <div>
                  {/* Technical Header Strip */}
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#242424] border-b-2 border-[#2A2A2A]">
                    <div className="flex items-center gap-2 font-mono-tabular text-[11px]">
                      <span className="text-[#F4F1EA] font-bold tracking-[0.06em]">
                        {item.sku}
                      </span>
                      <span className="text-[#8E8D88]">/</span>
                      <span className="text-[#8E8D88]">{item.conditionRating}</span>
                    </div>

                    {/* Halftone Live Indicator */}
                    <span
                      className={`px-2 py-0.5 font-mono-tabular text-[10px] font-bold uppercase tracking-[0.08em] whitespace-nowrap shrink-0 border border-[#0D0D0D] ${
                        isInVehicle
                          ? 'bg-halftone-lime text-[#121212]'
                          : 'bg-[#131410] text-[#F4F1EA] border-[#F4F1EA]'
                      }`}
                    >
                      {item.availabilityFlag}
                    </span>
                  </div>

                  {/* Hardware Image Viewport */}
                  <div className="relative aspect-[4/3] bg-[#131410] border-b-2 border-[#2A2A2A] overflow-hidden">
                    {!isImageBroken ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({...prev, [item.id]: true}))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-halftone-dark flex flex-col items-center justify-center p-6 text-center gap-2">
                        <Wrench className="w-8 h-8 text-[#FF5A1F]" />
                        <span className="font-mono-tabular text-xs text-[#F4F1EA]">
                          {item.sku}
                        </span>
                      </div>
                    )}

                    {/* Etched Corner Coordinate Stamps */}
                    <span
                      aria-hidden="true"
                      className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#131410]/90 border border-[#2A2A2A] font-mono-tabular text-[10px] text-[#F4F1EA]"
                    >
                      + {item.category}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#131410]/95 border border-[#2A2A2A] font-mono-tabular text-[11px] font-semibold text-[#C6FF3D]">
                      ETA {item.etaMinutes} MIN
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h2 className="font-display text-[26px] leading-[1.05] text-[#F4F1EA] uppercase">
                        {item.name}
                      </h2>
                      <p className="mt-1.5 text-[13px] text-[#8E8D88] leading-snug line-clamp-2">
                        {item.summary}
                      </p>
                    </div>

                    {/* Key Telemetry Spec Bar */}
                    <div className="grid grid-cols-2 border-2 border-[#2A2A2A] bg-[#131410] divide-x divide-[#2A2A2A] font-mono-tabular text-[11px]">
                      <div className="px-3 py-2">
                        <div className="text-[9px] text-[#8E8D88] uppercase">
                          OUTPUT RATING
                        </div>
                        <div className="text-[#F4F1EA] font-semibold truncate">
                          {item.primaryOutput}
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <div className="text-[9px] text-[#8E8D88] uppercase">
                          INTERFACE / LOAD
                        </div>
                        <div className="text-[#F4F1EA] font-semibold truncate">
                          {item.voltageOrPressure}
                        </div>
                      </div>
                    </div>

                    {/* Trust Stack Micro-Component */}
                    <TrustStack
                      depositTier={item.depositTier}
                      rating={item.rating}
                      lastPingSeconds={item.lastPingSeconds}
                      distanceMiles={item.distanceMiles}
                      compact
                    />
                  </div>
                </div>

                {/* Pricing & Mechanical Push Footer */}
                <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-3">
                  <div className="font-mono-tabular">
                    {mode === 'emergency' ? (
                      <>
                        <div className="text-lg font-bold text-[#F4F1EA] leading-none">
                          {formatRs(item.emergencyHourlyRate)}
                          <span className="text-xs font-normal text-[#8E8D88]">
                            /HR
                          </span>
                        </div>
                        <div className="text-[10px] text-[#FF5A1F] mt-1">
                          +{formatRs(item.emergencyDispatchFee)} RAPID DROP
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-[#F4F1EA] leading-none">
                          {formatRs(item.rentalDailyRate)}
                          <span className="text-xs font-normal text-[#8E8D88]">
                            /DAY
                          </span>
                        </div>
                        <div className="text-[10px] text-[#C6FF3D] mt-1">
                          {formatRs(item.rentalWeeklyRate)}/WK RATE
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectEquipment(item)}
                    className="btn-dispatch chamfer-tag px-4 py-2.5 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {mode === 'emergency' ? 'DISPATCH NOW' : 'STAGE RENTAL'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
