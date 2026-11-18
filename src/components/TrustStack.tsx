import {ShieldCheck, Star} from 'lucide-react';

interface TrustStackProps {
  depositTier: string;
  rating: number;
  lastPingSeconds: number;
  distanceMiles: number;
  compact?: boolean;
}

export function TrustStack({
  depositTier,
  rating,
  lastPingSeconds,
  distanceMiles,
  compact = false,
}: TrustStackProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 border-2 border-[#2A2A2A] bg-[#131410] divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A2A] font-mono-tabular ${
        compact ? 'text-[10px]' : 'text-[11px]'
      }`}
    >
      {/* 1. Shield badge displaying deposit security tier */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 text-[#F4F1EA] whitespace-nowrap overflow-hidden">
        <ShieldCheck className="w-3.5 h-3.5 text-[#C6FF3D] shrink-0" />
        <span className="font-semibold tracking-[0.05em] truncate">
          {depositTier}
        </span>
      </div>

      {/* 2. Numerical star verification */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 text-[#F4F1EA] whitespace-nowrap">
        <Star className="w-3.5 h-3.5 text-[#FF5A1F] fill-[#FF5A1F] shrink-0" />
        <span className="font-semibold tracking-[0.04em]">
          {rating.toFixed(2)} / 5.00
        </span>
      </div>

      {/* 3. Last active telemetry timestamp */}
      <div className="flex items-center px-2.5 py-2 text-[#C6FF3D] whitespace-nowrap">
        <span className="tracking-[0.05em]">
          PING: {lastPingSeconds}S AGO
        </span>
      </div>

      {/* 4. Radial geodesic distance metric */}
      <div className="flex items-center sm:justify-end px-2.5 py-2 text-[#F4F1EA] whitespace-nowrap">
        <span className="font-semibold tracking-[0.05em]">
          {distanceMiles.toFixed(1)} MILES
        </span>
      </div>
    </div>
  );
}
