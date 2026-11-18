import {useEffect, useState} from 'react';
import {MissionStatus} from '../types/rescue';

interface LaunchDialProps {
  totalSeconds: number;
  remainingSeconds: number;
  status: MissionStatus;
  priorityOverride: boolean;
}

export function LaunchDial({
  totalSeconds,
  remainingSeconds,
  status,
  priorityOverride,
}: LaunchDialProps) {
  const [millis, setMillis] = useState(0);

  useEffect(() => {
    if (status === 'ARRIVED' || status === 'COMPLETED' || status === 'ABORTED') {
      setMillis(0);
      return;
    }
    const interval = setInterval(() => {
      setMillis((prev) => (prev + 93) % 1000);
    }, 93);
    return () => clearInterval(interval);
  }, [status]);

  const safeTotal = Math.max(1, totalSeconds);
  const clampedRemaining = Math.max(0, Math.min(safeTotal, remainingSeconds));
  const progressRatio = clampedRemaining / safeTotal;

  const mins = Math.floor(clampedRemaining / 60);
  const secs = Math.floor(clampedRemaining % 60);
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');
  const formattedMs = String(Math.floor(millis / 10)).padStart(2, '0');

  const tickCount = 60;
  const activeTicks = Math.ceil(progressRatio * tickCount);

  const dialAccent =
    status === 'ABORTED'
      ? '#FF2E2E'
      : priorityOverride || clampedRemaining <= 180
      ? '#FF2E2E'
      : clampedRemaining <= 600
      ? '#FF5A1F'
      : '#C6FF3D';

  const statusLabel =
    status === 'ARRIVED' || status === 'COMPLETED'
      ? 'UNIT ON SITE'
      : status === 'ABORTED'
      ? 'MISSION ABORTED'
      : priorityOverride
      ? 'OVERRIDE EXPEDITE'
      : 'ER DISPATCH WINDOW';

  const center = 140;
  const outerR = 126;
  const innerR = 110;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard">
      {/* Corner Coordinate Ticks */}
      <span
        aria-hidden="true"
        className="absolute top-2 left-2.5 font-mono-tabular text-[10px] text-[#8E8D88]"
      >
        + DIAL-01
      </span>
      <span
        aria-hidden="true"
        className="absolute top-2 right-2.5 font-mono-tabular text-[10px] text-[#8E8D88]"
      >
        SLA 45:00 +
      </span>

      <div className="relative w-[280px] h-[280px] flex items-center justify-center my-2">
        <svg
          viewBox="0 0 280 280"
          className="w-full h-full"
          role="img"
          aria-label={`Dispatch countdown ${formattedMins} minutes ${formattedSecs} seconds`}
        >
          {/* Outer mechanical bezel ring */}
          <circle
            cx={center}
            cy={center}
            r={134}
            fill="#131410"
            stroke="#2A2A2A"
            strokeWidth="2"
          />
          <circle
            cx={center}
            cy={center}
            r={98}
            fill="none"
            stroke="#2A2A2A"
            strokeWidth="1.5"
          />

          {/* 60 segmented outer ticks that extinguish as time elapses */}
          {Array.from({length: tickCount}).map((_, i) => {
            const angleDeg = i * (360 / tickCount) - 90;
            const angleRad = (angleDeg * Math.PI) / 180;
            const isMajor = i % 5 === 0;
            const r1 = isMajor ? innerR - 4 : innerR;
            const r2 = outerR;
            const x1 = center + r1 * Math.cos(angleRad);
            const y1 = center + r1 * Math.sin(angleRad);
            const x2 = center + r2 * Math.cos(angleRad);
            const y2 = center + r2 * Math.sin(angleRad);

            const isLit = i < activeTicks && status !== 'ABORTED';
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isLit ? dialAccent : '#2A2A2A'}
                strokeWidth={isMajor ? 3 : 2}
              />
            );
          })}

          {/* Crosshair Axis Ticks */}
          <line x1={center} y1={46} x2={center} y2={58} stroke="#8E8D88" strokeWidth="1" />
          <line x1={center} y1={222} x2={center} y2={234} stroke="#8E8D88" strokeWidth="1" />
          <line x1={46} y1={center} x2={58} y2={center} stroke="#8E8D88" strokeWidth="1" />
          <line x1={222} y1={center} x2={234} y2={center} stroke="#8E8D88" strokeWidth="1" />
        </svg>

        {/* Central Countdown Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span
            className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.12em] mb-1 px-2 py-0.5 border border-[#2A2A2A] bg-[#1A1A1A]"
            style={{color: dialAccent}}
          >
            {statusLabel}
          </span>

          <div className="flex items-baseline justify-center font-mono-tabular text-[#F4F1EA]">
            <span className="text-5xl font-bold tracking-tight leading-none">
              {formattedMins}:{formattedSecs}
            </span>
            <span
              className="text-base font-semibold ml-1 leading-none"
              style={{color: dialAccent}}
            >
              .{formattedMs}
            </span>
          </div>

          <span className="mt-2 font-mono-tabular text-[11px] text-[#8E8D88] uppercase tracking-[0.08em]">
            {Math.round(progressRatio * 100)}% WINDOW REMAINING
          </span>
        </div>
      </div>

      {/* Bottom Instrumentation Strip */}
      <div className="w-full grid grid-cols-3 border-2 border-[#2A2A2A] bg-[#131410] divide-x divide-[#2A2A2A] font-mono-tabular text-[11px]">
        <div className="px-3 py-2">
          <div className="text-[9px] text-[#8E8D88] uppercase">TARGET ETA</div>
          <div className="text-[#F4F1EA] font-semibold">
            {status === 'ARRIVED' || status === 'COMPLETED'
              ? 'ON SITE'
              : `${Math.max(1, Math.ceil(clampedRemaining / 60))} MIN`}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[9px] text-[#8E8D88] uppercase">PRIORITY</div>
          <div
            className={`font-semibold ${
              priorityOverride ? 'text-[#FF2E2E]' : 'text-[#FF5A1F]'
            }`}
          >
            {priorityOverride ? 'TIER-0 OVERRIDE' : 'ER STANDARD'}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[9px] text-[#8E8D88] uppercase">TELEMETRY</div>
          <div className="text-[#C6FF3D] font-semibold">LOCKED</div>
        </div>
      </div>
    </div>
  );
}
