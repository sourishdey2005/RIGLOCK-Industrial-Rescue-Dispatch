import {useMemo, useState} from 'react';
import {DEPOT_NODES} from '../data/catalog';
import {DepotNode, DispatchMission} from '../types/rescue';

interface FieldMapProps {
  mission: DispatchMission;
  siteCoordinates: string;
  dropZoneAddress: string;
}

interface Point {
  x: number;
  y: number;
}

function interpolateAlongPolyline(points: Point[], t: number): Point {
  if (points.length === 0) return {x: 50, y: 31};
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const segments: {start: Point; end: Point; length: number}[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push({start, end, length});
    totalLength += length;
  }

  if (totalLength === 0) return points[0];

  let targetDist = t * totalLength;
  for (const seg of segments) {
    if (targetDist <= seg.length || seg === segments[segments.length - 1]) {
      const ratio = seg.length === 0 ? 0 : targetDist / seg.length;
      return {
        x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
        y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
      };
    }
    targetDist -= seg.length;
  }

  return points[points.length - 1];
}

function splitPolylineAt(points: Point[], t: number): Point[] {
  if (points.length < 2) return points;
  if (t <= 0) return [points[0]];
  if (t >= 1) return points;

  const segments: {start: Point; end: Point; length: number}[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push({start, end, length});
    totalLength += length;
  }

  let targetDist = t * totalLength;
  const traversed: Point[] = [points[0]];

  for (const seg of segments) {
    if (targetDist <= seg.length) {
      const ratio = seg.length === 0 ? 0 : targetDist / seg.length;
      traversed.push({
        x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
        y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
      });
      break;
    }
    traversed.push(seg.end);
    targetDist -= seg.length;
  }

  return traversed;
}

