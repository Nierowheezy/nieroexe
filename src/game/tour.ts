/**
 * Cinematic Showcase Tour Controller for NIERO.EXE
 * Smoothly flies visitors along a 3D spline showcase visiting all 12 project monuments
 * and scenic terrain vistas with broadcast lower-third project introductions.
 */

import * as THREE from 'three';
import { PROJECTS, Project } from '../data/portfolioData';
import { TerrainSystem } from './terrain';

export interface TourWaypoint {
  pos: THREE.Vector3;
  lookAt: THREE.Vector3;
  project?: Project;
  dwellDuration: number; // in seconds
}

export class CinematicTourSystem {
  public isActive: boolean = false;
  private waypoints: TourWaypoint[] = [];
  private curve!: THREE.CatmullRomCurve3;
  private lookCurve!: THREE.CatmullRomCurve3;

  private progress: number = 0; // 0..1 along curve
  private tourSpeed: number = 0.018; // Speed along curve per sec
  private currentProject: Project | null = null;
  private onLandmarkFocus: ((project: Project | null) => void) | null = null;

  constructor(private terrain: TerrainSystem) {
    this.buildWaypoints();
  }

  private buildWaypoints() {
    const points: THREE.Vector3[] = [];
    const lookPoints: THREE.Vector3[] = [];

    // 1. High aerial starting overview
    points.push(new THREE.Vector3(0, 32, -45));
    lookPoints.push(new THREE.Vector3(0, 2, -10));

    // Map through key showcase projects in scenic order
    PROJECTS.forEach(proj => {
      const px = proj.coordinates.x;
      const pz = proj.coordinates.z;
      const py = this.terrain.getHeight(px, pz);

      // Camera flies slightly offset and elevated from the monument
      const angle = Math.atan2(pz, px);
      const camOffsetDist = 12;
      const camX = px + Math.cos(angle) * camOffsetDist;
      const camZ = pz + Math.sin(angle) * camOffsetDist;
      const camY = Math.max(py + 4.5, 6.0);

      const targetPos = new THREE.Vector3(camX, camY, camZ);
      const lookPos = new THREE.Vector3(px, py + 1.8, pz);

      points.push(targetPos);
      lookPoints.push(lookPos);

      this.waypoints.push({
        pos: targetPos,
        lookAt: lookPos,
        project: proj,
        dwellDuration: 4.5,
      });
    });

    // Arch bridge pass
    points.push(new THREE.Vector3(0, 8, -6));
    lookPoints.push(new THREE.Vector3(0, 3, 14));

    // Overlook summit pass
    points.push(new THREE.Vector3(42, 10, -22));
    lookPoints.push(new THREE.Vector3(0, 2, 0));

    // Loop back to plaza
    points.push(new THREE.Vector3(0, 14, -36));
    lookPoints.push(new THREE.Vector3(0, 1, -16));

    this.curve = new THREE.CatmullRomCurve3(points, true);
    this.lookCurve = new THREE.CatmullRomCurve3(lookPoints, true);
  }

  public startTour(onLandmarkFocus: (project: Project | null) => void) {
    this.isActive = true;
    this.progress = 0;
    this.currentProject = null;
    this.onLandmarkFocus = onLandmarkFocus;
  }

  public stopTour() {
    this.isActive = false;
    this.currentProject = null;
    this.onLandmarkFocus?.(null);
  }

  public update(delta: number): { camPos: THREE.Vector3; lookAt: THREE.Vector3 } | null {
    if (!this.isActive) return null;

    this.progress = (this.progress + this.tourSpeed * delta) % 1.0;

    const cameraPos = this.curve.getPointAt(this.progress);
    const lookAtPos = this.lookCurve.getPointAt(this.progress);

    // Find nearest project landmark in view
    let nearestProj: Project | null = null;
    let minDist = 18;

    for (const proj of PROJECTS) {
      const dist = Math.hypot(lookAtPos.x - proj.coordinates.x, lookAtPos.z - proj.coordinates.z);
      if (dist < minDist) {
        minDist = dist;
        nearestProj = proj;
      }
    }

    if (nearestProj !== this.currentProject) {
      this.currentProject = nearestProj;
      this.onLandmarkFocus?.(this.currentProject);
    }

    return { camPos: cameraPos, lookAt: lookAtPos };
  }
}
