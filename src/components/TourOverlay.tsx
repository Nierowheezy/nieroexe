import React from 'react';
import { Project } from '../data/portfolioData';
import { Video, X, ExternalLink, Sparkles, Navigation } from 'lucide-react';

interface Props {
  isActive: boolean;
  activeProject: Project | null;
  onExitTour: () => void;
  onInspectProject: (project: Project) => void;
}

export const TourOverlay: React.FC<Props> = ({
  isActive,
  activeProject,
  onExitTour,
  onInspectProject,
}) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none">
      {/* Top Tour Broadcast Status */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div
          className="bg-[#17242D]/95 border border-[#8BAE9B]/60 rounded-2xl shadow-2xl flex items-center gap-3"
          style={{ padding: '10px 18px' }}
        >
          <div className="w-3 h-3 rounded-full bg-[#E87545] animate-ping" />
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#8BAE9B]" />
            <span className="text-xs sm:text-sm font-mono font-bold text-[#F2F0E9] tracking-wider uppercase">
              Project Showcase Tour
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#A4B0B5] hidden md:inline pl-2 border-l border-[#24343D]">
            Cruising through Olabode Olaniyi David's 3D World
          </span>
        </div>

        {/* Exit Tour Button */}
        <button
          onClick={onExitTour}
          className="rounded-2xl bg-[#E87545] hover:bg-[#E87545]/90 text-[#101820] font-mono font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 transition-transform active:scale-95"
          style={{ padding: '10px 18px' }}
        >
          <X className="w-4 h-4" />
          <span>Exit Tour [ESC / WASD]</span>
        </button>
      </div>

      {/* Broadcast Lower-Third Project Card */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div
          className="max-w-2xl w-full bg-[#17242D]/95 border-2 border-[#E87545] rounded-3xl shadow-2xl backdrop-blur-md animate-modal-enter"
          style={{
            padding: '20px 24px',
            boxShadow: '0 20px 50px rgba(16, 24, 32, 0.95), 0 0 30px rgba(232, 117, 69, 0.25)',
          }}
        >
          {activeProject ? (
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-lg bg-[#E87545]/20 text-[#E87545] border border-[#E87545]/40">
                    {activeProject.category}
                  </span>
                  <span className="text-xs font-mono text-[#8BAE9B]">
                    {activeProject.year} • {activeProject.status}
                  </span>
                </div>

                <button
                  onClick={() => onInspectProject(activeProject)}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#E87545] hover:text-[#F2F0E9] transition-colors"
                >
                  <span>Read Spec</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#F2F0E9] mb-1">
                {activeProject.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#A4B0B5] line-clamp-2 mb-3">
                {activeProject.description}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {activeProject.technologies.slice(0, 5).map((tech, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#24343D] text-[#8BAE9B] border border-[#24343D]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-[#8BAE9B] animate-spin" />
                <div>
                  <h3 className="text-sm font-bold text-[#F2F0E9]">Cruising Over Landscape</h3>
                  <p className="text-xs text-[#A4B0B5]">Approaching next architectural project monument...</p>
                </div>
              </div>
              <div className="text-xs font-mono text-[#A4B0B5]">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[#24343D] text-[#F2F0E9]">WASD</kbd> to take the wheel
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
