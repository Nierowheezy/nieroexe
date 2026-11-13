/**
 * Bruno Simon-Inspired Interactive 3D Playground System for NIERO.EXE
 * Includes:
 * - Smashable Giant 3D "NIERO" Block Letters with rigid-body-like collision & tumble physics
 * - Interactive 3D Bowling Alley (giant ball + 10 LatheGeometry pins + strike detection + reset pad)
 * - Soccer Pitch with 3D Goal & Giant Physics Ball + Goal celebration
 * - 3 Stunt Jump Ramps (including River Jump Ramp) with analytical surface heights
 * - 6 Musical Synth Floor Pads (C-Major Pentatonic scale)
 * - Interactive 3D Social & Portfolio Pedestals (GitHub, LinkedIn, Resume, Contact)
 * - Scatterable Traffic Cones, Tech Crates, Wobbling Arrow Signposts, & Painted Ground Stencils
 */

import * as THREE from 'three';
import { PALETTE } from './constants';
import { TerrainSystem } from './terrain';
import { sound } from './audio';
import { DEVELOPER_PROFILE } from '../data/portfolioData';

export type SocialTileAction = 'github' | 'linkedin' | 'resume' | 'contact' | 'reset_props';

export interface PlaygroundInteractable {
  id: string;
  title: string;
  subtitle: string;
  action: SocialTileAction;
  url?: string;
  position: THREE.Vector3;
  interactRadius: number;
}

export interface RampZone {
  id: string;
  x: number;
  z: number;
  angle: number; // Direction ramp ascends toward (+Z local)
  width: number;
  length: number;
  height: number;
  cosA: number;
  sinA: number;
}

interface DynamicProp {
  id: string;
  kind: 'letter' | 'pin' | 'bowlingBall' | 'soccerBall' | 'cone' | 'crate';
  mesh: THREE.Object3D;
  homePos: THREE.Vector3;
  homeRot: THREE.Euler;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  radius: number;
  halfHeight: number;
  mass: number;
  restitution: number;
  friction: number;
  knocked?: boolean;
}

interface SynthPad {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  x: number;
  z: number;
  freq: number;
  baseY: number;
  cooldown: number;
  litTimer: number;
}

interface WobbleSign {
  group: THREE.Group;
  x: number;
  z: number;
  tiltX: number;
  tiltZ: number;
  velX: number;
  velZ: number;
}

export interface PlaygroundCallbacks {
  onBowlingStrike?: () => void;
  onBowlingProgress?: (knockedCount: number) => void;
  onSoccerGoal?: () => void;
  onPropsReset?: () => void;
  onFirstPropSmash?: () => void;
}

// Reusable scratch vectors for zero GC pressure in tick()
const _tmpVec = new THREE.Vector3();

export class PlaygroundSystem {
  public group: THREE.Group;
  public ramps: RampZone[] = [];
  public interactables: PlaygroundInteractable[] = [];

  private props: DynamicProp[] = [];
  private synthPads: SynthPad[] = [];
  private wobbleSigns: WobbleSign[] = [];
  private resetPadMesh!: THREE.Mesh;

  private bowlingStrikeAwarded: boolean = false;
  private bowlingResetTimer: number = 0;
  private soccerGoalCooldown: number = 0;
  private resetPadCooldown: number = 0;
  private hasSmashedProp: boolean = false;

  private soccerGoalPos = new THREE.Vector3(-20, 0.1, 30.2);

  constructor(private terrain: TerrainSystem, private callbacks: PlaygroundCallbacks = {}) {
    this.group = new THREE.Group();

    this.buildPaintedFloorStencils();
    this.buildSmashableTitleLetters();
    this.buildBowlingAlley();
    this.buildSoccerPitch();
    this.buildStuntRamps();
    this.buildSynthFloorPads();
    this.buildSocialTiles();
    this.buildScatterableConesAndCrates();
    this.buildWobbleSignposts();
  }

  // ---------------------------------------------------------------------------
  // 1. PAINTED 3D FLOOR STENCILS (Bruno Simon's signature painted ground copy)
  // ---------------------------------------------------------------------------
  private buildPaintedFloorStencils() {
    // Main Plaza Driving Instructions Stencil right below Start Plaza
    this.createGroundDecal(
      0,
      -14.8,
      9.6,
      2.6,
      0,
      'NIERO.EXE  //  DRIVE TO EXPLORE',
      'WASD DRIVE  ·  SPACE BRAKE  ·  SHIFT NITRO  ·  F HORN',
      '#E87545'
    );

    // Bridge Ahead Directional Stencil
    this.createGroundDecal(
      0,
      -11.8,
      5.0,
      1.6,
      0,
      '▲  ARCH BRIDGE & PLAYGROUND',
      'SMASH LETTERS · BOWLING · SOCCER',
      '#8BAE9B'
    );

    // River Jump Stencil
    this.createGroundDecal(
      10,
      -17.2,
      4.4,
      1.6,
      0,
      '⚡ RIVER STUNT JUMP ▲',
      'USE NITRO [SHIFT / N] FOR AIR',
      '#E87545'
    );

    // Bowling Zone Title
    this.createGroundDecal(
      23,
      13.6,
      5.6,
      1.6,
      0,
      '🎳 BOWLING ALLEY',
      'RAM THE BALL OR PINS FOR A STRIKE',
      '#E87545'
    );

    // Soccer Pitch Title
    this.createGroundDecal(
      -20,
      13.6,
      5.6,
      1.6,
      0,
      '⚽ SOCCER ARENA',
      'DRIBBLE & SCORE INTO THE GOAL NET',
      '#8BAE9B'
    );

    // Synth Floor Label
    this.createGroundDecal(
      13.5,
      15.2,
      4.2,
      1.3,
      0,
      '🎹 MUSICAL PADS',
      'DRIVE OVER TILES TO PLAY',
      '#8BAE9B'
    );

    // Social Hub Label
    this.createGroundDecal(
      17.5,
      -15.2,
      5.6,
      1.4,
      0,
      '🔗 CONNECT & RESUME',
      'PARK ON A TILE & PRESS [E]',
      '#E87545'
    );
  }

  private createGroundDecal(
    x: number,
    z: number,
    width: number,
    height: number,
    rotY: number,
    headline: string,
    subline: string,
    accentHex: string
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 160);

