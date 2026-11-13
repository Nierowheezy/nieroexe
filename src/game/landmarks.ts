/**
 * Project Landmarks and Collectible Tokens for NIERO.EXE
 * Creates distinct physical 3D objects representing each project (NOT generic buildings!):
 * - globe: Geographic Globe & coordinate rings
 * - kiosk: Digital Civic Information Kiosk
 * - terminal: Fintech Transaction Terminal & Ledger Monolith
 * - vault: Digital Verification Scanner & Cryptographic Vault
 * - switch: Interactive Dark-Mode Switch Monolith
 * - monolith: Database Query Obelisk & Code Monolith
 * - tower: Media Broadcasting & Push Antenna Tower
 * - gateway: Enterprise Transaction Gateway Arch
 * - badge: GitHub Trophy & Achievement Pedestal
 *
 * Plus 6 collectible orange tech tokens.
 */

import * as THREE from 'three';
import { PALETTE } from './constants';
import { PROJECTS, TOKENS, Project, TokenCollectible } from '../data/portfolioData';
import { TerrainSystem } from './terrain';

import { SocialTileAction } from './playground';

export interface InteractiveTarget {
  id: string;
  type: 'project' | 'checkpoint' | 'viewpoint' | 'social';
  title: string;
  subtitle: string;
  project?: Project;
  socialAction?: SocialTileAction;
  externalUrl?: string;
  position: THREE.Vector3;
  interactRadius: number;
}

export class LandmarkSystem {
  public group: THREE.Group;
  public interactables: InteractiveTarget[] = [];
  public tokenMeshes: Map<string, THREE.Group> = new Map();
  public collectedTokenIds: Set<string> = new Set();

  // Animated elements within landmarks (only interaction beacon rings & tokens)
  private beaconRings: { mesh: THREE.Mesh; baseScale: number }[] = [];
  private rotatingParts: THREE.Object3D[] = [];

  constructor(private terrain: TerrainSystem) {
    this.group = new THREE.Group();
    this.buildProjectLandmarks();
    this.buildTokens();
    this.buildSpecialCheckpoints();
  }

