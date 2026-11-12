import React, { useState } from 'react';
import { RaceState } from '../game/race';
import { Timer, Zap, Trophy, Play, X, Minimize2, Maximize2 } from 'lucide-react';

interface Props {
  raceState: RaceState;
  onToggleRace?: () => void;
}

export const RaceTimerHUD: React.FC<Props> = ({ raceState, onToggleRace }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    const paddedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
    return `${mins}:${paddedSecs}`;
  };

  // Minimized / Collapsed View
  if (isCollapsed && !raceState.isActive) {
    return (
      <div className="pointer-events-auto select-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-[#17242D]/90 hover:bg-[#17242D] border border-[#24343D] hover:border-[#8BAE9B] rounded-2xl shadow-xl flex items-center gap-2 text-xs font-mono text-[#A4B0B5] hover:text-[#F2F0E9] transition-all cursor-pointer"
          style={{ padding: '6px 12px' }}
          title="Expand Time-Trial Race Challenge"
        >
          <Timer className="w-3.5 h-3.5 text-[#8BAE9B]" />
          <span>Race Trial</span>
          <Maximize2 className="w-3 h-3 text-[#A4B0B5]" />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto select-none">
      <div
        className={`border rounded-2xl shadow-xl transition-all flex items-center gap-3 ${
          raceState.isActive
            ? 'bg-[#17242D]/95 border-[#E87545] shadow-[0_0_20px_rgba(232,117,69,0.25)]'
            : 'bg-[#17242D]/90 border-[#24343D]'
        }`}
        style={{ padding: '8px 14px' }}
      >
        {/* Race Status Indicator & Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRace}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              raceState.isActive
                ? 'bg-[#E87545] text-[#101820] shadow-[0_0_12px_rgba(232,117,69,0.5)]'
                : 'bg-[#24343D] text-[#8BAE9B] hover:text-[#F2F0E9] hover:bg-[#8BAE9B]/20'
            }`}
            title={raceState.isActive ? 'Quit Time-Trial' : 'Start Optional Time-Trial'}
          >
            {raceState.isActive ? <Timer className="w-4 h-4 animate-pulse" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <div
            className="cursor-pointer"
            onClick={onToggleRace}
            title={raceState.isActive ? 'Time-Trial in progress' : 'Click to start race'}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#A4B0B5] font-semibold flex items-center gap-1.5">
              <span>{raceState.isActive ? 'Time-Trial Active' : 'Time-Trial (Optional)'}</span>
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-[#F2F0E9]">
              {raceState.isActive ? formatTime(raceState.currentLapTime) : 'Click to Start'}
            </div>
          </div>
        </div>

        {/* Checkpoint Badge */}
        {raceState.isActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#24343D] border border-[#24343D] text-xs font-mono font-bold text-[#8BAE9B]">
            <Zap className="w-3.5 h-3.5 text-[#E87545]" />
            <span>
              CP {raceState.currentCheckpoint}/{raceState.totalCheckpoints}
            </span>
          </div>
        )}

        {/* Personal Best Record */}
        {raceState.bestLapTime && (
          <div className="hidden sm:flex items-center gap-1.5 pl-2.5 border-l border-[#24343D] text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-[#E87545]" />
            <span className="text-[#A4B0B5]">BEST:</span>
            <span className="font-bold text-[#8BAE9B]">{raceState.bestLapTime.toFixed(2)}s</span>
          </div>
        )}

        {/* Quit Race Button when active */}
        {raceState.isActive && onToggleRace && (
          <button
            onClick={onToggleRace}
            className="w-7 h-7 rounded-lg bg-[#24343D]/60 hover:bg-[#E87545] hover:text-[#101820] text-[#A4B0B5] flex items-center justify-center transition-all ml-1 cursor-pointer"
            title="End / Exit Time-Trial"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Collapse Button (Only shown when not mid-race) */}
        {!raceState.isActive && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-6 h-6 rounded-lg bg-[#24343D]/40 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-all ml-1 cursor-pointer"
            title="Minimize Time-Trial Widget"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
