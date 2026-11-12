/**
 * Terrain system for NIERO.EXE
 * Provides procedural height calculation, surface normals, and low-poly terrain geometry.
 * Strictly adheres to the color palette:
 * - Primary environment: #17242D
 * - Secondary surfaces: #24343D
 * - River canal / water: #111c24
 */

import * as THREE from 'three';
import { PALETTE, WORLD_CONFIG, EnvironmentTheme } from './constants';

export class TerrainSystem {
  public mesh: THREE.Mesh;
  public riverMesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;

  constructor() {
    const size = WORLD_CONFIG.size;
    const segments = 120; // Crisp low-poly resolution

    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.geometry.rotateX(-Math.PI / 2); // Lay horizontal in XZ plane

    const pos = this.geometry.attributes.position;
    const colors: number[] = [];
    const colorA = new THREE.Color(PALETTE.cPrimaryEnv);
    const colorB = new THREE.Color(PALETTE.cSecondarySurfaces);
    const colorSage = new THREE.Color(PALETTE.cSecondaryAccent);
    const tempColor = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeight(x, z);
      pos.setY(i, y);

      // Low-poly vertex shading based on slope & feature
      const distFromCenter = Math.hypot(x, z);
      const isRoad = this.isRoadArea(x, z);

      if (isRoad) {
        tempColor.copy(colorB).multiplyScalar(0.9);
      } else if (y > 3.0) {
        // Mountain rock terrace
        tempColor.copy(colorB);
      } else if (distFromCenter < 24) {
        // Central hub tint
        tempColor.copy(colorA).lerp(colorSage, 0.08);
      } else {
        tempColor.copy(colorA);
        // Subtle natural variety
        const noise = (Math.sin(x * 0.2) + Math.cos(z * 0.2)) * 0.04;
        tempColor.addScalar(noise);
      }

      colors.push(tempColor.r, tempColor.g, tempColor.b);
    }

    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, terrainMaterial);
    this.mesh.receiveShadow = true;

    // Create subtle water canal
    const riverGeo = new THREE.PlaneGeometry(size * 0.9, 14, 32, 8);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cWater,
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.88,
      flatShading: true,
    });
    this.riverMesh = new THREE.Mesh(riverGeo, riverMat);
    this.riverMesh.position.set(0, -0.4, 0);
    this.riverMesh.receiveShadow = true;
  }

  public setTheme(theme: EnvironmentTheme) {
    const pos = this.geometry.attributes.position;
    const colorAttr = this.geometry.attributes.color;
    const colorA = new THREE.Color(theme.primaryEnvNum);
    const colorB = new THREE.Color(theme.secondarySurfacesNum);
    const colorAccent = new THREE.Color(theme.hemiSkyNum);
    const tempColor = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = pos.getY(i);
      const distFromCenter = Math.hypot(x, z);
      const isRoad = this.isRoadArea(x, z);

      if (isRoad) {
        tempColor.copy(colorB).multiplyScalar(0.9);
      } else if (y > 3.0) {
        tempColor.copy(colorB);
      } else if (distFromCenter < 24) {
        tempColor.copy(colorA).lerp(colorAccent, 0.08);
      } else {
        tempColor.copy(colorA);
        const noise = (Math.sin(x * 0.2) + Math.cos(z * 0.2)) * 0.04;
        tempColor.addScalar(noise);
      }

      colorAttr.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
    }

    colorAttr.needsUpdate = true;
    (this.riverMesh.material as THREE.MeshStandardMaterial).color.setHex(theme.waterNum);
  }

  /**
   * Pure mathematical height function for the terrain
   */
  public getHeight(x: number, z: number): number {
    const dist = Math.hypot(x, z);

    // Natural mountain boundary to prevent driving off map
    if (dist > WORLD_CONFIG.playableRadius) {
      const edgeFactor = (dist - WORLD_CONFIG.playableRadius) / 8;
      return Math.min(14, edgeFactor * edgeFactor * 2.2);
    }

    // River channel along Z = 0 (-7 < z < 7)
    const bridgeSpanX = Math.abs(x) < 7;
    const inRiverTrough = Math.abs(z) < 7;

    if (inRiverTrough) {
      if (bridgeSpanX) {
        // On bridge road path
        return 0.1; // Bridge will sit directly on this
      }
      // River bed depression
      const riverDepth = (1 - Math.abs(z) / 7);
      return -1.4 * riverDepth;
    }

    // Central plaza area (flat for easy starting navigation)
    if (dist < 18) {
      return 0.05;
    }

    // Elevated scenic viewpoint / Overlook hill (North-East: x: 30..50, z: -40..-20)
    const dxOverlook = x - 38;
    const dzOverlook = z - (-28);
    const distOverlook = Math.hypot(dxOverlook, dzOverlook);
    if (distOverlook < 16) {
      const h = (1 - distOverlook / 16);
      return h * h * 4.2;
    }

    // Elevated ridge (West: x: -45, z: 20)
    const dxRidge = x - (-40);
    const dzRidge = z - 25;
    const distRidge = Math.hypot(dxRidge, dzRidge);
    if (distRidge < 15) {
      return (1 - distRidge / 15) * 3.0;
    }

    // Gentle rolling terrain
    const wave1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.6;
    const wave2 = Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.05) * 0.8;

    return Math.max(0, wave1 + wave2);
  }

  /**
   * Returns vehicle ground height, taking into account the arch bridge over the river
   */
  public getVehicleGroundHeight(x: number, z: number): number {
    // Check if vehicle is on the bridge
    // Bridge spans from z = -12 to z = 12, width x = -4 to 4
    if (Math.abs(x) < 4.2 && Math.abs(z) < 12.5) {
      // Smooth arch height over the river
      const archFactor = 1 - Math.pow(z / 12.5, 2);
      return 0.4 + archFactor * 1.5;
    }

    return this.getHeight(x, z);
  }

  /**
   * Calculates surface normal vector at (x, z)
   */
  public getNormal(x: number, z: number): THREE.Vector3 {
    const eps = 0.5;
    const hL = this.getVehicleGroundHeight(x - eps, z);
    const hR = this.getVehicleGroundHeight(x + eps, z);
    const hD = this.getVehicleGroundHeight(x, z - eps);
    const hU = this.getVehicleGroundHeight(x, z + eps);

    const normal = new THREE.Vector3(hL - hR, 2 * eps, hD - hU);
    normal.normalize();
    return normal;
  }

  /**
   * Check if coordinate is near road
   */
  public isRoadArea(x: number, z: number): boolean {
    // Main north-south road through bridge
    if (Math.abs(x) < 4.2 && Math.abs(z) < 55) return true;

    // Loop road around projects
    const r = Math.hypot(x, z);
    if (r > 32 && r < 40) return true;

    // Diagonal branch to landmark 1 & 2
    if (Math.abs(x - z) < 4 && r < 45) return true;

    return false;
  }

  public updateWater(time: number) {
    // Subtle procedural ripple for water, never jarring (per prompt rule: water surface very subtly)
    if (this.riverMesh) {
      this.riverMesh.position.y = -0.4 + Math.sin(time * 1.2) * 0.03;
    }
  }

  public dispose() {
    this.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
