/**
 * Procedural Web Audio Sound Synthesizer for NIERO.EXE
 * Features independent audio mixing channels:
 * - Engine noise (low-end rumble + variable RPM oscillator)
 * - Aerodynamic Wind noise (pink noise bandpass filter scaling with speed)
 * - Coastal & City Ambient sound (warm drone + soft surf atmosphere)
 * - Nitro Boost turbo propulsion blast
 * Zero external mp3/wav files required (100% Web Audio API).
 */

export interface AudioSettingsState {
  masterVolume: number;
  engineVolume: number;
  windVolume: number;
  ambienceVolume: number;
  isMuted: boolean;
  engineMuted: boolean;
  windMuted: boolean;
  ambienceMuted: boolean;
}

class SoundSystem {
  private ctx: AudioContext | null = null;
  private userStarted: boolean = false;

  // Master
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.85;

  // 1. Engine Channel
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private engineVolume: number = 0.8;
  private engineMuted: boolean = false;
  private isEngineRunning: boolean = false;

  // 2. Wind Channel (High-speed airflow whoosh)
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windVolume: number = 0.75;
  private windMuted: boolean = false;
  private isWindRunning: boolean = false;

  // 3. Ambience Channel (Coastal breeze & city urban drone)
  private ambienceOsc1: OscillatorNode | null = null;
  private ambienceOsc2: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceVolume: number = 0.6;
  private ambienceMuted: boolean = false;
  private isAmbienceRunning: boolean = false;