    // Subtle translucent dark backing strip for readability on any theme
    ctx.fillStyle = 'rgba(16, 24, 32, 0.72)';
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(10, 14, 492, 132, 18);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = accentHex;
    ctx.fillText(headline, 256, 70);

    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = '#F2F0E9';
    ctx.fillText(subline, 256, 112);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const geo = new THREE.PlaneGeometry(width, height);
    geo.rotateX(-Math.PI / 2);
    geo.rotateY(rotY);

    const mesh = new THREE.Mesh(geo, mat);
    const groundY = this.terrain.getVehicleGroundHeight(x, z);
    // Account for central Start Plaza cylinder top (y = 0.25)
    const inPlaza = Math.hypot(x, z - (-16)) < 10.8;
    mesh.position.set(x, Math.max(groundY, inPlaza ? 0.255 : 0) + 0.03, z);
    this.group.add(mesh);
  }

  // ---------------------------------------------------------------------------
  // 2. GIANT 3D SMASHABLE "NIERO" LETTERS (Signature Bruno Simon Greeting!)
  // ---------------------------------------------------------------------------
  private buildSmashableTitleLetters() {
    const letters: ('N' | 'I' | 'E' | 'R' | 'O')[] = ['N', 'I', 'E', 'R', 'O'];
    const spacing = 2.05;
    const startX = -((letters.length - 1) * spacing) / 2;
    const zPos = -13.0;
    const baseGround = 0.25; // Top of start plaza cylinder

    letters.forEach((char, idx) => {
      const geo = this.createExtrudedLetterGeometry(char);
      const isOrange = idx % 2 === 0;
      const mat = new THREE.MeshStandardMaterial({
        color: isOrange ? PALETTE.cPrimaryAccent : PALETTE.cMainText,
        roughness: isOrange ? 0.35 : 0.45,
        metalness: isOrange ? 0.25 : 0.15,
        flatShading: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const x = startX + idx * spacing;
      const halfH = 0.9;
      mesh.position.set(x, baseGround + halfH, zPos);
      this.group.add(mesh);

      this.props.push({
        id: `letter-${char}-${idx}`,
        kind: 'letter',
        mesh,
        homePos: new THREE.Vector3(x, baseGround + halfH, zPos),
        homeRot: new THREE.Euler(0, 0, 0),
        pos: new THREE.Vector3(x, baseGround + halfH, zPos),
        vel: new THREE.Vector3(),
        angVel: new THREE.Vector3(),
        radius: 0.78,
        halfHeight: halfH,
        mass: 1.4,
        restitution: 0.48,
        friction: 3.2,
      });
    });
  }

  private createExtrudedLetterGeometry(char: 'N' | 'I' | 'E' | 'R' | 'O'): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const h = 1.8;
    const w = 1.25;
    const hw = w / 2;
    const hh = h / 2;
    const t = 0.32; // Stroke thickness

    switch (char) {
      case 'N': {
        shape.moveTo(-hw, -hh);
        shape.lineTo(-hw + t, -hh);
        shape.lineTo(-hw + t, hh - t * 1.4);
        shape.lineTo(hw - t, -hh);
        shape.lineTo(hw, -hh);
        shape.lineTo(hw, hh);
        shape.lineTo(hw - t, hh);
        shape.lineTo(hw - t, -hh + t * 1.4);
        shape.lineTo(-hw + t, hh);
        shape.lineTo(-hw, hh);
        shape.closePath();
        break;
      }
      case 'I': {
        const capW = 0.45;
        shape.moveTo(-capW, -hh);
        shape.lineTo(capW, -hh);
        shape.lineTo(capW, -hh + t);
        shape.lineTo(t * 0.65, -hh + t);
        shape.lineTo(t * 0.65, hh - t);
        shape.lineTo(capW, hh - t);
        shape.lineTo(capW, hh);
        shape.lineTo(-capW, hh);
        shape.lineTo(-capW, hh - t);
        shape.lineTo(-t * 0.65, hh - t);
        shape.lineTo(-t * 0.65, -hh + t);
        shape.lineTo(-capW, -hh + t);
        shape.closePath();
        break;
      }
      case 'E': {
        shape.moveTo(-hw, -hh);
        shape.lineTo(hw, -hh);
        shape.lineTo(hw, -hh + t);
        shape.lineTo(-hw + t, -hh + t);
        shape.lineTo(-hw + t, -t * 0.45);
        shape.lineTo(hw * 0.72, -t * 0.45);
        shape.lineTo(hw * 0.72, t * 0.45);
        shape.lineTo(-hw + t, t * 0.45);
        shape.lineTo(-hw + t, hh - t);
        shape.lineTo(hw, hh - t);
        shape.lineTo(hw, hh);
        shape.lineTo(-hw, hh);
        shape.closePath();
        break;
      }
      case 'R': {
        shape.moveTo(-hw, -hh);
        shape.lineTo(-hw + t, -hh);
        shape.lineTo(-hw + t, -0.08);
        shape.lineTo(0.05, -0.08);
        shape.lineTo(hw - t * 0.9, -hh);
        shape.lineTo(hw, -hh);
        shape.lineTo(0.28, -0.04);
        shape.lineTo(hw, 0.14);
        shape.lineTo(hw, hh - 0.16);
        shape.lineTo(hw - 0.18, hh);
        shape.lineTo(-hw, hh);
        shape.closePath();

        const hole = new THREE.Path();
        hole.moveTo(-hw + t, 0.2);
        hole.lineTo(hw - t, 0.2);
        hole.lineTo(hw - t, hh - t);
        hole.lineTo(-hw + t, hh - t);
        hole.closePath();
        shape.holes.push(hole);
        break;
      }
      case 'O': {
        shape.moveTo(-hw + 0.2, -hh);
        shape.lineTo(hw - 0.2, -hh);
        shape.lineTo(hw, -hh + 0.2);
        shape.lineTo(hw, hh - 0.2);
        shape.lineTo(hw - 0.2, hh);
        shape.lineTo(-hw + 0.2, hh);
        shape.lineTo(-hw, hh - 0.2);
        shape.lineTo(-hw, -hh + 0.2);
        shape.closePath();

        const hole = new THREE.Path();
        hole.moveTo(-hw + t, -hh + t);
        hole.lineTo(-hw + t, hh - t);
        hole.lineTo(hw - t, hh - t);
        hole.lineTo(hw - t, -hh + t);
        hole.closePath();
        shape.holes.push(hole);
        break;
      }
    }

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.48,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    extrudeGeo.center();
    return extrudeGeo;
  }

  // ---------------------------------------------------------------------------
  // 3. INTERACTIVE 3D BOWLING ALLEY (South-East Playground: x: 23, z: 15..30)
  // ---------------------------------------------------------------------------
  private buildBowlingAlley() {
    const laneX = 23;
    const laneCenterZ = 22.5;
    const baseY = 0.1;

    // Dark polished lane bed
    const laneGeo = new THREE.BoxGeometry(4.4, 0.08, 15.5);
    const laneMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.25,
      metalness: 0.3,
    });
    const laneMesh = new THREE.Mesh(laneGeo, laneMat);
    laneMesh.position.set(laneX, baseY + 0.04, laneCenterZ);
    laneMesh.receiveShadow = true;
    this.group.add(laneMesh);

    // Glowing side lane rails
    const railGeo = new THREE.BoxGeometry(0.18, 0.14, 15.5);
    const railMatLeft = new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent });
    const railMatRight = new THREE.MeshBasicMaterial({ color: PALETTE.cSecondaryAccent });
    const railL = new THREE.Mesh(railGeo, railMatLeft);
    railL.position.set(laneX - 2.3, baseY + 0.07, laneCenterZ);
    const railR = new THREE.Mesh(railGeo, railMatRight);
    railR.position.set(laneX + 2.3, baseY + 0.07, laneCenterZ);
    this.group.add(railL, railR);

    // Foul line strip
    const foulGeo = new THREE.PlaneGeometry(4.4, 0.18);
    foulGeo.rotateX(-Math.PI / 2);
    const foulMesh = new THREE.Mesh(foulGeo, new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent }));
    foulMesh.position.set(laneX, baseY + 0.09, 15.5);
    this.group.add(foulMesh);

    // Giant 3D Bowling Ball
    const ballGroup = new THREE.Group();
    const ballRadius = 0.88;
    const ballGeo = new THREE.IcosahedronGeometry(ballRadius, 2);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x101820,
      roughness: 0.15,
      metalness: 0.75,
    });
    const ballCore = new THREE.Mesh(ballGeo, ballMat);
    ballCore.castShadow = true;
    ballGroup.add(ballCore);

    // Three signature orange finger-hole dots so spin is visible!
    const dotGeo = new THREE.SphereGeometry(0.13, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent });
    const offsets: [number, number, number][] = [
      [0.18, 0.72, 0.42],
      [-0.18, 0.72, 0.42],
      [0.0, 0.56, 0.65],
    ];
    offsets.forEach(([ox, oy, oz]) => {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(ox, oy, oz);
      ballGroup.add(dot);
    });

    const ballStart = new THREE.Vector3(laneX, baseY + 0.08 + ballRadius, 17.2);
    ballGroup.position.copy(ballStart);
    this.group.add(ballGroup);

    this.props.push({
      id: 'bowling-ball',
      kind: 'bowlingBall',
      mesh: ballGroup,
      homePos: ballStart.clone(),
      homeRot: new THREE.Euler(),
      pos: ballStart.clone(),
      vel: new THREE.Vector3(),
      angVel: new THREE.Vector3(),
      radius: ballRadius,
      halfHeight: ballRadius,
      mass: 2.6,
      restitution: 0.65,
      friction: 0.75, // Rolls a long way down the polished lane!
    });

    // 10 LatheGeometry Bowling Pins in 4-3-2-1 triangle
    const pinProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.28, 0.25),
      new THREE.Vector2(0.26, 0.55),
      new THREE.Vector2(0.12, 0.92),
      new THREE.Vector2(0.16, 1.15),
      new THREE.Vector2(0.14, 1.32),
      new THREE.Vector2(0.0, 1.38),
    ];
    const pinGeo = new THREE.LatheGeometry(pinProfile, 12);
    pinGeo.center(); // Center around y=0 so tumbling spins naturally around CoM

    const pinMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cMainText,
      roughness: 0.35,
      metalness: 0.1,
    });
    const stripeGeo = new THREE.CylinderGeometry(0.145, 0.145, 0.14, 12);
    const stripeMat = new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent });

    const pinRows = 4;
    const headPinZ = 25.4;
    const rowSpacingZ = 0.85;
    const colSpacingX = 0.82;
    let pinIndex = 0;

    for (let row = 0; row < pinRows; row++) {
      const pinsInRow = row + 1;
      const z = headPinZ + row * rowSpacingZ;
      const rowStartX = laneX - ((pinsInRow - 1) * colSpacingX) / 2;

      for (let col = 0; col < pinsInRow; col++) {
        const x = rowStartX + col * colSpacingX;
        const pinGroup = new THREE.Group();

        const body = new THREE.Mesh(pinGeo, pinMat);
        body.castShadow = true;
        pinGroup.add(body);

        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0.28;
        pinGroup.add(stripe);

        const halfH = 0.69;
        const pinPos = new THREE.Vector3(x, baseY + 0.08 + halfH, z);
        pinGroup.position.copy(pinPos);
        this.group.add(pinGroup);

        this.props.push({
          id: `bowling-pin-${pinIndex++}`,
          kind: 'pin',
          mesh: pinGroup,
          homePos: pinPos.clone(),
          homeRot: new THREE.Euler(),
          pos: pinPos.clone(),
          vel: new THREE.Vector3(),
          angVel: new THREE.Vector3(),
          radius: 0.34,
          halfHeight: halfH,
          mass: 0.65,
          restitution: 0.55,
          friction: 2.8,
          knocked: false,
        });
      }
    }

    // Glowing "RESET PINS & LETTERS" floor pad next to the bowling lane
    const padX = 18.6;
    const padZ = 16.5;
    const resetGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.12, 16);
    const resetMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondaryAccent,
      emissive: new THREE.Color(PALETTE.cSecondaryAccent),
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    this.resetPadMesh = new THREE.Mesh(resetGeo, resetMat);
    this.resetPadMesh.position.set(padX, baseY + 0.06, padZ);
    this.group.add(this.resetPadMesh);

    this.createGroundDecal(
      padX,
      padZ - 2.1,
      3.4,
      1.0,
      0,
      '↻ RESET PROPS',
      'DRIVE OVER PAD',
      '#8BAE9B'
    );
  }

  // ---------------------------------------------------------------------------
  // 4. SOCCER PITCH & GIANT PHYSICS BALL (South-West: x: -20, z: 15..31)
  // ---------------------------------------------------------------------------
  private buildSoccerPitch() {
    const cx = -20;
    const baseY = 0.1;

    // Pitch outline border
    const lineMat = new THREE.MeshBasicMaterial({
      color: PALETTE.cSecondaryAccent,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const pitchBorderGeo = new THREE.RingGeometry(7.2, 7.45, 4);
    pitchBorderGeo.rotateX(-Math.PI / 2);
    pitchBorderGeo.rotateY(Math.PI / 4);
    const pitchBorder = new THREE.Mesh(pitchBorderGeo, lineMat);
    pitchBorder.scale.set(1.1, 1, 1.4);
    pitchBorder.position.set(cx, baseY + 0.03, 22.5);
    this.group.add(pitchBorder);

    // Center Kickoff Ring
    const centerRingGeo = new THREE.RingGeometry(2.1, 2.3, 24);
    centerRingGeo.rotateX(-Math.PI / 2);
    const centerRing = new THREE.Mesh(centerRingGeo, lineMat);
    centerRing.position.set(cx, baseY + 0.03, 21.0);
    this.group.add(centerRing);

    // 3D Soccer Goal Frame at z = 30.2
    const goalGroup = new THREE.Group();
    goalGroup.position.set(cx, baseY, 30.2);

    const postMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cMainText,
      roughness: 0.3,
      metalness: 0.4,
    });
    const goalW = 7.2;
    const goalH = 3.2;
    const goalD = 2.4;

    const postGeo = new THREE.CylinderGeometry(0.14, 0.14, goalH, 8);
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-goalW / 2, goalH / 2, 0);
    postL.castShadow = true;
    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(goalW / 2, goalH / 2, 0);
    postR.castShadow = true;

    const crossbarGeo = new THREE.CylinderGeometry(0.14, 0.14, goalW + 0.28, 8);
    crossbarGeo.rotateZ(Math.PI / 2);
    const crossbar = new THREE.Mesh(crossbarGeo, postMat);
    crossbar.position.set(0, goalH, 0);
    crossbar.castShadow = true;

    // Back frame struts
    const backPostL = new THREE.Mesh(postGeo, postMat);
    backPostL.position.set(-goalW / 2, goalH / 2, goalD);
    const backPostR = new THREE.Mesh(postGeo, postMat);
    backPostR.position.set(goalW / 2, goalH / 2, goalD);
    const backBar = new THREE.Mesh(crossbarGeo, postMat);
    backBar.position.set(0, goalH, goalD);

    // Translucent goal net
    const netMat = new THREE.MeshBasicMaterial({
      color: PALETTE.cSecondaryAccent,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const backNet = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalH, 10, 5), netMat);
    backNet.position.set(0, goalH / 2, goalD);
    const sideNetL = new THREE.Mesh(new THREE.PlaneGeometry(goalD, goalH, 4, 5), netMat);
    sideNetL.rotation.y = Math.PI / 2;
    sideNetL.position.set(-goalW / 2, goalH / 2, goalD / 2);
    const sideNetR = new THREE.Mesh(new THREE.PlaneGeometry(goalD, goalH, 4, 5), netMat);
    sideNetR.rotation.y = Math.PI / 2;
    sideNetR.position.set(goalW / 2, goalH / 2, goalD / 2);
    const topNet = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalD, 10, 4), netMat);
    topNet.rotation.x = Math.PI / 2;
    topNet.position.set(0, goalH, goalD / 2);

    goalGroup.add(postL, postR, crossbar, backPostL, backPostR, backBar, backNet, sideNetL, sideNetR, topNet);
    this.group.add(goalGroup);

    // Giant Bouncy Soccer Ball
    const ballRadius = 1.05;
    const soccerGroup = new THREE.Group();
    const ballMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(ballRadius, 1),
      new THREE.MeshStandardMaterial({
        color: PALETTE.cMainText,
        roughness: 0.45,
        metalness: 0.1,
        flatShading: true,
      })
    );
    ballMesh.castShadow = true;
    soccerGroup.add(ballMesh);

    // Accent pentagon cap patches so ball rotation is visually clear
    const patchGeo = new THREE.IcosahedronGeometry(ballRadius * 1.02, 0);
    const patchMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryAccent,
      wireframe: true,
    });
    soccerGroup.add(new THREE.Mesh(patchGeo, patchMat));

    const kickoffPos = new THREE.Vector3(cx, baseY + ballRadius, 21.0);
    soccerGroup.position.copy(kickoffPos);
    this.group.add(soccerGroup);

    this.props.push({
      id: 'soccer-ball',
      kind: 'soccerBall',
      mesh: soccerGroup,
      homePos: kickoffPos.clone(),
      homeRot: new THREE.Euler(),
      pos: kickoffPos.clone(),
      vel: new THREE.Vector3(),
      angVel: new THREE.Vector3(),
      radius: ballRadius,
      halfHeight: ballRadius,
      mass: 0.9,
      restitution: 0.78,
      friction: 0.9,
    });
  }

  // ---------------------------------------------------------------------------
  // 5. STUNT JUMP RAMPS (River Jump + Highway + Playground)
  // ---------------------------------------------------------------------------
  private buildStuntRamps() {
    const rampConfigs = [
      { id: 'ramp-river', x: 10, z: -12.0, angle: 0, width: 4.4, length: 7.4, height: 2.5 },
      { id: 'ramp-south', x: 0, z: 24.0, angle: 0, width: 4.2, length: 6.4, height: 2.0 },
      { id: 'ramp-arena', x: -10.5, z: 18.0, angle: -Math.PI / 5, width: 3.8, length: 5.8, height: 1.85 },
    ];

    rampConfigs.forEach(cfg => {
      const cosA = Math.cos(cfg.angle);
      const sinA = Math.sin(cfg.angle);
      this.ramps.push({ ...cfg, cosA, sinA });

      const baseY = this.terrain.getHeight(cfg.x, cfg.z);
      const rampGroup = new THREE.Group();
      rampGroup.position.set(cfg.x, baseY, cfg.z);
      rampGroup.rotation.y = cfg.angle;

      // Extruded wedge side profile so the ramp is solid and beveled
      const halfL = cfg.length / 2;
      const shape = new THREE.Shape();
      shape.moveTo(-halfL, 0);
      shape.lineTo(halfL, 0);
      shape.lineTo(halfL, cfg.height);
      shape.closePath();

      const wedgeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: cfg.width,
        bevelEnabled: false,
      });
      // ExtrudeGeometry extrudes along +Z; rotate so profile X->Z (length) and extrusion Z->X (width)
      wedgeGeo.rotateY(-Math.PI / 2);
      wedgeGeo.translate(cfg.width / 2, 0, 0);

      const wedgeMat = new THREE.MeshStandardMaterial({
        color: PALETTE.cSecondarySurfaces,
        roughness: 0.75,
        metalness: 0.2,
        flatShading: true,
      });
      const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
      wedge.castShadow = true;
      wedge.receiveShadow = true;
      rampGroup.add(wedge);

      // Bright glowing orange/sage edge stripes along top edges of ramp deck
      const slopeLen = Math.hypot(cfg.length, cfg.height);
      const slopeAngle = Math.atan2(cfg.height, cfg.length);

      const stripeGeo = new THREE.BoxGeometry(0.24, 0.08, slopeLen);
      const stripeMat = new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent });

      const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
      leftStripe.position.set(-cfg.width / 2 + 0.25, cfg.height / 2 + 0.04, 0);
      leftStripe.rotation.x = -slopeAngle;

      const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
      rightStripe.position.set(cfg.width / 2 - 0.25, cfg.height / 2 + 0.04, 0);
      rightStripe.rotation.x = -slopeAngle;

      // Center booster arrow chevron bars on the ramp face
      for (let i = -1; i <= 1; i++) {
        const barGeo = new THREE.BoxGeometry(cfg.width * 0.55, 0.07, 0.28);
        const bar = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: PALETTE.cSecondaryAccent }));
        const frac = 0.5 + i * 0.25;
        bar.position.set(0, cfg.height * frac + 0.05, (frac - 0.5) * cfg.length);
        bar.rotation.x = -slopeAngle;
        rampGroup.add(bar);
      }

      rampGroup.add(leftStripe, rightStripe);
      this.group.add(rampGroup);
    });
  }

  /**
   * Returns elevated ramp height if (x, z) is on any stunt ramp deck
   */
  public getRampHeightAt(x: number, z: number): number {
    let bestH = -Infinity;
    for (const r of this.ramps) {
      const dx = x - r.x;
      const dz = z - r.z;
      // Transform world delta into ramp local space (localZ = forward direction of ascent)
      const localX = dx * r.cosA - dz * r.sinA;
      const localZ = dx * r.sinA + dz * r.cosA;

      if (Math.abs(localX) <= r.width / 2 + 0.4 && localZ >= -r.length / 2 && localZ <= r.length / 2) {
        const t = (localZ + r.length / 2) / r.length; // 0 at foot, 1 at launch lip
        const baseY = this.terrain.getHeight(r.x, r.z);
        const h = baseY + t * r.height;
        if (h > bestH) bestH = h;
      }
    }
    return bestH;
  }

  // ---------------------------------------------------------------------------
  // 6. MUSICAL SYNTH FLOOR PADS (Pentatonic Keyboard Tiles)
  // ---------------------------------------------------------------------------
  private buildSynthFloorPads() {
    const notes = [
      { label: 'C4', freq: 261.63, color: 0xE87545 },
      { label: 'D4', freq: 293.66, color: 0x8BAE9B },
      { label: 'E4', freq: 329.63, color: 0xE87545 },
      { label: 'G4', freq: 392.0, color: 0x8BAE9B },
      { label: 'A4', freq: 440.0, color: 0xE87545 },
      { label: 'C5', freq: 523.25, color: 0x00E5FF },
    ];

    const padX = 13.6;
    const startZ = 17.5;
    const baseY = 0.1;

    notes.forEach((n, idx) => {
      const z = startZ + idx * 2.15;
      const geo = new THREE.BoxGeometry(3.2, 0.18, 1.75);
      const mat = new THREE.MeshStandardMaterial({
        color: PALETTE.cSecondarySurfaces,
        emissive: new THREE.Color(n.color),
        emissiveIntensity: 0.18,
        roughness: 0.35,
        metalness: 0.4,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(padX, baseY + 0.09, z);
      mesh.receiveShadow = true;
      this.group.add(mesh);

      // Note indicator strip
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.04, 0.25),
        new THREE.MeshBasicMaterial({ color: n.color })
      );
      trim.position.set(0, 0.1, 0.65);
      mesh.add(trim);

      this.synthPads.push({
        mesh,
        mat,
        x: padX,
        z,
        freq: n.freq,
        baseY: baseY + 0.09,
        cooldown: 0,
        litTimer: 0,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 7. INTERACTIVE 3D SOCIAL & RESUME FLOOR TILES (Bruno Simon Info Plaza)
  // ---------------------------------------------------------------------------
  private buildSocialTiles() {
    const tiles: {
      id: string;
      title: string;
      subtitle: string;
      label: string;
      action: SocialTileAction;
      url?: string;
      x: number;
      z: number;
      accent: string;
    }[] = [
      {
        id: 'social-github',
        title: 'GitHub (@nierowheezy)',
        subtitle: 'Open GitHub repositories & open-source profile',
        label: 'GITHUB',
        action: 'github',
        url: DEVELOPER_PROFILE.github,
        x: 15.0,
        z: -18.0,
        accent: '#F2F0E9',
      },
      {
        id: 'social-linkedin',
        title: 'LinkedIn Profile',
        subtitle: 'Connect with Olabode Olaniyi David on LinkedIn',
        label: 'LINKEDIN',
        action: 'linkedin',
        url: DEVELOPER_PROFILE.linkedin,
        x: 20.0,
        z: -18.0,
        accent: '#8BAE9B',
      },
      {
        id: 'social-resume',
        title: 'Verified Resume PDF',
        subtitle: 'View or download Olaniyi_Olabode_David_Resume.pdf',
        label: 'RESUME PDF',
        action: 'resume',
        x: 15.0,
        z: -22.5,
        accent: '#E87545',
      },
      {
        id: 'social-contact',
        title: 'Direct Email & Contact',
        subtitle: `${DEVELOPER_PROFILE.email} · ${DEVELOPER_PROFILE.phone}`,
        label: 'CONTACT',
        action: 'contact',
        x: 20.0,
        z: -22.5,
        accent: '#E87545',
      },
    ];

    tiles.forEach(tile => {
      const y = this.terrain.getHeight(tile.x, tile.z);
      const tileGroup = new THREE.Group();
      tileGroup.position.set(tile.x, y, tile.z);

      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.2, 3.2),
        new THREE.MeshStandardMaterial({
          color: PALETTE.cSecondarySurfaces,
          roughness: 0.65,
          metalness: 0.25,
        })
      );
      plinth.position.y = 0.1;
      plinth.receiveShadow = true;
      tileGroup.add(plinth);

      // Canvas Label Top Plate
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 192;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#101820';
      ctx.fillRect(0, 0, 256, 192);
      ctx.strokeStyle = tile.accent;
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 240, 176);

      ctx.textAlign = 'center';
      ctx.font = 'bold 34px monospace';
      ctx.fillStyle = tile.accent;
      ctx.fillText(tile.label, 128, 92);

      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#A4B0B5';
      ctx.fillText('PRESS [E] TO OPEN', 128, 140);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const topPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 2.7),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      topPlate.rotation.x = -Math.PI / 2;
      topPlate.position.y = 0.21;
      tileGroup.add(topPlate);

      this.group.add(tileGroup);

      this.interactables.push({
        id: tile.id,
        title: tile.title,
        subtitle: tile.subtitle,
        action: tile.action,
        url: tile.url,
        position: new THREE.Vector3(tile.x, y, tile.z),
        interactRadius: 3.4,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 8. KNOCKABLE TRAFFIC CONES & TECH CRATES
  // ---------------------------------------------------------------------------
  private buildScatterableConesAndCrates() {
    const conePositions: [number, number][] = [
      [-6.5, -10.5],
      [6.5, -10.5],
      [-5.2, 13.5],
      [5.2, 13.5],
      [7.5, -15.5],
      [12.5, -15.5],
      [-14.0, 13.8],
      [18.0, 13.8],
    ];

    const coneGeo = new THREE.ConeGeometry(0.32, 0.85, 8);
    const coneMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryAccent,
      roughness: 0.45,
      flatShading: true,
    });
    const coneBaseGeo = new THREE.BoxGeometry(0.7, 0.08, 0.7);
    const coneBaseMat = new THREE.MeshStandardMaterial({ color: PALETTE.cBg, roughness: 0.8 });
    const collarGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.18, 8);
    const collarMat = new THREE.MeshBasicMaterial({ color: PALETTE.cMainText });

    conePositions.forEach(([x, z], idx) => {
      const y = this.terrain.getVehicleGroundHeight(x, z);
      const halfH = 0.45;
      const coneGroup = new THREE.Group();

      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 0.04;
      cone.castShadow = true;
      const base = new THREE.Mesh(coneBaseGeo, coneBaseMat);
      base.position.y = -0.39;
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.y = 0.05;

      coneGroup.add(cone, base, collar);
      coneGroup.position.set(x, y + halfH, z);
      this.group.add(coneGroup);

      this.props.push({
        id: `cone-${idx}`,
        kind: 'cone',
        mesh: coneGroup,
        homePos: new THREE.Vector3(x, y + halfH, z),
        homeRot: new THREE.Euler(),
        pos: new THREE.Vector3(x, y + halfH, z),
        vel: new THREE.Vector3(),
        angVel: new THREE.Vector3(),
        radius: 0.42,
        halfHeight: halfH,
        mass: 0.4,
        restitution: 0.55,
        friction: 3.5,
      });
    });

    // Knockable Tech Crates cluster near South-West plaza edge & playground entrance
    const crateCoords: [number, number, number][] = [
      [-9.0, 0.45, -18.0],
      [-9.0, 0.45, -19.5],
      [-7.55, 0.45, -18.75],
      [9.2, 0.45, 16.5],
    ];
    const crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const crateMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cBridgeWood,
      roughness: 0.85,
      flatShading: true,
    });
    const bandGeo = new THREE.BoxGeometry(0.94, 0.14, 0.94);
    const bandMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondaryAccent,
      metalness: 0.4,
      roughness: 0.4,
    });

    crateCoords.forEach(([x, localY, z], idx) => {
      const ground = this.terrain.getVehicleGroundHeight(x, z);
      const inPlaza = Math.hypot(x, z - (-16)) < 10.8;
      const base = Math.max(ground, inPlaza ? 0.25 : 0);

      const crateGroup = new THREE.Group();
      const box = new THREE.Mesh(crateGeo, crateMat);
      box.castShadow = true;
      const band = new THREE.Mesh(bandGeo, bandMat);
      crateGroup.add(box, band);

      const pos = new THREE.Vector3(x, base + localY, z);
      crateGroup.position.copy(pos);
      this.group.add(crateGroup);

      this.props.push({
        id: `crate-${idx}`,
        kind: 'crate',
        mesh: crateGroup,
        homePos: pos.clone(),
        homeRot: new THREE.Euler(),
        pos: pos.clone(),
        vel: new THREE.Vector3(),
        angVel: new THREE.Vector3(),
        radius: 0.62,
        halfHeight: 0.45,
        mass: 0.9,
        restitution: 0.45,
        friction: 3.8,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 9. WOBBLING 3D DIRECTIONAL ARROW SIGNPOSTS
  // ---------------------------------------------------------------------------
  private buildWobbleSignposts() {
    const spots: { x: number; z: number; lines: string[] }[] = [
      { x: 5.2, z: -13.5, lines: ['JUMP →', 'SOCIAL ↗'] },
      { x: -5.2, z: 13.5, lines: ['← SOCCER', 'BOWLING →'] },
    ];

    spots.forEach(s => {
      const y = this.terrain.getVehicleGroundHeight(s.x, s.z);
      const g = new THREE.Group();
      g.position.set(s.x, y, s.z);

      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 2.3, 6),
        new THREE.MeshStandardMaterial({ color: PALETTE.cBridgeWood, roughness: 0.85 })
      );
      post.position.y = 1.15;
      post.castShadow = true;
      g.add(post);

      s.lines.forEach((txt, idx) => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = idx === 0 ? '#E87545' : '#17242D';
        ctx.fillRect(0, 0, 256, 64);
        ctx.strokeStyle = '#F2F0E9';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 252, 60);
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = idx === 0 ? '#101820' : '#8BAE9B';
        ctx.textAlign = 'center';
        ctx.fillText(txt, 128, 42);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(1.45, 0.36, 0.08),
          [
            new THREE.MeshStandardMaterial({ color: PALETTE.cBridgeWood }),
            new THREE.MeshStandardMaterial({ color: PALETTE.cBridgeWood }),
            new THREE.MeshStandardMaterial({ color: PALETTE.cBridgeWood }),
            new THREE.MeshStandardMaterial({ color: PALETTE.cBridgeWood }),
            new THREE.MeshBasicMaterial({ map: tex }),
            new THREE.MeshBasicMaterial({ map: tex }),
          ]
        );
        board.position.y = 2.0 - idx * 0.44;
        board.rotation.y = idx === 0 ? 0.2 : -0.25;
        board.castShadow = true;
        g.add(board);
      });

      this.group.add(g);
      this.wobbleSigns.push({
        group: g,
        x: s.x,
        z: s.z,
        tiltX: 0,
        tiltZ: 0,
        velX: 0,
        velZ: 0,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // RESET & PHYSICS SIMULATION UPDATE
  // ---------------------------------------------------------------------------
  public resetAllProps() {
    this.bowlingStrikeAwarded = false;
    this.bowlingResetTimer = 0;

    for (const p of this.props) {
      p.pos.copy(p.homePos);
      p.vel.set(0, 0, 0);
      p.angVel.set(0, 0, 0);
      p.mesh.position.copy(p.homePos);
      p.mesh.rotation.copy(p.homeRot);
      p.knocked = false;
    }

    sound.playCheckpoint();
    this.callbacks.onPropsReset?.();
  }

  public resetBowlingSet() {
    this.bowlingStrikeAwarded = false;
    this.bowlingResetTimer = 0;

    for (const p of this.props) {
      if (p.kind === 'pin' || p.kind === 'bowlingBall') {
        p.pos.copy(p.homePos);
        p.vel.set(0, 0, 0);
        p.angVel.set(0, 0, 0);
        p.mesh.position.copy(p.homePos);
        p.mesh.rotation.copy(p.homeRot);
        p.knocked = false;
      }
    }
  }

  public update(delta: number, vehiclePos: THREE.Vector3, vehicleVelSpeed: number, vehicleHeading: number) {
    const dt = Math.min(delta, 0.05);
    const vehVx = Math.sin(vehicleHeading) * vehicleVelSpeed;
    const vehVz = Math.cos(vehicleHeading) * vehicleVelSpeed;
    const vehRadius = 1.38;

    // 1. Auto reset timers
    if (this.bowlingResetTimer > 0) {
      this.bowlingResetTimer -= dt;
      if (this.bowlingResetTimer <= 0) {
        this.resetBowlingSet();
      }
    }
    if (this.soccerGoalCooldown > 0) {
      this.soccerGoalCooldown -= dt;
    }
    if (this.resetPadCooldown > 0) {
      this.resetPadCooldown -= dt;
    }

    // Check Reset Pad trigger
    const distReset = Math.hypot(vehiclePos.x - 18.6, vehiclePos.z - 16.5);
    if (distReset < 1.8 && this.resetPadCooldown <= 0) {
      this.resetPadCooldown = 2.5;
      this.resetAllProps();
    }

    // 2. Musical Synth Floor Pads
    for (const pad of this.synthPads) {
      if (pad.cooldown > 0) pad.cooldown -= dt;
      if (pad.litTimer > 0) {
        pad.litTimer -= dt;
        pad.mat.emissiveIntensity = 0.18 + Math.max(0, pad.litTimer) * 2.2;
        pad.mesh.position.y = pad.baseY - 0.05 * Math.min(1, pad.litTimer * 3);
      } else {
        pad.mat.emissiveIntensity = 0.18;
        pad.mesh.position.y = pad.baseY;
      }

      if (Math.abs(vehiclePos.x - pad.x) < 1.8 && Math.abs(vehiclePos.z - pad.z) < 1.0 && pad.cooldown <= 0) {
        pad.cooldown = 0.35;
        pad.litTimer = 0.45;
        sound.playSynthNote(pad.freq);
      }
    }

    // 3. Wobble Signposts
    for (const sign of this.wobbleSigns) {
      const dx = vehiclePos.x - sign.x;
      const dz = vehiclePos.z - sign.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.55 && Math.abs(vehicleVelSpeed) > 1.0) {
        const pushStrength = Math.min(10, Math.abs(vehicleVelSpeed) * 0.55);
        sign.velX += (-dz / Math.max(0.1, dist)) * pushStrength * dt * 10;
        sign.velZ += (dx / Math.max(0.1, dist)) * pushStrength * dt * 10;
      }
      // Spring-damper upright recovery
      sign.velX += (-45 * sign.tiltX - 5.5 * sign.velX) * dt;
      sign.velZ += (-45 * sign.tiltZ - 5.5 * sign.velZ) * dt;
      sign.tiltX = THREE.MathUtils.clamp(sign.tiltX + sign.velX * dt, -0.55, 0.55);
      sign.tiltZ = THREE.MathUtils.clamp(sign.tiltZ + sign.velZ * dt, -0.55, 0.55);
      sign.group.rotation.x = sign.tiltX;
      sign.group.rotation.z = sign.tiltZ;
    }

    // 4. Vehicle -> Dynamic Props Collision
    for (const p of this.props) {
      const dx = p.pos.x - vehiclePos.x;
      const dz = p.pos.z - vehiclePos.z;
      const dy = Math.abs(p.pos.y - (vehiclePos.y + 0.7));
      const dist = Math.hypot(dx, dz);
      const minDist = vehRadius + p.radius;

      if (dist < minDist && dy < 1.85 && dist > 0.001) {
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = minDist - dist;

        // Separate prop cleanly outside vehicle bumper
        p.pos.x += nx * (overlap + 0.04);
        p.pos.z += nz * (overlap + 0.04);

        const relVx = vehVx - p.vel.x;
        const relVz = vehVz - p.vel.z;
        const impactSpeed = Math.max(4.5, relVx * nx + relVz * nz + Math.abs(vehicleVelSpeed) * 0.45);
        const kickFactor = (1.35 / p.mass) * (p.kind === 'soccerBall' ? 1.25 : 1.0);

        p.vel.x += nx * impactSpeed * kickFactor;
        p.vel.z += nz * impactSpeed * kickFactor;
        p.vel.y += Math.min(7.5, impactSpeed * (p.kind === 'soccerBall' ? 0.38 : 0.24));

        // Realistic spin/tumble
        p.angVel.x += nz * impactSpeed * 0.45;
        p.angVel.z -= nx * impactSpeed * 0.45;
        p.angVel.y += (Math.random() - 0.5) * impactSpeed * 0.35;

        sound.playPropHit(Math.min(1, impactSpeed / 18));

        if (!this.hasSmashedProp && (p.kind === 'letter' || p.kind === 'cone' || p.kind === 'crate')) {
          this.hasSmashedProp = true;
          this.callbacks.onFirstPropSmash?.();
        }
      }
    }

    // 5. Prop <-> Prop Collisions (Bowling ball knocking pins, letters tumbling into each other)
    for (let i = 0; i < this.props.length; i++) {
      const a = this.props[i];
      for (let j = i + 1; j < this.props.length; j++) {
        const b = this.props[j];
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const dy = Math.abs(b.pos.y - a.pos.y);
        const dist = Math.hypot(dx, dz);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dy < (a.halfHeight + b.halfHeight) && dist > 0.001) {
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = minDist - dist;

          const totalMass = a.mass + b.mass;
          a.pos.x -= nx * overlap * (b.mass / totalMass);
          a.pos.z -= nz * overlap * (b.mass / totalMass);
          b.pos.x += nx * overlap * (a.mass / totalMass);
          b.pos.z += nz * overlap * (a.mass / totalMass);

          const rvx = a.vel.x - b.vel.x;
          const rvz = a.vel.z - b.vel.z;
          const velAlongNormal = rvx * nx + rvz * nz;

          if (velAlongNormal > 0) {
            const e = Math.min(a.restitution, b.restitution);
            const jImp = ((1 + e) * velAlongNormal) / (1 / a.mass + 1 / b.mass);
            a.vel.x -= (jImp / a.mass) * nx;
            a.vel.z -= (jImp / a.mass) * nz;
            b.vel.x += (jImp / b.mass) * nx;
            b.vel.z += (jImp / b.mass) * nz;

            // Tumble transfer
            b.vel.y += Math.min(3.5, velAlongNormal * 0.18);
            b.angVel.x += nz * velAlongNormal * 0.4;
            b.angVel.z -= nx * velAlongNormal * 0.4;

            if (velAlongNormal > 2.2) {
              sound.playPropHit(Math.min(0.8, velAlongNormal / 16));
            }
          }
        }
      }
    }

    // 6. Integrate Prop Motion, Gravity, Ground Bounce, and Boundary Containment
    let knockedPinsCount = 0;

    for (const p of this.props) {
      // Gravity
      p.vel.y -= 22 * dt;

      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.pos.z += p.vel.z * dt;

      // Ground height check (account for plaza slab around (0, -16) and bowling lane bed)
      let groundY = this.terrain.getVehicleGroundHeight(p.pos.x, p.pos.z);
      if (Math.hypot(p.pos.x, p.pos.z - (-16)) < 10.8) {
        groundY = Math.max(groundY, 0.25);
      } else if (
        Math.abs(p.pos.x - 23) <= 2.35 &&
        p.pos.z >= 14.75 &&
        p.pos.z <= 30.25
      ) {
        groundY = Math.max(groundY, 0.18);
      }

      const isUpright =
        p.kind === 'bowlingBall' ||
        p.kind === 'soccerBall' ||
        (Math.abs(p.mesh.rotation.x) < 0.25 && Math.abs(p.mesh.rotation.z) < 0.25);

      const effectiveHalfH = isUpright ? p.halfHeight : Math.min(p.halfHeight, Math.max(p.radius * 0.65, p.halfHeight * 0.5));
      const floorY = groundY + (p.kind === 'bowlingBall' || p.kind === 'soccerBall' ? p.radius : effectiveHalfH);

      if (p.pos.y <= floorY) {
        p.pos.y = floorY;
        if (p.vel.y < -1.8) {
          p.vel.y = -p.vel.y * p.restitution;
        } else {
          p.vel.y = 0;
        }

        // Ground rolling/sliding friction
        const damp = Math.exp(-p.friction * dt);
        p.vel.x *= damp;
        p.vel.z *= damp;

        if (p.kind === 'bowlingBall' || p.kind === 'soccerBall') {
          // True rolling rotation coupled to linear velocity
          p.mesh.rotation.x += (p.vel.z / p.radius) * dt;
          p.mesh.rotation.z -= (p.vel.x / p.radius) * dt;
        } else {
          p.angVel.multiplyScalar(Math.exp(-5.0 * dt));
        }
      } else {
        // Airborne tumble
        p.mesh.rotation.x += p.angVel.x * dt;
        p.mesh.rotation.y += p.angVel.y * dt;
        p.mesh.rotation.z += p.angVel.z * dt;
      }

      if (p.kind !== 'bowlingBall' && p.kind !== 'soccerBall' && p.vel.lengthSq() > 0.15) {
        p.mesh.rotation.x += p.angVel.x * dt;
        p.mesh.rotation.y += p.angVel.y * dt;
        p.mesh.rotation.z += p.angVel.z * dt;
      }

      // Keep inside island perimeter
      const distCenter = Math.hypot(p.pos.x, p.pos.z);
      if (distCenter > 68) {
        p.pos.x *= 68 / distCenter;
        p.pos.z *= 68 / distCenter;
        p.vel.x *= -0.5;
        p.vel.z *= -0.5;
      }

      p.mesh.position.copy(p.pos);

      // Pin knocked check
      if (p.kind === 'pin') {
        const displaced = _tmpVec.copy(p.pos).distanceTo(p.homePos);
        const tilted = Math.abs(p.mesh.rotation.x) > 0.45 || Math.abs(p.mesh.rotation.z) > 0.45;
        if (displaced > 0.45 || tilted) {
          p.knocked = true;
          knockedPinsCount++;
        }
      }

      // Soccer Goal Check
      if (p.kind === 'soccerBall' && this.soccerGoalCooldown <= 0) {
        if (
          Math.abs(p.pos.x - this.soccerGoalPos.x) < 3.4 &&
          p.pos.z >= this.soccerGoalPos.z - 0.3 &&
          p.pos.z <= this.soccerGoalPos.z + 2.5
        ) {
          this.soccerGoalCooldown = 3.2;
          sound.playBowlingStrike();
          this.callbacks.onSoccerGoal?.();
          // Reset ball cleanly back to kickoff spot after slight celebration bounce
          window.setTimeout(() => {
            p.pos.copy(p.homePos);
            p.vel.set(0, 3.5, 0);
          }, 1600);
        }
      }
    }

    // 7. Bowling Strike Check
    if (knockedPinsCount === 10 && !this.bowlingStrikeAwarded) {
      this.bowlingStrikeAwarded = true;
      this.bowlingResetTimer = 5.5;
      sound.playBowlingStrike();
      this.callbacks.onBowlingStrike?.();
    } else if (knockedPinsCount > 0 && !this.bowlingStrikeAwarded) {
      this.callbacks.onBowlingProgress?.(knockedPinsCount);
    }
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
