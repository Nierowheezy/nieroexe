/**
 * Game constants and strict color palette for NIERO.EXE
 * All hex codes and Three.js numbers conform strictly to the specified palette:
 * - Background: #101820
 * - Primary environment: #17242D
 * - Secondary surfaces: #24343D
 * - Primary accent: #E87545
 * - Secondary accent: #8BAE9B
 * - Main text: #F2F0E9
 * - Muted text: #A4B0B5
 */

export const PALETTE = {
  // Hex strings
  bg: '#101820',
  primaryEnv: '#17242D',
  secondarySurfaces: '#24343D',
  primaryAccent: '#E87545',
  secondaryAccent: '#8BAE9B',
  mainText: '#F2F0E9',
  mutedText: '#A4B0B5',

  // Numeric for Three.js
  cBg: 0x101820,
  cPrimaryEnv: 0x17242D,
  cSecondarySurfaces: 0x24343D,
  cPrimaryAccent: 0xE87545,
  cSecondaryAccent: 0x8BAE9B,
  cMainText: 0xF2F0E9,
  cMutedText: 0xA4B0B5,

  // Environmental variations strictly derived from the base palette
  cRoad: 0x152028,
  cRoadBorder: 0x24343D,
  cRoadMarking: 0x8BAE9B,
  cWater: 0x111c24,
  cWaterShallow: 0x172a33,
  cBridgeWood: 0x24343D,
  cRock: 0x203038,
  cRockDark: 0x17242D,
  cTreeTrunk: 0x1b2830,
  cFoliage: 0x8BAE9B,
  cFoliageDark: 0x5a7868,
  cBuggyBody: 0xE87545,
  cBuggyTrim: 0x17242D,
  cBuggyMetal: 0x24343D,
  cBuggyWheel: 0x101820,
  cBuggyRim: 0xE87545,
  cHeadlight: 0xF2F0E9,
  cTaillight: 0xE87545,
} as const;

export type VehicleModelType = 'buggy' | 'roadster' | 'rover' | 'muscle';

export interface VehicleOption {
  id: VehicleModelType;
  name: string;
  category: string;
  description: string;
  speed: string;
  handling: string;
}

export const VEHICLE_MODELS: VehicleOption[] = [
  {
    id: 'buggy',
    name: 'Dune Buggy',
    category: 'Off-Road Spec',
    description: 'Lightweight tubular roll cage, raised suspension, high-downforce rear wing.',
    speed: '24 MPH',
    handling: 'Agile & Responsive',
  },
  {
    id: 'roadster',
    name: 'Cyber Roadster',
    category: 'Aero Hypercar',
    description: 'Ultra-low wedge body, aerodynamic ground diffusers, race canopy.',
    speed: '28 MPH',
    handling: 'High Grip & Precision',
  },
  {
    id: 'rover',
    name: 'Lunar Explorer',
    category: 'Heavy Tech Rover',
    description: 'Reinforced dual chassis, roof searchlights, heavy-duty utility gear bed.',
    speed: '22 MPH',
    handling: 'Maximum Stability',
  },
  {
    id: 'muscle',
    name: 'Turbo Cruiser',
    category: 'Retro Fastback',
    description: 'Power-dome air blower scoop, twin chrome exhaust manifolds, wide rear stance.',
    speed: '26 MPH',
    handling: 'Raw Drift Output',
  },
];

export interface PaintColorOption {
  id: string;
  name: string;
  hex: string;
  num: number;
}

export const PAINT_COLORS: PaintColorOption[] = [
  { id: 'orange', name: 'Hyper Orange', hex: '#E87545', num: 0xE87545 },
  { id: 'sage', name: 'Sage Green', hex: '#8BAE9B', num: 0x8BAE9B },
  { id: 'cyan', name: 'Cyber Azure', hex: '#00E5FF', num: 0x00E5FF },
  { id: 'crimson', name: 'Solar Crimson', hex: '#FF3366', num: 0xFF3366 },
  { id: 'amber', name: 'Electric Gold', hex: '#F59E0B', num: 0xF59E0B },
  { id: 'obsidian', name: 'Matte Stealth', hex: '#2A2E33', num: 0x2A2E33 },
  { id: 'alpine', name: 'Alpine Titanium', hex: '#F2F0E9', num: 0xF2F0E9 },
  { id: 'lime', name: 'Neon Lime', hex: '#39FF14', num: 0x39FF14 },
];

