/**
 * Main 3D Game Engine for NIERO.EXE
 * Orchestrates Three.js rendering, lighting, world systems, vehicle physics, audio,
 * collision detection, and interaction callbacks.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PALETTE, VehicleModelType, EnvironmentTheme } from './constants';
import { TerrainSystem } from './terrain';
import { EnvironmentSystem } from './environment';
import { LandmarkSystem, InteractiveTarget } from './landmarks';
import { Vehicle, VehicleInput } from './vehicle';
import { CameraController } from './camera';
import { RaceSystem, RaceState } from './race';
import { CinematicTourSystem } from './tour';
import { AutoDriveSystem } from './autodrive';
import { WeatherSystem, WeatherState } from './weather';
import { sound } from './audio';
import { Project, TokenCollectible } from '../data/portfolioData';

export interface GameCallbacks {
  onSpeedUpdate: (speedMph: number) => void;
  onNearbyTarget: (target: InteractiveTarget | null) => void;
  onTokenCollect: (token: TokenCollectible, collectedCount: number, totalTokens: number) => void;
  onAchievementUnlock: (title: string, desc: string) => void;
  onInspectProject: (project: Project) => void;
  onPlayerPosUpdate?: (pos: { x: number; z: number; heading: number }) => void;
  onRaceUpdate?: (state: RaceState) => void;
  onTourUpdate?: (isActive: boolean, project: Project | null) => void;
  onAutoDriveUpdate?: (isActive: boolean, project: Project | null) => void;
  onWeatherUpdate?: (weather: WeatherState) => void;
  onNitroUpdate?: (state: { isActive: boolean; charge: number }) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraCtrl: CameraController;

  // Systems
  private terrain: TerrainSystem;
  private environment: EnvironmentSystem;
  private landmarks: LandmarkSystem;
  private vehicle: Vehicle;
  private race: RaceSystem;
  private tour: CinematicTourSystem;
  private autoDrive: AutoDriveSystem;
  private weather: WeatherSystem;

  // Lighting references
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Loop & timing
  private clock: THREE.Clock;
  private frameId: number = 0;
  private isRunning: boolean = false;
  private isSoftwareGl: boolean = false;

  // Input
  private inputState: VehicleInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  };

  // Interactions & Achievements
  private callbacks: GameCallbacks;
  private currentNearby: InteractiveTarget | null = null;
  private visitedProjects: Set<string> = new Set();
  private unlockedAchievements: Set<string> = new Set();
  private topSpeedReached: boolean = false;
  private hasIgnited: boolean = false;
  private lastPosUpdate: number = 0;
  private lastNitroUpdate: number = 0;
  private lastNitroActive: boolean = false;

  // Raycaster for click-to-inspect
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Detect software WebGL per Three.js directives
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Background Fog matching #101820
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.cBg);
    this.scene.fog = new THREE.Fog(PALETTE.cBg, 55, 175);

    // Studio Environment map reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Camera
    this.cameraCtrl = new CameraController(container.clientWidth / container.clientHeight);

    // 6. Subsystems
    this.terrain = new TerrainSystem();
    this.scene.add(this.terrain.mesh);
    this.scene.add(this.terrain.riverMesh);

    this.environment = new EnvironmentSystem(this.terrain);
    this.scene.add(this.environment.group);

    this.landmarks = new LandmarkSystem(this.terrain);
    this.scene.add(this.landmarks.group);

    this.race = new RaceSystem(this.terrain);
    this.scene.add(this.race.group);

    this.tour = new CinematicTourSystem(this.terrain);
    this.autoDrive = new AutoDriveSystem(this.terrain);

    this.vehicle = new Vehicle(this.terrain);
    this.scene.add(this.vehicle.group);
    this.scene.add(this.vehicle.getDustMesh());
    this.scene.add(this.vehicle.getNitroMesh());

    this.weather = new WeatherSystem(this.terrain);
    this.weather.initScene(this.scene, this.keyLight, this.hemiLight);

    // 7. Clock & Event Handlers
    this.clock = new THREE.Clock();
    this.bindEvents();

    // Start engine loop
    this.isRunning = true;
    this.tick();
  }

  private setupLighting() {
    // Warm key light
    this.keyLight = new THREE.DirectionalLight(0xfff1e6, 1.8);
    this.keyLight.position.set(45, 60, 35);
    this.keyLight.castShadow = !this.isSoftwareGl;

    if (!this.isSoftwareGl) {
      this.keyLight.shadow.mapSize.width = 2048;
      this.keyLight.shadow.mapSize.height = 2048;
      this.keyLight.shadow.camera.near = 10;
      this.keyLight.shadow.camera.far = 160;
      const d = 60;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);

    // Cool Hemisphere fill light (sage sky / dark navy ground)
    this.hemiLight = new THREE.HemisphereLight(PALETTE.cSecondaryAccent, PALETTE.cPrimaryEnv, 0.85);
    this.scene.add(this.hemiLight);

    // Subtle ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambientLight);
  }

  public setVehicleCustomization(model: VehicleModelType, paintHex: string) {
    this.vehicle.setVehicleConfig(model, paintHex);
  }

  public setEnvironmentTheme(theme: EnvironmentTheme) {
    this.scene.background = new THREE.Color(theme.bgNum);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(theme.bgNum);
    }
    if (this.keyLight) {
      this.keyLight.color.setHex(theme.keyLightNum);
    }
    if (this.hemiLight) {
      this.hemiLight.color.setHex(theme.hemiSkyNum);
      this.hemiLight.groundColor.setHex(theme.hemiGroundNum);
    }
    this.terrain.setTheme(theme);
  }

  public getVehicleConfig(): { model: VehicleModelType; paintHex: string } {
    return {
      model: this.vehicle.currentModel,
      paintHex: this.vehicle.currentPaintHex,
    };
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    this.container.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.container.addEventListener('wheel', this.handleWheel, { passive: true });
    this.container.style.cursor = 'grab';
  }

  private isPointerDragging: boolean = false;
  private pointerMovedDist: number = 0;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  private handlePointerDown = (e: PointerEvent) => {
    sound.enableAudio();
    this.isPointerDragging = true;
    this.pointerMovedDist = 0;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.container.style.cursor = 'grabbing';
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isPointerDragging) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.pointerMovedDist += Math.hypot(dx, dy);

    // Pan camera 360 degrees
    this.cameraCtrl.addOrbit(dx * 0.006, -dy * 0.005);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.isPointerDragging) return;
    this.isPointerDragging = false;
    this.container.style.cursor = 'grab';
    this.cameraCtrl.endPan();

    // If it was a click/tap without dragging, inspect target
    if (this.pointerMovedDist < 6) {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.cameraCtrl.camera);
      const intersects = this.raycaster.intersectObjects(this.landmarks.group.children, true);

      if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        for (const item of this.landmarks.interactables) {
          if (item.position.distanceTo(hitPoint) < 7.5) {
            if (item.project) {
              sound.playButtonClick();
              this.callbacks.onInspectProject(item.project);
              this.cameraCtrl.setInspectTarget(item.position);
            }
            break;
          }
        }
      }
    }
  };

  private handleWheel = (e: WheelEvent) => {
    this.cameraCtrl.zoom(e.deltaY * 0.015);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    sound.enableAudio();

    if (this.tour.isActive) {
      this.stopCinematicTour();
      return;
    }

    if (this.autoDrive.isActive && ['w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
      this.stopAutoDrive();
      if (e.key === 'Escape') return;
    }

    if (e.key === 'z' || e.key === 'Z') {
      this.toggleAutoDrive();
      return;
    }

    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'n' || e.key === 'N') {
      if (!e.repeat) {
        this.triggerNitroBoost();
      }
      return;
    }

    if (!this.hasIgnited && ['w', 'ArrowUp', 's', 'ArrowDown'].includes(e.key)) {
      this.hasIgnited = true;
      this.unlockAchievement('First Ignition', 'Fired up the NIERO buggy engine');
    }

    switch (e.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        this.inputState.forward = true;
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        this.inputState.backward = true;
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        this.inputState.left = true;
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        this.inputState.right = true;
        break;
      case ' ':
        this.inputState.brake = true;
        break;
      case 'r':
      case 'R':
        this.resetVehicle();
        break;
      case 'e':
      case 'E':
        if (this.currentNearby) {
          this.interactWithCurrent();
        }
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        this.inputState.forward = false;
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        this.inputState.backward = false;
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        this.inputState.left = false;
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        this.inputState.right = false;
        break;
      case ' ':
        this.inputState.brake = false;
        break;
    }
  };

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.cameraCtrl.resize(width, height);
  };

  public setInput(input: Partial<VehicleInput>) {
    sound.enableAudio();
    Object.assign(this.inputState, input);
    if (!this.hasIgnited && (input.forward || input.backward)) {
      this.hasIgnited = true;
      this.unlockAchievement('First Ignition', 'Fired up the NIERO buggy engine');
    }
  }

  public resetVehicle() {
    this.vehicle.reset(0, -16, 0);
    this.cameraCtrl.setInspectTarget(null);
  }

  public teleportTo(x: number, z: number, angle: number = 0) {
    this.vehicle.reset(x, z, angle);
    this.cameraCtrl.setInspectTarget(null);
  }

  public focusLandmark(targetPos: THREE.Vector3 | null) {
    this.cameraCtrl.setInspectTarget(targetPos);
  }

  public startCinematicTour() {
    this.cameraCtrl.setInspectTarget(null);
    this.tour.startTour((proj) => {
      this.callbacks.onTourUpdate?.(true, proj);
    });
    this.callbacks.onTourUpdate?.(true, null);
  }

  public stopCinematicTour() {
    this.tour.stopTour();
    this.cameraCtrl.setCinematicTarget(null);
    this.callbacks.onTourUpdate?.(false, null);
  }

  public isTourActive(): boolean {
    return this.tour.isActive;
  }

  public startAutoDrive() {
    this.stopCinematicTour();
    this.cameraCtrl.setInspectTarget(null);
    this.autoDrive.startAutoDrive(this.vehicle.position, (proj) => {
      this.callbacks.onTourUpdate?.(true, proj);
      this.callbacks.onAutoDriveUpdate?.(true, proj);
    });
    this.callbacks.onTourUpdate?.(true, this.autoDrive.getCurrentProject());
    this.callbacks.onAutoDriveUpdate?.(true, this.autoDrive.getCurrentProject());
  }

  public stopAutoDrive() {
    this.autoDrive.stopAutoDrive();
    this.callbacks.onTourUpdate?.(false, null);
    this.callbacks.onAutoDriveUpdate?.(false, null);
  }

  public toggleAutoDrive(): boolean {
    if (this.autoDrive.isActive) {
      this.stopAutoDrive();
      return false;
    } else {
      this.startAutoDrive();
      return true;
    }
  }

  public isAutoDriveActive(): boolean {
    return this.autoDrive.isActive;
  }

  public startRace() {
    this.race.startRace();
    this.callbacks.onRaceUpdate?.({ ...this.race.state });
  }

  public stopRace() {
    this.race.stopRace();
    this.callbacks.onRaceUpdate?.({ ...this.race.state });
  }

  public toggleRace(): boolean {
    const res = this.race.toggleRace();
    this.callbacks.onRaceUpdate?.({ ...this.race.state });
    return res;
  }

  public triggerNitroBoost(): boolean {
    const success = this.vehicle.triggerNitroBoost();
    if (success) {
      this.unlockAchievement('Nitro Overdrive', 'Engaged twin-exhaust nitrous acceleration');
    }
    return success;
  }

  public getNitroState(): { isActive: boolean; charge: number } {
    return this.vehicle.getNitroState();
  }

  public setWeather(state: WeatherState) {
    this.weather.setWeather(state);
    this.callbacks.onWeatherUpdate?.(state);
  }

  public cycleWeather(): WeatherState {
    const next = this.weather.cycleNextWeather();
    this.callbacks.onWeatherUpdate?.(next);
    return next;
  }

  public getWeather(): WeatherState {
    return this.weather.currentWeather;
  }

  public interactWithCurrent() {
    if (!this.currentNearby) return;
    sound.playCheckpoint();

    if (this.currentNearby.project) {
      this.visitedProjects.add(this.currentNearby.project.id);
      this.callbacks.onInspectProject(this.currentNearby.project);
      this.cameraCtrl.setInspectTarget(this.currentNearby.position);

      if (this.visitedProjects.size === 4) {
        this.unlockAchievement('Master Explorer', 'Discovered all 4 engineering projects across the world');
      }
    } else if (this.currentNearby.id === 'checkpoint-experience') {
      this.unlockAchievement('Overlook Master', 'Reached the scenic career and experience summit');
    }
  }

  private unlockAchievement(title: string, desc: string) {
    if (this.unlockedAchievements.has(title)) return;
    this.unlockedAchievements.add(title);
    sound.playCollectToken();
    this.callbacks.onAchievementUnlock(title, desc);
  }

  private tick = () => {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update vehicle physics (manual or autonomous driving)
    if (this.autoDrive.isActive) {
      const autoRes = this.autoDrive.update(delta, this.vehicle);
      this.callbacks.onTourUpdate?.(true, autoRes.activeProject);
      this.callbacks.onAutoDriveUpdate?.(true, autoRes.activeProject);
    } else {
      this.vehicle.update(delta, this.inputState, this.environment.colliders);
    }

    // Dynamic Weather system update (rain streaks & light shifts)
    this.weather.update(delta, this.vehicle.position);

    // 2. Speed reporting & achievement
    const speedMph = this.vehicle.getSpeedMph();
    this.callbacks.onSpeedUpdate(speedMph);

    // Dynamic camera boost FOV while nitro is active
    if (this.vehicle.isNitroActive) {
      this.cameraCtrl.triggerBoostFOV();
    }

    // Smooth Nitro UI reporting (~30 Hz or whenever active state toggles)
    const nitroState = this.vehicle.getNitroState();
    if (
      nitroState.isActive !== this.lastNitroActive ||
      elapsedTime - this.lastNitroUpdate > 0.03
    ) {
      this.lastNitroActive = nitroState.isActive;
      this.lastNitroUpdate = elapsedTime;
      this.callbacks.onNitroUpdate?.(nitroState);
    }

    // Player position update for Minimap
    if (this.callbacks.onPlayerPosUpdate && elapsedTime - this.lastPosUpdate > 0.04) {
      this.lastPosUpdate = elapsedTime;
      this.callbacks.onPlayerPosUpdate({
        x: this.vehicle.position.x,
        z: this.vehicle.position.z,
        heading: this.vehicle.heading,
      });
    }
    if (speedMph >= 48 && !this.topSpeedReached) {
      this.topSpeedReached = true;
      this.unlockAchievement('Speed Demon', 'Reached top speed in the NIERO buggy');
    }

    // Drift King achievement (brake while turning at high speed)
    if (this.inputState.brake && (this.inputState.left || this.inputState.right) && speedMph > 20) {
      this.unlockAchievement('Drift Master', 'Executed a power slide drift');
    }

    // 3. Update Camera & Cinematic Tour
    if (this.tour.isActive) {
      const tourTarget = this.tour.update(delta);
      if (tourTarget) {
        this.cameraCtrl.setCinematicTarget(tourTarget);
      }
    } else {
      this.cameraCtrl.setCinematicTarget(null);
    }
    this.cameraCtrl.update(delta, this.vehicle, this.terrain);

    // 4. Update Race & Time-Trial System
    this.race.update(
      elapsedTime,
      this.vehicle.position,
      (lapTime, isBest) => {
        if (isBest) {
          this.unlockAchievement('Lap Record Broken!', `Blistered the circuit in ${lapTime.toFixed(2)}s`);
        } else {
          this.unlockAchievement('Lap Completed', `Finished circuit in ${lapTime.toFixed(2)}s`);
        }
      },
      () => {
        // Boost pad recharge: Refills manual Nitro battery to 100% instead of auto-firing
        this.vehicle.nitroCharge = 1.0;
        this.callbacks.onNitroUpdate?.(this.vehicle.getNitroState());
        this.unlockAchievement('Nitro Recharged!', 'Manual Nitro tank 100% full — Press [Shift] or [N] to Boost');
      }
    );

    if (this.callbacks.onRaceUpdate) {
      this.callbacks.onRaceUpdate({ ...this.race.state });
    }

    // 5. Update Environmental animations (strictly per prompt rules)
    this.terrain.updateWater(elapsedTime);
    this.environment.update(delta);
    this.landmarks.update(elapsedTime, delta);

    // 5. Proximity to Landmarks & Checkpoints
    let foundNearby: InteractiveTarget | null = null;
    for (const item of this.landmarks.interactables) {
      const dist = this.vehicle.position.distanceTo(item.position);
      if (dist < item.interactRadius) {
        foundNearby = item;
        break;
      }
    }

    if (foundNearby !== this.currentNearby) {
      this.currentNearby = foundNearby;
      this.callbacks.onNearbyTarget(this.currentNearby);
      if (foundNearby) {
        sound.playCheckpoint();
      }
    }

    // 6. Token pickups
    for (const [tokenId, group] of this.landmarks.tokenMeshes) {
      if (!this.landmarks.collectedTokenIds.has(tokenId)) {
        const dist = this.vehicle.position.distanceTo(group.position);
        if (dist < 2.2) {
          const collected = this.landmarks.collectToken(tokenId);
          if (collected) {
            sound.playCollectToken();
            const total = this.landmarks.tokenMeshes.size;
            const count = this.landmarks.collectedTokenIds.size;
            this.callbacks.onTokenCollect(collected, count, total);

            if (count === total) {
              this.unlockAchievement('Tech Collector', 'Harvested all 6 core engineering tech tokens');
            }
          }
        }
      }
    }

    // 7. Render
    this.renderer.render(this.scene, this.cameraCtrl.camera);

    // 8. Schedule next frame (Software-GL safe pacing)
    if (this.isSoftwareGl) {
      window.setTimeout(this.tick, 60);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    this.container.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.container.removeEventListener('wheel', this.handleWheel);

    this.terrain.dispose();
    this.environment.dispose();
    this.landmarks.dispose();
    this.vehicle.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
