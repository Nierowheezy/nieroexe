/**
 * Environment System for NIERO.EXE
 * Creates all static landscape features: roads, arch bridge, instanced trees, rocks, streetlights,
 * and slow drifting low-poly clouds.
 *
 * ANIMATION RULE ENFORCEMENT:
 * - Trees, rocks, roads, bridge, streetlights: STRICTLY STATIC. Never wobble, scale, or bounce.
 * - Clouds: Drift very slowly.
 */

import * as THREE from 'three';
import { PALETTE, WORLD_CONFIG } from './constants';
import { TerrainSystem } from './terrain';

export interface Collider {
  x: number;
  z: number;
  radius: number;
  type: 'tree' | 'rock' | 'structure' | 'post' | 'bridge_rail';
}

export class EnvironmentSystem {
  public group: THREE.Group;
  public colliders: Collider[] = [];
  private clouds: THREE.Group[] = [];

  constructor(private terrain: TerrainSystem) {
    this.group = new THREE.Group();
    this.buildRoadsAndPlaza();
    this.buildArchBridge();
    this.buildTrees();
    this.buildRocks();
    this.buildStreetlights();
    this.buildScenicViewpoint();
    this.buildClouds();
  }

  /**
   * Builds the road network: Central avenue, loop circle, and start plaza
   */
  private buildRoadsAndPlaza() {
    // 1. Central Start Plaza (x: 0, z: -16)
    const plazaGeo = new THREE.CylinderGeometry(11, 11, 0.25, 12);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.8,
      metalness: 0.15,
      flatShading: true,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(0, 0.12, -16);
    plaza.receiveShadow = true;
    this.group.add(plaza);

    // Inner decorative ring on plaza
    const ringGeo = new THREE.RingGeometry(8.2, 8.8, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: PALETTE.cPrimaryAccent,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.26, -16);
    this.group.add(ring);

    // Welcome Monolith at Plaza
    this.buildStartMonolith(0, -22);

    // 2. North-South Road segments
    // North segment (z: -50 to -12)
    this.createRoadStrip(0, -32, 5.4, 38, 0);
    // South segment (z: 12 to 55)
    this.createRoadStrip(0, 33.5, 5.4, 43, 0);

    // 3. Circular Loop Road
    const loopSegments = 40;
    const loopRadius = 36;
    for (let i = 0; i < loopSegments; i++) {
      const angle = (i / loopSegments) * Math.PI * 2;
      const x = Math.sin(angle) * loopRadius;
      const z = Math.cos(angle) * loopRadius;

      // Skip segment if in river channel without bridge
      if (Math.abs(z) < 6 && Math.abs(x) > 6) continue;

      const segGeo = new THREE.PlaneGeometry(5.2, (Math.PI * 2 * loopRadius) / loopSegments + 0.4);
      segGeo.rotateX(-Math.PI / 2);
      segGeo.rotateY(angle);

      const y = this.terrain.getHeight(x, z) + 0.08;
      const segMat = new THREE.MeshStandardMaterial({
        color: PALETTE.cRoad,
        roughness: 0.85,
        metalness: 0.1,
        flatShading: true,
      });
      const segMesh = new THREE.Mesh(segGeo, segMat);
      segMesh.position.set(x, y, z);
      segMesh.receiveShadow = true;
      this.group.add(segMesh);
    }
  }

