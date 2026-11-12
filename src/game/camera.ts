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
  public currentDist: number = CAMERA_CONFIG.distance;
  private isUserPanning: boolean = false;
  private timeSinceLastPan: number = 999;
  private targetFov: number = CAMERA_CONFIG.fov;
  private cinematicTarget: { camPos: THREE.Vector3; lookAt: THREE.Vector3 } | null = null;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      aspect,
      0.1,
      500
    );
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public triggerBoostFOV() {
    this.targetFov = 56;
  }

  public setCinematicTarget(target: { camPos: THREE.Vector3; lookAt: THREE.Vector3 } | null) {
    this.cinematicTarget = target;
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public setInspectTarget(target: THREE.Vector3 | null) {
    this.inspectTarget = target ? target.clone() : null;
    this.inspectAngle = 0;
  }

  public addOrbit(deltaYaw: number, deltaPitch: number) {
    this.orbitYaw += deltaYaw;
    this.orbitPitch = THREE.MathUtils.clamp(this.orbitPitch + deltaPitch, -0.35, 0.75);
    this.isUserPanning = true;
    this.timeSinceLastPan = 0;
  }

  public endPan() {
    this.isUserPanning = false;
  }

  public zoom(deltaZoom: number) {
    this.currentDist = THREE.MathUtils.clamp(this.currentDist + deltaZoom, 8, 30);
  }

  public resetOrbit() {
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.currentDist = CAMERA_CONFIG.distance;
  }

  public update(delta: number, vehicle: Vehicle, terrain: TerrainSystem) {
    this.timeSinceLastPan += delta;

    // Smooth FOV recovery
    if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 4.0, delta);
      this.camera.updateProjectionMatrix();
    }
    this.targetFov = THREE.MathUtils.damp(this.targetFov, CAMERA_CONFIG.fov, 1.5, delta);

    if (this.cinematicTarget) {
      // Cinematic auto-pilot tour override
      this.currentPos.lerp(this.cinematicTarget.camPos, Math.min(delta * 3.5, 0.15));
      this.currentLookAt.lerp(this.cinematicTarget.lookAt, Math.min(delta * 4.0, 0.18));
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

      // If user isn't actively panning and buggy is driving forward, gently decay orbit back behind vehicle
      if (!this.isUserPanning && vehicleSpeed > 3 && this.timeSinceLastPan > 2.0) {
        this.orbitYaw = THREE.MathUtils.damp(this.orbitYaw, 0, 1.8, delta);
        this.orbitPitch = THREE.MathUtils.damp(this.orbitPitch, 0, 1.8, delta);
      }

      const totalHeading = vehicle.heading + this.orbitYaw;
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

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }
}
