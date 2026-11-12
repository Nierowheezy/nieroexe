/**
 * Time-Trial Race & Nitro Boost Pad System for NIERO.EXE
 * Creates holographic checkpoint gates along the loop road and road-embedded boost pads.
 * Tracks lap times, splits, and personal best records.
 */

import * as THREE from 'three';
import { PALETTE } from './constants';
import { TerrainSystem } from './terrain';
import { sound } from './audio';

export interface CheckpointGate {
  id: number;
  x: number;
  z: number;
  angle: number;
  radius: number;
  isStartFinish: boolean;
}

export interface BoostPad {
  id: number;
  x: number;
  z: number;
  angle: number;
  mesh: THREE.Group;
}

export interface RaceState {
  isActive: boolean;
  isRaceEnabled: boolean;
  currentCheckpoint: number;
  totalCheckpoints: number;
  startTime: number;
  currentLapTime: number;
  bestLapTime: number | null;
  lastLapTime: number | null;
  isNewBest: boolean;
  completedLaps: number;
}

export class RaceSystem {
  public group: THREE.Group;
  public checkpoints: CheckpointGate[] = [];
  public boostPads: BoostPad[] = [];

  // 3D Visual Meshes
  private gateMeshes: THREE.Group[] = [];
  private boostMeshes: THREE.Group[] = [];
  private gateLights: THREE.MeshBasicMaterial[] = [];

  // Race Tracking
  public state: RaceState = {
    isActive: false,
    isRaceEnabled: false, // Optional by default!
    currentCheckpoint: 0,
    totalCheckpoints: 6,
    startTime: 0,
    currentLapTime: 0,
    bestLapTime: null,
    lastLapTime: null,
    isNewBest: false,
    completedLaps: 0,
  };

  private lastBoostTrigger: number = 0;

  constructor(private terrain: TerrainSystem) {
    this.group = new THREE.Group();

    // Load persisted best lap time
    const savedBest = localStorage.getItem('niero_best_lap');
    if (savedBest) {
      this.state.bestLapTime = parseFloat(savedBest);
    }

    this.setupCheckpoints();
    this.setupBoostPads();
    this.buildGates();
    this.buildBoostPads();
  }

  private setupCheckpoints() {
    // 6 strategic checkpoints around the circuit road
    this.checkpoints = [
      { id: 0, x: 0, z: -16, angle: 0, radius: 4.5, isStartFinish: true },
      { id: 1, x: 26, z: -24, angle: Math.PI / 4, radius: 5.0, isStartFinish: false },
      { id: 2, x: 36, z: 4, angle: Math.PI / 2, radius: 5.0, isStartFinish: false },
      { id: 3, x: 0, z: 28, angle: Math.PI, radius: 5.0, isStartFinish: false },
      { id: 4, x: -36, z: 4, angle: -Math.PI / 2, radius: 5.0, isStartFinish: false },
      { id: 5, x: -24, z: -24, angle: -Math.PI / 4, radius: 5.0, isStartFinish: false },
    ];
    this.state.totalCheckpoints = this.checkpoints.length;
  }

  private setupBoostPads() {
    // 4 glowing nitro boost pads on straightaways
    const padLocations = [
      { id: 0, x: 0, z: -6, angle: 0 },
      { id: 1, x: 34, z: -10, angle: Math.PI / 3 },
      { id: 2, x: 0, z: 12, angle: Math.PI },
      { id: 3, x: -34, z: -10, angle: -Math.PI / 3 },
    ];

    padLocations.forEach(loc => {
      this.boostPads.push({
        id: loc.id,
        x: loc.x,
        z: loc.z,
        angle: loc.angle,
        mesh: new THREE.Group(),
      });
    });
  }