  private createRoadStrip(x: number, z: number, width: number, length: number, _rotY: number) {
    const geo = new THREE.BoxGeometry(width, 0.16, length);
    const mat = new THREE.MeshStandardMaterial({
      color: PALETTE.cRoad,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const y = this.terrain.getHeight(x, z) + 0.08;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.group.add(mesh);

    // Road dash markings
    const dashCount = Math.floor(length / 4);
    for (let i = 0; i < dashCount; i++) {
      const dashGeo = new THREE.PlaneGeometry(0.3, 1.8);
      dashGeo.rotateX(-Math.PI / 2);
      const dashMat = new THREE.MeshBasicMaterial({ color: PALETTE.cRoadMarking });
      const dash = new THREE.Mesh(dashGeo, dashMat);
      const dz = -length / 2 + 2 + i * 4;
      dash.position.set(x, y + 0.09, z + dz);
      this.group.add(dash);
    }
  }

  /**
   * Builds the arch bridge across the river canal
   */
  private buildArchBridge() {
    const bridgeGroup = new THREE.Group();
    const length = 24;
    const width = 6.4;
    const steps = 18;

    // Deck arch
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = -length / 2 + t * length;
      const archFactor = 1 - Math.pow(z / (length / 2), 2);
      const y = 0.4 + archFactor * 1.5;

      // Bridge plank / segment
      const plankGeo = new THREE.BoxGeometry(width, 0.35, length / steps + 0.1);
      const plankMat = new THREE.MeshStandardMaterial({
        color: PALETTE.cBridgeWood,
        roughness: 0.7,
        metalness: 0.2,
        flatShading: true,
      });
      const plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(0, y, z);
      plank.receiveShadow = true;
      plank.castShadow = true;
      bridgeGroup.add(plank);

      // Railing posts on left and right
      if (i % 3 === 0) {
        const postGeo = new THREE.BoxGeometry(0.25, 1.0, 0.25);
        const postMat = new THREE.MeshStandardMaterial({
          color: PALETTE.cPrimaryAccent,
          roughness: 0.5,
          metalness: 0.5,
        });

        // Left post
        const pLeft = new THREE.Mesh(postGeo, postMat);
        pLeft.position.set(-width / 2 + 0.2, y + 0.5, z);
        pLeft.castShadow = true;
        bridgeGroup.add(pLeft);

        // Right post
        const pRight = new THREE.Mesh(postGeo, postMat);
        pRight.position.set(width / 2 - 0.2, y + 0.5, z);
        pRight.castShadow = true;
        bridgeGroup.add(pRight);
      }
    }

    // Longitudinal handrails
    const railGeo = new THREE.BoxGeometry(0.18, 0.15, length);
    const railMat = new THREE.MeshStandardMaterial({ color: PALETTE.cPrimaryAccent });
    const railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.position.set(-width / 2 + 0.2, 1.8, 0);
    const railRight = new THREE.Mesh(railGeo, railMat);
    railRight.position.set(width / 2 - 0.2, 1.8, 0);
    bridgeGroup.add(railLeft, railRight);

    // Stone support pillars under bridge
    const pillarGeo = new THREE.BoxGeometry(width + 0.5, 3.2, 1.8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.9,
      flatShading: true,
    });
    const pillar1 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar1.position.set(0, 0.2, -6);
    const pillar2 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar2.position.set(0, 0.2, 6);
    bridgeGroup.add(pillar1, pillar2);

    this.group.add(bridgeGroup);

    // Add bridge side colliders so buggy does not plummet off into river
    for (let z = -11; z <= 11; z += 3) {
      this.colliders.push({ x: -width / 2 - 0.2, z, radius: 0.6, type: 'bridge_rail' });
      this.colliders.push({ x: width / 2 + 0.2, z, radius: 0.6, type: 'bridge_rail' });
    }
  }

  /**
   * Welcome monument at spawn plaza
   */
  private buildStartMonolith(x: number, z: number) {
    const monoGroup = new THREE.Group();
    monoGroup.position.set(x, this.terrain.getHeight(x, z), z);

    // Stepped pedestal (2 layers)
    const baseGeo = new THREE.BoxGeometry(4.2, 0.4, 2.2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    monoGroup.add(base);

    // Pillar monolith
    const pillarGeo = new THREE.BoxGeometry(3.0, 3.6, 0.8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryEnv,
      roughness: 0.5,
      metalness: 0.3,
      flatShading: true,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 2.2;
    pillar.castShadow = true;
    monoGroup.add(pillar);

    // Neon accent bar on monolith
    const accentGeo = new THREE.BoxGeometry(2.4, 0.15, 0.9);
    const accentMat = new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent });
    const accent = new THREE.Mesh(accentGeo, accentMat);
    accent.position.y = 3.6;
    monoGroup.add(accent);

    this.group.add(monoGroup);
    this.colliders.push({ x, z, radius: 2.2, type: 'structure' });
  }

