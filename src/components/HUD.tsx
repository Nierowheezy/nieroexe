import React, { useState, useEffect, useRef } from 'react';
import { InteractiveTarget } from '../game/landmarks';
import { sound } from '../game/audio';
import { PortfolioTab } from './PortfolioModal';
import { Minimap, PlayerPosition } from './Minimap';
import { Project, PROJECTS } from '../data/portfolioData';
import { WeatherState, WEATHER_CONFIGS } from '../game/weather';
import { LagosWeatherReport, getLagosTime } from '../services/lagosWeather';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  User,
  Layers,
  Briefcase,
  Code2,
  FileText,
  Mail,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Map,
  Palette,
  Video,
  Clock,
  RefreshCw,
  Wind,
  Droplets,
  Zap,
  Sliders,
  Navigation,
  ExternalLink,
  Megaphone,
  Boxes,
} from 'lucide-react';
import { RadioWidget } from './RadioWidget';
import { RaceTimerHUD } from './RaceTimerHUD';
import { SpeedometerGauge } from './SpeedometerGauge';
import { RaceState } from '../game/race';

interface Props {
  speedMph: number;
  tokensCount: number;
  totalTokens: number;
  nearbyTarget: InteractiveTarget | null;
  playerPos: PlayerPosition;
  uncollectedTokenIds: Set<string>;
  raceState?: RaceState;
  isTourActive?: boolean;
  isAutoDriveActive?: boolean;
  currentWeather?: WeatherState;
  lagosWeather?: LagosWeatherReport | null;
  nitroState?: { isActive: boolean; charge: number };
  onTriggerNitro?: () => void;
  onTriggerHorn?: () => void;
  onResetProps?: () => void;
  onOpenAudioSettings?: () => void;
  onRefreshLagosWeather?: () => void;
  onInteract: () => void;
  onOpenPortfolio: (tab: PortfolioTab) => void;
  onOpenCustomizer: () => void;
  onStartTour?: () => void;
  onToggleAutoDrive?: () => void;
  onToggleRace?: () => void;
  onResetVehicle: () => void;
  onOpenHelp: () => void;
  onTeleport: (x: number, z: number) => void;
  onSelectProject: (project: Project) => void;
  onMobileInput: (input: {
    forward?: boolean;
    backward?: boolean;
    left?: boolean;
    right?: boolean;
    brake?: boolean;
  }) => void;
}

