import React, { useState, useEffect } from 'react';
import { sound, AudioSettingsState } from '../game/audio';
import {
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Sliders,
  Wind,
  Car,
  Waves,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettingsState>(sound.getAudioSettings());

  useEffect(() => {
    if (isOpen) {
      setSettings(sound.getAudioSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMasterVolume = (val: number) => {
    sound.setVolume('master', val);
    setSettings(sound.getAudioSettings());
  };

  const handleEngineVolume = (val: number) => {
    sound.setVolume('engine', val);
    setSettings(sound.getAudioSettings());
  };

  const handleWindVolume = (val: number) => {
    sound.setVolume('wind', val);
    setSettings(sound.getAudioSettings());
  };

  const handleAmbienceVolume = (val: number) => {
    sound.setVolume('ambience', val);
    setSettings(sound.getAudioSettings());
  };

  const handleToggleMasterMute = () => {
    sound.toggleMute();
    setSettings(sound.getAudioSettings());
  };

  const handleToggleChannelMute = (channel: 'engine' | 'wind' | 'ambience') => {
    sound.toggleChannelMute(channel);
    setSettings(sound.getAudioSettings());
  };

  const handleResetDefaults = () => {
    sound.setVolume('master', 0.85);
    sound.setVolume('engine', 0.8);
    sound.setVolume('wind', 0.75);
    sound.setVolume('ambience', 0.6);
    if (settings.isMuted) sound.toggleMute();
    if (settings.engineMuted) sound.toggleChannelMute('engine');
    if (settings.windMuted) sound.toggleChannelMute('wind');
    if (settings.ambienceMuted) sound.toggleChannelMute('ambience');
    setSettings(sound.getAudioSettings());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#101820]/80 backdrop-blur-md animate-fade-in pointer-events-auto select-none"
      style={{
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="w-full max-w-lg max-h-[92dvh] bg-[#17242D] border border-[#24343D] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#F2F0E9] animate-modal-enter"
        style={{
          boxShadow: '0 25px 60px rgba(16, 24, 32, 0.98), 0 0 40px rgba(232, 117, 69, 0.12)',
        }}
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-[#24343D]/70 border-b border-[#24343D] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E87545]/20 border border-[#E87545]/40 text-[#E87545] flex items-center justify-center shadow">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-[#F2F0E9]">
                  Audio Mixer Settings
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#8BAE9B]/20 text-[#8BAE9B] font-semibold">
                  Web Audio API
                </span>
              </div>
              <p className="text-xs text-[#A4B0B5] mt-0.5">
                Independently balance engine, aerodynamic wind, and ambient soundscapes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#24343D]/60 hover:bg-[#24343D] text-[#A4B0B5] hover:text-[#F2F0E9] flex items-center justify-center transition-colors cursor-pointer"
            title="Close Audio Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Master Volume Row */}
          <div className="bg-[#101820]/90 border border-[#24343D] rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMasterMute}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    settings.isMuted
                      ? 'bg-[#E87545]/20 border-[#E87545] text-[#E87545]'
                      : 'bg-[#24343D] border-transparent text-[#8BAE9B]'
                  }`}
                  title={settings.isMuted ? 'Unmute Master' : 'Mute Master Audio'}
                >
                  {settings.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div>
                  <div className="text-sm font-bold font-mono text-[#F2F0E9]">Master Output</div>
                  <div className="text-[11px] text-[#A4B0B5]">Global game audio gain</div>
                </div>
              </div>

              <span className="text-sm font-mono font-bold text-[#E87545]">
                {settings.isMuted ? 'MUTED' : `${Math.round(settings.masterVolume * 100)}%`}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              disabled={settings.isMuted}
              value={settings.masterVolume}
              onChange={e => handleMasterVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#24343D] rounded-lg appearance-none cursor-pointer accent-[#E87545] disabled:opacity-40"
            />
          </div>

          {/* 3 Independent Sound Channels */}
          <div className="space-y-3.5">
            {/* Channel 1: Engine Noise */}
            <div className="bg-[#24343D]/30 border border-[#24343D] rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleToggleChannelMute('engine')}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      settings.engineMuted || settings.isMuted
                        ? 'bg-[#E87545]/20 border-[#E87545] text-[#E87545]'
                        : 'bg-[#24343D] border-transparent text-[#E87545]'
                    }`}
                    title={settings.engineMuted ? 'Unmute Engine' : 'Mute Engine Noise'}
                  >
                    <Car className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-[#F2F0E9]">
                      Vehicle Engine Noise
                    </div>
                    <div className="text-[11px] text-[#A4B0B5]">
                      Procedural low-end combustion rumble & dynamic RPM pitch
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-mono font-bold text-[#F2F0E9]">
                    {settings.engineMuted || settings.isMuted ? 'Muted' : `${Math.round(settings.engineVolume * 100)}%`}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={settings.engineMuted || settings.isMuted}
                value={settings.engineVolume}
                onChange={e => handleEngineVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#101820] rounded-lg appearance-none cursor-pointer accent-[#E87545] disabled:opacity-40"
              />
            </div>

            {/* Channel 2: Wind Sound */}
            <div className="bg-[#24343D]/30 border border-[#24343D] rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleToggleChannelMute('wind')}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      settings.windMuted || settings.isMuted
                        ? 'bg-[#E87545]/20 border-[#E87545] text-[#E87545]'
                        : 'bg-[#24343D] border-transparent text-[#8BAE9B]'
                    }`}
                    title={settings.windMuted ? 'Unmute Wind' : 'Mute Wind Sound'}
                  >
                    <Wind className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-[#F2F0E9]">
                      Aerodynamic Wind Noise
                    </div>
                    <div className="text-[11px] text-[#A4B0B5]">
                      Dynamic airflow whoosh scaling continuously with speed
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-mono font-bold text-[#F2F0E9]">
                    {settings.windMuted || settings.isMuted ? 'Muted' : `${Math.round(settings.windVolume * 100)}%`}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={settings.windMuted || settings.isMuted}
                value={settings.windVolume}
                onChange={e => handleWindVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#101820] rounded-lg appearance-none cursor-pointer accent-[#8BAE9B] disabled:opacity-40"
              />
            </div>

            {/* Channel 3: City & Coastal Ambience */}
            <div className="bg-[#24343D]/30 border border-[#24343D] rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleToggleChannelMute('ambience')}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      settings.ambienceMuted || settings.isMuted
                        ? 'bg-[#E87545]/20 border-[#E87545] text-[#E87545]'
                        : 'bg-[#24343D] border-transparent text-[#8BAE9B]'
                    }`}
                    title={settings.ambienceMuted ? 'Unmute Ambience' : 'Mute Ambience Sound'}
                  >
                    <Waves className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-[#F2F0E9]">
                      City & Island Ambience
                    </div>
                    <div className="text-[11px] text-[#A4B0B5]">
                      Low-frequency atmospheric drone and distant coastal surf
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-mono font-bold text-[#F2F0E9]">
                    {settings.ambienceMuted || settings.isMuted ? 'Muted' : `${Math.round(settings.ambienceVolume * 100)}%`}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={settings.ambienceMuted || settings.isMuted}
                value={settings.ambienceVolume}
                onChange={e => handleAmbienceVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#101820] rounded-lg appearance-none cursor-pointer accent-[#8BAE9B] disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#24343D]/50 border-t border-[#24343D] flex items-center justify-between shrink-0">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-mono text-[#A4B0B5] hover:text-[#F2F0E9] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#E87545] hover:bg-[#E87545]/90 text-[#101820] text-xs font-mono font-bold tracking-wider transition-transform active:scale-95 shadow cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