  /**
   * Low-poly trees (pine + geometric canopy)
   * Using InstancedMesh for maximum 60FPS performance
   */
  private buildTrees() {
    const treeCoords: { x: number; z: number; scale: number }[] = [];

    // Scatter trees naturally across the landscape, avoiding roads & river
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    for (let i = 0; i < 90; i++) {
      const angle = rand(0, Math.PI * 2);
      const r = rand(15, WORLD_CONFIG.playableRadius - 2);
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      // Don't place in river or roads or plaza
      if (Math.abs(z) < 7.5) continue;
      if (this.terrain.isRoadArea(x, z)) continue;
      if (Math.hypot(x, z - (-16)) < 12) continue; // Plaza clearance

      // Avoid Bruno-inspired Playground, Soccer Pitch, River Jump & Social Plaza
      if (x >= 8 && x <= 32 && z >= 12 && z <= 35) continue;
      if (x >= -32 && x <= -8 && z >= 12 && z <= 35) continue;
      if (x >= 6 && x <= 14 && z >= -18 && z <= 18) continue;
      if (x >= 10 && x <= 26 && z >= -28 && z <= -12) continue;

      // Avoid landmark zones
      if (Math.hypot(x - 38, z - (-25)) < 9) continue;
      if (Math.hypot(x - (-35), z - (-30)) < 9) continue;
      if (Math.hypot(x - (-32), z - 35) < 9) continue;
      if (Math.hypot(x - 34, z - 32) < 9) continue;

      treeCoords.push({ x, z, scale: rand(0.8, 1.25) });
      this.colliders.push({ x, z, radius: 0.9, type: 'tree' });
    }

    // 1. Trunks instanced mesh
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.8, 5);
    trunkGeo.translate(0, 0.9, 0); // Bottom-center pivot
    const trunkMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cTreeTrunk,
      roughness: 0.9,
      flatShading: true,
    });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCoords.length);
    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;

    // 2. Foliage instanced mesh (low poly cone tiers)
    const foliageGeo = new THREE.ConeGeometry(1.6, 2.8, 6);
    foliageGeo.translate(0, 2.5, 0); // Position above trunk
    const foliageMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cFoliage,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCoords.length);
    foliageInst.castShadow = true;
    foliageInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();
    const baseSage = new THREE.Color(PALETTE.cFoliage);
    const darkSage = new THREE.Color(PALETTE.cFoliageDark);

    treeCoords.forEach((t, i) => {
      const y = this.terrain.getHeight(t.x, t.z);
      dummy.position.set(t.x, y, t.z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.updateMatrix();

      trunkInst.setMatrixAt(i, dummy.matrix);
      foliageInst.setMatrixAt(i, dummy.matrix);

      // Subtle foliage color variation within palette
      tintColor.copy(baseSage).lerp(darkSage, Math.random() * 0.4);
      foliageInst.setColorAt(i, tintColor);
    });

    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;
    if (foliageInst.instanceColor) foliageInst.instanceColor.needsUpdate = true;

    this.group.add(trunkInst, foliageInst);
  }

  /**
   * Low-poly boulders along hill ridges and perimeter
   */
  private buildRocks() {
    const rockCoords: { x: number; z: number; scale: number; rotY: number }[] = [];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    for (let i = 0; i < 45; i++) {
      const angle = rand(0, Math.PI * 2);
      const r = rand(22, WORLD_CONFIG.playableRadius);
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      if (this.terrain.isRoadArea(x, z)) continue;
      if (Math.hypot(x, z) < 14) continue;
      if (x >= 8 && x <= 32 && z >= 12 && z <= 35) continue;
      if (x >= -32 && x <= -8 && z >= 12 && z <= 35) continue;
      if (x >= 6 && x <= 14 && z >= -18 && z <= 18) continue;
      if (x >= 10 && x <= 26 && z >= -28 && z <= -12) continue;

      const scale = rand(1.0, 2.4);
      rockCoords.push({ x, z, scale, rotY: rand(0, Math.PI * 2) });
      this.colliders.push({ x, z, radius: scale * 0.7, type: 'rock' });
    }

    const rockGeo = new THREE.DodecahedronGeometry(1.0, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cRock,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
    });
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCoords.length);
    rockInst.castShadow = true;
    rockInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    rockCoords.forEach((r, i) => {
      const y = this.terrain.getHeight(r.x, r.z) + r.scale * 0.35;
      dummy.position.set(r.x, y, r.z);
      dummy.rotation.set(r.scale * 0.4, r.rotY, r.scale * 0.2);
      dummy.scale.set(r.scale * 1.3, r.scale * 0.8, r.scale * 1.1);
      dummy.updateMatrix();
      rockInst.setMatrixAt(i, dummy.matrix);
    });

    rockInst.instanceMatrix.needsUpdate = true;
    this.group.add(rockInst);
  }

  /**
   * Minimalist geometric streetlights along the road
   */
  private buildStreetlights() {
    const lightPositions: { x: number; z: number }[] = [
      { x: -3.8, z: -40 },
      { x: 3.8, z: -28 },
      { x: -3.8, z: -14 },
      { x: 3.8, z: 14 },
      { x: -3.8, z: 28 },
      { x: 3.8, z: 42 },
      { x: 26, z: 26 },
      { x: -26, z: 26 },
      { x: -26, z: -26 },
      { x: 26, z: -26 },
    ];

    lightPositions.forEach(pos => {
      const poleGroup = new THREE.Group();
      const y = this.terrain.getHeight(pos.x, pos.z);
      poleGroup.position.set(pos.x, y, pos.z);

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.8, 6);
      poleGeo.translate(0, 1.9, 0);
      const poleMat = new THREE.MeshStandardMaterial({
        color: PALETTE.cSecondarySurfaces,
        roughness: 0.6,
        metalness: 0.4,
      });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.castShadow = true;
      poleGroup.add(pole);

      // Angled lamp head
      const armGeo = new THREE.BoxGeometry(0.8, 0.12, 0.15);
      armGeo.translate(pos.x > 0 ? -0.35 : 0.35, 3.7, 0);
      const arm = new THREE.Mesh(armGeo, poleMat);
      poleGroup.add(arm);

      // Lamp glow prism
      const lampGeo = new THREE.BoxGeometry(0.3, 0.08, 0.12);
      const lampMat = new THREE.MeshBasicMaterial({ color: PALETTE.cHeadlight });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(pos.x > 0 ? -0.6 : 0.6, 3.6, 0);
      poleGroup.add(lamp);

      this.group.add(poleGroup);
      this.colliders.push({ x: pos.x, z: pos.z, radius: 0.4, type: 'post' });
    });
  }

  /**
   * Overlook Observation Deck (Career & Experience Overlook at elevated hill)
   */
  private buildScenicViewpoint() {
    const vx = 38;
    const vz = -28;
    const vy = this.terrain.getHeight(vx, vz);

    const deckGroup = new THREE.Group();
    deckGroup.position.set(vx, vy, vz);

    // Octagonal wooden terrace
    const deckGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.4, 8);
    const deckMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.2;
    deck.receiveShadow = true;
    deckGroup.add(deck);

    // Observation telescope / kiosk
    const scopeBaseGeo = new THREE.CylinderGeometry(0.18, 0.25, 1.4, 6);
    scopeBaseGeo.translate(0, 0.7, 0);
    const scopeMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryAccent,
      metalness: 0.6,
      roughness: 0.3,
    });
    const scopeBase = new THREE.Mesh(scopeBaseGeo, scopeMat);
    scopeBase.position.set(0, 0.4, 2.2);
    deckGroup.add(scopeBase);

    // Bench
    const benchGeo = new THREE.BoxGeometry(2.0, 0.4, 0.6);
    const bench = new THREE.Mesh(benchGeo, deckMat);
    bench.position.set(0, 0.5, -2.2);
    deckGroup.add(bench);

    this.group.add(deckGroup);
  }

  /**
   * Stylized geometric low-poly clouds
   */
  private buildClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: PALETTE.cSecondarySurfaces,
      transparent: true,
      opacity: 0.45,
    });

    for (let i = 0; i < 7; i++) {
      const cloud = new THREE.Group();
      const numPuffs = 3 + Math.floor(Math.random() * 3);

      for (let j = 0; j < numPuffs; j++) {
        const puffGeo = new THREE.DodecahedronGeometry(3 + Math.random() * 3, 0);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(j * 3.5 - 4, Math.random() * 1.5, Math.random() * 3 - 1.5);
        cloud.add(puff);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 140,
        32 + Math.random() * 10,
        (Math.random() - 0.5) * 140
      );
      this.clouds.push(cloud);
      this.group.add(cloud);
    }
  }

  /**
   * Slow drift of clouds (strictly animated per prompt rule)
   */
  public update(delta: number) {
    this.clouds.forEach(cloud => {
      cloud.position.x += delta * 1.2;
      if (cloud.position.x > 80) {
        cloud.position.x = -80;
      }
    });
  }

  public dispose() {
    // Free geometries and materials
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
