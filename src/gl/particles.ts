import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type ColorRepresentation,
  Points,
  ShaderMaterial,
  Uniform,
} from 'three';

import { BRAND_COLORS } from '../core/brand';
import type { PerformanceTier } from '../core/store';
import { clampDpr, getTierProfile } from './tiers';

export const MAX_AMBIENT_PARTICLES = 200;
export const DEFAULT_BURST_CAPACITY = 96;

export type FlourParticlesOptions = Readonly<{
  tier?: PerformanceTier;
  burstCapacity?: number;
  deviceDpr?: number;
  pointSize?: number;
  color?: ColorRepresentation;
  random?: () => number;
  reducedMotion?: boolean;
}>;

type ParticleUniforms = Readonly<{
  uTime: Uniform<number>;
  uPointSize: Uniform<number>;
  uNoiseOctaves: Uniform<number>;
  uMotion: Uniform<number>;
  uColor: Uniform<Color>;
}>;

/**
 * One GPU Points draw call containing ambient flour motes and a fixed burst
 * pool. The owner supplies time from the shared GSAP ticker.
 */
export class FlourParticles {
  readonly points: Points<BufferGeometry, ShaderMaterial>;

  private readonly geometry: BufferGeometry;
  private readonly material: ShaderMaterial;
  private readonly uniforms: ParticleUniforms;
  private readonly positionAttribute: BufferAttribute;
  private readonly alphaAttribute: BufferAttribute;
  private readonly scaleAttribute: BufferAttribute;
  private readonly ambientAlpha: Float32Array;
  private readonly positions: Float32Array;
  private readonly alphas: Float32Array;
  private readonly scales: Float32Array;
  private readonly velocityX: Float32Array;
  private readonly velocityY: Float32Array;
  private readonly burstLife: Float32Array;
  private readonly burstDuration: Float32Array;
  private readonly random: () => number;
  private readonly basePointSize: number;
  private readonly burstCapacity: number;

  private currentTier: PerformanceTier;
  private ambientCount = 0;
  private burstCursor = 0;
  private deviceDpr: number;
  private reducedMotion: boolean;
  private disposed = false;

  constructor(options: FlourParticlesOptions = {}) {
    this.currentTier = options.tier ?? 'mid';
    this.burstCapacity = positiveInteger(options.burstCapacity, DEFAULT_BURST_CAPACITY);
    this.deviceDpr = positiveFinite(options.deviceDpr, 1);
    this.basePointSize = positiveFinite(options.pointSize, 4.5);
    this.random = options.random ?? Math.random;
    this.reducedMotion = options.reducedMotion ?? false;

    const totalCapacity = MAX_AMBIENT_PARTICLES + this.burstCapacity;
    this.positions = new Float32Array(totalCapacity * 3);
    this.alphas = new Float32Array(totalCapacity);
    this.scales = new Float32Array(totalCapacity);
    this.ambientAlpha = new Float32Array(MAX_AMBIENT_PARTICLES);
    this.velocityX = new Float32Array(this.burstCapacity);
    this.velocityY = new Float32Array(this.burstCapacity);
    this.burstLife = new Float32Array(this.burstCapacity);
    this.burstDuration = new Float32Array(this.burstCapacity);

    const seeds = new Float32Array(totalCapacity);
    const kinds = new Float32Array(totalCapacity);
    this.seedAmbientParticles(seeds);
    this.seedBurstPool(seeds, kinds);

    this.geometry = new BufferGeometry();
    this.positionAttribute = new BufferAttribute(this.positions, 3);
    this.alphaAttribute = new BufferAttribute(this.alphas, 1);
    this.scaleAttribute = new BufferAttribute(this.scales, 1);
    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('aAlpha', this.alphaAttribute);
    this.geometry.setAttribute('aScale', this.scaleAttribute);
    this.geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    this.geometry.setAttribute('aKind', new BufferAttribute(kinds, 1));
    this.geometry.setDrawRange(0, totalCapacity);

    const profile = getTierProfile(this.currentTier);
    this.uniforms = {
      uTime: new Uniform(0),
      uPointSize: new Uniform(this.basePointSize * clampDpr(this.deviceDpr, this.currentTier)),
      uNoiseOctaves: new Uniform(profile.noiseOctaves),
      uMotion: new Uniform(this.reducedMotion ? 0 : 1),
      uColor: new Uniform(new Color(options.color ?? BRAND_COLORS.canvas)),
    };

    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.points = new Points(this.geometry, this.material);
    this.points.name = 'flour-particles';
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
    this.setCount(profile.particleCount);
  }

