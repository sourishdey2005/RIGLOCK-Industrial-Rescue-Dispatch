import {AlertOctagon, ArrowRight, Check, KeyRound, Send} from 'lucide-react';
import {FormEvent, useState} from 'react';
import {DispatchMission, MissionStatus} from '../types/rescue';
import {FieldMap} from './FieldMap';
import {LaunchDial} from './LaunchDial';
import {TrustStack} from './TrustStack';

interface ActiveDispatchScreenProps {
  mission: DispatchMission | null;
  onAdvanceStage: () => void;
  onToggleOverride: () => void;
  onAbortMission: () => void;
  onSendSiteNote: (note: string) => void;
  onReturnToBoard: () => void;
}

const STAGES: {id: MissionStatus; step: string; label: string}[] = [
  {id: 'VERIFIED', step: '01', label: 'HARDWARE VERIFIED'},
  {id: 'LOADED', step: '02', label: 'LOADED IN VEHICLE'},
  {id: 'EN_ROUTE', step: '03', label: 'EN ROUTE TO SITE'},
  {id: 'ARRIVED', step: '04', label: 'ON-SITE HANDOFF'},
];

export function ActiveDispatchScreen({
  mission,
  onAdvanceStage,
  onToggleOverride,
  onAbortMission,
  onSendSiteNote,
  onReturnToBoard,
}: ActiveDispatchScreenProps) {
  const [siteNote, setSiteNote] = useState('');
  const [confirmAbort, setConfirmAbort] = useState(false);

  if (!mission) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-14">
        <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-10 text-center space-y-5 max-w-2xl mx-auto">
          <div className="font-mono-tabular text-xs text-[#FF5A1F] uppercase tracking-[0.1em]">
            ACTIVE DISPATCH CONSOLE // IDLE
          </div>
          <h1 className="font-display text-4xl text-[#F4F1EA]">
            NO LIVE DISPATCH CURRENTLY IN FLIGHT
          </h1>
          <p className="text-sm text-[#8E8D88]">
            Stage an emergency hardware unit or scheduled rental from the Triage Board to activate the 45-minute Launch Dial and sector telemetry radar.
          </p>
          <button
            type="button"
            onClick={onReturnToBoard}
            className="btn-dispatch chamfer-tag px-6 py-3 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] cursor-pointer"
          >
            OPEN TRIAGE BOARD
          </button>
        </div>
      </section>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.id === mission.status);
  const effectiveIndex =
    mission.status === 'COMPLETED' ? 3 : Math.max(0, currentStageIndex);

  const handleNoteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!siteNote.trim()) return;
    onSendSiteNote(siteNote.trim().toUpperCase());
    setSiteNote('');
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 space-y-6">
      {/* Top Mission Telemetry Strip */}
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-xs">
            <span className="px-2 py-0.5 bg-halftone-lime text-[#121212] font-bold border border-[#0D0D0D]">
              {mission.missionCode}
            </span>
            <span className="text-[#F4F1EA] font-semibold">
              {mission.equipment.sku}
            </span>
            <span className="text-[#8E8D88]">/</span>
            <span className="text-[#8E8D88]">DISPATCHED {mission.startedAt}</span>
            {mission.priorityOverride && (
              <span className="px-2 py-0.5 border border-[#FF2E2E] text-[#FF2E2E] font-bold">
                CRITICAL OVERRIDE
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-[#F4F1EA] leading-none">
            {mission.equipment.name}
          </h1>
          <div className="font-mono-tabular text-xs text-[#8E8D88]">
            DROP ZONE: <span className="text-[#F4F1EA]">{mission.dropZoneAddress}</span>
          </div>
        </div>

        {/* Handoff Verification PIN Plate */}
        <div className="flex items-center gap-4 shrink-0 bg-[#131410] border-2 border-[#2A2A2A] px-4 py-3">
          <KeyRound className="w-5 h-5 text-[#FF5A1F]" />
          <div className="font-mono-tabular">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              HANDOFF RELEASE PIN
            </div>
            <div className="text-2xl font-bold text-[#C6FF3D] tracking-[0.16em]">
              {mission.handoffPin}
            </div>
          </div>
        </div>
      </div>

      {/* 12-Column Tactical Operations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Launch Dial + Milestones + Overrides */}
        <div className="lg:col-span-5 space-y-6">
          <LaunchDial
            totalSeconds={mission.etaTotalSeconds}
            remainingSeconds={mission.remainingSeconds}
            status={mission.status}
            priorityOverride={mission.priorityOverride}
          />

          {/* Procedural Milestone Stepper */}
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-4 space-y-3">
            <div className="flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-semibold text-[#F4F1EA] uppercase">
                DISPATCH MILESTONE PROTOCOL
              </span>
              <span className="text-[#C6FF3D]">
                STEP {effectiveIndex + 1} OF 4
              </span>
            </div>

            <div className="space-y-2">
              {STAGES.map((stage, idx) => {
                const isDone =
                  mission.status === 'COMPLETED' || idx < effectiveIndex;
                const isCurrent =
                  mission.status !== 'COMPLETED' &&
                  mission.status !== 'ABORTED' &&
                  idx === effectiveIndex;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-between px-3 py-2.5 border-2 font-mono-tabular text-xs ${
                      isCurrent
                        ? 'bg-[#242424] border-[#FF5A1F] text-[#F4F1EA]'
                        : isDone
                        ? 'bg-[#131410] border-[#C6FF3D] text-[#C6FF3D]'
                        : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{stage.step}.</span>
                      <span className="font-semibold">{stage.label}</span>
                    </div>
                    {isDone ? (
                      <Check className="w-4 h-4 text-[#C6FF3D]" />
                    ) : isCurrent ? (
                      <span className="text-[10px] font-bold text-[#FF5A1F]">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8E8D88]">PENDING</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interactive Controls */}
            {mission.status !== 'ABORTED' && mission.status !== 'COMPLETED' && (
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={onAdvanceStage}
                  className="w-full btn-dispatch chamfer-tr py-3 px-4 font-mono-tabular text-xs font-bold uppercase tracking-[0.06em] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {mission.status === 'ARRIVED'
                      ? 'VERIFY PIN & COMPLETE HANDOFF'
                      : 'ADVANCE COURIER STAGE'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onToggleOverride}
                    className="btn-override-mech py-2.5 px-3 font-mono-tabular text-[11px] font-bold uppercase tracking-[0.05em] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>
                      {mission.priorityOverride
                        ? 'OVERRIDE ACTIVE'
                        : 'EMERGENCY OVERRIDE'}
                    </span>
                  </button>

                  {!confirmAbort ? (
                    <button
                      type="button"
                      onClick={() => setConfirmAbort(true)}
                      className="btn-secondary-mech py-2.5 px-3 font-mono-tabular text-[11px] font-bold uppercase tracking-[0.05em] cursor-pointer"
                    >
                      ABORT DISPATCH
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onAbortMission();
                          setConfirmAbort(false);
                        }}
                        className="bg-[#FF2E2E] border-2 border-[#0D0D0D] text-[#121212] font-mono-tabular text-[11px] font-bold uppercase py-2 cursor-pointer"
                      >
                        CONFIRM
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAbort(false)}
                        className="bg-[#242424] border-2 border-[#2A2A2A] text-[#F4F1EA] font-mono-tabular text-[11px] font-bold uppercase py-2 cursor-pointer"
                      >
                        KEEP
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Real-Time Field Map + Courier Trust Stack + Comms Log */}
        <div className="lg:col-span-7 space-y-6">
          <FieldMap
            mission={mission}
            siteCoordinates={mission.siteCoordinates}
            dropZoneAddress={mission.dropZoneAddress}
          />

          {/* Courier Telemetry Plate */}
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono-tabular text-xs">
                <span className="text-[#8E8D88] uppercase">ASSIGNED COURIER: </span>
                <span className="text-[#F4F1EA] font-bold">
                  {mission.courierName}
                </span>
                <span className="text-[#8E8D88] mx-2">/</span>
                <span className="text-[#C6FF3D] font-semibold">
                  VEHICLE {mission.courierPlate}
                </span>
              </div>
              <span className="font-mono-tabular text-xs text-[#F4F1EA]">
                SITE CONTACT: {mission.siteContact}
              </span>
            </div>

            <TrustStack
              depositTier={mission.equipment.depositTier}
              rating={mission.equipment.rating}
              lastPingSeconds={mission.equipment.lastPingSeconds}
              distanceMiles={mission.equipment.distanceMiles}
            />
          </div>

          {/* Field Comms & Dispatch Log */}
          <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard flex flex-col">
            <div className="px-4 py-2.5 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between font-mono-tabular text-xs">
              <span className="font-semibold text-[#F4F1EA]">
                DISPATCH INCIDENT COMMS LOG
              </span>
              <span className="text-[#8E8D88]">
                {mission.logs.length} ENTRIES
              </span>
            </div>

            <div className="p-4 space-y-2 max-h-56 overflow-y-auto bg-[#131410] font-mono-tabular text-xs">
              {mission.logs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 border-b border-[#242424] pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-[#8E8D88] shrink-0">
                    {entry.timestamp}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                      entry.source === 'COURIER'
                        ? 'bg-[#C6FF3D] text-[#121212]'
                        : entry.source === 'SITE'
                        ? 'bg-[#FF5A1F] text-[#121212]'
                        : 'bg-[#242424] text-[#F4F1EA]'
                    }`}
                  >
                    {entry.source}
                  </span>
                  <span className="text-[#F4F1EA] leading-relaxed">
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleNoteSubmit}
              className="p-3 bg-[#1A1A1A] border-t-2 border-[#2A2A2A] flex gap-2"
            >
              <input
                type="text"
                value={siteNote}
                onChange={(e) => setSiteNote(e.target.value)}
                placeholder="TRANSMIT GATE CODE OR RIGGING NOTE TO COURIER..."
                aria-label="Transmit note to courier"
                className="input-tactical flex-1 h-10 px-3 font-mono-tabular text-xs"
              />
              <button
                type="submit"
                className="btn-dispatch px-4 h-10 font-mono-tabular text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