export const HUD: React.FC<Props> = ({
  speedMph,
  tokensCount,
  totalTokens,
  nearbyTarget,
  playerPos,
  uncollectedTokenIds,
  raceState,
  isTourActive: _isTourActive,
  isAutoDriveActive,
  currentWeather = 'sunny',
  lagosWeather,
  nitroState = { isActive: false, charge: 1.0 },
  onTriggerNitro,
  onTriggerHorn,
  onResetProps,
  onOpenAudioSettings,
  onRefreshLagosWeather,
  onInteract,
  onOpenPortfolio,
  onOpenCustomizer,
  onStartTour,
  onToggleAutoDrive,
  onToggleRace,
  onResetVehicle,
  onOpenHelp,
  onTeleport,
  onSelectProject,
  onMobileInput,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [isDockCollapsed, setIsDockCollapsed] = useState(true);
  const [isTopCollapsed, setIsTopCollapsed] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [isWeatherDetailsOpen, setIsWeatherDetailsOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(96);
  const topBarRef = useRef<HTMLDivElement>(null);

  // Live ticking Lagos clock
  const [currentLagosTime, setCurrentLagosTime] = useState<{ lagosTime: string; lagosDate: string }>(
    getLagosTime()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLagosTime(getLagosTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkTouch = () => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };
    setIsTouchDevice(checkTouch());

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsTopCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Measure expanded header height dynamically so subheader widgets never collide on mobile wrap
  useEffect(() => {
    if (!topBarRef.current) return;
    const updateHeight = () => {
      if (topBarRef.current) {
        setHeaderHeight(topBarRef.current.getBoundingClientRect().bottom + 8);
      }
    };
    updateHeight();
    const raf = requestAnimationFrame(updateHeight);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(topBarRef.current);
    window.addEventListener('resize', updateHeight);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [isTopCollapsed]);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const weatherConfig = WEATHER_CONFIGS[currentWeather] || WEATHER_CONFIGS.sunny;
  const nitroChargePct = Math.round(nitroState.charge * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* 1. COLLAPSIBLE TOP HEADER MENU (Safe-Area Aware for iPhone Dynamic Island) */}
      <div
        ref={topBarRef}
        className="absolute left-0 right-0 pointer-events-none z-30 flex flex-col items-center px-3 sm:px-6"
        style={{
          top: 'max(8px, env(safe-area-inset-top))',
        }}
      >
        {/* Main Header Bar Container (only rendered when expanded so nothing peeks into Dynamic Island) */}
        {!isTopCollapsed && (
          <header className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4 pointer-events-auto mb-2">
            {/* Top Mobile Row: Brand Badge + Compact Mobile Telemetry */}
            <div className="flex items-center justify-between gap-2.5 w-full lg:w-auto">
              <div
                className="flex items-center gap-2.5 sm:gap-3 bg-[#17242D]/95 border border-[#24343D] rounded-2xl shadow-xl shrink-0"
                style={{ padding: '8px 12px' }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#E87545] text-[#101820] font-mono font-bold flex items-center justify-center text-xs sm:text-sm shadow shrink-0">
                  NE
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-bold font-mono tracking-wider text-[#F2F0E9]">
                      NIERO.EXE
                    </span>
                    <span className="text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md bg-[#8BAE9B]/15 text-[#8BAE9B] border border-[#8BAE9B]/30 font-semibold">
                      v2.2
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A4B0B5] font-medium hidden sm:block truncate mt-0.5">
                    Olabode Olaniyi David • Interactive 3D World
                  </div>
                </div>
              </div>

              {/* Compact Telemetry Pill for Mobile/Tablet (< lg) */}
              <div className="flex lg:hidden items-center gap-2 bg-[#17242D]/95 border border-[#24343D] rounded-2xl px-3 py-2 shadow-xl text-[11px] font-mono shrink-0">
                <span className="font-bold text-[#E87545] tabular-nums">{speedMph} MPH</span>
                <span className="text-[#24343D]">|</span>
                <span className="text-[#F2F0E9]">
                  {lagosWeather ? `${lagosWeather.temperatureC}°C` : '29°C'} {lagosWeather ? lagosWeather.icon : weatherConfig.icon}
                </span>
                <span className="text-[#24343D]">|</span>
                <span className="text-[#8BAE9B] font-bold">✦ {tokensCount}/{totalTokens}</span>
              </div>
            </div>

          {/* Center Stats: Real-time Lagos Weather (Strict Sync), Lagos Time, Speed, Tokens */}
          <div className="hidden lg:flex items-center gap-3 sm:gap-4 relative">
            {/* Real-time Lagos Weather Pill (Strictly reflecting actual weather in Lagos, Nigeria) */}
            <div className="relative">
              <button
                onClick={() => setIsWeatherDetailsOpen(!isWeatherDetailsOpen)}
                className="bg-[#17242D]/95 hover:bg-[#24343D] border border-[#24343D] hover:border-[#8BAE9B] rounded-2xl shadow-xl flex items-center gap-2.5 transition-all text-left cursor-pointer"
                style={{ padding: '8px 14px' }}
                title="Real-Time Lagos Weather & West Africa Time (Strictly Synced)"
              >
                <span className="text-base shrink-0">🇳🇬</span>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#F2F0E9]">
                    <span>Lagos</span>
                    <span className="text-[#E87545]">
                      {lagosWeather ? `${lagosWeather.temperatureC}°C` : '29°C'}
                    </span>
                    <span>{lagosWeather ? lagosWeather.icon : weatherConfig.icon}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8BAE9B] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A4B0B5]" />
                    <span>{currentLagosTime.lagosTime}</span>
                  </div>
                </div>
              </button>

              {/* Lagos Weather Details Dropdown with Hourly Forecast */}
              {isWeatherDetailsOpen && (
                <div
                  className="absolute top-full mt-2 left-0 w-80 bg-[#17242D]/98 border border-[#24343D] rounded-2xl p-4 shadow-2xl z-50 text-[#F2F0E9] animate-modal-enter"
                  style={{ boxShadow: '0 12px 30px rgba(16, 24, 32, 0.98)' }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#24343D] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇳🇬</span>
                      <div>
                        <div className="text-xs font-bold font-mono">Lagos, Nigeria</div>
                        <div className="text-[10px] text-[#A4B0B5]">{currentLagosTime.lagosDate}</div>
                      </div>
                    </div>
                    {onRefreshLagosWeather && (
                      <button
                        onClick={onRefreshLagosWeather}
                        className="p-1 rounded-lg bg-[#24343D] hover:bg-[#8BAE9B] text-[#A4B0B5] hover:text-[#101820] transition-colors cursor-pointer"
                        title="Fetch Latest Real-Time Lagos Weather"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Current Conditions Card */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#101820]/80 p-2.5 rounded-xl border border-[#24343D]">
                      <div className="text-[10px] text-[#A4B0B5] font-mono">Current Conditions</div>
                      <div className="text-base font-bold text-[#E87545] mt-0.5">
                        {lagosWeather?.temperatureC ?? 29}°C{' '}
                        <span className="text-xs font-normal text-[#A4B0B5]">
                          ({lagosWeather?.temperatureF ?? 84}°F)
                        </span>
                      </div>
                      <div className="text-[10px] text-[#F2F0E9] font-medium truncate">
                        {lagosWeather?.conditionText ?? 'Partly Cloudy'}
                      </div>
                    </div>

                    <div className="bg-[#101820]/80 p-2.5 rounded-xl border border-[#24343D]">
                      <div className="text-[10px] text-[#A4B0B5] font-mono flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-[#8BAE9B]" /> Humidity
                      </div>
                      <div className="text-base font-bold text-[#8BAE9B] mt-0.5">
                        {lagosWeather?.humidity ?? 73}%
                      </div>
                      <div className="text-[10px] text-[#A4B0B5] font-mono flex items-center gap-1 truncate">
                        <Wind className="w-3 h-3" /> {lagosWeather?.windSpeedKmH ?? 4.4} km/h
                      </div>
                    </div>
                  </div>

                  {/* Hourly Forecast for Today in Lagos */}
                  {lagosWeather?.forecast && lagosWeather.forecast.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-mono uppercase text-[#A4B0B5] font-semibold mb-1.5">
                        Today's Forecast in Lagos
                      </div>
                      <div className="grid grid-cols-4 gap-1 bg-[#101820]/60 p-1.5 rounded-xl border border-[#24343D]">
                        {lagosWeather.forecast.map((fc, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col items-center p-1 rounded-lg text-center ${
                              fc.isRain ? 'bg-[#E87545]/15 border border-[#E87545]/40' : ''
                            }`}
                          >
                            <span className="text-[9px] font-mono text-[#A4B0B5]">{fc.timeLabel.split(' ')[0]}</span>
                            <span className="text-sm my-0.5">{fc.icon}</span>
                            <span className="text-[10px] font-mono font-bold text-[#F2F0E9]">
                              {Math.round(fc.temperatureC)}°
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-[#8BAE9B] bg-[#24343D]/40 p-2 rounded-xl border border-[#24343D]">
                    ✓ 3D World atmosphere strictly reflects actual Lagos conditions. If rain starts in Lagos, the 3D world transitions to rain.
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Digital-Style Circular Speedometer Gauge */}
            <SpeedometerGauge
              speedMph={speedMph}
              isNitroActive={nitroState.isActive}
            />

            {/* Collectible Tokens Counter */}
            <div
              className="bg-[#17242D]/95 border border-[#24343D] rounded-2xl shadow-xl flex items-center gap-2.5"
              style={{ padding: '8px 14px' }}
            >
              <span className="text-base text-[#E87545]">✦</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#F2F0E9]">
                {tokensCount}/{totalTokens}
              </span>
              <span className="text-xs font-mono text-[#A4B0B5]">Tokens</span>
            </div>
          </div>

          {/* Action Controls in Top Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start lg:justify-end">
            {/* NITRO BOOST BUTTON (Smooth animated gauge with continuous percentage fill) */}
            {onTriggerNitro && (
              <button
                onClick={onTriggerNitro}
                disabled={nitroState.charge < 0.2 && !nitroState.isActive}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-xl flex flex-col justify-center text-xs font-mono font-bold shrink-0 cursor-pointer ${
                  nitroState.isActive
                    ? 'bg-[#101820] text-[#00E5FF] border-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.65)] ring-1 ring-[#00E5FF]'
                    : nitroState.charge >= 0.98
                    ? 'bg-[#17242D]/95 hover:bg-[#24343D] text-[#E87545] border-[#E87545] shadow-[0_0_12px_rgba(232,117,69,0.35)]'
                    : nitroState.charge >= 0.2
                    ? 'bg-[#17242D]/95 hover:bg-[#24343D] text-[#F2F0E9] border-[#24343D]'
                    : 'bg-[#17242D]/60 border-[#24343D]/40 text-[#A4B0B5] opacity-50 cursor-not-allowed'
                }`}
                style={{ padding: '8px 14px', minWidth: '136px' }}
                title={`Nitro Boost [Shift or N] — ${nitroChargePct}% Charge`}
              >
                {/* Background progress fill bar with smooth continuous transition */}
                <div
                  className={`absolute inset-y-0 left-0 pointer-events-none transition-all duration-100 ease-linear ${
                    nitroState.isActive
                      ? 'bg-gradient-to-r from-[#00E5FF]/40 via-[#00E5FF]/25 to-transparent'
                      : 'bg-gradient-to-r from-[#E87545]/25 via-[#E87545]/15 to-transparent'
                  }`}
                  style={{ width: `${nitroChargePct}%` }}
                />

                <div className="relative z-10 flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-[#101820]/90 text-[#00E5FF] border border-[#00E5FF]/40 text-[9px] font-mono font-extrabold tracking-wider shadow-sm shrink-0">
                      SHIFT / N
                    </span>
                    <span className="truncate">
                      {nitroState.isActive
                        ? 'BURNING'
                        : nitroState.charge >= 0.98
                        ? 'NITRO READY'
                        : 'NITRO'}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs tabular-nums shrink-0 ${
                      nitroState.isActive
                        ? 'text-[#00E5FF] font-black'
                        : nitroState.charge >= 0.98
                        ? 'text-[#E87545] font-bold'
                        : 'text-[#A4B0B5]'
                    }`}
                  >
                    {nitroChargePct}%
                  </span>
                </div>

                {/* Sub-bar line gauge */}
                <div className="relative z-10 w-full h-1 bg-[#101820]/80 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ease-linear ${
                      nitroState.isActive
                        ? 'bg-gradient-to-r from-[#00E5FF] to-[#38bdf8] shadow-[0_0_8px_#00E5FF]'
                        : nitroState.charge >= 0.98
                        ? 'bg-gradient-to-r from-[#E87545] to-[#F59E0B]'
                        : 'bg-gradient-to-r from-[#E87545]/80 to-[#E87545]/40'
                    }`}
                    style={{ width: `${nitroChargePct}%` }}
                  />
                </div>
              </button>
            )}

            {/* DEDICATED AUDIO SETTINGS PANEL BUTTON */}
            {onOpenAudioSettings && (
              <button
                onClick={onOpenAudioSettings}
                className="rounded-2xl bg-[#17242D]/95 border border-[#24343D] hover:border-[#8BAE9B] text-[#A4B0B5] hover:text-[#F2F0E9] transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-medium shrink-0 cursor-pointer"
                style={{ padding: '10px 14px' }}
                title="Open Audio Mixer Settings (Engine, Wind & Ambience)"
              >
                <Sliders className="w-4 h-4 text-[#8BAE9B]" />
                <span className="hidden md:inline">Audio Mixer</span>
              </button>
            )}

            {/* Autonomous Car Auto-Drive */}
            {onToggleAutoDrive && (
              <button
                onClick={onToggleAutoDrive}
                className={`rounded-2xl border transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-bold shrink-0 cursor-pointer ${
                  isAutoDriveActive
                    ? 'bg-[#E87545] text-[#101820] border-[#E87545] animate-pulse shadow-[0_0_15px_rgba(232,117,69,0.5)]'
                    : 'bg-[#17242D]/95 border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545]'
                }`}
                style={{ padding: '10px 14px' }}
                title="Autonomous Car Auto-Drive Around All Projects (Key: Z)"
              >
                <Navigation className="w-4 h-4" />
                <span className="hidden md:inline">{isAutoDriveActive ? 'Cruising...' : 'Auto Drive [Z]'}</span>
              </button>
            )}

            {/* Cinematic Drone Tour Button */}
            {onStartTour && (
              <button
                onClick={onStartTour}
                className="rounded-2xl border transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-bold bg-[#8BAE9B]/20 border-[#8BAE9B] text-[#8BAE9B] hover:bg-[#8BAE9B] hover:text-[#101820] shrink-0 cursor-pointer"
                style={{ padding: '10px 14px' }}
                title="Launch Cinematic Drone Showcase Tour"
              >
                <Video className="w-4 h-4" />
                <span className="hidden md:inline">Drone Tour</span>
              </button>
            )}

            {/* Garage & World Colors Customizer Button */}
            <button
              onClick={onOpenCustomizer}
              className="rounded-2xl border transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-bold bg-[#E87545]/20 border-[#E87545] text-[#E87545] hover:bg-[#E87545] hover:text-[#101820] shrink-0 cursor-pointer"
              style={{ padding: '10px 14px' }}
              title="Change Vehicle & World Colors"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden md:inline">Garage</span>
            </button>

            {/* Minimap radar toggle button */}
            <button
              onClick={() => setIsMinimapVisible(!isMinimapVisible)}
              className={`rounded-2xl border transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-medium shrink-0 cursor-pointer ${
                isMinimapVisible
                  ? 'bg-[#17242D]/95 border-[#8BAE9B] text-[#8BAE9B]'
                  : 'bg-[#17242D]/95 border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#8BAE9B]'
              }`}
              style={{ padding: '10px 14px' }}
              title="Toggle Minimap Radar"
            >
              <Map className="w-4 h-4" />
              <span className="hidden md:inline">Radar</span>
            </button>

            {/* Audio Master Mute toggle */}
            <button
              onClick={handleToggleSound}
              className="rounded-2xl bg-[#17242D]/95 border border-[#24343D] hover:border-[#E87545] text-[#A4B0B5] hover:text-[#F2F0E9] transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-medium shrink-0 cursor-pointer"
              style={{ padding: '10px 14px' }}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#A4B0B5]" /> : <Volume2 className="w-4 h-4 text-[#8BAE9B]" />}
              <span className="hidden md:inline">{isMuted ? 'Muted' : 'Audio ON'}</span>
            </button>

            {/* Horn Button */}
            {onTriggerHorn && (
              <button
                onClick={onTriggerHorn}
                className="rounded-2xl bg-[#17242D]/95 border border-[#24343D] hover:border-[#E87545] text-[#A4B0B5] hover:text-[#F2F0E9] transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-medium shrink-0 cursor-pointer"
                style={{ padding: '10px 14px' }}
                title="Honk Buggy Horn (Key: F)"
              >
                <Megaphone className="w-4 h-4 text-[#E87545]" />
                <span className="hidden md:inline">Horn [F]</span>
              </button>
            )}

            {/* Reset Props (NIERO Letters, Bowling Pins, Soccer Ball) */}
            {onResetProps && (
              <button
                onClick={onResetProps}
                className="rounded-2xl bg-[#17242D]/95 border border-[#24343D] hover:border-[#8BAE9B] text-[#A4B0B5] hover:text-[#F2F0E9] transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-medium shrink-0 cursor-pointer"
                style={{ padding: '10px 14px' }}
                title="Restack NIERO Letters, Bowling Pins & Soccer Ball"
              >
                <Boxes className="w-4 h-4 text-[#8BAE9B]" />
                <span className="hidden md:inline">Reset Props</span>
              </button>
            )}

            {/* Reset Buggy */}
            <button
              onClick={onResetVehicle}
              className="rounded-2xl bg-[#17242D]/95 border border-[#24343D] hover:border-[#E87545] text-[#A4B0B5] hover:text-[#F2F0E9] transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-medium shrink-0 cursor-pointer"
              style={{ padding: '10px 14px' }}
              title="Reset Buggy to Road (Key: R)"
            >
              <RotateCcw className="w-4 h-4 text-[#E87545]" />
              <span className="hidden md:inline">Reset [R]</span>
            </button>

            {/* Help & Controls */}
            <button
              onClick={onOpenHelp}
              className="rounded-2xl bg-[#17242D]/95 border border-[#24343D] hover:border-[#8BAE9B] text-[#A4B0B5] hover:text-[#F2F0E9] transition-all shadow-lg flex items-center gap-2 text-xs font-mono font-medium shrink-0 cursor-pointer"
              style={{ padding: '10px 14px' }}
              title="World Controls & Guide"
            >
              <HelpCircle className="w-4 h-4 text-[#8BAE9B]" />
              <span className="hidden md:inline">Guide</span>
            </button>
          </div>
          </header>
        )}

        {/* Hanging Center Tab for Top Header Bar */}
        <div className="flex justify-center pointer-events-auto">
          <button
            onClick={() => setIsTopCollapsed(!isTopCollapsed)}
            className={`flex items-center gap-2 px-4 py-1.5 bg-[#17242D]/95 border border-[#24343D] text-xs font-mono text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545]/60 transition-colors shadow-lg cursor-pointer ${
              isTopCollapsed ? 'rounded-xl' : 'rounded-b-xl border-t-0'
            }`}
            title={isTopCollapsed ? 'Show Header Bar (Key: H)' : 'Collapse Header Bar (Key: H)'}
          >
            {isTopCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#E87545]" />
                <span>Show Header Bar</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#A4B0B5]" />
                <span>Collapse Header [H]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. LIVE SUB-HEADER WIDGETS & MINIMAP (Responsive stack on mobile, left/right on sm+, dynamically below header) */}
      {(!isTopCollapsed || raceState?.isActive) && (
        <div
          className="absolute left-3 right-3 sm:left-6 sm:right-6 z-[25] flex flex-col sm:flex-row items-start sm:justify-between gap-2.5 pointer-events-none transition-all duration-200"
          style={{
            top: `${headerHeight}px`,
          }}
        >
          {/* Left: Radio & Race Time-Trial */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 pointer-events-none">
            {!isTopCollapsed && <RadioWidget />}
            {raceState && (!isTopCollapsed || raceState.isActive) && (
              <RaceTimerHUD
                raceState={raceState}
                onToggleRace={onToggleRace}
              />
            )}
          </div>

          {/* Right: Draggable Minimap Radar */}
          {!isTopCollapsed && isMinimapVisible && (
            <div className="self-end sm:self-auto pointer-events-none">
              <Minimap
                playerPos={playerPos}
                uncollectedTokenIds={uncollectedTokenIds}
                onTeleport={onTeleport}
                onSelectProject={onSelectProject}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. PROXIMITY INTERACTION BANNER (Safely above mobile touch controls & bottom dock) */}
      {nearbyTarget && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-40 max-w-lg w-[calc(100vw-24px)] sm:w-[92vw] animate-modal-enter"
          style={{
            bottom: isTouchDevice
              ? 'calc(190px + env(safe-area-inset-bottom, 0px))'
              : isDockCollapsed
              ? 'calc(56px + env(safe-area-inset-bottom, 0px))'
              : 'calc(112px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div
            className="bg-[#17242D]/95 border-2 border-[#E87545] rounded-2xl p-3.5 sm:p-5 shadow-2xl flex items-center justify-between gap-3 sm:gap-4 text-[#F2F0E9]"
            style={{
              boxShadow: '0 12px 35px rgba(16, 24, 32, 0.95), 0 0 25px rgba(232, 117, 69, 0.35)',
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-[#E87545] font-bold tracking-wider">
                  {nearbyTarget.type === 'social' ? 'Quick Action Tile' : 'Landmark in Range'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#F2F0E9] truncate mt-1">
                {nearbyTarget.title}
              </h3>
              <p className="text-xs text-[#A4B0B5] truncate mt-0.5">{nearbyTarget.subtitle}</p>
            </div>

            {nearbyTarget.externalUrl ? (
              <a
                href={nearbyTarget.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#E87545] hover:bg-[#E87545]/90 text-[#101820] text-xs sm:text-sm font-bold font-mono tracking-wider transition-transform active:scale-95 shadow flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>OPEN</span>
              </a>
            ) : (
              <button
                onClick={onInteract}
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#E87545] hover:bg-[#E87545]/90 text-[#101820] text-xs sm:text-sm font-bold font-mono tracking-wider transition-transform active:scale-95 shadow flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>{nearbyTarget.type === 'social' ? 'OPEN [E]' : 'INSPECT [E]'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. MOBILE ON-SCREEN TOUCH CONTROLS (Safe-area padded, non-blocking, touch-cancel protected) */}
      {isTouchDevice && (
        <div
          className="absolute flex items-end justify-between pointer-events-none z-30 transition-all duration-300"
          style={{
            bottom: isDockCollapsed
              ? 'calc(52px + env(safe-area-inset-bottom, 0px))'
              : 'calc(126px + env(safe-area-inset-bottom, 0px))',
            left: 'max(14px, env(safe-area-inset-left))',
            right: 'max(14px, env(safe-area-inset-right))',
          }}
        >
          <div className="flex flex-col items-start gap-2.5 pointer-events-auto touch-none">
            {/* Compact Mobile Utility Row: Horn & Nitro right above Steering */}
            <div className="flex items-center gap-2">
              {onTriggerHorn && (
                <button
                  onTouchStart={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTriggerHorn();
                  }}
                  onClick={onTriggerHorn}
                  className="h-10 px-3 rounded-xl bg-[#17242D]/90 border border-[#24343D] active:bg-[#E87545] active:text-[#101820] text-[#F2F0E9] flex items-center gap-1.5 text-[11px] font-mono font-bold shadow-lg touch-none select-none"
                  title="Honk Horn"
                >
                  <Megaphone className="w-3.5 h-3.5 text-[#E87545]" />
                  <span>HORN</span>
                </button>
              )}
              {onTriggerNitro && (
                <button
                  onTouchStart={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTriggerNitro();
                  }}
                  disabled={nitroState.charge < 0.2 && !nitroState.isActive}
                  className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-[11px] font-mono font-bold shadow-lg touch-none select-none ${
                    nitroState.isActive
                      ? 'bg-[#00E5FF] text-[#101820] border-[#00E5FF]'
                      : nitroState.charge >= 0.2
                      ? 'bg-[#17242D]/90 border-[#00E5FF]/50 text-[#00E5FF]'
                      : 'bg-[#17242D]/60 border-[#24343D]/40 text-[#A4B0B5] opacity-50'
                  }`}
                  title="Nitro Boost"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{nitroChargePct}%</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onTouchStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMobileInput({ left: true });
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  onMobileInput({ left: false });
                }}
                onTouchCancel={() => onMobileInput({ left: false })}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#17242D]/90 border border-[#24343D] active:bg-[#E87545] active:text-[#101820] text-[#F2F0E9] flex items-center justify-center text-lg shadow-xl touch-none select-none"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onTouchStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMobileInput({ right: true });
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  onMobileInput({ right: false });
                }}
                onTouchCancel={() => onMobileInput({ right: false })}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#17242D]/90 border border-[#24343D] active:bg-[#E87545] active:text-[#101820] text-[#F2F0E9] flex items-center justify-center text-lg shadow-xl touch-none select-none"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2.5 pointer-events-auto touch-none">
            <button
              onTouchStart={e => {
                e.preventDefault();
                e.stopPropagation();
                onMobileInput({ forward: true });
              }}
              onTouchEnd={e => {
                e.preventDefault();
                onMobileInput({ forward: false });
              }}
              onTouchCancel={() => onMobileInput({ forward: false })}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#17242D]/90 border border-[#24343D] active:bg-[#E87545] active:text-[#101820] text-[#F2F0E9] flex items-center justify-center shadow-xl touch-none select-none"
            >
              <ArrowUp className="w-6 h-6" />
            </button>

            <div className="flex gap-2.5">
              <button
                onTouchStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMobileInput({ brake: true });
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  onMobileInput({ brake: false });
                }}
                onTouchCancel={() => onMobileInput({ brake: false })}
                className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-[#24343D]/95 border border-[#24343D] active:bg-[#E87545] text-[#A4B0B5] active:text-[#101820] text-xs font-mono font-bold flex items-center justify-center shadow-lg touch-none select-none"
              >
                STOP
              </button>
              <button
                onTouchStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMobileInput({ backward: true });
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  onMobileInput({ backward: false });
                }}
                onTouchCancel={() => onMobileInput({ backward: false })}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#17242D]/90 border border-[#24343D] active:bg-[#E87545] active:text-[#101820] text-[#F2F0E9] flex items-center justify-center shadow-xl touch-none select-none"
              >
                <ArrowDown className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. COLLAPSIBLE BOTTOM NAVIGATION DOCK (Safe-Area Aware, collapsed by default) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-40 px-3 sm:px-4"
        style={{
          bottom: 'max(10px, env(safe-area-inset-bottom))',
          maxWidth: 'min(960px, 100vw)',
          width: '100%',
        }}
      >
        {/* Collapse / Expand Tab */}
        <div className="flex justify-center pointer-events-auto">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className={`flex items-center gap-2 px-4 py-1.5 bg-[#17242D]/95 border border-[#24343D] text-xs font-mono text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545]/60 transition-colors shadow cursor-pointer ${
              isDockCollapsed ? 'rounded-xl' : 'rounded-t-xl border-b-0 -mb-px'
            }`}
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#E87545]" />
                <span>Show Portfolio Bar</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#A4B0B5]" />
                <span>Cinema / Full Screen</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Container: Exclusively Portfolio Tabs (Only rendered when expanded) */}
        {!isDockCollapsed && (
          <div
            className="pointer-events-auto bg-[#17242D]/95 border border-[#24343D] rounded-2xl shadow-2xl flex items-center justify-between gap-2 overflow-x-auto no-scrollbar"
            style={{
              padding: '10px 14px',
              boxShadow: '0 12px 35px rgba(16, 24, 32, 0.95), 0 0 15px rgba(232, 117, 69, 0.1)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 justify-start">
              {[
                { id: 'about', label: 'About', icon: User },
                { id: 'projects', label: 'Projects', icon: Layers, badge: `${PROJECTS.length}` },
                { id: 'experience', label: 'Experience', icon: Briefcase },
                { id: 'skills', label: 'Skills', icon: Code2 },
                { id: 'resume', label: 'Resume', icon: FileText, highlight: true },
                { id: 'contact', label: 'Contact', icon: Mail },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onOpenPortfolio(item.id as PortfolioTab)}
                    className={`flex items-center gap-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                      item.highlight
                        ? 'bg-[#E87545]/15 text-[#E87545] border border-[#E87545]/40 hover:bg-[#E87545] hover:text-[#101820]'
                        : 'bg-[#24343D]/40 border border-transparent text-[#A4B0B5] hover:text-[#F2F0E9] hover:bg-[#24343D] hover:border-[#24343D]'
                    }`}
                    style={{ padding: '8px 14px' }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-[#24343D] text-[#8BAE9B]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-2.5 pl-4 border-l border-[#24343D] text-xs font-mono text-[#A4B0B5] shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-[#24343D] text-[#F2F0E9]">W A S D</span>
              <span>Drive</span>
              <span className="px-2 py-0.5 rounded-md bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 font-bold">Shift / N</span>
              <span className="text-[#00E5FF] font-semibold">Manual Nitro</span>
              <span className="px-2 py-0.5 rounded-md bg-[#24343D] text-[#F2F0E9]">Z</span>
              <span>Auto Drive</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