  get tier(): PerformanceTier {
    return this.currentTier;
  }

  get count(): number {
    return this.ambientCount;
  }

  get activeBurstCount(): number {
    let active = 0;
    for (let index = 0; index < this.burstCapacity; index += 1) {
      if ((this.burstLife[index] ?? 0) > 0) active += 1;
    }
    return active;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  setTier(tier: PerformanceTier): void {
    if (this.disposed) return;
    this.currentTier = tier;
    const profile = getTierProfile(tier);
    this.uniforms.uNoiseOctaves.value = profile.noiseOctaves;
    this.uniforms.uPointSize.value = this.basePointSize * clampDpr(this.deviceDpr, tier);
    this.setCount(profile.particleCount);
  }

  setCount(count: number): void {
    if (this.disposed) return;
    const nextCount = Math.min(
      MAX_AMBIENT_PARTICLES,
      Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0),
    );

    this.ambientCount = nextCount;
    for (let index = 0; index < MAX_AMBIENT_PARTICLES; index += 1) {
      this.alphas[index] = index < nextCount ? (this.ambientAlpha[index] ?? 0) : 0;
    }
    this.alphaAttribute.needsUpdate = true;
  }

  setPixelRatio(deviceDpr: number): void {
    if (this.disposed) return;
    this.deviceDpr = positiveFinite(deviceDpr, 1);
    this.uniforms.uPointSize.value =
      this.basePointSize * clampDpr(this.deviceDpr, this.currentTier);
  }

  setReducedMotion(reduced: boolean): void {
    if (this.disposed) return;
    this.reducedMotion = reduced;
    this.uniforms.uMotion.value = reduced ? 0 : 1;
    if (reduced) this.clearBursts();
  }

  /**
   * Emits into reusable slots. Input coordinates are viewport-normalized:
   * x/y are 0..1 from top-left.
   */
  burst(normalizedX: number, normalizedY: number, count = 18): number {
    if (this.disposed || this.reducedMotion) return 0;
    const requested = Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0);
    const emitted = Math.min(requested, this.burstCapacity);
    const x = clamp01(normalizedX) * 2 - 1;
    const y = 1 - clamp01(normalizedY) * 2;

    for (let offset = 0; offset < emitted; offset += 1) {
      const slot = this.burstCursor;
      this.burstCursor = (this.burstCursor + 1) % this.burstCapacity;
      const particleIndex = MAX_AMBIENT_PARTICLES + slot;
      const positionIndex = particleIndex * 3;
      const angle = this.random() * Math.PI * 2;
      const speed = 0.22 + this.random() * 0.42;
      const duration = 0.55 + this.random() * 0.45;

      this.positions[positionIndex] = x;
      this.positions[positionIndex + 1] = y;
      this.positions[positionIndex + 2] = 0;
      this.velocityX[slot] = Math.cos(angle) * speed;
      this.velocityY[slot] = Math.sin(angle) * speed + 0.12;
      this.burstLife[slot] = duration;
      this.burstDuration[slot] = duration;
      this.alphas[particleIndex] = 1;
      this.scales[particleIndex] = 0.75 + this.random() * 0.65;
    }

