import {
  Color,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import type { ColorRepresentation } from 'three';

import { BRAND_COLORS } from '../core/brand';
import {
  FLOUR_TRAIL_CAPACITY,
  type FlourTrailSource,
} from './flour-trail';

export const MIN_DOUGH_NOISE_OCTAVES = 2;
export const MAX_DOUGH_NOISE_OCTAVES = 6;
export const DEFAULT_DOUGH_NOISE_OCTAVES = 5;

export interface DoughGradientOptions {
  accent?: ColorRepresentation;
  heat?: number;
  noiseOctaves?: number;
  pointer?: Readonly<{ x: number; y: number }>;
  resolution?: Readonly<{ x: number; y: number }>;
}

export type DoughGradientUniforms = {
  uTime: { value: number };
  uHeat: { value: number };
  uAccent: { value: Color };
  uResolution: { value: Vector2 };
  uPointer: { value: Vector2 };
  uTrail: { value: Vector3[] };
  uTrailCount: { value: number };
};

const DEFAULT_ACCENT = BRAND_COLORS.orange;

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function fragmentShader(noiseOctaves: number): string {
  return /* glsl */ `
    precision highp float;

    #define FBM_OCTAVES ${noiseOctaves}
    #define TRAIL_CAPACITY ${FLOUR_TRAIL_CAPACITY}

    varying vec2 vUv;

    uniform float uTime;
    uniform float uHeat;
    uniform vec3 uAccent;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform vec3 uTrail[TRAIL_CAPACITY];
    uniform float uTrailCount;

    float hash(vec2 point) {
      return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);

      return mix(
        mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
        mix(
          hash(cell + vec2(0.0, 1.0)),
          hash(cell + vec2(1.0, 1.0)),
          local.x
        ),
        local.y
      );
    }

    float fbm(vec2 point) {
      float value = 0.0;
      float amplitude = 0.5;

      for (int octave = 0; octave < FBM_OCTAVES; octave += 1) {
        value += amplitude * noise(point);
        point = point * 2.02 + vec2(17.13, 9.71);
        amplitude *= 0.5;
      }

      return value;
    }

    vec2 trailWarp(vec2 uv, float aspect) {
      vec2 displacement = vec2(0.0);

      for (int index = 0; index < TRAIL_CAPACITY; index += 1) {
        float enabled = step(float(index) + 0.5, uTrailCount);
        vec3 samplePoint = uTrail[index];
        vec2 delta = uv - samplePoint.xy;
        delta.x *= aspect;

        float distanceToTrail = length(delta);
        float influence = smoothstep(0.2, 0.0, distanceToTrail)
          * samplePoint.z
          * enabled;
        vec2 direction = delta / max(distanceToTrail, 0.0001);
        vec2 swirl = vec2(-direction.y, direction.x);

        displacement += (direction * 0.45 + swirl * 0.8) * influence * 0.035;
      }

      float displacementLength = length(displacement);
      displacement *= min(1.0, 0.12 / max(displacementLength, 0.0001));
      displacement.x /= max(aspect, 0.0001);
      return displacement;
    }

    void main() {
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 uv = vUv;
      vec2 warp = trailWarp(uv, aspect);
      vec2 warpedUv = uv + warp;

      vec2 field = warpedUv - 0.5;
      field.x *= aspect;

      vec2 pointer = uPointer - 0.5;
      pointer.x *= aspect;
      vec2 pointerDelta = field - pointer;
      float pointerDistance = length(pointerDelta);
      float pointerInfluence = smoothstep(0.62, 0.0, pointerDistance);
      field += pointerDelta / max(pointerDistance, 0.001)
        * pointerInfluence
        * 0.035;

      float time = uTime * 0.1;
      vec2 q = vec2(
        fbm(field * 1.35 + vec2(time, -time * 0.7)),
        fbm(field * 1.35 + vec2(5.2, 1.3) - vec2(time * 0.65, time))
      );
      vec2 r = vec2(
        fbm(field * 1.25 + q * 2.25 + vec2(1.7, 9.2) + time * 0.8),
        fbm(field * 1.25 + q * 2.25 + vec2(8.3, 2.8) - time * 0.55)
      );
      float flow = fbm(field * 1.2 + r * 2.0);

      vec3 canvas = vec3(0.871367, 0.879622, 0.913099);
      vec3 deepBlue = vec3(0.009134, 0.020289, 0.318547);
      vec3 brightBlue = vec3(0.029557, 0.171441, 0.814847);
      vec3 orange = vec3(0.806952, 0.138432, 0.005605);

      vec3 coolBase = mix(canvas, brightBlue, 0.08 + q.y * 0.08);
      vec3 warmBase = mix(canvas, orange, 0.08 + flow * 0.12);
      vec3 base = mix(coolBase, warmBase, uHeat);
      vec3 ribbon = mix(brightBlue, orange, smoothstep(0.18, 0.88, flow));
      ribbon = mix(ribbon, deepBlue, smoothstep(0.62, 0.96, r.x) * 0.18);

      vec3 color = mix(base, ribbon, smoothstep(0.26, 0.82, flow) * 0.24);
      float accentMix = clamp(0.05 + uHeat * 0.10 + length(warp) * 0.55, 0.0, 0.24);
      color = mix(color, uAccent, accentMix);
      color += pointerInfluence * 0.018;
      color += (hash(gl_FragCoord.xy + fract(uTime) * 61.7) - 0.5) * 0.012;

      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeOctaves(value: number | undefined): number {
  return Math.round(
    clamp(
      finiteOr(value ?? DEFAULT_DOUGH_NOISE_OCTAVES, DEFAULT_DOUGH_NOISE_OCTAVES),
      MIN_DOUGH_NOISE_OCTAVES,
      MAX_DOUGH_NOISE_OCTAVES,
    ),
  );
}

export class DoughGradient {
  readonly noiseOctaves: number;
  readonly geometry: PlaneGeometry;
  readonly material: ShaderMaterial;
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  readonly uniforms: DoughGradientUniforms;

  constructor(options: DoughGradientOptions = {}) {
    this.noiseOctaves = normalizeOctaves(options.noiseOctaves);
    this.uniforms = {
      uTime: { value: 0 },
      uHeat: { value: clamp(finiteOr(options.heat ?? 0, 0), 0, 1) },
      uAccent: { value: new Color(options.accent ?? DEFAULT_ACCENT) },
      uResolution: {
        value: new Vector2(
          Math.max(1, finiteOr(options.resolution?.x ?? 1, 1)),
          Math.max(1, finiteOr(options.resolution?.y ?? 1, 1)),
        ),
      },
      uPointer: {
        value: new Vector2(
          clamp(finiteOr(options.pointer?.x ?? 0.5, 0.5), 0, 1),
          clamp(finiteOr(options.pointer?.y ?? 0.5, 0.5), 0, 1),
        ),
      },
      uTrail: {
        value: Array.from(
          { length: FLOUR_TRAIL_CAPACITY },
          () => new Vector3(0.5, 0.5, 0),
        ),
      },
      uTrailCount: { value: 0 },
    };

    this.geometry = new PlaneGeometry(2, 2);
    this.material = new ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader: fragmentShader(this.noiseOctaves),
      uniforms: this.uniforms,
      vertexShader,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1_000;
  }

  setTime(seconds: number): void {
    this.uniforms.uTime.value = Math.max(0, finiteOr(seconds, 0));
  }

  setHeat(heat: number): void {
    this.uniforms.uHeat.value = clamp(finiteOr(heat, 0), 0, 1);
  }

  setAccent(accent: ColorRepresentation): void {
    this.uniforms.uAccent.value.set(accent);
  }

  setResolution(width: number, height: number): void {
    this.uniforms.uResolution.value.set(
      Math.max(1, finiteOr(width, 1)),
      Math.max(1, finiteOr(height, 1)),
    );
  }

  setPointer(x: number, y: number): void {
    this.uniforms.uPointer.value.set(
      clamp(finiteOr(x, 0.5), 0, 1),
      clamp(finiteOr(y, 0.5), 0, 1),
    );
  }

  syncTrail(trail: FlourTrailSource): void {
    if (trail.capacity !== FLOUR_TRAIL_CAPACITY) {
      throw new RangeError(
        `Dough gradient expects a ${FLOUR_TRAIL_CAPACITY}-point flour trail; received ${trail.capacity}.`,
      );
    }

    trail.copyInto(this.uniforms.uTrail.value);
    this.uniforms.uTrailCount.value = clamp(trail.count, 0, FLOUR_TRAIL_CAPACITY);
  }

  clearTrail(): void {
    for (const sample of this.uniforms.uTrail.value) {
      sample.set(0.5, 0.5, 0);
    }

    this.uniforms.uTrailCount.value = 0;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export function createDoughGradient(options: DoughGradientOptions = {}): DoughGradient {
  return new DoughGradient(options);
}
