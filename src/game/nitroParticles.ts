/**
 * Nitro Boost Particle System for NIERO.EXE
 * Creates high-velocity streaming jet particles, sparks, and heat trails
 * trailing behind the player's vehicle in 3D world coordinates.
 */

import * as THREE from 'three';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

export class NitroParticleSystem {
  public group: THREE.Group;
  private particleCount = 140;
  private particles: Particle[] = [];
  private geo!: THREE.BufferGeometry;
  private mat!: THREE.PointsMaterial;
  private positions!: Float32Array;
  private colors!: Float32Array;
  private pointsMesh!: THREE.Points;

  private texture!: THREE.Texture;

  // Dual exhaust nozzles relative to vehicle chassis
  private nozzleOffsets = [
    new THREE.Vector3(-0.35, 0.45, -1.45),
    new THREE.Vector3(0.35, 0.45, -1.45),
  ];

  constructor() {
    this.group = new THREE.Group();
    this.texture = this.createSparkTexture();
    this.initParticles();
  }

  private createSparkTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(0, 229, 255, 0.9)');
    grad.addColorStop(0.55, 'rgba(232, 117, 69, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  private initParticles() {
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);

    const cyan = new THREE.Color(0x00e5ff);

    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3 + 0] = 0;
      this.positions[i * 3 + 1] = -100; // Hidden initially
      this.positions[i * 3 + 2] = 0;

      this.colors[i * 3 + 0] = cyan.r;
      this.colors[i * 3 + 1] = cyan.g;
      this.colors[i * 3 + 2] = cyan.b;

      this.particles.push({
        pos: new THREE.Vector3(0, -100, 0),
        vel: new THREE.Vector3(),
        color: new THREE.Color(0x00e5ff),
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        size: 0.35 + Math.random() * 0.3,
      });
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.mat = new THREE.PointsMaterial({
      size: 0.65,
      map: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.geo, this.mat);
    this.pointsMesh.frustumCulled = false;
    this.group.add(this.pointsMesh);
  }

  /**
   * Spawns nitro jet particles in world space from vehicle exhaust
   */
  public update(delta: number, isNitroActive: boolean, vehicleGroup: THREE.Group, vehicleSpeed: number) {
    let spawnCount = 0;

    // 1. If Nitro is active, spawn fresh exhaust particles
    if (isNitroActive) {
      spawnCount = 4; // Spawn 4 particles per frame per exhaust nozzle
    }

    let spawned = 0;

    // Transform nozzle positions to world space
    const worldNozzles = this.nozzleOffsets.map(offset => {
      const v = offset.clone();
      vehicleGroup.localToWorld(v);
      return v;
    });

    // Vehicle forward and backward directions in world space
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(vehicleGroup.quaternion).normalize();
    const backward = forward.clone().negate();

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      // Update active particles
      if (p.life > 0) {
        p.life -= delta;
        p.pos.addScaledVector(p.vel, delta);

        // Slow down slightly with air resistance
        p.vel.multiplyScalar(0.96);

        // Update positions buffer
        this.positions[i * 3 + 0] = p.pos.x;
        this.positions[i * 3 + 1] = p.pos.y;
        this.positions[i * 3 + 2] = p.pos.z;

        // Color shift from hot white/cyan to blazing fiery orange/red as particle cools
        const lifeRatio = p.life / p.maxLife; // 1 -> 0
        if (lifeRatio > 0.6) {
          // Hot core: bright cyan / white
          this.colors[i * 3 + 0] = p.color.r;
          this.colors[i * 3 + 1] = p.color.g;
          this.colors[i * 3 + 2] = p.color.b;
        } else {
          // Cooling tail: flame orange / amber
          this.colors[i * 3 + 0] = 0.95 * lifeRatio;
          this.colors[i * 3 + 1] = 0.4 * lifeRatio;
          this.colors[i * 3 + 2] = 0.1 * lifeRatio;
        }

        if (p.life <= 0) {
          // Offscreen
          this.positions[i * 3 + 1] = -100;
        }
      } else if (spawned < spawnCount && isNitroActive) {
        // Recycle dead particle and launch from a nozzle
        const nozzle = worldNozzles[spawned % worldNozzles.length];
        p.pos.copy(nozzle);

        // Eject backward with turbulent spread
        const spread = new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.4
        );

        // Jet blast speed (high backward impulse + vehicle motion inertia)
        const jetSpeed = 16 + Math.random() * 12 + vehicleSpeed * 0.4;
        p.vel.copy(backward).multiplyScalar(jetSpeed).add(spread);

        p.maxLife = 0.32 + Math.random() * 0.22;
        p.life = p.maxLife;

        const pick = Math.random();
        if (pick > 0.6) {
          p.color.setHex(0xffffff); // White hot core
        } else if (pick > 0.25) {
          p.color.setHex(0x00e5ff); // Electric cyan
        } else {
          p.color.setHex(0xff7700); // Fiery orange
        }

        this.positions[i * 3 + 0] = p.pos.x;
        this.positions[i * 3 + 1] = p.pos.y;
        this.positions[i * 3 + 2] = p.pos.z;

        this.colors[i * 3 + 0] = p.color.r;
        this.colors[i * 3 + 1] = p.color.g;
        this.colors[i * 3 + 2] = p.color.b;

        spawned++;
      }
    }

    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }

  public dispose() {
    this.geo.dispose();
    this.mat.dispose();
    this.texture.dispose();
  }
}