export interface EnvironmentTheme {
  id: string;
  name: string;
  tagline: string;
  bgHex: string;
  bgNum: number;
  primaryEnvHex: string;
  primaryEnvNum: number;
  secondarySurfacesHex: string;
  secondarySurfacesNum: number;
  waterHex: string;
  waterNum: number;
  keyLightNum: number;
  hemiSkyNum: number;
  hemiGroundNum: number;
}

export const ENVIRONMENT_THEMES: EnvironmentTheme[] = [
  {
    id: 'twilight',
    name: 'Obsidian Twilight',
    tagline: 'Default dark-mode world with sage and warm amber highlights',
    bgHex: '#101820',
    bgNum: 0x101820,
    primaryEnvHex: '#17242D',
    primaryEnvNum: 0x17242D,
    secondarySurfacesHex: '#24343D',
    secondarySurfacesNum: 0x24343D,
    waterHex: '#111c24',
    waterNum: 0x111c24,
    keyLightNum: 0xfff1e6,
    hemiSkyNum: 0x8BAE9B,
    hemiGroundNum: 0x17242D,
  },
  {
    id: 'sahara',
    name: 'Sahara Sunset',
    tagline: 'Dusk red planet landscape with warm terracotta rock terraces',
    bgHex: '#221210',
    bgNum: 0x221210,
    primaryEnvHex: '#361C17',
    primaryEnvNum: 0x361C17,
    secondarySurfacesHex: '#4C2822',
    secondarySurfacesNum: 0x4C2822,
    waterHex: '#1A2228',
    waterNum: 0x1A2228,
    keyLightNum: 0xFFA756,
    hemiSkyNum: 0xE87545,
    hemiGroundNum: 0x241412,
  },
  {
    id: 'emerald',
    name: 'Emerald Aurora',
    tagline: 'Lush sci-fi highlands bathed in arctic jade and mint glow',
    bgHex: '#0C1814',
    bgNum: 0x0C1814,
    primaryEnvHex: '#132820',
    primaryEnvNum: 0x132820,
    secondarySurfacesHex: '#1C3A30',
    secondarySurfacesNum: 0x1C3A30,
    waterHex: '#0A201E',
    waterNum: 0x0A201E,
    keyLightNum: 0xA7F3D0,
    hemiSkyNum: 0x8BAE9B,
    hemiGroundNum: 0x0C1814,
  },
  {
    id: 'oceanic',
    name: 'Deep Oceanic',
    tagline: 'Deep midnight nautical depths with electric cyan reflections',
    bgHex: '#0A111F',
    bgNum: 0x0A111F,
    primaryEnvHex: '#111C33',
    primaryEnvNum: 0x111C33,
    secondarySurfacesHex: '#1A2C4D',
    secondarySurfacesNum: 0x1A2C4D,
    waterHex: '#081329',
    waterNum: 0x081329,
    keyLightNum: 0x93C5FD,
    hemiSkyNum: 0x60A5FA,
    hemiGroundNum: 0x0A111F,
  },
  {
    id: 'synthwave',
    name: 'Synthwave Noir',
    tagline: 'High-contrast cyberpunk purple dusk with neon skyline energy',
    bgHex: '#150A22',
    bgNum: 0x150A22,
    primaryEnvHex: '#211035',
    primaryEnvNum: 0x211035,
    secondarySurfacesHex: '#351952',
    secondarySurfacesNum: 0x351952,
    waterHex: '#200936',
    waterNum: 0x200936,
    keyLightNum: 0xFF007F,
    hemiSkyNum: 0x00F0FF,
    hemiGroundNum: 0x150A22,
  },
];

export const WORLD_CONFIG = {
  size: 160, // Total terrain diameter
  playableRadius: 72,
  riverZ: 0,
  bridgeWidth: 10,
  bridgeLength: 24,
  bridgeElevation: 1.8,
  spawnPoint: { x: 0, z: -16, angle: 0 },
};

export const VEHICLE_CONFIG = {
  maxSpeed: 24,
  reverseMaxSpeed: 10,
  acceleration: 28,
  brakeDeceleration: 42,
  naturalFriction: 14,
  turnSpeed: 2.8,
  maxSteerAngle: 0.52, // ~30 deg
  steerReturnSpeed: 6.0,
  wheelRadius: 0.55,
  wheelBase: 2.2,
  trackWidth: 1.8,
  driftFactor: 0.92,
  suspensionStiffness: 15,
};

export const CAMERA_CONFIG = {
  distance: 14,
  height: 9,
  fov: 48,
  lookAheadDist: 4.5,
  lookAheadHeight: 1.2,
  damping: 4.5,
};
