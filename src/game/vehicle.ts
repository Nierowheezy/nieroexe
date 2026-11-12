/**
 * Player Vehicle: Stylized low-poly off-road buggy / rover
 * Composite 3-12 part procedural model with rolling wheels, steering front wheels,
 * suspension tilt, smooth physics, and obstacle collision detection.
 * Color palette:
 * - Body: Primary accent orange (#E87545)
 * - Roll cage / Chassis trim: #17242D / #24343D
 * - Tires: #101820
 * - Hubs: #E87545
 * - Headlights: #F2F0E9
 */

import * as THREE from 'three';
import { PALETTE, VEHICLE_CONFIG, WORLD_CONFIG, VehicleModelType } from './constants';
import { TerrainSystem } from './terrain';
import { Collider } from './environment';
import { sound } from './audio';
import { NitroParticleSystem } from './nitroParticles';

export interface VehicleInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
}

export class Vehicle {
  public group: THREE.Group;
  public chassisGroup: THREE.Group;
  public frontLeftWheel: THREE.Group;
  public frontRightWheel: THREE.Group;
  public rearLeftWheel: THREE.Group;
  public rearRightWheel: THREE.Group;
  public currentModel: VehicleModelType = 'buggy';
  public currentPaintHex: string = '#E87545';

  // Wheel rim meshes for dynamic paint updates
  private rimMeshes: THREE.Mesh[] = [];

  // Dust particles trail
  private dustParticles!: THREE.Points;
  private dustGeo!: THREE.BufferGeometry;
  private dustPositions!: Float32Array;
  private dustOpacities!: Float32Array;
  private maxDust: number = 30;
  private dustIndex: number = 0;

  // Real-world 3D Nitro Jet Particle System
  public nitroParticles: NitroParticleSystem = new NitroParticleSystem();

