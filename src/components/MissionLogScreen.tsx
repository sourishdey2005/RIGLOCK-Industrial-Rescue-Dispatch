import {FileText, RotateCcw} from 'lucide-react';
import {useState} from 'react';
import {DispatchMission, EquipmentItem} from '../types/rescue';
import {formatRs} from '../utils/currency';

interface MissionLogScreenProps {
  missions: DispatchMission[];
  onRedispatch: (equipment: EquipmentItem) => void;
  onOpenActiveDispatch: (missionId: string) => void;
}

export function MissionLogScreen({
  missions,
  onRedispatch,
  onOpenActiveDispatch,
}: MissionLogScreenProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<DispatchMission | null>(
    null,
  );

  const totalSpend = missions
    .filter((m) => m.status !== 'ABORTED')
    .reduce((acc, m) => acc + m.totalCost, 0);

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 space-y-6">
      {/* Header Summary */}
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="font-mono-tabular text-[11px] uppercase tracking-[0.08em] text-[#8E8D88]">
            OPERATIONAL AUDIT TRAIL // {missions.length} RECORDED DISPATCHES
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-[#F4F1EA] leading-none">
            MISSION LEDGER & RECEIPTS
          </h1>
        </div>

        <div className="grid grid-cols-2 border-2 border-[#2A2A2A] bg-[#131410] divide-x divide-[#2A2A2A] font-mono-tabular">
          <div className="px-4 py-2.5">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              LOGGED MISSIONS
            </div>
            <div className="text-xl font-bold text-[#F4F1EA]">
              {missions.length}
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[10px] text-[#8E8D88] uppercase">
              COMMITTED LEDGER
            </div>
            <div className="text-xl font-bold text-[#C6FF3D]">
              {formatRs(totalSpend)}
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Tabular Ledger */}
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard overflow-x-auto">
        {missions.length === 0 ? (
          <div className="p-10 text-center font-mono-tabular text-xs text-[#8E8D88]">
            NO DISPATCHES LOGGED FOR YOUR BUYER ACCOUNT YET. STAGE A UNIT FROM THE TRIAGE BOARD OR BUYER DESK.
          </div>
        ) : (
        <table className="w-full text-left border-collapse font-mono-tabular text-xs">
          <thead>
            <tr className="bg-[#242424] border-b-2 border-[#2A2A2A] text-[10px] uppercase tracking-[0.08em] text-[#8E8D88]">
              <th className="py-3 px-4">MISSION CODE</th>
              <th className="py-3 px-4">HARDWARE UNIT</th>
              <th className="py-3 px-4">MODE</th>
              <th className="py-3 px-4">DROP ZONE</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">TOTAL</th>
              <th className="py-3 px-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {missions.map((mission) => {
              const isLive =
                mission.status === 'VERIFIED' ||
                mission.status === 'LOADED' ||
                mission.status === 'EN_ROUTE' ||
                mission.status === 'ARRIVED';

              return (
                <tr
                  key={mission.id}
                  className="hover:bg-[#242424]/60 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-[#F4F1EA] whitespace-nowrap">
                    {mission.missionCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[#F4F1EA] font-semibold">
                      {mission.equipment.name}
                    </div>
                    <div className="text-[10px] text-[#8E8D88]">
                      {mission.equipment.sku} · {mission.courierName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#8E8D88] uppercase">
                    {mission.mode === 'emergency'
                      ? 'ER DISPATCH'
                      : `${mission.rentalDays}D RENTAL`}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-[#F4F1EA]">
                    {mission.dropZoneAddress}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold border ${
                        isLive
                          ? 'bg-halftone-lime text-[#121212] border-[#0D0D0D]'
                          : mission.status === 'COMPLETED'
                          ? 'bg-[#131410] text-[#C6FF3D] border-[#C6FF3D]'
                          : 'bg-[#131410] text-[#FF2E2E] border-[#FF2E2E]'
                      }`}
                    >
                      {mission.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#F4F1EA] whitespace-nowrap">
                    {formatRs(mission.totalCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {isLive && (
                        <button
                          type="button"
                          onClick={() => onOpenActiveDispatch(mission.id)}
                          className="px-2.5 py-1.5 bg-[#FF5A1F] text-[#121212] border border-[#0D0D0D] text-[10px] font-bold uppercase cursor-pointer"
                        >
                          TRACK LIVE
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(mission)}
                        className="px-2.5 py-1.5 bg-[#131410] text-[#F4F1EA] border border-[#2A2A2A] hover:border-[#F4F1EA] text-[10px] font-semibold uppercase inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        RECEIPT
                      </button>
                      <button
                        type="button"
                        onClick={() => onRedispatch(mission.equipment)}
                        className="px-2.5 py-1.5 bg-[#131410] text-[#C6FF3D] border border-[#2A2A2A] hover:border-[#C6FF3D] text-[10px] font-semibold uppercase inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        RE-DISPATCH
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Receipt Inspection Modal */}
      {selectedReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Dispatch receipt ${selectedReceipt.missionCode}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="w-full max-w-lg bg-[#1A1A1A] border-2 border-[#F4F1EA] shadow-hard p-6 space-y-4 font-mono-tabular text-xs">
            <div className="flex items-center justify-between border-b-2 border-[#2A2A2A] pb-3">
              <div>
                <div className="text-[10px] text-[#FF5A1F] uppercase">
                  RIGLOCK DISPATCH MANIFEST
                </div>
                <div className="font-display text-3xl text-[#F4F1EA] leading-none mt-1">
                  {selectedReceipt.missionCode}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="btn-secondary-mech px-3 py-1.5 text-[11px] font-bold uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-2 text-[#F4F1EA]">
              <div className="flex justify-between">
                <span className="text-[#8E8D88]">EQUIPMENT</span>
                <span className="font-semibold">
                  {selectedReceipt.equipment.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8D88]">SKU / BOND</span>
                <span>
                  {selectedReceipt.equipment.sku} ·{' '}
                  {selectedReceipt.equipment.depositTier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8D88]">COURIER / PLATE</span>
                <span>
                  {selectedReceipt.courierName} ({selectedReceipt.courierPlate})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8D88]">HANDOFF PIN</span>
                <span className="text-[#C6FF3D] font-bold">
                  {selectedReceipt.handoffPin}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2">
                <span className="text-[#8E8D88]">DISPATCH TOTAL</span>
                <span className="text-base font-bold text-[#FF5A1F]">
                  {formatRs(selectedReceipt.totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
