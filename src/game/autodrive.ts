/**
 * Autonomous Vehicle Self-Driving System for NIERO.EXE
 * Actively takes the wheel of the player's car/buggy, steering and cruising it
 * smoothly between all 12 architectural project monuments across the island,
 * gracefully stopping at each monument to showcase it to the user.
 */

import * as THREE from 'three';
import { PROJECTS, Project } from '../data/portfolioData';
import { Vehicle, VehicleInput } from './vehicle';
import { TerrainSystem } from './terrain';
import { VEHICLE_CONFIG } from './constants';
import { sound } from './audio';

export interface AutoDriveWaypoint {
  project: Project;
  targetX: number;
  targetZ: number;
  approachAngle: number;
}

export class AutoDriveSystem {
  public isActive: boolean = false;
  public waypoints: AutoDriveWaypoint[] = [];
  public currentWaypointIndex: number = 0;
  private isDwelling: boolean = false;
  private dwellTimer: number = 0;
  private dwellDuration: number = 4.5; // seconds to pause and showcase monument
  private onLandmarkShow: ((project: Project | null) => void) | null = null;

  constructor(private terrain: TerrainSystem) {
    this.buildWaypoints();
  }

  private buildWaypoints() {
    // Sequence the 12 projects in a smooth loop around the island
    const orderedProjectIds = [
      'postcode-atlas',
      'smart-school-erp',
      'channels-tv-platform',
      'proofmark',
      'dev-utilities-hub',
      'fast-file-transfers',
      'mova',
      'xfund-system',
      'edward-consulting',
      'know-your-rights',
      'use-dark-switch',
      'sql-cheatsheet',
    ];

    orderedProjectIds.forEach(id => {
      const proj = PROJECTS.find(p => p.id === id);
      if (!proj) return;

      const px = proj.coordinates.x;
      const pz = proj.coordinates.z;

      // Position parking waypoint slightly offset towards center plaza so monument is right in front of the car
      const angleToCenter = Math.atan2(-pz, -px);
      const stopDist = 6.2;
      const targetX = px + Math.cos(angleToCenter) * stopDist;
      const targetZ = pz + Math.sin(angleToCenter) * stopDist;
      const approachAngle = Math.atan2(px - targetX, pz - targetZ);

      this.waypoints.push({
        project: proj,
        targetX,
        targetZ,
        approachAngle,
      });
    });
  }

  public startAutoDrive(
    vehiclePos: THREE.Vector3,
    onLandmarkShow: (project: Project | null) => void
  ) {
    this.isActive = true;
    this.isDwelling = false;
    this.dwellTimer = 0;
    this.onLandmarkShow = onLandmarkShow;

    // Pick closest waypoint to car
    let nearestIdx = 0;
    let minDist = Infinity;

    this.waypoints.forEach((wp, idx) => {
      const dist = Math.hypot(vehiclePos.x - wp.targetX, vehiclePos.z - wp.targetZ);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });

    this.currentWaypointIndex = nearestIdx;
    this.onLandmarkShow?.(this.waypoints[this.currentWaypointIndex].project);
  }

  public stopAutoDrive() {
    this.isActive = false;
    this.isDwelling = false;
    this.dwellTimer = 0;
    this.onLandmarkShow?.(null);
  }

  public getCurrentProject(): Project | null {
    if (!this.isActive || this.waypoints.length === 0) return null;
    return this.waypoints[this.currentWaypointIndex].project;
  }

  /**
   * Autonomous driving step: Directly steers and throttles vehicle to target
   */
  public update(
    delta: number,
    vehicle: Vehicle
  ): {
    input: VehicleInput;
    activeProject: Project | null;
    isDwelling: boolean;
  } {
    const input: VehicleInput = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false,
    };

    if (!this.isActive || this.waypoints.length === 0) {
      return { input, activeProject: null, isDwelling: false };
    }

    const currentWp = this.waypoints[this.currentWaypointIndex];

