import React, { useState, useRef, useEffect } from 'react';
import { PROJECTS, TOKENS, Project } from '../data/portfolioData';
import { WORLD_CONFIG } from '../game/constants';
import {
  Maximize2,
  Minimize2,
  MapPin,
  Navigation,
  Compass,
  GripHorizontal,
  RotateCcw,
} from 'lucide-react';

export interface PlayerPosition {
  x: number;
  z: number;
  heading: number;
}

interface Props {
  playerPos: PlayerPosition;
  uncollectedTokenIds: Set<string>;
  onTeleport: (x: number, z: number) => void;
  onSelectProject: (project: Project) => void;
}

export const Minimap: React.FC<Props> = ({
  playerPos,
  uncollectedTokenIds,
  onTeleport,
  onSelectProject,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hoveredLandmark, setHoveredLandmark] = useState<{
    id: string;
    name: string;
    category?: string;
    x: number;
    z: number;
    dist: number;
    project?: Project;
  } | null>(null);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Map coordinates transformation
  const size = isExpanded ? 260 : 140;
  const halfSize = size / 2;
  const worldRadius = WORLD_CONFIG.playableRadius; // 72
  const scale = (halfSize - 12) / worldRadius;

  const worldToMap = (wx: number, wz: number) => {
    return {
      mx: halfSize + wx * scale,
      my: halfSize + wz * scale,
    };
  };

  const playerMap = worldToMap(playerPos.x, playerPos.z);
  const playerAngleDeg = (playerPos.heading * 180) / Math.PI;

  const specialPOIs = [
    { id: 'start-plaza', name: 'Start Plaza & NIERO Letters', x: 0, z: -17, color: '#A4B0B5', icon: '✦' },
    { id: 'viewpoint-overlook', name: 'Career Overlook Summit', x: 38, z: -28, color: '#8BAE9B', icon: '▲' },
    { id: 'bowling-alley', name: '3D Bowling Alley & Synth Pads', x: 23, z: 14, color: '#E87545', icon: 'B' },
    { id: 'soccer-arena', name: 'Soccer Pitch & Giant Ball', x: -20, z: 15, color: '#8BAE9B', icon: 'S' },
    { id: 'river-jump', name: 'River Stunt Jump Ramp', x: 10, z: -18, color: '#E87545', icon: '⚡' },
    { id: 'social-hub', name: 'Social & Resume Floor Tiles', x: 17, z: -17, color: '#F2F0E9', icon: '@' },
  ];

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag when clicking the header / grip bar
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('svg.map-svg')) return;

    e.preventDefault();
    e.stopPropagation();

    const currentX =
      position?.x ?? (containerRef.current ? containerRef.current.getBoundingClientRect().left : 0);
    const currentY =
      position?.y ?? (containerRef.current ? containerRef.current.getBoundingClientRect().top : 0);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
    };

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(12, Math.min(window.innerWidth - size - 12, dragStartRef.current.initX + deltaX));
    const newY = Math.max(12, Math.min(window.innerHeight - size - 12, dragStartRef.current.initY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition(null);
  };

  return (
    <div
      ref={containerRef}
      className={`pointer-events-auto select-none ${
        position ? 'fixed z-50 transition-none' : 'relative z-20'
      }`}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : undefined
      }
    >
      {/* Tooltip on landmark hover / tap */}
      {hoveredLandmark && (
        <div
          className="absolute -top-16 right-0 z-50 bg-[#17242D] border border-[#E87545] p-2 rounded-lg shadow-xl text-left pointer-events-none min-w-[170px]"
          style={{ boxShadow: '0 8px 20px rgba(16, 24, 32, 0.95)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase text-[#E87545] font-semibold truncate">
              {hoveredLandmark.category || 'Landmark'}
            </span>
            <span className="text-[10px] font-mono text-[#8BAE9B] shrink-0">
              {hoveredLandmark.dist}m
            </span>
          </div>
          <div className="text-xs font-bold text-[#F2F0E9] truncate mt-0.5">
            {hoveredLandmark.name}
          </div>
          <div className="text-[9px] font-mono text-[#A4B0B5] mt-0.5">
            Tap to teleport buggy here
          </div>
        </div>
      )}

      {/* Main Radar Frame */}
      <div
        className={`relative bg-[#101820]/95 border ${
          isDragging ? 'border-[#E87545] shadow-[0_0_25px_rgba(232,117,69,0.4)]' : 'border-[#24343D]'
        } rounded-2xl overflow-hidden shadow-2xl transition-all duration-200`}
        style={{
          width: size,
          height: size,
          boxShadow: '0 10px 25px rgba(16, 24, 32, 0.9), inset 0 0 15px rgba(23, 36, 45, 0.6)',
        }}
      >
        {/* Draggable Header Grip Bar (Drag radar to move it around!) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute top-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono z-30 cursor-grab active:cursor-grabbing select-none"
          title="Click and drag to move radar anywhere on screen"
        >
          <div className="flex items-center gap-1 text-[#8BAE9B] bg-[#101820]/90 px-1.5 py-0.5 rounded border border-[#24343D] shadow">
            <Compass className="w-2.5 h-2.5 text-[#E87545]" />
            <span className="font-bold">RADAR</span>
            <GripHorizontal className="w-3 h-3 text-[#A4B0B5] ml-0.5 opacity-80" />
          </div>

          <div className="flex items-center gap-1">
            {position && (
              <button
                onClick={handleResetPosition}
                className="p-1 rounded bg-[#17242D]/90 border border-[#24343D] text-[#A4B0B5] hover:text-[#E87545] hover:border-[#E87545] transition-colors cursor-pointer"
                title="Reset Radar position to default"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded bg-[#17242D]/90 border border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545] transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse Radar Size' : 'Expand Radar Size'}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* SVG Map Canvas */}
        <svg width={size} height={size} className="map-svg w-full h-full block">
          {/* Subtle Grid / Radar Concentric Rings */}
          <circle
            cx={halfSize}
            cy={halfSize}
            r={halfSize - 6}
            fill="#101820"
            stroke="#24343D"
            strokeWidth="1.5"
          />
          <circle
            cx={halfSize}
            cy={halfSize}
            r={(halfSize - 6) * 0.66}
            fill="none"
            stroke="#17242D"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={halfSize}
            cy={halfSize}
            r={(halfSize - 6) * 0.33}
            fill="none"
            stroke="#17242D"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Crosshairs */}
          <line
            x1={halfSize}
            y1={8}
            x2={halfSize}
            y2={size - 8}
            stroke="#17242D"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <line
            x1={8}
            y1={halfSize}
            x2={size - 8}
            y2={halfSize}
            stroke="#17242D"
            strokeWidth="1"
            strokeDasharray="2 4"
          />

          {/* Main Road Loop approximation on radar */}
          <circle
            cx={halfSize}
            cy={halfSize}
            r={(halfSize - 12) * 0.72}
            fill="none"
            stroke="#24343D"
            strokeWidth="2.5"
            opacity="0.4"
          />

          {/* Special Points of Interest (Start Plaza, Summit) */}
          {specialPOIs.map(poi => {
            const m = worldToMap(poi.x, poi.z);
            const dist = Math.round(Math.hypot(playerPos.x - poi.x, playerPos.z - poi.z));
            return (
              <g
                key={poi.id}
                transform={`translate(${m.mx}, ${m.my})`}
                className="cursor-pointer"
                onClick={() => onTeleport(poi.x, poi.z)}
                onMouseEnter={() =>
                  setHoveredLandmark({
                    id: poi.id,
                    name: poi.name,
                    category: 'POI',
                    x: poi.x,
                    z: poi.z,
                    dist,
                  })
                }
                onMouseLeave={() => setHoveredLandmark(null)}
              >
                <circle cx="0" cy="0" r="4.5" fill="#17242D" stroke={poi.color} strokeWidth="1" />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fontSize="6"
                  fill={poi.color}
                  fontFamily="monospace"
                >
                  {poi.icon}
                </text>
              </g>
            );
          })}

          {/* Collectible Tokens */}
          {TOKENS.map(token => {
            if (!uncollectedTokenIds.has(token.id)) return null;
            const m = worldToMap(token.coordinates.x, token.coordinates.z);
            const dist = Math.round(
              Math.hypot(playerPos.x - token.coordinates.x, playerPos.z - token.coordinates.z)
            );
            return (
              <g
                key={token.id}
                transform={`translate(${m.mx}, ${m.my})`}
                className="cursor-pointer"
                onClick={() => onTeleport(token.coordinates.x, token.coordinates.z)}
                onMouseEnter={() =>
                  setHoveredLandmark({
                    id: token.id,
                    name: token.name,
                    category: 'Tech Token',
                    x: token.coordinates.x,
                    z: token.coordinates.z,
                    dist,
                  })
                }
                onMouseLeave={() => setHoveredLandmark(null)}
              >
                <circle cx="0" cy="0" r="2.8" fill="#E87545" opacity="0.9" />
              </g>
            );
          })}

          {/* 12 Project Monuments */}
          {PROJECTS.map(project => {
            const m = worldToMap(project.coordinates.x, project.coordinates.z);
            const isOrange = project.color === '#E87545';
            const color = isOrange ? '#E87545' : '#8BAE9B';
            const dist = Math.round(
              Math.hypot(playerPos.x - project.coordinates.x, playerPos.z - project.coordinates.z)
            );

            return (
              <g
                key={project.id}
                transform={`translate(${m.mx}, ${m.my})`}
                className="cursor-pointer group"
                onClick={() => {
                  onSelectProject(project);
                  onTeleport(project.coordinates.x, project.coordinates.z);
                }}
                onMouseEnter={() =>
                  setHoveredLandmark({
                    id: project.id,
                    name: project.name,
                    category: project.category,
                    x: project.coordinates.x,
                    z: project.coordinates.z,
                    dist,
                    project,
                  })
                }
                onMouseLeave={() => setHoveredLandmark(null)}
              >
                {/* Ping wave */}
                <circle cx="0" cy="0" r="6" fill={color} opacity="0.18" />
                {/* Diamond Monument Marker */}
                <polygon
                  points="0,-4.5 4.5,0 0,4.5 -4.5,0"
                  fill="#17242D"
                  stroke={color}
                  strokeWidth="1.2"
                />
                <circle cx="0" cy="0" r="1.5" fill={color} />

                {/* Project Name Label on Radar when expanded */}
                {isExpanded && (
                  <text
                    x="6"
                    y="3"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#F2F0E9"
                    className="pointer-events-none"
                  >
                    {project.name.split(' ')[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Player Vehicle Pointer */}
          <g transform={`translate(${playerMap.mx}, ${playerMap.my}) rotate(${playerAngleDeg})`}>
            {/* Pulsing subtle aura */}
            <circle cx="0" cy="0" r="7" fill="#E87545" opacity="0.25" />
            {/* Vehicle Arrowhead */}
            <polygon points="0,-6 4,4 0,2 -4,4" fill="#E87545" stroke="#F2F0E9" strokeWidth="0.8" />
          </g>
        </svg>

        {/* Coordinates & Drag Hint at bottom */}
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[8px] font-mono text-[#A4B0B5] bg-[#101820]/80 px-1.5 py-0.5 rounded border border-[#24343D] pointer-events-none">
          <span>X: {Math.round(playerPos.x)} Z: {Math.round(playerPos.z)}</span>
          <span className="text-[#8BAE9B] opacity-80">DRAG TO MOVE</span>
        </div>
      </div>
    </div>
  );
};