    if (emitted > 0) {
      this.positionAttribute.needsUpdate = true;
      this.alphaAttribute.needsUpdate = true;
      this.scaleAttribute.needsUpdate = true;
    }
    return emitted;
  }

  /** Time and delta are seconds. Call from the shared application ticker only. */
  tick(timeSeconds: number, deltaSeconds: number): void {
    if (this.disposed) return;
    this.uniforms.uTime.value = this.reducedMotion ? 0 : finiteOr(timeSeconds, 0);
    if (this.reducedMotion || this.activeBurstCount === 0) return;

    const delta = Math.min(0.05, Math.max(0, finiteOr(deltaSeconds, 0)));
    if (delta === 0) return;
    let changed = false;

    for (let slot = 0; slot < this.burstCapacity; slot += 1) {
      const life = this.burstLife[slot] ?? 0;
      if (life <= 0) continue;
      const nextLife = Math.max(0, life - delta);
      const particleIndex = MAX_AMBIENT_PARTICLES + slot;
      const positionIndex = particleIndex * 3;

      if (nextLife === 0) {
        this.burstLife[slot] = 0;
        this.alphas[particleIndex] = 0;
        changed = true;
        continue;
      }

      const drag = Math.exp(-1.8 * delta);
      this.velocityX[slot] = (this.velocityX[slot] ?? 0) * drag;
      this.velocityY[slot] = ((this.velocityY[slot] ?? 0) - 0.32 * delta) * drag;
      this.positions[positionIndex] =
        (this.positions[positionIndex] ?? 0) + (this.velocityX[slot] ?? 0) * delta;
      this.positions[positionIndex + 1] =
        (this.positions[positionIndex + 1] ?? 0) + (this.velocityY[slot] ?? 0) * delta;
      this.burstLife[slot] = nextLife;
      const duration = this.burstDuration[slot] ?? 1;
      this.alphas[particleIndex] = smoothFade(nextLife / duration);
      changed = true;
    }

    if (changed) {
      this.positionAttribute.needsUpdate = true;
      this.alphaAttribute.needsUpdate = true;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.points.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }

  private seedAmbientParticles(seeds: Float32Array): void {
    for (let index = 0; index < MAX_AMBIENT_PARTICLES; index += 1) {
      const positionIndex = index * 3;
      this.positions[positionIndex] = this.random() * 2.2 - 1.1;
      this.positions[positionIndex + 1] = this.random() * 2.2 - 1.1;
      this.positions[positionIndex + 2] = this.random() * 0.2 - 0.1;
      this.scales[index] = 0.35 + this.random() * 0.65;
      this.ambientAlpha[index] = 0.18 + this.random() * 0.42;
      seeds[index] = this.random();
    }
  }

  private seedBurstPool(seeds: Float32Array, kinds: Float32Array): void {
    for (let slot = 0; slot < this.burstCapacity; slot += 1) {
      const particleIndex = MAX_AMBIENT_PARTICLES + slot;
      this.scales[particleIndex] = 1;
      seeds[particleIndex] = this.random();
      kinds[particleIndex] = 1;
    }
  }

  private clearBursts(): void {
    for (let slot = 0; slot < this.burstCapacity; slot += 1) {
      this.burstLife[slot] = 0;
      this.alphas[MAX_AMBIENT_PARTICLES + slot] = 0;
    }
    this.alphaAttribute.needsUpdate = true;
  }
}

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPointSize;
  uniform float uNoiseOctaves;
  uniform float uMotion;

  attribute float aAlpha;
  attribute float aScale;
  attribute float aSeed;
  attribute float aKind;

  varying float vAlpha;

  float hash(float value) {
    return fract(sin(value * 127.1) * 43758.5453123);
  }

  float noise1(float value) {
    float cell = floor(value);
    float fraction = fract(value);
    float eased = fraction * fraction * (3.0 - 2.0 * fraction);
    return mix(hash(cell), hash(cell + 1.0), eased);
  }

  float fbm(float value) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave += 1) {
      if (float(octave) >= uNoiseOctaves) break;
      sum += amplitude * noise1(value);
      value = value * 2.03 + 19.1;
      amplitude *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 particle = position;
    if (aKind < 0.5) {
      float drift = fbm(aSeed * 31.0 + uTime * 0.035) - 0.5;
      float phase = aSeed * 6.28318530718;
      particle.x += (sin(uTime * 0.09 + phase) * 0.024 + drift * 0.025) * uMotion;
      particle.y += (cos(uTime * 0.07 + phase * 1.37) * 0.03 + drift * 0.02) * uMotion;
    }

    gl_Position = vec4(particle.xy, particle.z, 1.0);
    gl_PointSize = max(1.0, uPointSize * mix(0.6, 1.25, aScale));
    vAlpha = aAlpha;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceFromCenter > 0.5) discard;
    float softEdge = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
    gl_FragColor = vec4(uColor, softEdge * vAlpha);
  }
`;

function positiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.floor(value));
}

function positiveFinite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function smoothFade(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}