  private buildGates() {
    this.checkpoints.forEach((cp, idx) => {
      const gateGroup = new THREE.Group();
      const y = this.terrain.getVehicleGroundHeight(cp.x, cp.z);
      gateGroup.position.set(cp.x, y, cp.z);
      gateGroup.rotation.y = cp.angle;

      const isSF = cp.isStartFinish;
      const width = isSF ? 9.0 : 8.0;
      const height = isSF ? 4.8 : 4.0;

      // Gate Posts
      const postGeo = new THREE.BoxGeometry(0.4, height, 0.4);
      const postMat = new THREE.MeshStandardMaterial({
        color: PALETTE.cPrimaryEnv,
        roughness: 0.5,
        metalness: 0.6,
      });
      const postL = new THREE.Mesh(postGeo, postMat);
      postL.position.set(-width / 2, height / 2, 0);
      const postR = new THREE.Mesh(postGeo, postMat);
      postR.position.set(width / 2, height / 2, 0);
      gateGroup.add(postL, postR);

      // Top Crossbar
      const barGeo = new THREE.BoxGeometry(width + 0.6, 0.45, 0.6);
      const bar = new THREE.Mesh(barGeo, postMat);
      bar.position.set(0, height, 0);
      gateGroup.add(bar);

      // Holographic Neon Energy Beam
      const beamGeo = new THREE.PlaneGeometry(width - 0.2, 0.2);
      const beamColor = isSF ? PALETTE.cPrimaryAccent : PALETTE.cSecondaryAccent;
      const beamMat = new THREE.MeshBasicMaterial({
        color: beamColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, height - 0.25, 0);
      gateGroup.add(beam);
      this.gateLights.push(beamMat);

      // Start/Finish Arch Banner Sprite
      if (isSF) {
        const sprite = this.createGateBannerSprite('START / FINISH LINE', true);
        sprite.position.set(0, height + 1.1, 0);
        gateGroup.add(sprite);
      } else {
        const sprite = this.createGateBannerSprite(`CHECKPOINT ${idx}/${this.checkpoints.length - 1}`, false);
        sprite.position.set(0, height + 0.8, 0);
        gateGroup.add(sprite);
      }

      this.gateMeshes.push(gateGroup);
      this.group.add(gateGroup);
    });
  }

  private buildBoostPads() {
    this.boostPads.forEach(pad => {
      const padGroup = pad.mesh;
      const y = this.terrain.getVehicleGroundHeight(pad.x, pad.z) + 0.05;
      padGroup.position.set(pad.x, y, pad.z);
      padGroup.rotation.y = pad.angle;

      // Base Pad Slab
      const baseGeo = new THREE.PlaneGeometry(3.6, 6.0);
      baseGeo.rotateX(-Math.PI / 2);
      const baseMat = new THREE.MeshStandardMaterial({
        color: PALETTE.cSecondarySurfaces,
        roughness: 0.8,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      padGroup.add(base);

      // Glowing Nitro Chevrons
      for (let i = -1.6; i <= 1.6; i += 1.4) {
        const chevronGeo = new THREE.RingGeometry(0.7, 1.1, 3, 1, 0, Math.PI);
        chevronGeo.rotateX(-Math.PI / 2);
        const chevronMat = new THREE.MeshBasicMaterial({
          color: PALETTE.cPrimaryAccent,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const chevron = new THREE.Mesh(chevronGeo, chevronMat);
        chevron.position.set(0, 0.04, i);
        chevron.rotation.y = Math.PI;
        padGroup.add(chevron);
      }

      this.boostMeshes.push(padGroup);
      this.group.add(padGroup);
    });
  }

  private createGateBannerSprite(text: string, isOrange: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(16, 24, 32, 0.95)';
    ctx.strokeStyle = isOrange ? '#E87545' : '#8BAE9B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(6, 6, 372, 68, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = isOrange ? '#E87545' : '#8BAE9B';
    ctx.textAlign = 'center';
    ctx.fillText(text, 192, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.8, 1.0, 1);
    return sprite;
  }

  public startRace() {
    this.state.isRaceEnabled = true;
    this.state.isActive = true;
    this.state.currentCheckpoint = 1;
    this.state.startTime = performance.now();
    this.state.isNewBest = false;
    sound.playCheckpoint();
  }

  public stopRace() {
    this.state.isRaceEnabled = false;
    this.state.isActive = false;
    this.state.currentCheckpoint = 0;
  }

  public toggleRace(): boolean {
    if (this.state.isRaceEnabled || this.state.isActive) {
      this.stopRace();
      return false;
    } else {
      this.startRace();
      return true;
    }
  }

  /**
   * Updates race tracking and checks gate passes
   */
  public update(
    time: number,
    vehiclePos: THREE.Vector3,
    onLapComplete?: (lapTime: number, isBest: boolean) => void,
    onBoostTriggered?: () => void
  ) {
    if (this.state.isActive) {
      this.state.currentLapTime = (performance.now() - this.state.startTime) / 1000;
    }

    // Check Gate Proximity (Only active when user has explicitly enabled race)
    if (this.state.isRaceEnabled) {
      this.checkpoints.forEach((cp, idx) => {
        const dist = Math.hypot(vehiclePos.x - cp.x, vehiclePos.z - cp.z);
        if (dist < cp.radius) {
          if (!this.state.isActive && cp.isStartFinish) {
            // Start race
            this.state.isActive = true;
            this.state.currentCheckpoint = 1;
            this.state.startTime = performance.now();
            this.state.isNewBest = false;
            sound.playCheckpoint();
          } else if (this.state.isActive) {
            if (idx === this.state.currentCheckpoint) {
            // Reached next sequential checkpoint
            if (cp.isStartFinish) {
              // Lap Finished!
              const lapTime = (performance.now() - this.state.startTime) / 1000;
              this.state.lastLapTime = lapTime;
              this.state.completedLaps++;

              let isBest = false;
              if (!this.state.bestLapTime || lapTime < this.state.bestLapTime) {
                this.state.bestLapTime = lapTime;
                this.state.isNewBest = true;
                isBest = true;
                localStorage.setItem('niero_best_lap', lapTime.toFixed(2));
              }

              sound.playCheckpoint();
              onLapComplete?.(lapTime, isBest);

              // Reset for next lap
              this.state.startTime = performance.now();
              this.state.currentCheckpoint = 1;
            } else {
              // Checkpoint pass
              this.state.currentCheckpoint++;
              sound.playButtonClick();
            }
          }
        }
      }
    });
  }

    // Check Boost Pad Proximity
    if (time - this.lastBoostTrigger > 2.0) {
      for (const pad of this.boostPads) {
        const dist = Math.hypot(vehiclePos.x - pad.x, vehiclePos.z - pad.z);
        if (dist < 2.5) {
          this.lastBoostTrigger = time;
          sound.playCollectToken();
          onBoostTriggered?.();
          break;
        }
      }
    }

    // Animate Gate Neon Glows
    this.gateLights.forEach((mat, idx) => {
      const isNext = this.state.isActive && idx === this.state.currentCheckpoint;
      const pulse = isNext ? 0.7 + Math.sin(time * 6) * 0.3 : 0.85;
      mat.opacity = pulse;
    });
  }

  public dispose() {
    this.group.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