  constructor() {
    // Load persisted preferences
    try {
      const savedMaster = localStorage.getItem('niero_audio_master');
      if (savedMaster !== null) this.masterVolume = parseFloat(savedMaster);

      const savedEngine = localStorage.getItem('niero_audio_engine');
      if (savedEngine !== null) this.engineVolume = parseFloat(savedEngine);

      const savedWind = localStorage.getItem('niero_audio_wind');
      if (savedWind !== null) this.windVolume = parseFloat(savedWind);

      const savedAmbience = localStorage.getItem('niero_audio_ambience');
      if (savedAmbience !== null) this.ambienceVolume = parseFloat(savedAmbience);

      const savedMute = localStorage.getItem('niero_audio_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';

      const savedEngineMute = localStorage.getItem('niero_audio_engine_mute');
      if (savedEngineMute !== null) this.engineMuted = savedEngineMute === 'true';

      const savedWindMute = localStorage.getItem('niero_audio_wind_mute');
      if (savedWindMute !== null) this.windMuted = savedWindMute === 'true';

      const savedAmbienceMute = localStorage.getItem('niero_audio_ambience_mute');
      if (savedAmbienceMute !== null) this.ambienceMuted = savedAmbienceMute === 'true';
    } catch {}
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
          this.isMuted ? 0 : this.masterVolume,
          this.ctx.currentTime
        );
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudio() {
    this.userStarted = true;
    this.initCtx();
    this.startEngine();
    this.startWind();
    this.startAmbience();
  }

  // --- Volume and Mute Controls ---

  public setVolume(channel: 'master' | 'engine' | 'wind' | 'ambience', value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.initCtx();
    const now = this.ctx?.currentTime ?? 0;

    switch (channel) {
      case 'master':
        this.masterVolume = clamped;
        localStorage.setItem('niero_audio_master', String(clamped));
        if (this.masterGain && this.ctx && !this.isMuted) {
          this.masterGain.gain.setTargetAtTime(clamped, now, 0.05);
        }
        break;
      case 'engine':
        this.engineVolume = clamped;
        localStorage.setItem('niero_audio_engine', String(clamped));
        if (this.engineGain && this.ctx && !this.engineMuted && !this.isMuted) {
          this.engineGain.gain.setTargetAtTime(clamped * 0.08, now, 0.05);
        }
        break;
      case 'wind':
        this.windVolume = clamped;
        localStorage.setItem('niero_audio_wind', String(clamped));
        if (this.windGain && this.ctx && !this.windMuted && !this.isMuted) {
          this.windGain.gain.setTargetAtTime(clamped * 0.06, now, 0.05);
        }
        break;
      case 'ambience':
        this.ambienceVolume = clamped;
        localStorage.setItem('niero_audio_ambience', String(clamped));
        if (this.ambienceGain && this.ctx && !this.ambienceMuted && !this.isMuted) {
          this.ambienceGain.gain.setTargetAtTime(clamped * 0.04, now, 0.05);
        }
        break;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('niero_audio_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
    return this.isMuted;
  }

  public toggleChannelMute(channel: 'engine' | 'wind' | 'ambience'): boolean {
    this.initCtx();
    const now = this.ctx?.currentTime ?? 0;

    switch (channel) {
      case 'engine':
        this.engineMuted = !this.engineMuted;
        localStorage.setItem('niero_audio_engine_mute', String(this.engineMuted));
        if (this.engineGain && this.ctx) {
          this.engineGain.gain.setTargetAtTime(
            this.engineMuted || this.isMuted ? 0 : this.engineVolume * 0.08,
            now,
            0.05
          );
        }
        return this.engineMuted;
      case 'wind':
        this.windMuted = !this.windMuted;
        localStorage.setItem('niero_audio_wind_mute', String(this.windMuted));
        if (this.windGain && this.ctx) {
          this.windGain.gain.setTargetAtTime(
            this.windMuted || this.isMuted ? 0 : this.windVolume * 0.06,
            now,
            0.05
          );
        }
        return this.windMuted;
      case 'ambience':
        this.ambienceMuted = !this.ambienceMuted;
        localStorage.setItem('niero_audio_ambience_mute', String(this.ambienceMuted));
        if (this.ambienceGain && this.ctx) {
          this.ambienceGain.gain.setTargetAtTime(
            this.ambienceMuted || this.isMuted ? 0 : this.ambienceVolume * 0.04,
            now,
            0.05
          );
        }
        return this.ambienceMuted;
    }
  }

  public getAudioSettings(): AudioSettingsState {
    return {
      masterVolume: this.masterVolume,
      engineVolume: this.engineVolume,
      windVolume: this.windVolume,
      ambienceVolume: this.ambienceVolume,
      isMuted: this.isMuted,
      engineMuted: this.engineMuted,
      windMuted: this.windMuted,
      ambienceMuted: this.ambienceMuted,
    };
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- 1. Procedural Engine Synthesizer ---

  public startEngine() {
    if (this.isEngineRunning || !this.userStarted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, this.ctx.currentTime);

      const initGain = this.isMuted || this.engineMuted ? 0 : this.engineVolume * 0.05;
      gain.gain.setValueAtTime(initGain, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.engineOsc = osc;
      this.engineFilter = filter;
      this.engineGain = gain;
      this.isEngineRunning = true;
    } catch {}
  }

  public updateEngine(speedNormalized: number, isAccelerating: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    if (this.isMuted || this.engineMuted) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      return;
    }

    const baseFreq = 42;
    const targetFreq = baseFreq + speedNormalized * 110 + (isAccelerating ? 24 : 0);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);

    const baseGain = this.engineVolume * 0.04;
    const targetGain = baseGain + speedNormalized * (this.engineVolume * 0.05) + (isAccelerating ? 0.02 : 0);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  // --- 2. Procedural Wind Aerodynamic Synthesizer ---

  public startWind() {
    if (this.isWindRunning || !this.userStarted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    try {
      // 2 seconds looping pink noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      source.start();
      this.windSource = source;
      this.windFilter = filter;
      this.windGain = gain;
      this.isWindRunning = true;
    } catch {}
  }

  public updateWind(speedNormalized: number) {
    if (!this.ctx || !this.windFilter || !this.windGain) return;
    if (this.isMuted || this.windMuted || speedNormalized < 0.05) {
      this.windGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }

    // Filter frequency rises from 250Hz to 1600Hz as car drives faster
    const targetFreq = 260 + speedNormalized * 1400;
    this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

    // Wind volume rises progressively with speed
    const targetGain = Math.pow(speedNormalized, 1.6) * (this.windVolume * 0.08);
    this.windGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  // --- 3. Procedural City & Coastal Ambience Synthesizer ---

  public startAmbience() {
    if (this.isAmbienceRunning || !this.userStarted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1 harmonic drone

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110.2, this.ctx.currentTime); // A2 slight detune

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      const targetGain = this.isMuted || this.ambienceMuted ? 0 : this.ambienceVolume * 0.035;
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start();
      osc2.start();
      this.ambienceOsc1 = osc1;
      this.ambienceOsc2 = osc2;
      this.ambienceGain = gain;
      this.isAmbienceRunning = true;
    } catch {}
  }

  // --- 4. Nitro Boost Turbo Ignition SFX ---

  public playNitro() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.initCtx();
    const now = this.ctx.currentTime;

    try {
      // 1. Ignition punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

      oscGain.gain.setValueAtTime(0.12, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.42);

      // 2. High-energy rushing turbo blast
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.6), this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(400, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.62);
    } catch {}
  }

  // --- UI Sound Effects ---

  public playCollectToken() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.initCtx();
    const now = this.ctx.currentTime;

    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.36);
    });
  }

  public playCheckpoint() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.initCtx();
    const now = this.ctx.currentTime;

    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach(freq => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.62);
    });
  }

  public playBrake() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.initCtx();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playButtonClick() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.initCtx();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // --- 5. Bruno-Inspired Playground SFX (Car Horn, Prop Collision, Bowling Strike, Synth Pads, Landing) ---

  public playHorn() {
    this.enableAudio();
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      // Classic dual-tone expressive buggy horn (F4 + A4)
      const freqs = [349.23, 440.0];
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      const masterHornGain = this.ctx.createGain();
      masterHornGain.gain.setValueAtTime(0.001, now);
      masterHornGain.gain.linearRampToValueAtTime(0.09, now + 0.02);
      masterHornGain.gain.setValueAtTime(0.085, now + 0.18);
      masterHornGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      filter.connect(masterHornGain);
      masterHornGain.connect(this.masterGain);

      freqs.forEach(freq => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch {}
  }

  public playPropHit(intensity: number = 0.6) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0.15, Math.min(1, intensity));

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 180 + Math.random() * 140;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.11);

      gain.gain.setValueAtTime(0.09 * clamped, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  public playBowlingStrike() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      // Cascading pin clatter
      for (let i = 0; i < 6; i++) {
        const delay = i * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420 + Math.random() * 320, now + delay);
        osc.frequency.exponentialRampToValueAtTime(110, now + delay + 0.1);

        gain.gain.setValueAtTime(0.07, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.13);
      }
      this.playCollectToken();
    } catch {}
  }

  public playSynthNote(freq: number) {
    this.enableAudio();
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch {}
  }

  public playLandingThud(strength: number = 0.7) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0.2, Math.min(1, strength));

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.18);

      gain.gain.setValueAtTime(0.13 * clamped, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {}
  }
}

export const sound = new SoundSystem();
