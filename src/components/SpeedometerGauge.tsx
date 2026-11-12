import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  speedMph: number;
  isNitroActive?: boolean;
}

export const SpeedometerGauge: React.FC<Props> = ({ speedMph, isNitroActive = false }) => {
  const [topSpeed, setTopSpeed] = useState<number>(0);
  const [accelState, setAccelState] = useState<'accel' | 'decel' | 'cruise'>('cruise');
  const prevSpeedRef = useRef<number>(speedMph);
  const lastTimeRef = useRef<number>(performance.now());

  // Track session top speed
  useEffect(() => {
    if (speedMph > topSpeed) {
      setTopSpeed(speedMph);
    }
  }, [speedMph, topSpeed]);

  // Track dynamic real-time acceleration
  useEffect(() => {
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    if (dt > 0.08) {
      const deltaSpeed = speedMph - prevSpeedRef.current;
      const rate = deltaSpeed / dt; // MPH per second

      if (rate > 2.0) {
        setAccelState('accel');
      } else if (rate < -2.5) {
        setAccelState('decel');
      } else {
        setAccelState('cruise');
      }

      prevSpeedRef.current = speedMph;
      lastTimeRef.current = now;
    }
  }, [speedMph]);

  // Geometry for 240° circular arc gauge
  // Sweep from 150° to 390° (bottom open)
  const maxDialSpeed = 80; // Scale up to 80 MPH
  const normalizedSpeed = Math.min(1.0, Math.max(0, speedMph / maxDialSpeed));
  const normalizedTop = Math.min(1.0, Math.max(0, topSpeed / maxDialSpeed));

  const size = 92;
  const strokeWidth = 6.5;
  const center = size / 2;
  const radius = center - strokeWidth - 4; // ~37
  const sweepAngle = 240; // degrees
  const startAngle = 150; // starts at bottom-left

  // Polar to Cartesian
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  // SVG Arc Path generator
  const describeArc = (x: number, y: number, r: number, start: number, end: number) => {
    const startPt = polarToCartesian(x, y, r, end);
    const endPt = polarToCartesian(x, y, r, start);
    const largeArcFlag = end - start <= 180 ? '0' : '1';
    return ['M', startPt.x, startPt.y, 'A', r, r, 0, largeArcFlag, 0, endPt.x, endPt.y].join(' ');
  };

  const totalCircumference = 2 * Math.PI * radius;
  const arcLength = totalCircumference * (sweepAngle / 360);
  const fillOffset = arcLength * (1 - normalizedSpeed);

  // Top speed notch position
  const topSpeedAngle = startAngle + sweepAngle * normalizedTop;
  const topNotch = polarToCartesian(center, center, radius, topSpeedAngle);

  // Dynamic color palette based on speed and nitro
  let strokeColor = '#8BAE9B';
  let glowColor = 'rgba(139, 174, 155, 0.4)';
  if (isNitroActive || speedMph >= 55) {
    strokeColor = '#00E5FF';
    glowColor = 'rgba(0, 229, 255, 0.7)';
  } else if (speedMph >= 32) {
    strokeColor = '#E87545';
    glowColor = 'rgba(232, 117, 69, 0.55)';
  }

  // Ticks marks around perimeter (0, 20, 40, 60, 80)
  const tickSpeeds = [0, 20, 40, 60, 80];

  return (
    <div
      className="relative bg-[#17242D]/95 border border-[#24343D] hover:border-[#8BAE9B]/50 rounded-2xl shadow-xl flex items-center gap-3 transition-all select-none group"
      style={{
        padding: '6px 14px 6px 10px',
        boxShadow: isNitroActive ? '0 0 20px rgba(0,229,255,0.3)' : undefined,
      }}
      title={`Speedometer — Real-time telemetry (Peak: ${topSpeed} MPH)`}
    >
      {/* 1. Dynamic Circular Gauge SVG */}
      <div className="relative w-[78px] h-[78px] shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none"
        >
          <defs>
            <linearGradient id="speedGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8BAE9B" />
              <stop offset="50%" stopColor="#E87545" />
              <stop offset="100%" stopColor={isNitroActive ? '#00E5FF' : '#FF3366'} />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={describeArc(center, center, radius, startAngle, startAngle + sweepAngle)}
            fill="none"
            stroke="#24343D"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Subtle Segment Ticks */}
          {tickSpeeds.map((tSpeed) => {
            const tAngle = startAngle + sweepAngle * (tSpeed / maxDialSpeed);
            const p1 = polarToCartesian(center, center, radius - 4, tAngle);
            const p2 = polarToCartesian(center, center, radius + 4, tAngle);
            return (
              <line
                key={tSpeed}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#101820"
                strokeWidth="1.5"
                opacity="0.8"
              />
            );
          })}

          {/* Dynamic Active Speed Arc */}
          <path
            d={describeArc(center, center, radius, startAngle, startAngle + sweepAngle)}
            fill="none"
            stroke="url(#speedGaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${totalCircumference}`}
            strokeDashoffset={fillOffset}
            filter={speedMph > 25 || isNitroActive ? 'url(#gaugeGlow)' : undefined}
            className="transition-all duration-75 ease-out"
          />

          {/* Top Speed Peak-Hold Marker Notch */}
          {topSpeed > 5 && (
            <circle
              cx={topNotch.x}
              cy={topNotch.y}
              r={2.5}
              fill="#F2F0E9"
              stroke="#E87545"
              strokeWidth="1"
              className="transition-all duration-300"
            />
          )}
        </svg>

        {/* Center Digital Speed Readout */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span
            className="font-mono font-black text-lg leading-none tracking-tight tabular-nums transition-colors duration-150"
            style={{ color: strokeColor }}
          >
            {speedMph}
          </span>
          <span className="text-[9px] font-mono font-bold tracking-wider text-[#A4B0B5] mt-0.5 leading-none">
            MPH
          </span>
        </div>
      </div>

      {/* 2. Telemetry Meta Info (Acceleration state & Peak speed) */}
      <div className="flex flex-col justify-center min-w-[70px]">
        {/* Dynamic Acceleration Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
          {accelState === 'accel' ? (
            <span className="flex items-center gap-1 text-[#00E5FF] animate-pulse">
              <TrendingUp className="w-3 h-3 text-[#00E5FF]" />
              ACCEL
            </span>
          ) : accelState === 'decel' ? (
            <span className="flex items-center gap-1 text-[#FF3366]">
              <TrendingDown className="w-3 h-3 text-[#FF3366]" />
              BRAKE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#8BAE9B]">
              <Minus className="w-3 h-3 text-[#8BAE9B]" />
              CRUISE
            </span>
          )}
        </div>

        {/* Top Speed Peak Tracker */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-[#A4B0B5] mt-0.5">
          <Zap className="w-2.5 h-2.5 text-[#E87545]" />
          <span>TOP</span>
          <span className="font-bold text-[#F2F0E9] tabular-nums">{topSpeed}</span>
        </div>

        {/* High-speed or Nitro Active Tag */}
        {isNitroActive ? (
          <div className="text-[9px] font-mono font-bold text-[#00E5FF] tracking-wider mt-0.5 animate-pulse">
            ⚡ NITRO BOOST
          </div>
        ) : speedMph >= 50 ? (
          <div className="text-[9px] font-mono font-bold text-[#E87545] tracking-wider mt-0.5">
            MAX VELOCITY
          </div>
        ) : null}
      </div>
    </div>
  );
};
