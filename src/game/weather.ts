/**
 * Dynamic Weather System for NIERO.EXE
 * Cycles dynamically between Sunny, Overcast, and Rainy states in the 3D world.
 * Features realistic 3D rain particles, atmospheric lighting transitions,
 * fog shifting, and soothing procedural rain ambience.
 */

import * as THREE from 'three';
import { TerrainSystem } from './terrain';

export type WeatherState = 'sunny' | 'overcast' | 'rainy';

export interface WeatherConfig {
  id: WeatherState;
  name: string;
  icon: string;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  keyLightColor: number;
  keyLightIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
}

export const WEATHER_CONFIGS: Record<WeatherState, WeatherConfig> = {
  sunny: {
    id: 'sunny',
    name: 'Clear Sun',
    icon: '☀️',
    skyColor: 0x101820,
    fogColor: 0x101820,
    fogNear: 58,
    fogFar: 180,
    keyLightColor: 0xfff4e6,
    keyLightIntensity: 1.85,
    hemiSkyColor: 0x8bae9b,
    hemiGroundColor: 0x17242d,
    hemiIntensity: 0.85,
  },
  overcast: {
    id: 'overcast',
    name: 'Overcast Mist',
    icon: '☁️',
    skyColor: 0x152028,
    fogColor: 0x152028,
    fogNear: 40,
    fogFar: 125,
    keyLightColor: 0xc8d6e0,
    keyLightIntensity: 1.15,
    hemiSkyColor: 0x6e8794,
    hemiGroundColor: 0x141f26,
    hemiIntensity: 0.7,
  },
  rainy: {
    id: 'rainy',
    name: 'Monsoon Rain',
    icon: '🌧️',
    skyColor: 0x0c1318,
    fogColor: 0x0c1318,
    fogNear: 28,
    fogFar: 92,
    keyLightColor: 0x8da2b2,
    keyLightIntensity: 0.75,
    hemiSkyColor: 0x48606d,
    hemiGroundColor: 0x0e171e,
    hemiIntensity: 0.55,
  },
};

export class WeatherSystem {
  public currentWeather: WeatherState = 'sunny';
  public group: THREE.Group;

  // 3D Rain Particles
  private rainCount = 2400;
  private rainGeo!: THREE.BufferGeometry;
  private rainMat!: THREE.PointsMaterial;
  private rainPoints!: THREE.Points;
  private rainPositions!: Float32Array;
  private rainVelocities!: Float32Array;

  // Scene references
  private scene!: THREE.Scene;
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Lagos Sync tracking (Strictly controlled by live Lagos weather; no random cycling)
  private isAutoCycle = false;

  // Rain Audio Synthesizer (Zero asset Web Audio)
  private rainAudioGain: GainNode | null = null;
  private rainAudioSource: AudioBufferSourceNode | null = null;

  constructor(private terrain: TerrainSystem) {
    this.group = new THREE.Group();
    this.buildRainParticles();
  }

  public initScene(
    scene: THREE.Scene,
    keyLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight
  ) {
    this.scene = scene;
    this.keyLight = keyLight;
    this.hemiLight = hemiLight;
    this.group.add(this.rainPoints);
    this.scene.add(this.group);
    this.applyWeather(this.currentWeather, true);
  }

  private buildRainParticles() {
    this.rainPositions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    const range = 65;
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3 + 0] = (Math.random() - 0.5) * range;
      this.rainPositions[i * 3 + 1] = Math.random() * 35;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * range;
      this.rainVelocities[i] = 22 + Math.random() * 14;
    }

    this.rainGeo = new THREE.BufferGeometry();
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMat = new THREE.PointsMaterial({
      color: 0x9bc2d4,
      size: 0.28,
      transparent: true,
      opacity: 0.0, // starts invisible until rainy
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeo, this.rainMat);
    this.rainPoints.visible = false;
  }

  public setWeather(state: WeatherState) {
    this.currentWeather = state;
    this.applyWeather(state, false);
  }

  public cycleNextWeather(): WeatherState {
    const states: WeatherState[] = ['sunny', 'overcast', 'rainy'];
    const nextIdx = (states.indexOf(this.currentWeather) + 1) % states.length;
    this.setWeather(states[nextIdx]);
    return this.currentWeather;
  }

  private applyWeather(state: WeatherState, immediate: boolean) {
    const config = WEATHER_CONFIGS[state];

    if (this.scene) {
      this.scene.background = new THREE.Color(config.skyColor);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(config.fogColor);
        this.scene.fog.near = config.fogNear;
        this.scene.fog.far = config.fogFar;
      }
    }

    if (this.keyLight) {
      this.keyLight.color.setHex(config.keyLightColor);
      this.keyLight.intensity = config.keyLightIntensity;
    }

    if (this.hemiLight) {
      this.hemiLight.color.setHex(config.hemiSkyColor);
      this.hemiLight.groundColor.setHex(config.hemiGroundColor);
      this.hemiLight.intensity = config.hemiIntensity;
    }

    // Toggle Rain Particle System
    if (state === 'rainy') {
      this.rainPoints.visible = true;
      this.rainMat.opacity = 0.72;
      this.startRainAudio();
    } else {
      this.rainPoints.visible = false;
      this.rainMat.opacity = 0.0;
      this.stopRainAudio();
    }
  }

  public update(delta: number, vehiclePos: THREE.Vector3) {
    // 1. Weather is strictly synced with real-time Lagos weather from Open-Meteo
    // (Random auto cycling completely removed per user request)

    // 2. Animate Rain Particles centered around player's vehicle when raining in Lagos
    if (this.currentWeather === 'rainy') {
      const posAttr = this.rainGeo.getAttribute('position') as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      const range = 70;

      for (let i = 0; i < this.rainCount; i++) {
        // Fall downwards with slight wind drift along X
        array[i * 3 + 1] -= this.rainVelocities[i] * delta;
        array[i * 3 + 0] -= delta * 2.8;

        // Ground collision reset
        const currentY = array[i * 3 + 1];
        if (currentY <= 0) {
          array[i * 3 + 0] = vehiclePos.x + (Math.random() - 0.5) * range;
          array[i * 3 + 1] = 30 + Math.random() * 8;
          array[i * 3 + 2] = vehiclePos.z + (Math.random() - 0.5) * range;
        }

        // Keep centered within range of vehicle
        if (Math.abs(array[i * 3 + 0] - vehiclePos.x) > range / 2) {
          array[i * 3 + 0] = vehiclePos.x + (Math.random() - 0.5) * range;
        }
        if (Math.abs(array[i * 3 + 2] - vehiclePos.z) > range / 2) {
          array[i * 3 + 2] = vehiclePos.z + (Math.random() - 0.5) * range;
        }
      }

      posAttr.needsUpdate = true;
    }
  }

  // --- Rain Ambient Audio Generator ---
  private startRainAudio() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      // Generate pink/white noise buffer for rainfall
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0,
        b1 = 0,
        b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        output[i] = (b0 + b1 + b2) * 0.04;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      this.rainAudioSource = whiteNoise;
      this.rainAudioGain = gain;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private stopRainAudio() {
    if (this.rainAudioSource) {
      try {
        this.rainAudioSource.stop();
        this.rainAudioSource.disconnect();
      } catch {}
      this.rainAudioSource = null;
    }
  }

  public dispose() {
    this.stopRainAudio();
    if (this.rainGeo) this.rainGeo.dispose();
    if (this.rainMat) this.rainMat.dispose();
  }
}