export function FieldMap({
  mission,
  siteCoordinates,
  dropZoneAddress,
}: FieldMapProps) {
  const originNode =
    DEPOT_NODES.find((n) => n.id === mission.equipment.nodeId) || DEPOT_NODES[1];
  const [selectedNode, setSelectedNode] = useState<DepotNode>(originNode);
  const [showRangeRings, setShowRangeRings] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(true);

  // Target site drop-zone coordinates on static 100x62 SVG field grid
  const targetPoint: Point = {x: 68, y: 34};
  const originPoint: Point = {
    x: originNode.mapX,
    y: originNode.mapY * 0.62,
  };

  // Multi-segment arterial path from origin depot/van to dropZoneAddress
  const routeWaypoints: Point[] = useMemo(() => {
    const midX = Number(((originPoint.x + targetPoint.x) / 2).toFixed(1));
    const elbow1: Point = {x: midX, y: originPoint.y};
    const elbow2: Point = {x: midX + 6, y: targetPoint.y};
    return [originPoint, elbow1, elbow2, targetPoint];
  }, [originPoint.x, originPoint.y, targetPoint.x, targetPoint.y]);

  const progress =
    mission.status === 'ARRIVED' || mission.status === 'COMPLETED'
      ? 1
      : mission.status === 'VERIFIED'
      ? 0.08
      : mission.status === 'LOADED'
      ? 0.22
      : mission.status === 'ABORTED'
      ? 0.35
      : Math.min(
          0.96,
          Math.max(
            0.28,
            1 - mission.remainingSeconds / Math.max(1, mission.etaTotalSeconds),
          ),
        );

  const courierPos = interpolateAlongPolyline(routeWaypoints, progress);
  const traversedPoints = splitPolylineAt(routeWaypoints, progress);

  const fullPathD = routeWaypoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');

  const traversedPathD = traversedPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');

  const shortDropZone =
    dropZoneAddress.length > 34
      ? `${dropZoneAddress.slice(0, 34)}...`
      : dropZoneAddress;

  return (
    <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] shadow-hard flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#242424] border-b-2 border-[#2A2A2A]">
        <div className="flex items-center gap-2 font-mono-tabular text-xs font-semibold text-[#F4F1EA]">
          <span className="text-[#FF5A1F]">⌖</span>
          <span>REAL-TIME FIELD MAP // SVG CORRIDOR PLOT</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWaypoints((v) => !v)}
            aria-pressed={showWaypoints}
            className={`px-2 py-1 border font-mono-tabular text-[10px] font-semibold uppercase cursor-pointer transition-colors ${
              showWaypoints
                ? 'bg-[#131410] border-[#C6FF3D] text-[#C6FF3D]'
                : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
            }`}
          >
            WAYPOINTS
          </button>
          <button
            type="button"
            onClick={() => setShowRangeRings((v) => !v)}
            aria-pressed={showRangeRings}
            className={`px-2 py-1 border font-mono-tabular text-[10px] font-semibold uppercase cursor-pointer transition-colors ${
              showRangeRings
                ? 'bg-[#131410] border-[#FF5A1F] text-[#FF5A1F]'
                : 'bg-[#131410] border-[#2A2A2A] text-[#8E8D88]'
            }`}
          >
            RINGS
          </button>
        </div>
      </div>

      {/* Site Coordinates & Drop-Zone Path Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-[#2A2A2A] bg-[#131410] divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A2A] font-mono-tabular text-[11px]">
        <div className="px-4 py-2">
          <span className="text-[#8E8D88] uppercase mr-2">SITE COORDS:</span>
          <span className="text-[#C6FF3D] font-semibold">{siteCoordinates}</span>
        </div>
        <div className="px-4 py-2 truncate">
          <span className="text-[#8E8D88] uppercase mr-2">DROP PATH:</span>
          <span className="text-[#F4F1EA] font-semibold" title={dropZoneAddress}>
            {originNode.callsign.split(' // ')[0]} → {shortDropZone}
          </span>
        </div>
      </div>

      {/* Static Tactical Grid + SVG Vector Plotting */}
      <div className="relative bg-[#131410] aspect-[16/10] w-full overflow-hidden border-b-2 border-[#2A2A2A]">
        <svg
          viewBox="0 0 100 62"
          className="w-full h-full"
          role="img"
          aria-label={`Field map plotting route to ${dropZoneAddress} at ${siteCoordinates}`}
        >
          {/* Minor Static Grid (every 5 units) */}
          {Array.from({length: 19}, (_, idx) => (idx + 1) * 5).map((x) => (
            <line
              key={`mgx-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={62}
              stroke="#1C1C18"
              strokeWidth="0.18"
            />
          ))}
          {Array.from({length: 11}, (_, idx) => (idx + 1) * 5).map((y) => (
            <line
              key={`mgy-${y}`}
              x1={0}
              y1={y}
              x2={100}
              y2={y}
              stroke="#1C1C18"
              strokeWidth="0.18"
            />
          ))}

          {/* Major Static Grid (every 10 units) */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((x) => (
            <g key={`vx-${x}`}>
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={62}
                stroke="#2A2A2A"
                strokeWidth="0.28"
              />
              <text
                x={x + 0.6}
                y={2.8}
                fill="#8E8D88"
                fontSize="1.7"
                fontFamily="JetBrains Mono"
              >
                E{x}
              </text>
            </g>
          ))}
          {[10, 20, 30, 40, 50].map((y) => (
            <g key={`hy-${y}`}>
              <line
                x1={0}
                y1={y}
                x2={100}
                y2={y}
                stroke="#2A2A2A"
                strokeWidth="0.28"
              />
              <text
                x={0.8}
                y={y - 0.8}
                fill="#8E8D88"
                fontSize="1.7"
                fontFamily="JetBrains Mono"
              >
                N{y}
              </text>
            </g>
          ))}

          {/* Industrial Arterial Reference Corridors */}
          <path
            d="M 8 14 L 46 14 L 46 48 L 88 48"
            fill="none"
            stroke="#242424"
            strokeWidth="1.2"
          />
          <path
            d="M 14 54 L 38 30 L 82 30"
            fill="none"
            stroke="#242424"
            strokeWidth="0.9"
          />

          {/* Concentric Range Rings centered on siteCoordinates */}
          {showRangeRings && (
            <g>
              <circle
                cx={targetPoint.x}
                cy={targetPoint.y}
                r={10}
                fill="none"
                stroke="#2A2A2A"
                strokeWidth="0.32"
                strokeDasharray="1.1 1.1"
              />
              <circle
                cx={targetPoint.x}
                cy={targetPoint.y}
                r={21}
                fill="none"
                stroke="#2A2A2A"
                strokeWidth="0.32"
                strokeDasharray="1.5 1.5"
              />
              <circle
                cx={targetPoint.x}
                cy={targetPoint.y}
                r={34}
                fill="none"
                stroke="#2A2A2A"
                strokeWidth="0.25"
              />
              <text
                x={targetPoint.x + 10.6}
                y={targetPoint.y - 0.8}
                fill="#8E8D88"
                fontSize="1.9"
                fontFamily="JetBrains Mono"
              >
                0.5 MI
              </text>
              <text
                x={targetPoint.x + 21.6}
                y={targetPoint.y - 0.8}
                fill="#8E8D88"
                fontSize="1.9"
                fontFamily="JetBrains Mono"
              >
                1.0 MI
              </text>
            </g>
          )}

          {/* Full Planned Drop-Zone Path */}
          <path
            d={fullPathD}
            fill="none"
            stroke="#FF5A1F"
            strokeWidth="0.65"
            strokeDasharray="1.8 1.2"
          />

          {/* Completed Traversed Path */}
          <path
            d={traversedPathD}
            fill="none"
            stroke={mission.status === 'ABORTED' ? '#FF2E2E' : '#C6FF3D'}
            strokeWidth="0.95"
          />

          {/* Intermediate Route Waypoint Markers */}
          {showWaypoints &&
            routeWaypoints.slice(1, -1).map((wp, idx) => (
              <g key={`wp-${idx}`}>
                <rect
                  x={wp.x - 0.9}
                  y={wp.y - 0.9}
                  width={1.8}
                  height={1.8}
                  fill="#131410"
                  stroke="#FF5A1F"
                  strokeWidth="0.4"
                />
                <text
                  x={wp.x + 1.5}
                  y={wp.y - 1.2}
                  fill="#8E8D88"
                  fontSize="1.8"
                  fontFamily="JetBrains Mono"
                >
                  WP-0{idx + 1}
                </text>
              </g>
            ))}

          {/* Depot & Van Nodes */}
          {DEPOT_NODES.map((node) => {
            const isOrigin = node.id === originNode.id;
            const isSelected = node.id === selectedNode.id;
            const nx = node.mapX;
            const ny = node.mapY * 0.62;
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                <rect
                  x={nx - 1.6}
                  y={ny - 1.6}
                  width={3.2}
                  height={3.2}
                  fill={isOrigin ? '#FF5A1F' : '#1A1A1A'}
                  stroke={isSelected ? '#C6FF3D' : '#8E8D88'}
                  strokeWidth={isSelected ? '0.6' : '0.4'}
                />
                <text
                  x={nx + 2.3}
                  y={ny + 0.8}
                  fill={isOrigin ? '#F4F1EA' : '#8E8D88'}
                  fontSize="2.0"
                  fontFamily="JetBrains Mono"
                >
                  {node.callsign.split(' // ')[0]}
                </text>
              </g>
            );
          })}

          {/* Drop-Zone Target Reticle & Coordinates Plot */}
          <g>
            <line
              x1={targetPoint.x - 4}
              y1={targetPoint.y}
              x2={targetPoint.x + 4}
              y2={targetPoint.y}
              stroke="#FF5A1F"
              strokeWidth="0.5"
            />
            <line
              x1={targetPoint.x}
              y1={targetPoint.y - 4}
              x2={targetPoint.x}
              y2={targetPoint.y + 4}
              stroke="#FF5A1F"
              strokeWidth="0.5"
            />
            <rect
              x={targetPoint.x - 2.2}
              y={targetPoint.y - 2.2}
              width={4.4}
              height={4.4}
              fill="none"
              stroke="#FF5A1F"
              strokeWidth="0.6"
            />
            <rect
              x={targetPoint.x + 3.2}
              y={targetPoint.y + 1.6}
              width={25.5}
              height={6.6}
              fill="#131410"
              fillOpacity="0.92"
              stroke="#FF5A1F"
              strokeWidth="0.35"
            />
            <text
              x={targetPoint.x + 4.3}
              y={targetPoint.y + 4.1}
              fill="#FF5A1F"
              fontSize="2.0"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              TARGET DROP ZONE
            </text>
            <text
              x={targetPoint.x + 4.3}
              y={targetPoint.y + 6.8}
              fill="#F4F1EA"
              fontSize="1.75"
              fontFamily="JetBrains Mono"
            >
              {siteCoordinates}
            </text>
          </g>

          {/* Active Courier Vehicle Marker along Plotted Path */}
          <g>
            <rect
              x={courierPos.x - 2.1}
              y={courierPos.y - 2.1}
              width={4.2}
              height={4.2}
              fill={mission.status === 'ABORTED' ? '#FF2E2E' : '#C6FF3D'}
              stroke="#121212"
              strokeWidth="0.6"
            />
            <text
              x={courierPos.x + 2.8}
              y={courierPos.y - 1.4}
              fill={mission.status === 'ABORTED' ? '#FF2E2E' : '#C6FF3D'}
              fontSize="2.1"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              {mission.courierPlate} ({Math.round(progress * 100)}%)
            </text>
          </g>
        </svg>

        {/* Bottom-Left Drop Zone Callout Plate */}
        <div className="absolute bottom-2 left-2 px-2.5 py-1.5 bg-[#131410]/95 border border-[#2A2A2A] font-mono-tabular text-[10px]">
          <span className="text-[#8E8D88] mr-1.5">DEST:</span>
          <span className="text-[#F4F1EA] font-semibold">{shortDropZone}</span>
        </div>
      </div>

      {/* Selected Node Inspection Strip */}
      <div className="p-3.5 bg-[#1A1A1A] flex flex-wrap items-center justify-between gap-3 font-mono-tabular text-xs">
        <div>
          <div className="text-[10px] text-[#8E8D88] uppercase">
            PLOTTED ORIGIN / INSPECTED NODE
          </div>
          <div className="text-[#F4F1EA] font-semibold">
            {selectedNode.callsign} · {selectedNode.vehicleType}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-[#C6FF3D]">{selectedNode.status}</span>
          <span className="text-[#F4F1EA]">SLA: {selectedNode.slaMinutes} MIN</span>
          <span className="text-[#8E8D88]">
            {selectedNode.distanceMiles.toFixed(1)} MI
          </span>
        </div>
      </div>
    </div>
  );
}
