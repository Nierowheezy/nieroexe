import React from 'react';
import { X, Compass, Key, Eye, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101820]/85 backdrop-blur-md animate-fade-in"
      style={{ padding: '16px' }}
    >
      <div
        className="w-full max-w-xl bg-[#17242D] border border-[#24343D] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#F2F0E9] animate-modal-enter select-text"
        style={{
          padding: '20px',
          boxShadow: '0 25px 60px rgba(16, 24, 32, 0.95), 0 0 35px rgba(232, 117, 69, 0.15)',
        }}
      >
        {/* Header Banner */}
        <div
          className="bg-[#24343D]/70 border border-[#24343D] rounded-2xl flex items-center justify-between shrink-0 mb-3"
          style={{ padding: '16px 20px' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E87545] text-[#101820] flex items-center justify-center font-bold shadow shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F2F0E9]">World Controls & Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#17242D] border border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div
          className="overflow-y-auto space-y-6 text-xs sm:text-sm text-[#A4B0B5] flex-1 rounded-2xl bg-[#101820]/40 border border-[#24343D]/60"
          style={{ padding: '22px' }}
        >
          {/* Key bindings */}
          <div>
            <h3 className="font-mono uppercase tracking-wider text-[#E87545] font-semibold mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#E87545]" /> Driving Controls
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-[#F2F0E9]">
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Accelerate</span>
                <span className="font-mono text-[#E87545] font-bold">W / ↑</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Reverse</span>
                <span className="font-mono text-[#E87545] font-bold">S / ↓</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Steer Left</span>
                <span className="font-mono text-[#E87545] font-bold">A / ←</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Steer Right</span>
                <span className="font-mono text-[#E87545] font-bold">D / →</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Handbrake</span>
                <span className="font-mono text-[#E87545] font-bold">SPACE</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Reset Buggy</span>
                <span className="font-mono text-[#E87545] font-bold">R</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40"
                style={{ padding: '10px 14px' }}
              >
                <span className="text-[#00E5FF] font-semibold">Nitro Boost ⚡</span>
                <span className="font-mono text-[#00E5FF] font-bold">SHIFT / N</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Auto Drive</span>
                <span className="font-mono text-[#E87545] font-bold">Z</span>
              </div>
              <div
                className="flex items-center justify-between rounded-xl bg-[#24343D]/40 border border-[#24343D]"
                style={{ padding: '10px 14px' }}
              >
                <span>Interact</span>
                <span className="font-mono text-[#8BAE9B] font-bold">E or Click</span>
              </div>
            </div>
          </div>

          {/* Garage & Themes */}
          <div>
            <h3 className="font-mono uppercase tracking-wider text-[#E87545] font-semibold mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#E87545]" /> Fleet & World Themes
            </h3>
            <div
              className="rounded-xl bg-[#24343D]/40 border border-[#24343D] leading-relaxed"
              style={{ padding: '14px 16px' }}
            >
              Click <strong>Garage & Colors</strong> on the top bar or bottom dock to switch between the Dune Buggy, Cyber Roadster, Lunar Explorer, and Turbo Cruiser, customize vehicle paint, or transform the atmospheric environment (Obsidian Twilight, Sahara Sunset, Emerald Aurora, Deep Oceanic, Synthwave Noir).
            </div>
          </div>

          {/* Camera Panning */}
          <div>
            <h3 className="font-mono uppercase tracking-wider text-[#8BAE9B] font-semibold mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#8BAE9B]" /> 360° Camera View
            </h3>
            <div
              className="rounded-xl bg-[#24343D]/40 border border-[#24343D] leading-relaxed"
              style={{ padding: '14px 16px' }}
            >
              Click & drag anywhere on the canvas with your mouse or swipe with your finger to freely pan and orbit the camera 360° around the world. Use your mouse scroll wheel to zoom in or out.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="bg-[#24343D]/50 border border-[#24343D] rounded-2xl flex justify-end shrink-0 mt-3"
          style={{ padding: '12px 18px' }}
        >
          <button
            onClick={onClose}
            className="rounded-xl bg-[#E87545] text-[#101820] text-xs sm:text-sm font-bold font-mono tracking-wider hover:bg-[#E87545]/90 transition-colors shadow"
            style={{ padding: '8px 20px' }}
          >
            LET'S DRIVE!
          </button>
        </div>
      </div>
    </div>
  );
};