  // Physics state
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, -16);
  public velocity: number = 0; // Forward speed (units/sec)
  public steeringAngle: number = 0; // Steering angle in radians
  public heading: number = 0; // Yaw angle in radians
  public lateralVelocity: number = 0;

  // Suspension / Chassis dynamics
  private pitch: number = 0;
  private roll: number = 0;

  // Nitro Boost Mechanic
  public isNitroActive: boolean = false;
  public nitroTimer: number = 0;
  public nitroDuration: number = 3.5;
  public nitroCharge: number = 1.0;
  public nitroRechargeRate: number = 0.18;
  private nitroFlames: THREE.Mesh[] = [];

  constructor(private terrain: TerrainSystem) {
    this.group = new THREE.Group();
    this.chassisGroup = new THREE.Group();
    this.group.add(this.chassisGroup);

    // Build initial vehicle
    this.buildChassis(this.currentModel, this.currentPaintHex);
    const wheels = this.buildWheels();
    this.frontLeftWheel = wheels.fl;
    this.frontRightWheel = wheels.fr;
    this.rearLeftWheel = wheels.rl;
    this.rearRightWheel = wheels.rr;

    // Dust trail
    this.initDust();

    // Set initial spawn
    this.reset(WORLD_CONFIG.spawnPoint.x, WORLD_CONFIG.spawnPoint.z, WORLD_CONFIG.spawnPoint.angle);
  }

  public setVehicleConfig(model: VehicleModelType, paintHex: string) {
    this.currentModel = model;
    this.currentPaintHex = paintHex;

    // Dispose old chassis parts
    while (this.chassisGroup.children.length > 0) {
      const child = this.chassisGroup.children[0];
      this.chassisGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    }

    // Rebuild chassis for selected model
    this.buildChassis(model, paintHex);

    // Update wheel rims color
    const rimColor = new THREE.Color(paintHex);
    this.rimMeshes.forEach(rim => {
      (rim.material as THREE.MeshStandardMaterial).color.copy(rimColor);
    });
  }

  private buildChassis(model: VehicleModelType, paintHex: string) {
    const paintColor = new THREE.Color(paintHex);
    const frameMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cBuggyTrim,
      roughness: 0.6,
      metalness: 0.4,
      flatShading: true,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cBuggyMetal,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true,
    });
    const bodyMat = new THREE.MeshStandardMaterial({
      color: paintColor,
      roughness: 0.28,
      metalness: 0.25,
      flatShading: true,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cBg,
      roughness: 0.1,
      metalness: 0.9,
    });
    const lightMat = new THREE.MeshBasicMaterial({ color: PALETTE.cHeadlight });

    switch (model) {
      case 'roadster':
        this.buildRoadsterModel(bodyMat, frameMat, metalMat, glassMat, lightMat);
        break;
      case 'rover':
        this.buildRoverModel(bodyMat, frameMat, metalMat, glassMat, lightMat);
        break;
      case 'muscle':
        this.buildMuscleModel(bodyMat, frameMat, metalMat, glassMat, lightMat);
        break;
      case 'buggy':
      default:
        this.buildBuggyModel(bodyMat, frameMat, metalMat, glassMat, lightMat);
        break;
    }

    this.initNitroFlames();
  }

  private initNitroFlames() {
    this.nitroFlames = [];

    const flameGeo = new THREE.ConeGeometry(0.14, 0.7, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.9,
    });

    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.35, 0.45, -1.8);
    flameL.visible = false;

    const flameR = new THREE.Mesh(flameGeo, flameMat.clone());
    flameR.position.set(0.35, 0.45, -1.8);
    flameR.visible = false;

    this.chassisGroup.add(flameL, flameR);
    this.nitroFlames = [flameL, flameR];
  }

  /**
   * Model 1: Dune Buggy
   */
  private buildBuggyModel(
    bodyMat: THREE.Material,
    frameMat: THREE.Material,
    metalMat: THREE.Material,
    glassMat: THREE.Material,
    lightMat: THREE.Material
  ) {
    // 1. Lower chassis frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 2.6), frameMat);
    frame.position.y = 0.55;
    frame.castShadow = true;
    this.chassisGroup.add(frame);

    // 2. Main body shell (Aerodynamic wedge in vibrant paint)
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 2.1), bodyMat);
    body.position.set(0, 0.85, -0.1);
    body.castShadow = true;
    this.chassisGroup.add(body);

    // Hood scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.8), frameMat);
    scoop.position.set(0, 1.1, 0.5);
    this.chassisGroup.add(scoop);

    // 3. Cabin roll cage
    const cage = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.65, 1.2), metalMat);
    cage.position.set(0, 1.35, -0.3);
    cage.castShadow = true;
    this.chassisGroup.add(cage);

    // Dark tinted windscreen
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 1.05), glassMat);
    glass.position.set(0, 1.35, -0.3);
    this.chassisGroup.add(glass);

    // 4. Front bumper with dual headlights
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 0.3), frameMat);
    bumper.position.set(0, 0.55, 1.4);
    this.chassisGroup.add(bumper);

    const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), lightMat);
    lightL.position.set(-0.55, 0.6, 1.5);
    const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), lightMat);
    lightR.position.set(0.55, 0.6, 1.5);
    this.chassisGroup.add(lightL, lightR);

    // 5. Rear spoiler / wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.4), bodyMat);
    wing.position.set(0, 1.6, -1.2);
    const wpL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), frameMat);
    wpL.position.set(-0.6, 1.4, -1.2);
    const wpR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), frameMat);
    wpR.position.set(0.6, 1.4, -1.2);
    this.chassisGroup.add(wing, wpL, wpR);

    // 6. Dual exhaust pipes
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6);
    exhaustGeo.rotateX(Math.PI / 2);
    const exL = new THREE.Mesh(exhaustGeo, metalMat);
    exL.position.set(-0.35, 0.45, -1.4);
    const exR = new THREE.Mesh(exhaustGeo, metalMat);
    exR.position.set(0.35, 0.45, -1.4);
    this.chassisGroup.add(exL, exR);
  }

  /**
   * Model 2: Cyber Roadster (Sleek low-profile hypercar)
   */
  private buildRoadsterModel(
    bodyMat: THREE.Material,
    frameMat: THREE.Material,
    metalMat: THREE.Material,
    glassMat: THREE.Material,
    lightMat: THREE.Material
  ) {
    // Low aerodynamic wedge chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 3.0), bodyMat);
    body.position.set(0, 0.65, 0);
    body.castShadow = true;
    this.chassisGroup.add(body);

    // Sloped nose wedge
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.0), bodyMat);
    nose.position.set(0, 0.58, 1.5);
    nose.rotation.x = 0.15;
    this.chassisGroup.add(nose);

    // Sleek cockpit canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 1.4), glassMat);
    canopy.position.set(0, 0.98, -0.2);
    this.chassisGroup.add(canopy);

    // Roof fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.9), metalMat);
    fin.position.set(0, 1.25, -0.4);
    this.chassisGroup.add(fin);

    // Carbon fiber front splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.4), frameMat);
    splitter.position.set(0, 0.42, 1.85);
    this.chassisGroup.add(splitter);

    // Horizontal cyber LED headlights
    const ledL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.1), lightMat);
    ledL.position.set(-0.55, 0.6, 1.8);
    const ledR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.1), lightMat);
    ledR.position.set(0.55, 0.6, 1.8);
    this.chassisGroup.add(ledL, ledR);

    // Rear diffuser and GT aerofoil
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.3), metalMat);
    diffuser.position.set(0, 0.5, -1.55);
    const gtWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.35), bodyMat);
    gtWing.position.set(0, 1.15, -1.45);
    const gwL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.2), metalMat);
    gwL.position.set(-0.7, 0.95, -1.45);
    const gwR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.2), metalMat);
    gwR.position.set(0.7, 0.95, -1.45);
    this.chassisGroup.add(diffuser, gtWing, gwL, gwR);
  }

  /**
   * Model 3: Lunar Explorer (Heavy Sci-Fi Rover / Cyber Truck)
   */
  private buildRoverModel(
    bodyMat: THREE.Material,
    frameMat: THREE.Material,
    metalMat: THREE.Material,
    glassMat: THREE.Material,
    lightMat: THREE.Material
  ) {
    // Heavy reinforced frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 3.2), frameMat);
    frame.position.y = 0.65;
    frame.castShadow = true;
    this.chassisGroup.add(frame);

    // Front armored cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.4), bodyMat);
    cab.position.set(0, 1.1, 0.4);
    cab.castShadow = true;
    this.chassisGroup.add(cab);

    // Vertical armored visor glass
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.2), glassMat);
    visor.position.set(0, 1.25, 1.1);
    this.chassisGroup.add(visor);

    // Heavy front push bumper
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 0.25), metalMat);
    bullBar.position.set(0, 0.7, 1.7);
    this.chassisGroup.add(bullBar);

    // Roof utility searchlight bar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), metalMat);
    bar.position.set(0, 1.52, 0.85);
    this.chassisGroup.add(bar);
    for (let i = -0.5; i <= 0.5; i += 0.33) {
      const spot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.1), lightMat);
      spot.position.set(i, 1.54, 0.9);
      this.chassisGroup.add(spot);
    }

    // Rear open utility cargo bed with tech containers
    const bedSides = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.4), metalMat);
    bedSides.position.set(0, 0.95, -0.9);
    const cargo1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 8), bodyMat);
    cargo1.rotation.z = Math.PI / 2;
    cargo1.position.set(0, 1.0, -0.7);
    const cargo2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), frameMat);
    cargo2.position.set(0.4, 1.0, -1.2);
    this.chassisGroup.add(bedSides, cargo1, cargo2);
  }

  /**
   * Model 4: Turbo Cruiser (Retro High-Output Fastback)
   */
  private buildMuscleModel(
    bodyMat: THREE.Material,
    frameMat: THREE.Material,
    metalMat: THREE.Material,
    glassMat: THREE.Material,
    lightMat: THREE.Material
  ) {
    // Long muscle car body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 3.1), bodyMat);
    body.position.set(0, 0.7, 0);
    body.castShadow = true;
    this.chassisGroup.add(body);

    // Fastback roof cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.5), bodyMat);
    cabin.position.set(0, 1.1, -0.3);
    this.chassisGroup.add(cabin);

    // Fastback tinted windows
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.35, 1.2), glassMat);
    sideGlass.position.set(0, 1.1, -0.25);
    this.chassisGroup.add(sideGlass);

    // Prominent hood air-blower scoop
    const blower = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.7), metalMat);
    blower.position.set(0, 1.0, 0.75);
    this.chassisGroup.add(blower);

    // Triple intake butterfly valves
    const valve = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.08), frameMat);
    valve.position.set(0, 1.1, 1.12);
    this.chassisGroup.add(valve);

    // Classic chrome front grill & headlights
    const grill = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.15), metalMat);
    grill.position.set(0, 0.65, 1.6);
    const hl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), lightMat);
    hl1.rotation.x = Math.PI / 2;
    hl1.position.set(-0.55, 0.65, 1.68);
    const hl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), lightMat);
    hl2.rotation.x = Math.PI / 2;
    hl2.position.set(0.55, 0.65, 1.68);
    this.chassisGroup.add(grill, hl1, hl2);

    // Ducktail rear spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.25), bodyMat);
    spoiler.position.set(0, 0.95, -1.5);
    spoiler.rotation.x = -0.3;
    this.chassisGroup.add(spoiler);

    // Side-exit rumble exhaust pipes
    const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), metalMat);
    pipeL.rotation.x = Math.PI / 2;
    pipeL.position.set(-0.85, 0.45, -0.2);
    const pipeR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), metalMat);
    pipeR.rotation.x = Math.PI / 2;
    pipeR.position.set(0.85, 0.45, -0.2);
    this.chassisGroup.add(pipeL, pipeR);
  }

  private buildWheels() {
    const tireGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 8);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cBuggyWheel,
      roughness: 0.9,
      flatShading: true,
    });

    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.37, 6);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cBuggyRim,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true,
    });

    const createWheel = () => {
      const pivot = new THREE.Group();
      const roller = new THREE.Group();

      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      const rimMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.currentPaintHex),
        roughness: 0.3,
        metalness: 0.7,
        flatShading: true,
      });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      this.rimMeshes.push(rim);

      roller.add(tire, rim);
      pivot.add(roller);
      return { pivot, roller };
    };

    const halfTrack = VEHICLE_CONFIG.trackWidth / 2;
    const halfBase = VEHICLE_CONFIG.wheelBase / 2;

    // Front Left
    const wFL = createWheel();
    wFL.pivot.position.set(-halfTrack, 0.48, halfBase);
    this.group.add(wFL.pivot);

    // Front Right
    const wFR = createWheel();
    wFR.pivot.position.set(halfTrack, 0.48, halfBase);
    this.group.add(wFR.pivot);

    // Rear Left
    const wRL = createWheel();
    wRL.pivot.position.set(-halfTrack, 0.48, -halfBase);
    this.group.add(wRL.pivot);

    // Rear Right
    const wRR = createWheel();
    wRR.pivot.position.set(halfTrack, 0.48, -halfBase);
    this.group.add(wRR.pivot);

    return {
      fl: wFL.pivot,
      fr: wFR.pivot,
      rl: wRL.pivot,
      rr: wRR.pivot,
    };
  }

  private initDust() {
    this.dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.maxDust * 3);
    this.dustOpacities = new Float32Array(this.maxDust);

    for (let i = 0; i < this.maxDust; i++) {
      this.dustPositions[i * 3 + 1] = -100; // Off-screen initially
      this.dustOpacities[i] = 0;
    }

    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    const dustMat = new THREE.PointsMaterial({
      color: PALETTE.cSecondarySurfaces,
      size: 0.4,
      transparent: true,
      opacity: 0.5,
    });

    this.dustParticles = new THREE.Points(this.dustGeo, dustMat);
    // Add to world root outside vehicle so dust stays in place
  }

  public getDustMesh(): THREE.Points {
    return this.dustParticles;
  }

  public getNitroMesh(): THREE.Group {
    return this.nitroParticles.group;
  }

  public reset(x: number, z: number, angle: number = 0) {
    this.position.set(x, this.terrain.getVehicleGroundHeight(x, z), z);
    this.velocity = 0;
    this.steeringAngle = 0;
    this.heading = angle;
    this.lateralVelocity = 0;
    this.pitch = 0;
    this.roll = 0;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, this.heading, 0);
  }

  public triggerNitroBoost(): boolean {
    if (this.nitroCharge < 0.2 || this.isNitroActive) return false;
    this.isNitroActive = true;
    this.nitroTimer = this.nitroDuration;
    sound.playNitro();
    return true;
  }

  public getNitroState(): { isActive: boolean; charge: number } {
    return {
      isActive: this.isNitroActive,
      charge: this.nitroCharge,
    };
  }

  public applyNitroBoost(boostMph: number = 18) {
    this.triggerNitroBoost();
  }

  public update(delta: number, input: VehicleInput, colliders: Collider[]) {
    // 0. Nitro Boost Timer, smooth continuous drainage & recharge
    if (this.isNitroActive) {
      this.nitroTimer -= delta;
      this.nitroCharge = Math.max(0, this.nitroCharge - (delta / this.nitroDuration));

      // Animate exhaust flame cones with high-energy flicker
      this.nitroFlames.forEach(flame => {
        flame.visible = true;
        flame.scale.set(
          0.9 + Math.random() * 0.35,
          0.9 + Math.random() * 0.35,
          1.1 + Math.random() * 0.7
        );
      });

      if (this.nitroTimer <= 0 || this.nitroCharge <= 0) {
        this.isNitroActive = false;
        this.nitroFlames.forEach(flame => {
          flame.visible = false;
        });
      }
    } else {
      this.nitroFlames.forEach(flame => {
        flame.visible = false;
      });
      // Smooth continuous recharge over ~5.5s
      this.nitroCharge = Math.min(1.0, this.nitroCharge + this.nitroRechargeRate * delta);
    }

    // Update real-world 3D trailing particle stream
    this.nitroParticles.update(delta, this.isNitroActive, this.group, Math.abs(this.velocity));

    // 1. Steering dynamics
    let targetSteer = 0;
    if (input.left) targetSteer += VEHICLE_CONFIG.maxSteerAngle;
    if (input.right) targetSteer -= VEHICLE_CONFIG.maxSteerAngle;

    this.steeringAngle = THREE.MathUtils.damp(
      this.steeringAngle,
      targetSteer,
      VEHICLE_CONFIG.steerReturnSpeed,
      delta
    );

    // Rotate front wheel pivots
    this.frontLeftWheel.rotation.y = this.steeringAngle;
    this.frontRightWheel.rotation.y = this.steeringAngle;

    // 2. Throttle, Nitro Boost Ramp & Braking (smooth velocity transitions, no jumping)
    const isAccelerating = input.forward;
    const isReversing = input.backward;

    if (input.brake) {
      // Hard brake
      if (Math.abs(this.velocity) > 0.1) {
        sound.playBrake();
      }
      this.velocity = THREE.MathUtils.damp(this.velocity, 0, VEHICLE_CONFIG.brakeDeceleration, delta);
    } else if (this.isNitroActive) {
      // Balanced nitro max speed (~64 MPH / 28.5 units/s vs 53 MPH normal cruise) for exciting yet controllable driving
      const targetNitroSpeed = 28.5;
      this.velocity = THREE.MathUtils.damp(this.velocity, targetNitroSpeed, 3.2, delta);
    } else if (isAccelerating) {
      // If exiting nitro boost with velocity > maxSpeed, glide smoothly down instead of snapping
      if (this.velocity > VEHICLE_CONFIG.maxSpeed) {
        this.velocity = THREE.MathUtils.damp(this.velocity, VEHICLE_CONFIG.maxSpeed, 2.2, delta);
      } else {
        this.velocity += VEHICLE_CONFIG.acceleration * delta;
        if (this.velocity > VEHICLE_CONFIG.maxSpeed) this.velocity = VEHICLE_CONFIG.maxSpeed;
      }
    } else if (isReversing) {
      this.velocity -= VEHICLE_CONFIG.acceleration * 0.7 * delta;
      if (this.velocity < -VEHICLE_CONFIG.reverseMaxSpeed) this.velocity = -VEHICLE_CONFIG.reverseMaxSpeed;
    } else {
      // Natural rolling friction, glide smoothly
      if (this.velocity > VEHICLE_CONFIG.maxSpeed) {
        this.velocity = THREE.MathUtils.damp(this.velocity, 0, VEHICLE_CONFIG.naturalFriction * 0.7, delta);
      } else {
        this.velocity = THREE.MathUtils.damp(this.velocity, 0, VEHICLE_CONFIG.naturalFriction, delta);
      }
    }

    // Update sound synthesizer pitch and aerodynamic wind
    const normalizedSpeed = Math.abs(this.velocity) / VEHICLE_CONFIG.maxSpeed;
    sound.updateEngine(normalizedSpeed, isAccelerating || this.isNitroActive);
    sound.updateWind(normalizedSpeed);

    // 3. Angular Yaw turning (Ackermann-like approximation)
    if (Math.abs(this.velocity) > 0.1) {
      const turnFactor = this.steeringAngle * (this.velocity / VEHICLE_CONFIG.wheelBase);
      this.heading += turnFactor * delta;
    }

    // 4. Proposed displacement
    const moveX = Math.sin(this.heading) * this.velocity * delta;
    const moveZ = Math.cos(this.heading) * this.velocity * delta;

    let nextX = this.position.x + moveX;
    let nextZ = this.position.z + moveZ;

    // 5. Obstacle Collision Detection & Resolution
    const vehicleRadius = 1.3;
    let collided = false;

    for (const c of colliders) {
      const dx = nextX - c.x;
      const dz = nextZ - c.z;
      const dist = Math.hypot(dx, dz);
      const minDist = vehicleRadius + c.radius;

      if (dist < minDist && dist > 0.001) {
        collided = true;
        // Push vehicle back along collision normal
        const overlap = minDist - dist;
        nextX += (dx / dist) * overlap;
        nextZ += (dz / dist) * overlap;
        this.velocity *= 0.35; // Absorbs impact energy
      }
    }

    // World boundary collision (steep natural mountains)
    const distFromCenter = Math.hypot(nextX, nextZ);
    if (distFromCenter > WORLD_CONFIG.playableRadius) {
      const pushback = distFromCenter - WORLD_CONFIG.playableRadius;
      nextX -= (nextX / distFromCenter) * pushback;
      nextZ -= (nextZ / distFromCenter) * pushback;
      this.velocity *= 0.2;
    }

    // Apply resolved position
    this.position.x = nextX;
    this.position.z = nextZ;
    this.position.y = this.terrain.getVehicleGroundHeight(this.position.x, this.position.z);

    // 6. Terrain normal orientation & suspension tilt
    const groundNormal = this.terrain.getNormal(this.position.x, this.position.z);

    // Calculate vehicle orientation matrix aligned to normal + heading
    const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const rightVec = new THREE.Vector3().crossVectors(groundNormal, forwardVec).normalize();
    const alignedForward = new THREE.Vector3().crossVectors(rightVec, groundNormal).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(rightVec, groundNormal, alignedForward);
    this.group.quaternion.setFromRotationMatrix(rotMatrix);
    this.group.position.copy(this.position);

    // 7. Dynamic Chassis Suspension Lean
    const targetPitch = (this.velocity / VEHICLE_CONFIG.maxSpeed) * 0.08 - (input.brake ? 0.12 : 0);
    const targetRoll = -this.steeringAngle * (this.velocity / VEHICLE_CONFIG.maxSpeed) * 0.22;

    this.pitch = THREE.MathUtils.damp(this.pitch, targetPitch, 8, delta);
    this.roll = THREE.MathUtils.damp(this.roll, targetRoll, 8, delta);
    this.chassisGroup.rotation.x = this.pitch;
    this.chassisGroup.rotation.z = this.roll;

    // 8. Roll wheels
    const rollAngle = (this.velocity / VEHICLE_CONFIG.wheelRadius) * delta;
    this.frontLeftWheel.children[0].rotation.x += rollAngle;
    this.frontRightWheel.children[0].rotation.x += rollAngle;
    this.rearLeftWheel.children[0].rotation.x += rollAngle;
    this.rearRightWheel.children[0].rotation.x += rollAngle;

    // 9. Dust trail emission
    if (Math.abs(this.velocity) > 6 && !this.terrain.isRoadArea(this.position.x, this.position.z)) {
      this.emitDust();
    }
    this.updateDust(delta);
  }

  private emitDust() {
    const idx = this.dustIndex * 3;
    // Emit from rear wheels
    this.dustPositions[idx] = this.position.x - Math.sin(this.heading) * 1.2 + (Math.random() - 0.5) * 0.8;
    this.dustPositions[idx + 1] = this.position.y + 0.2;
    this.dustPositions[idx + 2] = this.position.z - Math.cos(this.heading) * 1.2 + (Math.random() - 0.5) * 0.8;
    this.dustOpacities[this.dustIndex] = 0.6;

    this.dustIndex = (this.dustIndex + 1) % this.maxDust;
    this.dustGeo.attributes.position.needsUpdate = true;
  }

  private updateDust(delta: number) {
    for (let i = 0; i < this.maxDust; i++) {
      if (this.dustOpacities[i] > 0) {
        this.dustPositions[i * 3 + 1] += delta * 0.5; // Rise gently
        this.dustOpacities[i] -= delta * 1.2;
        if (this.dustOpacities[i] <= 0) {
          this.dustPositions[i * 3 + 1] = -100;
        }
      }
    }
    this.dustGeo.attributes.position.needsUpdate = true;
  }

  public getSpeedMph(): number {
    return Math.round(Math.abs(this.velocity) * 2.236);
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
    this.dustGeo.dispose();
    this.nitroParticles.dispose();
  }
}
