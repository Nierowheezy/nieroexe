import React, { useState, useEffect, useRef } from 'react';
import { radio, RadioStation, RADIO_STATIONS, SpectrumData } from '../game/radio';
import {
  Radio as RadioIcon,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronDown,
  ChevronUp,
  Activity,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  GripHorizontal,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export const RadioWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(radio.getIsPlaying());
  const [isBuffering, setIsBuffering] = useState<boolean>(radio.getIsBuffering());
  const [currentStation, setCurrentStation] = useState<RadioStation>(radio.getCurrentStation());
  const [spectrum, setSpectrum] = useState<SpectrumData>({
    bars: new Array(16).fill(0.08),
    peaks: new Array(16).fill(0.08),
  });
  const [isStationsOpen, setIsStationsOpen] = useState<boolean>(false);
  const [isSpectrumExpanded, setIsSpectrumExpanded] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(radio.getVolume());

  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      setIsPlaying(radio.getIsPlaying());
      setIsBuffering(radio.getIsBuffering());
      setSpectrum(radio.getSpectrumData());
      animId = requestAnimationFrame(updateLoop);
    };
    animId = requestAnimationFrame(updateLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Dragging event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    e.preventDefault();
    e.stopPropagation();

    const currentX =
      position?.x ?? (cardRef.current ? cardRef.current.getBoundingClientRect().left : 24);
    const currentY =
      position?.y ?? (cardRef.current ? cardRef.current.getBoundingClientRect().top : 98);

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

    const cardWidth = cardRef.current?.offsetWidth ?? 320;
    const cardHeight = cardRef.current?.offsetHeight ?? 180;

    const newX = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, dragStartRef.current.initX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - cardHeight - 10, dragStartRef.current.initY + deltaY));

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

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const playing = radio.toggle();
    setIsPlaying(playing);
    setCurrentStation(radio.getCurrentStation());
  };

  const handleNextStation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = radio.nextStation();
    setCurrentStation(next);
  };

  const handlePrevStation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = radio.prevStation();
    setCurrentStation(prev);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    radio.setVolume(val);
  };

  // 1. Minimized / Collapsed Radio Badge View (also draggable)
  if (isCollapsed) {
    return (
      <div
        ref={cardRef}
        className={`pointer-events-auto select-none ${
          position ? 'fixed z-50 transition-none' : 'relative z-30'
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
        <div
          className="bg-[#17242D]/95 border border-[#24343D] hover:border-[#E87545]/60 rounded-2xl shadow-xl flex items-center gap-2 transition-all"
          style={{ padding: '6px 10px' }}
        >
          {/* Drag Grip Icon */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-grab active:cursor-grabbing text-[#A4B0B5] hover:text-[#F2F0E9] p-0.5"
            title="Drag Radio Badge"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>

          <button
            onClick={handleTogglePlay}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isPlaying
                ? 'bg-[#E87545] text-[#101820] shadow-[0_0_12px_rgba(232,117,69,0.5)]'
                : 'bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9]'
            }`}
            title={isPlaying ? 'Pause Radio' : 'Play Live Radio'}
          >
            {isBuffering ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#E87545]" />
            ) : isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          <div
            className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-[#F2F0E9]"
            onClick={() => setIsCollapsed(false)}
            title="Click to expand Radio Tuner"
          >
            <RadioIcon className={`w-3.5 h-3.5 ${isPlaying ? 'text-[#8BAE9B] animate-pulse' : 'text-[#A4B0B5]'}`} />
            <span className="font-bold truncate max-w-[100px]">{currentStation.freq}</span>
            {isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#8BAE9B] animate-ping" />
            )}
          </div>

          {position && (
            <button
              onClick={handleResetPosition}
              className="w-6 h-6 rounded-lg bg-[#24343D]/50 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-all cursor-pointer"
              title="Reset Radio Position"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(false)}
            className="w-6 h-6 rounded-lg bg-[#24343D]/50 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-all cursor-pointer"
            title="Expand Radio Tuner"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Full Radio Deck View with Live Spectrum Analyzer & Drag Grip
  return (
    <div
      ref={cardRef}
      className={`pointer-events-auto select-none ${
        position ? 'fixed z-50 transition-none' : 'relative z-30'
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
      <div
        className="bg-[#17242D]/98 border border-[#24343D] rounded-2xl shadow-2xl flex flex-col gap-2 transition-all w-[320px] sm:w-[350px]"
        style={{ padding: '10px 14px' }}
      >
        {/* Drag Grip Handle Header Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between pb-1 border-b border-[#24343D]/60 cursor-grab active:cursor-grabbing text-[#A4B0B5] hover:text-[#F2F0E9] select-none"
          title="Click and drag to move Radio Tuner anywhere"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-4 h-4 text-[#E87545]" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#A4B0B5] uppercase">
              Lagos FM Tuner
            </span>
          </div>

          <div className="flex items-center gap-1">
            {position && (
              <button
                onClick={handleResetPosition}
                className="p-1 rounded-md bg-[#24343D]/50 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] transition-all cursor-pointer"
                title="Reset to default position"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#24343D] text-[#8BAE9B] font-semibold">
              DRAGGABLE
            </span>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isPlaying
                ? 'bg-[#E87545] text-[#101820] shadow-[0_0_12px_rgba(232,117,69,0.5)]'
                : 'bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9]'
            }`}
            title={isPlaying ? 'Pause Radio' : 'Tune into Lagos Live Radio'}
          >
            {isBuffering ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#101820]" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Previous Station */}
          <button
            onClick={handlePrevStation}
            className="w-7 h-7 rounded-lg bg-[#24343D]/50 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Previous Lagos Station"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Station Info & Stations Menu Trigger */}
          <div
            className="cursor-pointer min-w-0 flex-1"
            onClick={() => setIsStationsOpen(!isStationsOpen)}
            title="Click to view all Lagos radio stations"
          >
            <div className="flex items-center gap-1.5">
              <RadioIcon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isPlaying ? 'text-[#8BAE9B] animate-pulse' : 'text-[#A4B0B5]'
                }`}
              />
              <span className="text-xs sm:text-sm font-mono font-bold text-[#F2F0E9] truncate max-w-[130px] sm:max-w-[160px]">
                {currentStation.name}
              </span>
              <span className="text-[10px] font-mono text-[#8BAE9B] font-bold shrink-0">
                {currentStation.freq}
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#A4B0B5] truncate flex items-center gap-1.5 mt-0.5">
              {isBuffering ? (
                <span className="text-[#E87545] animate-pulse flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Connecting Lagos Stream...
                </span>
              ) : isPlaying ? (
                <span className="flex items-center gap-1 text-[#8BAE9B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8BAE9B] animate-ping" />
                  <span>24/7 Lagos Live</span>
                </span>
              ) : (
                <span>Lagos FM Radio [Paused]</span>
              )}
            </div>
          </div>

          {/* Next Station */}
          <button
            onClick={handleNextStation}
            className="w-7 h-7 rounded-lg bg-[#24343D]/50 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Next Lagos Station"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Spectrum Mode */}
          <button
            onClick={() => setIsSpectrumExpanded(!isSpectrumExpanded)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isSpectrumExpanded
                ? 'bg-[#E87545]/20 text-[#E87545] border border-[#E87545]/40'
                : 'bg-[#24343D]/50 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9]'
            }`}
            title="Toggle Detailed Spectrum Analyzer"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Stations Dropdown Icon */}
          <button
            onClick={() => setIsStationsOpen(!isStationsOpen)}
            className="w-7 h-7 rounded-lg bg-[#24343D]/30 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Toggle Lagos Stations Menu"
          >
            {isStationsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Minimize / Collapse Button (Collapsible requirement) */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 rounded-lg bg-[#24343D]/30 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Minimize Radio Tuner"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 16-Band Live Visual Spectrum Analyzer */}
        <div className="bg-[#101820]/80 rounded-xl p-2 border border-[#24343D] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#A4B0B5] px-0.5">
            <span className="flex items-center gap-1">
              <span className="text-[#E87545]">■</span> BASS
              <span className="text-[#8BAE9B] ml-2">■</span> MID/TREBLE
            </span>
            <span className="font-semibold text-[#8BAE9B]">
              {isPlaying ? 'SPECTRUM ANALYZER • ACTIVE' : 'SPECTRUM • STANDBY'}
            </span>
          </div>

          {/* 16 Responsive Frequency Bars with Peak Indicators */}
          <div className="flex items-end justify-between gap-1 h-8 px-0.5 pt-1">
            {spectrum.bars.map((barLvl, idx) => {
              const peakLvl = spectrum.peaks[idx] ?? barLvl;
              const isBass = idx < 6;
              const barHeight = Math.max(3, Math.round(barLvl * 28));
              const peakPos = Math.max(4, Math.round(peakLvl * 28));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative">
                  {/* Floating Peak Hold Dot */}
                  <div
                    className={`w-full h-0.5 rounded-full absolute transition-all duration-75 ${
                      isBass ? 'bg-[#F2F0E9]' : 'bg-[#00E5FF]'
                    }`}
                    style={{ bottom: `${peakPos}px` }}
                  />

                  {/* Gradient Audio Bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-75 ${
                      isBass
                        ? 'bg-gradient-to-t from-[#E87545] to-[#F59E0B]'
                        : 'bg-gradient-to-t from-[#8BAE9B] to-[#00E5FF]'
                    }`}
                    style={{
                      height: `${barHeight}px`,
                      opacity: isPlaying ? 0.95 : 0.25,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed High-Res Waveform Equalizer (Optional Drawer Mode) */}
        {isSpectrumExpanded && (
          <div className="bg-[#101820]/90 rounded-xl p-2.5 border border-[#24343D] animate-modal-enter flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#A4B0B5]">
              <span>TUNER FREQUENCY RESPONSE</span>
              <span className="text-[#E87545] font-bold">{currentStation.genre}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-[#17242D] p-1.5 rounded-lg border border-[#24343D]">
                <div className="text-[9px] text-[#A4B0B5] font-mono">SUB (60Hz)</div>
                <div className="text-xs font-mono font-bold text-[#E87545] mt-0.5">
                  {Math.round((spectrum.bars[1] ?? 0.3) * 100)}%
                </div>
              </div>
              <div className="bg-[#17242D] p-1.5 rounded-lg border border-[#24343D]">
                <div className="text-[9px] text-[#A4B0B5] font-mono">BASS (150Hz)</div>
                <div className="text-xs font-mono font-bold text-[#E87545] mt-0.5">
                  {Math.round((spectrum.bars[4] ?? 0.3) * 100)}%
                </div>
              </div>
              <div className="bg-[#17242D] p-1.5 rounded-lg border border-[#24343D]">
                <div className="text-[9px] text-[#A4B0B5] font-mono">MIDS (1kHz)</div>
                <div className="text-xs font-mono font-bold text-[#8BAE9B] mt-0.5">
                  {Math.round((spectrum.bars[8] ?? 0.3) * 100)}%
                </div>
              </div>
              <div className="bg-[#17242D] p-1.5 rounded-lg border border-[#24343D]">
                <div className="text-[9px] text-[#A4B0B5] font-mono">HIGH (8kHz)</div>
                <div className="text-xs font-mono font-bold text-[#00E5FF] mt-0.5">
                  {Math.round((spectrum.bars[14] ?? 0.3) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Volume Slider Row */}
        <div className="flex items-center gap-2 pt-0.5 px-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const next = volume === 0 ? 0.8 : 0;
              setVolume(next);
              radio.setVolume(next);
            }}
            className="text-[#A4B0B5] hover:text-[#F2F0E9] transition-colors cursor-pointer"
          >
            {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-[#E87545]" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 bg-[#24343D] rounded-lg appearance-none cursor-pointer accent-[#E87545]"
          />
          <span className="text-[10px] font-mono text-[#A4B0B5] w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Expanded Lagos Radio Stations Menu */}
      {isStationsOpen && (
        <div
          className="absolute top-full mt-2 left-0 right-0 sm:w-88 bg-[#17242D]/98 border border-[#24343D] rounded-2xl shadow-2xl z-50 animate-modal-enter max-h-[380px] flex flex-col"
          style={{ padding: '12px 14px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#24343D]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🇳🇬</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F2F0E9]">
                Lagos Live FM Stations
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#24343D] text-[#8BAE9B] font-bold">
              REAL LIVE AUDIO
            </span>
          </div>

          {/* Station List */}
          <div className="space-y-1.5 overflow-y-auto max-h-[250px] pr-1">
            {RADIO_STATIONS.map((station, idx) => {
              const isSelected = currentStation.id === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => {
                    radio.setStation(idx);
                    radio.play();
                    setCurrentStation(station);
                    setIsStationsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E87545]/15 border border-[#E87545]/60 text-[#F2F0E9]'
                      : 'bg-[#24343D]/30 border border-transparent text-[#A4B0B5] hover:text-[#F2F0E9] hover:bg-[#24343D]'
                  }`}
                  style={{ padding: '8px 10px' }}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#E87545] animate-ping" />}
                      <span className="text-xs font-bold font-mono truncate">{station.name}</span>
                    </div>
                    <div className="text-[10px] text-[#A4B0B5] truncate mt-0.5">{station.genre}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono font-bold text-[#8BAE9B]">{station.freq}</div>
                    <div className="text-[9px] font-mono text-[#A4B0B5]">Lagos Live</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