    // State A: Dwelling (Holding vehicle still in front of project monument)
    if (this.isDwelling) {
      input.brake = true;
      vehicle.velocity = THREE.MathUtils.damp(vehicle.velocity, 0, 10, delta);
      sound.updateEngine(0.08, false);

      this.dwellTimer += delta;
      if (this.dwellTimer >= this.dwellDuration) {
        // Finished viewing! Move onto next project monument
        this.isDwelling = false;
        this.dwellTimer = 0;
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
        this.onLandmarkShow?.(this.waypoints[this.currentWaypointIndex].project);
      }

      return { input, activeProject: currentWp.project, isDwelling: true };
    }

    // State B: Driving to current project waypoint
    const dx = currentWp.targetX - vehicle.position.x;
    const dz = currentWp.targetZ - vehicle.position.z;
    const dist = Math.hypot(dx, dz);

    // If within parking stopping distance, enter dwell
    if (dist < 4.0) {
      this.isDwelling = true;
      this.dwellTimer = 0;
      vehicle.velocity = 0;
      input.brake = true;
      this.onLandmarkShow?.(currentWp.project);
      sound.playCheckpoint();
      return { input, activeProject: currentWp.project, isDwelling: true };
    }

    // 1. Steering: Steer towards target waypoint
    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - vehicle.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Smoothly turn front wheels and vehicle heading
    const maxTurnRate = 2.4; // radians/sec
    const desiredSteer = THREE.MathUtils.clamp(
      angleDiff * 1.6,
      -VEHICLE_CONFIG.maxSteerAngle,
      VEHICLE_CONFIG.maxSteerAngle
    );

    vehicle.steeringAngle = THREE.MathUtils.damp(
      vehicle.steeringAngle,
      desiredSteer,
      8.0,
      delta
    );
    vehicle.frontLeftWheel.rotation.y = vehicle.steeringAngle;
    vehicle.frontRightWheel.rotation.y = vehicle.steeringAngle;

    // Turn heading based on current speed
    vehicle.heading += THREE.MathUtils.clamp(angleDiff * 2.8, -maxTurnRate, maxTurnRate) * delta;

    // 2. Throttle / Speed Control
    // Cruise at 18-22 MPH on open stretches, slow down as approaching
    let targetSpeedUnits = 9.0; // ~20 MPH
    if (dist < 14) {
      targetSpeedUnits = Math.max(2.5, (dist / 14) * 8.5);
    }
    if (Math.abs(angleDiff) > 0.6) {
      targetSpeedUnits = Math.min(targetSpeedUnits, 4.5); // Slow down for sharp turns
    }

    vehicle.velocity = THREE.MathUtils.damp(vehicle.velocity, targetSpeedUnits, 3.5, delta);
    sound.updateEngine(vehicle.velocity / VEHICLE_CONFIG.maxSpeed, true);

    // 3. Move vehicle forward along heading
    vehicle.position.x += Math.sin(vehicle.heading) * vehicle.velocity * delta;
    vehicle.position.z += Math.cos(vehicle.heading) * vehicle.velocity * delta;
    vehicle.position.y = this.terrain.getVehicleGroundHeight(
      vehicle.position.x,
      vehicle.position.z
    );

    // 4. Orient vehicle to ground normal & heading
    const groundNormal = this.terrain.getNormal(vehicle.position.x, vehicle.position.z);
    const forwardVec = new THREE.Vector3(Math.sin(vehicle.heading), 0, Math.cos(vehicle.heading));
    const rightVec = new THREE.Vector3().crossVectors(groundNormal, forwardVec).normalize();
    const alignedForward = new THREE.Vector3().crossVectors(rightVec, groundNormal).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(rightVec, groundNormal, alignedForward);
    vehicle.group.quaternion.setFromRotationMatrix(rotMatrix);
    vehicle.group.position.copy(vehicle.position);

    // 5. Roll wheels
    const rollAngle = (vehicle.velocity / VEHICLE_CONFIG.wheelRadius) * delta;
    vehicle.frontLeftWheel.children[0].rotation.x += rollAngle;
    vehicle.frontRightWheel.children[0].rotation.x += rollAngle;
    vehicle.rearLeftWheel.children[0].rotation.x += rollAngle;
    vehicle.rearRightWheel.children[0].rotation.x += rollAngle;

    input.forward = true;
    return { input, activeProject: currentWp.project, isDwelling: false };
  }
}
