import {ArrowUpRight, Truck, Warehouse} from 'lucide-react';
import {useState} from 'react';
import {DepotNode} from '../types/rescue';
import {TrustStack} from './TrustStack';

interface DepotNodesScreenProps {
  nodes: DepotNode[];
  onInspectNodeInventory: (nodeId: string) => void;
}

export function DepotNodesScreen({
  nodes,
  onInspectNodeInventory,
}: DepotNodesScreenProps) {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN VEHICLE' | 'LIVE NODE'>('ALL');

  const visibleNodes = nodes.filter(
    (n) => filterStatus === 'ALL' || n.status === filterStatus,
  );

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 space-y-6">
      <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="font-mono-tabular text-[11px] uppercase tracking-[0.08em] text-[#C6FF3D]">
            REGIONAL SUPPLY MESH // {nodes.length} VERIFIED NODES
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-[#F4F1EA] leading-none">
            ACTIVE DEPOTS & MOBILE RESPONSE VANS
          </h1>
          <p className="text-sm text-[#8E8D88] max-w-2xl">
            Every unit on the Triage Board is physically staged in a live response van or 24/7 staging yard with verified GPS ping telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(['ALL', 'IN VEHICLE', 'LIVE NODE'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-2 border-2 font-mono-tabular text-xs font-semibold uppercase whitespace-nowrap cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#FF5A1F] border-[#0D0D0D] text-[#121212] shadow-hard-sm'
                  : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88] hover:text-[#F4F1EA]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleNodes.map((node) => (
          <article
            key={node.id}
            className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard flex flex-col justify-between"
          >
            <div>
              <div className="px-4 py-3 bg-[#242424] border-b-2 border-[#2A2A2A] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 font-mono-tabular text-xs font-bold text-[#F4F1EA]">
                  {node.status === 'IN VEHICLE' ? (
                    <Truck className="w-4 h-4 text-[#FF5A1F]" />
                  ) : (
                    <Warehouse className="w-4 h-4 text-[#C6FF3D]" />
                  )}
                  <span>{node.callsign}</span>
                </div>
                <span
                  className={`px-2 py-0.5 font-mono-tabular text-[10px] font-bold uppercase border border-[#0D0D0D] ${
                    node.status === 'IN VEHICLE'
                      ? 'bg-halftone-lime text-[#121212]'
                      : 'bg-[#131410] text-[#F4F1EA] border-[#F4F1EA]'
                  }`}
                >
                  {node.status}
                </span>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono-tabular text-xs">
                  <div>
                    <div className="text-[10px] text-[#8E8D88] uppercase">
                      SECTOR / CORRIDOR
                    </div>
                    <div className="text-[#F4F1EA] font-semibold mt-0.5">
                      {node.region}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8E8D88] uppercase">
                      PLATFORM
                    </div>
                    <div className="text-[#F4F1EA] font-semibold mt-0.5">
                      {node.vehicleType}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8E8D88] uppercase">
                      LEAD TECHNICIAN
                    </div>
                    <div className="text-[#F4F1EA] font-semibold mt-0.5">
                      {node.leadTech}
                    </div>
                  </div>
                </div>

                <TrustStack
                  depositTier={node.depositTier}
                  rating={node.rating}
                  lastPingSeconds={node.lastPingSeconds}
                  distanceMiles={node.distanceMiles}
                />
              </div>
            </div>

            <div className="px-4 py-3 bg-[#131410] border-t-2 border-[#2A2A2A] flex items-center justify-between gap-3">
              <div className="font-mono-tabular text-xs text-[#8E8D88]">
                <span className="text-[#F4F1EA] font-bold">
                  {node.activeUnits} STAGED UNITS
                </span>
                <span className="mx-2">·</span>
                <span>AVG SLA {node.slaMinutes} MIN</span>
              </div>
              <button
                type="button"
                onClick={() => onInspectNodeInventory(node.id)}
                className="btn-dispatch px-4 py-2 font-mono-tabular text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>INSPECT GEAR</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
