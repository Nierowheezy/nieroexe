/**
 * Camera Controller for NIERO.EXE
 * Smooth third-person chase camera with interactive 360° pan/orbit, look-ahead,
 * terrain clearance, zoom, and landmark inspection focus modes.
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from './constants';
import { Vehicle } from './vehicle';
import { TerrainSystem } from './terrain';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private currentPos: THREE.Vector3 = new THREE.Vector3(0, 15, -30);
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 1, -16);
  private inspectTarget: THREE.Vector3 | null = null;
  private inspectAngle: number = 0;

  // Interactive Orbit & Pan Controls
  public orbitYaw: number = 0; // Horizontal orbit offset (radians)
  public orbitPitch: number = 0; // Vertical pitch offset (radians)
  private baseFov: number = CAMERA_CONFIG.fov;
  private baseDistance: number = CAMERA_CONFIG.distance;
  public currentDist: number = CAMERA_CONFIG.distance;
  private isUserPanning: boolean = false;
  private timeSinceLastPan: number = 999;
  private targetFov: number = CAMERA_CONFIG.fov;
  private cinematicTarget: { camPos: THREE.Vector3; lookAt: THREE.Vector3 } | null = null;

  // Smooth yaw follow & subtle banking tilt during turns
  private smoothedHeading: number = 0;
  private prevVehicleHeading: number = 0;
  private hasInitializedHeading: boolean = false;
  private currentTilt: number = 0;

  constructor(aspect: number) {
    this.updateViewportForAspect(aspect, true);
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      aspect,
      0.1,
      500
    );
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  private updateViewportForAspect(aspect: number, resetZoom: boolean = false) {
    const safeAspect = Math.max(0.35, aspect);
    if (safeAspect < 1.0) {
      // Portrait mobile (e.g. iPhone 16): widen vertical FOV and pull camera back slightly so road & surroundings aren't cropped
      this.baseFov = THREE.MathUtils.clamp(
        CAMERA_CONFIG.fov / Math.pow(safeAspect, 0.38),
        CAMERA_CONFIG.fov,
        68
      );
      this.baseDistance = THREE.MathUtils.clamp(
        CAMERA_CONFIG.distance + (1 - safeAspect) * 4.5,
        CAMERA_CONFIG.distance,
        17.5
      );
    } else {
      this.baseFov = CAMERA_CONFIG.fov;
      this.baseDistance = CAMERA_CONFIG.distance;
    }

    if (resetZoom) {
      this.currentDist = this.baseDistance;
      this.targetFov = this.baseFov;
    }
  }

  public triggerBoostFOV() {
    this.targetFov = this.baseFov + 8;
  }

  public setCinematicTarget(target: { camPos: THREE.Vector3; lookAt: THREE.Vector3 } | null) {
    this.cinematicTarget = target;
  }

  public resize(width: number, height: number) {
    const aspect = width / Math.max(1, height);
    this.updateViewportForAspect(aspect, false);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public setInspectTarget(target: THREE.Vector3 | null) {
    this.inspectTarget = target ? target.clone() : null;
    this.inspectAngle = 0;
  }

  public addOrbit(deltaYaw: number, deltaPitch: number) {
    this.orbitYaw += deltaYaw;
    this.orbitPitch = THREE.MathUtils.clamp(this.orbitPitch + deltaPitch, -0.3, 1.15);
    this.isUserPanning = true;
    this.timeSinceLastPan = 0;
  }

  public endPan() {
    this.isUserPanning = false;
  }

  public zoom(deltaZoom: number) {
    this.currentDist = THREE.MathUtils.clamp(this.currentDist + deltaZoom, 8, 32);
  }

  public resetOrbit() {
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.currentDist = this.baseDistance;
  }

  private normalizeAngleDiff(target: number, current: number): number {
    let diff = target - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  public update(delta: number, vehicle: Vehicle, terrain: TerrainSystem) {
    this.timeSinceLastPan += delta;

    // Initialize heading tracking on first frame
    if (!this.hasInitializedHeading) {
      this.smoothedHeading = vehicle.heading;
      this.prevVehicleHeading = vehicle.heading;
      this.hasInitializedHeading = true;
    }

    // Measure vehicle yaw rotation rate (rad/s) for subtle camera tilt
    const yawDelta = this.normalizeAngleDiff(vehicle.heading, this.prevVehicleHeading);
    this.prevVehicleHeading = vehicle.heading;
    // Ignore large instantaneous jumps (e.g. reset / teleport)
    const isTeleportJump = Math.abs(yawDelta) > 0.5;
    const yawRate = !isTeleportJump && delta > 0.001 ? yawDelta / delta : 0;

    // Smooth FOV recovery to responsive baseFov
    if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 4.0, delta);
      this.camera.updateProjectionMatrix();
    }
    this.targetFov = THREE.MathUtils.damp(this.targetFov, this.baseFov, 1.5, delta);

    let targetTilt = 0;

    if (this.cinematicTarget) {
      // Cinematic auto-pilot tour override
      this.currentPos.lerp(this.cinematicTarget.camPos, Math.min(delta * 3.5, 0.15));
      this.currentLookAt.lerp(this.cinematicTarget.lookAt, Math.min(delta * 4.0, 0.18));
      this.smoothedHeading = vehicle.heading;
    } else if (this.inspectTarget) {
      // Orbit smoothly around landmark
      this.inspectAngle += delta * 0.35;
      const dist = 9.5;
      const targetCamX = this.inspectTarget.x + Math.sin(this.inspectAngle) * dist;
      const targetCamZ = this.inspectTarget.z + Math.cos(this.inspectAngle) * dist;
      const targetCamY = this.inspectTarget.y + 4.5;

      this.currentPos.x = THREE.MathUtils.damp(this.currentPos.x, targetCamX, 3.5, delta);
      this.currentPos.y = THREE.MathUtils.damp(this.currentPos.y, targetCamY, 3.5, delta);
      this.currentPos.z = THREE.MathUtils.damp(this.currentPos.z, targetCamZ, 3.5, delta);

      this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, this.inspectTarget.x, 4.0, delta);
      this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, this.inspectTarget.y + 1.2, 4.0, delta);
      this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, this.inspectTarget.z, 4.0, delta);
    } else {
      // Third-person vehicle chase mode with interactive orbit
      const vehicleSpeed = Math.abs(vehicle.velocity);

      // Give users 4 seconds after panning before gently centering behind the car while driving
      if (!this.isUserPanning && vehicleSpeed > 3 && this.timeSinceLastPan > 4.0) {
        this.orbitYaw = THREE.MathUtils.damp(this.orbitYaw, 0, 1.2, delta);
        this.orbitPitch = THREE.MathUtils.damp(this.orbitPitch, 0, 1.2, delta);
      }

      // Smoothly trail vehicle heading so turns feel weighty and fluid rather than snappy
      if (isTeleportJump) {
        this.smoothedHeading = vehicle.heading;
      } else {
        const headingDiff = this.normalizeAngleDiff(vehicle.heading, this.smoothedHeading);
        const followFactor = 1 - Math.exp(-4.2 * delta);
        this.smoothedHeading += headingDiff * followFactor;
      }

      // Subtle camera bank/tilt following vehicle yaw rotation during turns (~3-4 deg max)
      if (vehicleSpeed > 1.0 && !this.isUserPanning) {
        targetTilt = THREE.MathUtils.clamp(yawRate * 0.038, -0.07, 0.07);
      }

      const totalHeading = this.smoothedHeading + this.orbitYaw;
      const horizontalDist = this.currentDist * Math.cos(this.orbitPitch);
      const verticalOffset = this.currentDist * Math.sin(this.orbitPitch);

      // Ideal camera position behind vehicle + orbit angle
      const idealX = vehicle.position.x - Math.sin(totalHeading) * horizontalDist;
      const idealZ = vehicle.position.z - Math.cos(totalHeading) * horizontalDist;

      // Ensure camera stays safely above terrain
      const groundAtCam = terrain.getHeight(idealX, idealZ);
      const idealY = Math.max(
        vehicle.position.y + CAMERA_CONFIG.height + verticalOffset,
        groundAtCam + 2.5
      );

      // Smooth exponential damping
      const damping = CAMERA_CONFIG.damping;
      this.currentPos.x = THREE.MathUtils.damp(this.currentPos.x, idealX, damping, delta);
      this.currentPos.y = THREE.MathUtils.damp(this.currentPos.y, idealY, damping, delta);
      this.currentPos.z = THREE.MathUtils.damp(this.currentPos.z, idealZ, damping, delta);

      // Look at target: slightly ahead of vehicle in direction of heading
      const lookDist = CAMERA_CONFIG.lookAheadDist;
      const targetLookX = vehicle.position.x + Math.sin(vehicle.heading) * lookDist;
      const targetLookZ = vehicle.position.z + Math.cos(vehicle.heading) * lookDist;
      const targetLookY = vehicle.position.y + CAMERA_CONFIG.lookAheadHeight;

      this.currentLookAt.x = THREE.MathUtils.damp(this.currentLookAt.x, targetLookX, damping * 1.2, delta);
      this.currentLookAt.y = THREE.MathUtils.damp(this.currentLookAt.y, targetLookY, damping * 1.2, delta);
      this.currentLookAt.z = THREE.MathUtils.damp(this.currentLookAt.z, targetLookZ, damping * 1.2, delta);
    }

    // Smoothly damp camera banking tilt
    this.currentTilt = THREE.MathUtils.damp(this.currentTilt, targetTilt, 4.5, delta);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);

    // Apply subtle horizon tilt along camera's forward axis after lookAt
    if (Math.abs(this.currentTilt) > 0.0001) {
      this.camera.rotateZ(this.currentTilt);
    }
  }
}