  private buildProjectLandmarks() {
    PROJECTS.forEach(project => {
      const pos = new THREE.Vector3(
        project.coordinates.x,
        this.terrain.getHeight(project.coordinates.x, project.coordinates.z),
        project.coordinates.z
      );

      const landmarkGroup = new THREE.Group();
      landmarkGroup.position.copy(pos);

      // Construct specific thematic object
      switch (project.landmarkType) {
        case 'globe':
          this.buildAtlasGlobe(landmarkGroup);
          break;
        case 'kiosk':
          this.buildCivicKiosk(landmarkGroup);
          break;
        case 'terminal':
          this.buildFintechTerminal(landmarkGroup, project.color === '#E87545');
          break;
        case 'vault':
          this.buildProofmarkVault(landmarkGroup);
          break;
        case 'switch':
          this.buildSwitchMonolith(landmarkGroup);
          break;
        case 'monolith':
          this.buildQueryObelisk(landmarkGroup, project.color === '#E87545');
          break;
        case 'tower':
          this.buildBroadcastTower(landmarkGroup);
          break;
        case 'gateway':
          this.buildGatewayArch(landmarkGroup, project.color === '#E87545');
          break;
        case 'badge':
          this.buildTrophyStation(landmarkGroup);
          break;
        default:
          this.buildQueryObelisk(landmarkGroup, true);
          break;
      }

      // Floating 3D Billboard Label (Readable from afar while driving)
      const labelSprite = this.createBillboardLabel(
        project.name,
        project.category,
        project.color === '#E87545'
      );
      const labelHeight = project.landmarkType === 'tower' ? 6.8 : project.landmarkType === 'monolith' ? 5.6 : 5.0;
      labelSprite.position.set(0, labelHeight, 0);
      landmarkGroup.add(labelSprite);

      // Ground interaction perimeter ring (indicator)
      const ringGeo = new THREE.RingGeometry(3.6, 3.9, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: project.color === '#E87545' ? PALETTE.cPrimaryAccent : PALETTE.cSecondaryAccent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.y = 0.05;
      landmarkGroup.add(ringMesh);
      this.beaconRings.push({ mesh: ringMesh, baseScale: 1.0 });

      this.group.add(landmarkGroup);

      this.interactables.push({
        id: project.id,
        type: 'project',
        title: project.name,
        subtitle: project.tagline,
        project,
        position: pos,
        interactRadius: 5.5,
      });
    });
  }

  /**
   * 1. Nigerian Postcode Atlas: Miniature Geographic Globe & Coordinate Rings
   */
  private buildAtlasGlobe(group: THREE.Group) {
    const pedGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.7, 8);
    const pedMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.8,
      flatShading: true,
    });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = 0.35;
    ped.receiveShadow = true;
    group.add(ped);

    const postGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6);
    const postMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryEnv,
      roughness: 0.4,
      metalness: 0.5,
    });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.4;
    group.add(post);

    const globePivot = new THREE.Group();
    globePivot.position.y = 2.8;

    const globeGeo = new THREE.IcosahedronGeometry(1.3, 1);
    const globeMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryEnv,
      roughness: 0.5,
      metalness: 0.3,
      flatShading: true,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.castShadow = true;
    globePivot.add(globe);

    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.05, 6, 24);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: PALETTE.cSecondaryAccent });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 4;
    globePivot.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(1.7, 0.04, 6, 24);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 3;
    globePivot.add(ring2);

    const pinGeo = new THREE.ConeGeometry(0.18, 0.5, 4);
    pinGeo.translate(0, 0.25, 0);
    const pinMat = new THREE.MeshBasicMaterial({ color: PALETTE.cPrimaryAccent });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(0.6, 0.8, 0.6);
    globePivot.add(pin);

    this.rotatingParts.push(globePivot);
    group.add(globePivot);
  }

  /**
   * 2. KnowYourRights NG: Digital Civic Information Kiosk
   */
  private buildCivicKiosk(group: THREE.Group) {
    const slabGeo = new THREE.BoxGeometry(4.0, 0.3, 3.2);
    const slabMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.85,
      flatShading: true,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = 0.15;
    group.add(slab);

    const pillarGeo = new THREE.BoxGeometry(0.4, 2.8, 0.4);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryEnv,
      roughness: 0.5,
      metalness: 0.3,
    });
    const p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-1.4, 1.5, 0);
    const p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(1.4, 1.5, 0);
    group.add(p1, p2);

    const roofGeo = new THREE.BoxGeometry(3.6, 0.2, 2.4);
    const roofMat = new THREE.MeshStandardMaterial({ color: PALETTE.cSecondarySurfaces });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.0;
    group.add(roof);

    const consoleGeo = new THREE.BoxGeometry(1.8, 1.2, 0.15);
    const consoleMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      metalness: 0.4,
    });
    const consoleMesh = new THREE.Mesh(consoleGeo, consoleMat);
    consoleMesh.position.set(0, 1.5, 0.1);
    consoleMesh.rotation.x = -Math.PI / 8;
    group.add(consoleMesh);

    const screenGeo = new THREE.PlaneGeometry(1.6, 0.9);
    const screenMat = new THREE.MeshBasicMaterial({ color: PALETTE.cSecondaryAccent });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.52, 0.18);
    screen.rotation.x = -Math.PI / 8;
    group.add(screen);
  }

  /**
   * 3. Fintech Transaction Terminal & Ledger Monolith (Mova / Xfund)
   */
  private buildFintechTerminal(group: THREE.Group, isOrange: boolean) {
    const baseGeo = new THREE.BoxGeometry(3.4, 0.4, 3.4);
    const baseMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    group.add(base);

    const monoGeo = new THREE.BoxGeometry(1.8, 3.2, 1.0);
    const monoMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryEnv,
      roughness: 0.4,
      metalness: 0.5,
      flatShading: true,
    });
    const mono = new THREE.Mesh(monoGeo, monoMat);
    mono.position.set(0, 1.8, 0);
    mono.castShadow = true;
    group.add(mono);

    const slitGeo = new THREE.BoxGeometry(1.4, 0.18, 1.05);
    const slitMat = new THREE.MeshBasicMaterial({
      color: isOrange ? PALETTE.cPrimaryAccent : PALETTE.cSecondaryAccent,
    });
    const slit1 = new THREE.Mesh(slitGeo, slitMat);
    slit1.position.set(0, 2.6, 0);
    const slit2 = new THREE.Mesh(slitGeo, slitMat);
    slit2.position.set(0, 1.6, 0);
    group.add(slit1, slit2);

    const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      metalness: 0.3,
    });
    const c1 = new THREE.Mesh(cubeGeo, cubeMat);
    c1.position.set(1.0, 0.6, 0.9);
    const c2 = new THREE.Mesh(cubeGeo, cubeMat);
    c2.position.set(1.1, 0.6, -0.8);
    group.add(c1, c2);
  }

  /**
   * 4. Proofmark: Digital Verification Scanner & Cryptographic Vault
   */
  private buildProofmarkVault(group: THREE.Group) {
    const daisGeo = new THREE.CylinderGeometry(3.0, 3.3, 0.4, 12);
    const daisMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cSecondarySurfaces,
      roughness: 0.8,
      flatShading: true,
    });
    const dais = new THREE.Mesh(daisGeo, daisMat);
    dais.position.y = 0.2;
    group.add(dais);

    const archLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 3.2, 0.6),
      new THREE.MeshStandardMaterial({ color: PALETTE.cPrimaryEnv, metalness: 0.4 })
    );
    archLeft.position.set(-1.2, 1.8, 0);

    const archRight = archLeft.clone();
    archRight.position.set(1.2, 1.8, 0);

    const archTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.5, 0.8),
      new THREE.MeshStandardMaterial({ color: PALETTE.cPrimaryEnv, metalness: 0.4 })
    );
    archTop.position.set(0, 3.4, 0);
    group.add(archLeft, archRight, archTop);

    const diamondGroup = new THREE.Group();
    diamondGroup.position.set(0, 2.0, 0);

    const diaGeo = new THREE.OctahedronGeometry(0.7, 0);
    const diaMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryAccent,
      metalness: 0.7,
      roughness: 0.2,
      flatShading: true,
    });
    const dia = new THREE.Mesh(diaGeo, diaMat);
    diamondGroup.add(dia);

    this.rotatingParts.push(diamondGroup);
    group.add(diamondGroup);
  }

  /**
   * 5. use-dark-switch: Interactive Dark/Light Switch Monolith
   */
  private buildSwitchMonolith(group: THREE.Group) {
    const baseGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: PALETTE.cSecondarySurfaces, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    group.add(base);

    // Switch capsule housing
    const housingGeo = new THREE.BoxGeometry(2.2, 1.0, 1.2);
    const housingMat = new THREE.MeshStandardMaterial({ color: PALETTE.cPrimaryEnv, metalness: 0.5 });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.y = 1.1;
    group.add(housing);

    // Dual mode indicator prisms
    const prismDark = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.6, 1.25),
      new THREE.MeshBasicMaterial({ color: PALETTE.cBg })
    );
    prismDark.position.set(-0.55, 1.1, 0);

    const prismLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.6, 1.25),
      new THREE.MeshBasicMaterial({ color: PALETTE.cSecondaryAccent })
    );
    prismLight.position.set(0.55, 1.1, 0);
    group.add(prismDark, prismLight);

    // Floating toggle sphere above
    const toggleGroup = new THREE.Group();
    toggleGroup.position.set(0, 2.2, 0);
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 1),
      new THREE.MeshStandardMaterial({ color: PALETTE.cSecondaryAccent, metalness: 0.8, roughness: 0.2 })
    );
    toggleGroup.add(sphere);
    this.rotatingParts.push(toggleGroup);
    group.add(toggleGroup);
  }

  /**
   * 6. SQL Cheatsheet / html-tags-utils: Query Obelisk Monolith
   */
  private buildQueryObelisk(group: THREE.Group, isOrange: boolean) {
    const baseGeo = new THREE.BoxGeometry(2.6, 0.4, 2.6);
    const baseMat = new THREE.MeshStandardMaterial({ color: PALETTE.cSecondarySurfaces, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    group.add(base);

    // Tall tapered database obelisk
    const obeliskGeo = new THREE.CylinderGeometry(0.6, 1.0, 3.4, 4);
    obeliskGeo.rotateY(Math.PI / 4);
    const obeliskMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryEnv,
      metalness: 0.4,
      roughness: 0.6,
      flatShading: true,
    });
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.y = 1.9;
    obelisk.castShadow = true;
    group.add(obelisk);

    // Glowing query data ring
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.05, 6, 16),
      new THREE.MeshBasicMaterial({ color: isOrange ? PALETTE.cPrimaryAccent : PALETTE.cSecondaryAccent })
    );
    ringMesh.position.y = 2.4;
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);

    // Floating top crystal
    const crystalGroup = new THREE.Group();
    crystalGroup.position.set(0, 4.0, 0);
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshStandardMaterial({
        color: isOrange ? PALETTE.cPrimaryAccent : PALETTE.cSecondaryAccent,
        metalness: 0.8,
        roughness: 0.2,
      })
    );
    crystalGroup.add(crystal);
    this.rotatingParts.push(crystalGroup);
    group.add(crystalGroup);
  }

  /**
   * 7. Channels TV: Media Broadcasting & Webpushr Antenna Tower
   */
  private buildBroadcastTower(group: THREE.Group) {
    const baseGeo = new THREE.BoxGeometry(3.0, 0.4, 3.0);
    const baseMat = new THREE.MeshStandardMaterial({ color: PALETTE.cSecondarySurfaces, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    group.add(base);

    // Lattice transmission tower
    const mastGeo = new THREE.CylinderGeometry(0.2, 0.8, 5.0, 4);
    mastGeo.rotateY(Math.PI / 4);
    const mastMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryEnv,
      metalness: 0.6,
      roughness: 0.4,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.7;
    mast.castShadow = true;
    group.add(mast);

    // Satellite receiver dish
    const dishGeo = new THREE.CylinderGeometry(0.9, 0.1, 0.35, 8);
    dishGeo.rotateX(Math.PI / 3);
    const dishMat = new THREE.MeshStandardMaterial({ color: PALETTE.cSecondarySurfaces, metalness: 0.5 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 4.2, 0.4);
    group.add(dish);

    // Glowing broadcast beacon tip
    const beaconMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: PALETTE.cSecondaryAccent })
    );
    beaconMesh.position.y = 5.3;
    group.add(beaconMesh);
  }

  /**
   * 8. Gateway Arch (IDS Africa / ALAT Business Suite)
   */
  private buildGatewayArch(group: THREE.Group, isOrange: boolean) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.3, 2.4),
      new THREE.MeshStandardMaterial({ color: PALETTE.cSecondarySurfaces, roughness: 0.8 })
    );
    base.position.y = 0.15;
    group.add(base);

    const postMat = new THREE.MeshStandardMaterial({ color: PALETTE.cPrimaryEnv, metalness: 0.5 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.0, 0.5), postMat);
    p1.position.set(-1.2, 1.65, 0);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.0, 0.5), postMat);
    p2.position.set(1.2, 1.65, 0);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 0.6), postMat);
    lintel.position.set(0, 3.3, 0);
    group.add(p1, p2, lintel);

    // Translucent portal energy beam
    const beamGeo = new THREE.PlaneGeometry(1.9, 2.7);
    const beamMat = new THREE.MeshBasicMaterial({
      color: isOrange ? PALETTE.cPrimaryAccent : PALETTE.cSecondaryAccent,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 1.7, 0);
    group.add(beam);
  }

  /**
   * 9. GitHub Profile Badges: Trophy Station & Pedestal
   */
  private buildTrophyStation(group: THREE.Group) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: PALETTE.cSecondarySurfaces, roughness: 0.8 })
    );
    base.position.y = 0.25;
    group.add(base);

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: PALETTE.cPrimaryEnv, metalness: 0.5 })
    );
    column.position.y = 1.4;
    group.add(column);

    // Floating GitHub star / badge trophy
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(0, 2.7, 0);

    const starGeo = new THREE.IcosahedronGeometry(0.65, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cPrimaryAccent,
      metalness: 0.8,
      roughness: 0.2,
      flatShading: true,
    });
    const star = new THREE.Mesh(starGeo, starMat);
    trophyGroup.add(star);

    this.rotatingParts.push(trophyGroup);
    group.add(trophyGroup);
  }

  /**
   * 6 Collectible Orange Tech Tokens
   */
  private buildTokens() {
    TOKENS.forEach(token => {
      const pos = new THREE.Vector3(
        token.coordinates.x,
        this.terrain.getHeight(token.coordinates.x, token.coordinates.z) + 1.2,
        token.coordinates.z
      );

      const tokenGroup = new THREE.Group();
      tokenGroup.position.copy(pos);

      const tokenGeo = new THREE.OctahedronGeometry(0.55, 0);
      const tokenMat = new THREE.MeshStandardMaterial({
        color: PALETTE.cPrimaryAccent,
        roughness: 0.2,
        metalness: 0.7,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(tokenGeo, tokenMat);
      tokenGroup.add(mesh);

      const haloGeo = new THREE.RingGeometry(0.65, 0.75, 16);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: PALETTE.cPrimaryAccent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.y = -0.5;
      tokenGroup.add(halo);

      // Distinct Token Label
      const tokenLabel = this.createTokenLabel(token.name);
      tokenLabel.position.set(0, 1.4, 0);
      tokenGroup.add(tokenLabel);

      this.tokenMeshes.set(token.id, tokenGroup);
      this.group.add(tokenGroup);
    });
  }

  /**
   * Generates crisp 3D Billboard label sprite for projects
   */
  private createBillboardLabel(title: string, category: string, isOrange: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Background pill with border
    ctx.fillStyle = 'rgba(16, 24, 32, 0.94)';
    ctx.strokeStyle = isOrange ? '#E87545' : '#8BAE9B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 140, 24);
    ctx.fill();
    ctx.stroke();

    // Accent line
    ctx.fillStyle = isOrange ? '#E87545' : '#8BAE9B';
    ctx.beginPath();
    ctx.roundRect(24, 18, 464, 8, 4);
    ctx.fill();

    // Category
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = isOrange ? '#E87545' : '#8BAE9B';
    ctx.textAlign = 'center';
    ctx.fillText(`[ ${category.toUpperCase()} ]`, 256, 56);

    // Project Name
    ctx.font = 'bold 34px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#F2F0E9';
    // Truncate if too long
    const displayTitle = title.length > 24 ? title.substring(0, 22) + '...' : title;
    ctx.fillText(displayTitle, 256, 102);

    // Prompt callout
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#A4B0B5';
    ctx.fillText('PRESS [E] OR TAP TO INSPECT', 256, 134);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6.8, 2.1, 1);
    return sprite;
  }

  /**
   * Generates small distinct label for collectible tokens
   */
  private createTokenLabel(name: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(16, 24, 32, 0.92)';
    ctx.strokeStyle = '#E87545';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 68, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#E87545';
    ctx.textAlign = 'center';
    ctx.fillText('✦ TECH TOKEN', 128, 32);

    ctx.font = 'bold 18px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#F2F0E9';
    ctx.fillText(name, 128, 58);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.0, 1);
    return sprite;
  }

  /**
   * Special Checkpoints: About Checkpoint & Career Overlook
   */
  private buildSpecialCheckpoints() {
    const posAbout = new THREE.Vector3(0, this.terrain.getHeight(0, -32), -32);
    this.interactables.push({
      id: 'checkpoint-about',
      type: 'checkpoint',
      title: 'About Olabode Olaniyi David',
      subtitle: 'Senior Full Stack Engineer & Systems Architect',
      position: posAbout,
      interactRadius: 6.0,
    });

    const posCareer = new THREE.Vector3(38, this.terrain.getHeight(38, -28), -28);
    this.interactables.push({
      id: 'checkpoint-experience',
      type: 'viewpoint',
      title: 'Career & Experience Overlook',
      subtitle: '5+ years in Fintech, Media, SaaS, and Enterprise systems',
      position: posCareer,
      interactRadius: 7.0,
    });
  }

  public collectToken(tokenId: string): TokenCollectible | null {
    if (this.collectedTokenIds.has(tokenId)) return null;
    this.collectedTokenIds.add(tokenId);

    const mesh = this.tokenMeshes.get(tokenId);
    if (mesh) {
      this.group.remove(mesh);
    }

    return TOKENS.find(t => t.id === tokenId) || null;
  }

  public update(time: number, _delta: number) {
    this.rotatingParts.forEach((part, idx) => {
      part.rotation.y = time * 0.4 * (idx % 2 === 0 ? 1 : -1);
    });

    this.tokenMeshes.forEach((group, id) => {
      if (!this.collectedTokenIds.has(id)) {
        group.rotation.y = time * 1.5;
        const initialY = this.terrain.getHeight(group.position.x, group.position.z) + 1.2;
        group.position.y = initialY + Math.sin(time * 2.5) * 0.12;
      }
    });

    this.beaconRings.forEach(ring => {
      const pulse = 1 + Math.sin(time * 3) * 0.05;
      ring.mesh.scale.set(pulse, pulse, 1);
    });
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
