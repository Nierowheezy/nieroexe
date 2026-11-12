/**
 * NIERO.EXE — Creative Direction & Gameplay Overhaul
 * Interactive 3D World Portfolio of Olabode Olaniyi David (Niero)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GameEngine } from './game/engine';
import { InteractiveTarget } from './game/landmarks';
import { Project, TokenCollectible, TOKENS } from './data/portfolioData';
import { HUD } from './components/HUD';
import { ProjectModal } from './components/ProjectModal';
import { PortfolioModal, PortfolioTab } from './components/PortfolioModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { CustomizerModal } from './components/CustomizerModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { TourOverlay } from './components/TourOverlay';
import { AchievementToast, ToastMessage } from './components/AchievementToast';
import { PlayerPosition } from './components/Minimap';
import { RaceState } from './game/race';
import {
  VehicleModelType,
  EnvironmentTheme,
  ENVIRONMENT_THEMES,
} from './game/constants';
import { WeatherState, WEATHER_CONFIGS } from './game/weather';
import { fetchLagosLiveWeather, LagosWeatherReport } from './services/lagosWeather';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // HUD & Game State
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [tokensCount, setTokensCount] = useState<number>(0);
  const [nearbyTarget, setNearbyTarget] = useState<InteractiveTarget | null>(null);
  const [playerPos, setPlayerPos] = useState<PlayerPosition>({ x: 0, z: -16, heading: 0 });
  const [uncollectedTokenIds, setUncollectedTokenIds] = useState<Set<string>>(
    () => new Set(TOKENS.map(t => t.id))
  );

  // Time-Trial Race & Cinematic Showcase Tour
  const [raceState, setRaceState] = useState<RaceState | undefined>(undefined);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [isAutoDriveActive, setIsAutoDriveActive] = useState<boolean>(false);
  const [tourProject, setTourProject] = useState<Project | null>(null);

  // Customization Fleet, Environment & Weather
  const [vehicleModel, setVehicleModel] = useState<VehicleModelType>('buggy');
  const [paintHex, setPaintHex] = useState<string>('#E87545');
  const [currentThemeId, setCurrentThemeId] = useState<string>('twilight');
  const [currentWeather, setCurrentWeather] = useState<WeatherState>('sunny');
  const [lagosWeather, setLagosWeather] = useState<LagosWeatherReport | null>(null);

  // Modals & Drawers
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [portfolioOpen, setPortfolioOpen] = useState<boolean>(false);
  const [portfolioTab, setPortfolioTab] = useState<PortfolioTab>('about');
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [customizerOpen, setCustomizerOpen] = useState<boolean>(false);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState<boolean>(false);
  const [nitroState, setNitroState] = useState<{ isActive: boolean; charge: number }>({
    isActive: false,
    charge: 1.0,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'achievement' | 'token', title: string, description: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, type, title, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onSpeedUpdate: (speed) => {
        setSpeedMph(speed);
      },
      onNearbyTarget: (target) => {
        setNearbyTarget(target);
      },
      onPlayerPosUpdate: (pos) => {
        setPlayerPos(pos);
      },
      onTokenCollect: (token: TokenCollectible, collectedCount: number, total: number) => {
        setTokensCount(collectedCount);
        setUncollectedTokenIds(prev => {
          const updated = new Set(prev);
          updated.delete(token.id);
          return updated;
        });
        addToast(
          'token',
          `${token.name} (+1 Token)`,
          `${token.topic} [${collectedCount}/${total} Collected]`
        );
      },
      onAchievementUnlock: (title: string, desc: string) => {
        addToast('achievement', title, desc);
      },
      onInspectProject: (project: Project) => {
        setSelectedProject(project);
      },
      onRaceUpdate: (state) => {
        setRaceState(state);
      },
      onTourUpdate: (isActive, project) => {
        setIsTourActive(isActive);
        setTourProject(project);
      },
      onAutoDriveUpdate: (isActive, project) => {
        setIsAutoDriveActive(isActive);
        setTourProject(project);
      },
      onWeatherUpdate: (weather) => {
        setCurrentWeather(weather);
      },
      onNitroUpdate: (state) => {
        setNitroState(state);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [addToast]);

  const handleTriggerNitro = useCallback(() => {
    if (engineRef.current) {
      const active = engineRef.current.triggerNitroBoost();
      if (active) {
        addToast('achievement', '⚡ MANUAL NITRO ENGAGED', 'Twin-exhaust boost active! [Shift / N]');
      }
    }
  }, [addToast]);

  // Live Lagos Weather Sync
  const loadLagosWeather = useCallback(async (showToastNotice: boolean = false) => {
    try {
      const report = await fetchLagosLiveWeather();
      setLagosWeather(report);
      setCurrentWeather(report.weatherState);
      if (engineRef.current) {
        engineRef.current.setWeather(report.weatherState);
      }
      if (showToastNotice) {
        addToast(
          'achievement',
          `Lagos Live Weather (${report.temperatureC}°C)`,
          `Conditions: ${report.conditionText} • ${report.lagosTime}`
        );
      }
    } catch {
      // Fallback handled in service
    }
  }, [addToast]);

  useEffect(() => {
    loadLagosWeather(false);
    // Refresh weather every 5 minutes
    const interval = setInterval(() => {
      loadLagosWeather(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadLagosWeather]);

  // Actions passed to HUD & Modals
  const handleInteract = () => {
    if (engineRef.current) {
      engineRef.current.interactWithCurrent();
    }
  };

  const handleResetVehicle = () => {
    if (engineRef.current) {
      engineRef.current.resetVehicle();
      addToast('achievement', 'Buggy Repositioned', 'Reset vehicle to starting road');
    }
  };

  const handleTeleport = (x: number, z: number) => {
    if (engineRef.current) {
      engineRef.current.teleportTo(x, z);
      addToast('achievement', 'Fast Travel', 'Teleported buggy directly to destination');
    }
  };

  const handleOpenPortfolio = (tab: PortfolioTab) => {
    setPortfolioTab(tab);
    setPortfolioOpen(true);
  };

  const handleMobileInput = (input: {
    forward?: boolean;
    backward?: boolean;
    left?: boolean;
    right?: boolean;
    brake?: boolean;
  }) => {
    if (engineRef.current) {
      engineRef.current.setInput(input);
    }
  };

  const handleCloseProjectModal = () => {
    setSelectedProject(null);
    if (engineRef.current) {
      engineRef.current.focusLandmark(null);
    }
  };

  const handleSelectVehicle = (model: VehicleModelType, paint: string) => {
    setVehicleModel(model);
    setPaintHex(paint);
    if (engineRef.current) {
      engineRef.current.setVehicleCustomization(model, paint);
    }
    addToast('achievement', 'Vehicle Customizer', `Switched to ${model.toUpperCase()} in ${paint}`);
  };

  const handleSelectTheme = (theme: EnvironmentTheme) => {
    setCurrentThemeId(theme.id);
    if (engineRef.current) {
      engineRef.current.setEnvironmentTheme(theme);
    }
    addToast('achievement', 'World Theme Applied', `Environment transformed to ${theme.name}`);
  };

  const handleStartTour = () => {
    if (engineRef.current) {
      engineRef.current.startCinematicTour();
      addToast('achievement', 'Cinematic Tour', 'Drone showcase tour initiated. Press ESC to cancel.');
    }
  };

  const handleStopTour = () => {
    if (engineRef.current) {
      engineRef.current.stopCinematicTour();
      engineRef.current.stopAutoDrive();
      setIsAutoDriveActive(false);
    }
  };

  const handleToggleAutoDrive = () => {
    if (engineRef.current) {
      const active = engineRef.current.toggleAutoDrive();
      setIsAutoDriveActive(active);
      if (active) {
        addToast(
          'achievement',
          'Autonomous Driving Active',
          'Cruising between all 12 projects. Press WASD or ESC to drive manually.'
        );
      }
    }
  };

  const handleToggleRace = () => {
    if (engineRef.current) {
      const active = engineRef.current.toggleRace();
      if (active) {
        addToast('achievement', 'Time-Trial Circuit', 'Race gates active! Pass through checkpoints.');
      } else {
        addToast('achievement', 'Time-Trial Stopped', 'Circuit race cancelled.');
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#101820]">
      {/* 1. Dedicated WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. HUD Overlay (Minimal Top Bar, Minimap Radar, Proximity Banner, Collapsible Dock, Mobile Controls) */}
      <HUD
        speedMph={speedMph}
        tokensCount={tokensCount}
        totalTokens={TOKENS.length}
        nearbyTarget={nearbyTarget}
        playerPos={playerPos}
        uncollectedTokenIds={uncollectedTokenIds}
        raceState={raceState}
        isTourActive={isTourActive}
        isAutoDriveActive={isAutoDriveActive}
        currentWeather={currentWeather}
        lagosWeather={lagosWeather}
        nitroState={nitroState}
        onTriggerNitro={handleTriggerNitro}
        onOpenAudioSettings={() => setAudioSettingsOpen(true)}
        onRefreshLagosWeather={() => loadLagosWeather(true)}
        onInteract={handleInteract}
        onOpenPortfolio={handleOpenPortfolio}
        onOpenCustomizer={() => setCustomizerOpen(true)}
        onStartTour={handleStartTour}
        onToggleAutoDrive={handleToggleAutoDrive}
        onToggleRace={handleToggleRace}
        onResetVehicle={handleResetVehicle}
        onOpenHelp={() => setHelpOpen(true)}
        onTeleport={handleTeleport}
        onSelectProject={(proj) => {
          setSelectedProject(proj);
          if (engineRef.current) {
            engineRef.current.focusLandmark(
              new THREE.Vector3(proj.coordinates.x, 0, proj.coordinates.z)
            );
          }
        }}
        onMobileInput={handleMobileInput}
      />

      {/* 2b. Cinematic Showcase Drone & Auto-Drive Tour Overlay */}
      <TourOverlay
        isActive={isTourActive || isAutoDriveActive}
        activeProject={tourProject}
        onExitTour={handleStopTour}
        onInspectProject={(proj) => {
          setSelectedProject(proj);
          if (engineRef.current) {
            engineRef.current.focusLandmark(
              new THREE.Vector3(proj.coordinates.x, 0, proj.coordinates.z)
            );
          }
        }}
      />

      {/* 3. Project Detail Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={handleCloseProjectModal}
        onTeleport={handleTeleport}
      />

      {/* 4. Full Portfolio Modal (About, Projects, Experience, Skills, Resume PDF, Contact) */}
      <PortfolioModal
        isOpen={portfolioOpen}
        activeTab={portfolioTab}
        onTabChange={setPortfolioTab}
        onClose={() => setPortfolioOpen(false)}
        onSelectProject={(proj) => {
          setSelectedProject(proj);
          if (engineRef.current) {
            engineRef.current.focusLandmark(
              new THREE.Vector3(
                proj.coordinates.x,
                0,
                proj.coordinates.z
              )
            );
          }
        }}
        onTeleport={handleTeleport}
      />

      {/* 5. Vehicle Fleet & Environment Theme Customizer Modal */}
      <CustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        currentVehicleModel={vehicleModel}
        currentPaintHex={paintHex}
        currentThemeId={currentThemeId}
        onSelectVehicle={handleSelectVehicle}
        onSelectTheme={handleSelectTheme}
      />

      {/* 5b. Dedicated Audio Mixer Settings Modal */}
      <AudioSettingsModal
        isOpen={audioSettingsOpen}
        onClose={() => setAudioSettingsOpen(false)}
      />

      {/* 6. World Controls & Guide Modal */}
      <ControlsGuideModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* 7. Achievement & Discovery Toasts */}
      <AchievementToast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
