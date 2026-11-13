import React, { useState } from 'react';
import {
  VehicleModelType,
  VEHICLE_MODELS,
  PAINT_COLORS,
  ENVIRONMENT_THEMES,
  EnvironmentTheme,
  VehicleOption,
  PaintColorOption,
} from '../game/constants';
import { X, Palette, Car, Sparkles, Check, SunMedium, Compass } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentVehicleModel: VehicleModelType;
  currentPaintHex: string;
  currentThemeId: string;
  onSelectVehicle: (model: VehicleModelType, paintHex: string) => void;
  onSelectTheme: (theme: EnvironmentTheme) => void;
}

export const CustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentVehicleModel,
  currentPaintHex,
  currentThemeId,
  onSelectVehicle,
  onSelectTheme,
}) => {
  const [activeSection, setActiveSection] = useState<'vehicle' | 'environment'>('vehicle');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101820]/90 backdrop-blur-md animate-fade-in p-2.5 sm:p-5"
      style={{
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[92dvh] bg-[#17242D] border border-[#24343D] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#F2F0E9] animate-modal-enter p-3 sm:p-6"
        style={{
          boxShadow: '0 25px 60px rgba(16, 24, 32, 0.98), 0 0 40px rgba(232, 117, 69, 0.15)',
        }}
      >
        {/* Top Header */}
        <div
          className="bg-[#24343D]/70 border border-[#24343D] rounded-2xl flex items-center justify-between shrink-0 mb-3 sm:mb-4 px-3.5 py-3 sm:px-5 sm:py-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E87545] text-[#101820] flex items-center justify-center font-bold shadow shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#F2F0E9]">
                  Garage & World Customizer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#8BAE9B]/20 text-[#8BAE9B] font-semibold border border-[#8BAE9B]/30">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-[#A4B0B5] mt-0.5">
                Switch vehicles, apply custom liveries, and alter the atmospheric world theme.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#17242D] border border-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] hover:border-[#E87545] transition-colors shrink-0"
            title="Return to World"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <button
            onClick={() => setActiveSection('vehicle')}
            className={`flex items-center gap-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSection === 'vehicle'
                ? 'bg-[#E87545] text-[#101820] shadow'
                : 'bg-[#24343D]/50 text-[#A4B0B5] hover:text-[#F2F0E9] border border-[#24343D]'
            }`}
            style={{ padding: '10px 18px' }}
          >
            <Car className="w-4 h-4" />
            <span>Vehicles & Paint</span>
          </button>

          <button
            onClick={() => setActiveSection('environment')}
            className={`flex items-center gap-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSection === 'environment'
                ? 'bg-[#E87545] text-[#101820] shadow'
                : 'bg-[#24343D]/50 text-[#A4B0B5] hover:text-[#F2F0E9] border border-[#24343D]'
            }`}
            style={{ padding: '10px 18px' }}
          >
            <SunMedium className="w-4 h-4" />
            <span>Environment Themes</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* SECTION 1: VEHICLES & PAINT */}
          {activeSection === 'vehicle' && (
            <div className="space-y-6">
              {/* Paint Swatches */}
              <div
                className="bg-[#24343D]/40 border border-[#24343D] rounded-2xl"
                style={{ padding: '20px' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-bold">
                    Vehicle Paint & Rim Accent
                  </span>
                  <span className="text-xs font-mono text-[#8BAE9B]">
                    Active: {PAINT_COLORS.find(c => c.hex.toLowerCase() === currentPaintHex.toLowerCase())?.name || currentPaintHex}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PAINT_COLORS.map(color => {
                    const isSelected = currentPaintHex.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.id}
                        onClick={() => onSelectVehicle(currentVehicleModel, color.hex)}
                        className={`flex items-center gap-3 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'bg-[#17242D] border-[#E87545] shadow-lg ring-1 ring-[#E87545]'
                            : 'bg-[#17242D]/60 border-[#24343D] hover:border-[#A4B0B5]/50'
                        }`}
                        style={{ padding: '10px 14px' }}
                      >
                        <span
                          className="w-6 h-6 rounded-lg border border-black/30 shadow-inner flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-black drop-shadow" />}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#F2F0E9] truncate">{color.name}</div>
                          <div className="text-[10px] font-mono text-[#A4B0B5] uppercase">{color.hex}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Models Grid (2 columns) */}
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-bold block mb-3">
                  Choose Vehicle Model
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {VEHICLE_MODELS.map(veh => {
                    const isSelected = currentVehicleModel === veh.id;
                    return (
                      <div
                        key={veh.id}
                        onClick={() => onSelectVehicle(veh.id, currentPaintHex)}
                        className={`rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#24343D]/70 border-[#E87545] shadow-xl ring-2 ring-[#E87545]/40'
                            : 'bg-[#24343D]/30 border-[#24343D] hover:border-[#8BAE9B]/60 hover:bg-[#24343D]/40'
                        }`}
                        style={{ padding: '20px' }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-[#17242D] text-[#8BAE9B] border border-[#24343D]">
                              {veh.category}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[11px] font-mono text-[#E87545] font-bold">
                                <Check className="w-3.5 h-3.5" /> SELECTED
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-[#F2F0E9] flex items-center gap-2">
                            <Car className="w-4 h-4 text-[#E87545]" />
                            {veh.name}
                          </h3>
                          <p className="text-xs text-[#A4B0B5] mt-1.5 leading-relaxed">
                            {veh.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#24343D]/80 text-xs font-mono text-[#A4B0B5]">
                          <span>Top Speed: <span className="text-[#E87545] font-bold">{veh.speed}</span></span>
                          <span>Handling: <span className="text-[#8BAE9B] font-bold">{veh.handling}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ENVIRONMENT THEMES */}
          {activeSection === 'environment' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#E87545] font-bold block mb-1">
                  Atmospheric Presets
                </span>
                <p className="text-xs text-[#A4B0B5]">
                  Select a theme to dynamically recolor the world sky, terrain slopes, water canal, and lighting rig.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ENVIRONMENT_THEMES.map(theme => {
                  const isSelected = currentThemeId === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => onSelectTheme(theme)}
                      className={`rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#24343D]/70 border-[#E87545] shadow-xl ring-2 ring-[#E87545]/40'
                          : 'bg-[#24343D]/30 border-[#24343D] hover:border-[#8BAE9B]/60 hover:bg-[#24343D]/40'
                      }`}
                      style={{ padding: '20px' }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h3 className="text-base font-bold text-[#F2F0E9] flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#E87545]" />
                            {theme.name}
                          </h3>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-[#E87545] font-bold">
                              <Check className="w-3.5 h-3.5" /> ACTIVE
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#A4B0B5] leading-relaxed mb-4">
                          {theme.tagline}
                        </p>

                        {/* Palette Swatches Preview */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1.5 bg-[#17242D] px-2.5 py-1.5 rounded-xl border border-[#24343D]">
                            <span
                              className="w-4 h-4 rounded-full border border-black/40"
                              style={{ backgroundColor: theme.bgHex }}
                              title="Atmosphere Sky & Fog"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-black/40"
                              style={{ backgroundColor: theme.primaryEnvHex }}
                              title="Primary Ground Terrain"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-black/40"
                              style={{ backgroundColor: theme.secondarySurfacesHex }}
                              title="Rocks & Elevated Ridges"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-black/40"
                              style={{ backgroundColor: theme.waterHex }}
                              title="River Canal Water"
                            />
                          </div>
                          <span className="text-[10px] font-mono text-[#A4B0B5]">Sky / Ground / Rocks / Water</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="bg-[#24343D]/50 border border-[#24343D] rounded-2xl flex items-center justify-between text-xs text-[#A4B0B5] shrink-0 mt-4"
          style={{ padding: '12px 18px' }}
        >
          <div className="font-mono text-xs">NIERO.EXE // Vehicle & World Studio</div>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#E87545] text-[#101820] font-bold font-mono hover:bg-[#E87545]/90 transition-colors shadow"
            style={{ padding: '8px 18px' }}
          >
            Apply & Drive [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
