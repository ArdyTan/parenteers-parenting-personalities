import { BufferAttribute, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_BURST_CAPACITY,
  FlourParticles,
  MAX_AMBIENT_PARTICLES,
} from './particles';

function fixedRandom(value = 0.5): () => number {
  return () => value;
}

describe('FlourParticles', () => {
  it('keeps ambient motes and the burst pool in one Points draw call', () => {
    const flour = new FlourParticles({ tier: 'high', random: fixedRandom() });
    const alpha = flour.points.geometry.getAttribute('aAlpha') as BufferAttribute;
    const kind = flour.points.geometry.getAttribute('aKind') as BufferAttribute;

    expect(flour.count).toBe(200);
    expect(flour.points.geometry.drawRange.count).toBe(
      MAX_AMBIENT_PARTICLES + DEFAULT_BURST_CAPACITY,
    );
    expect(alpha.count).toBe(MAX_AMBIENT_PARTICLES + DEFAULT_BURST_CAPACITY);
    expect(kind.getX(MAX_AMBIENT_PARTICLES - 1)).toBe(0);
    expect(kind.getX(MAX_AMBIENT_PARTICLES)).toBe(1);

    flour.dispose();
  });

  it('applies tier counts and permits an explicit clamped count', () => {
    const flour = new FlourParticles({ tier: 'low', deviceDpr: 3, random: fixedRandom() });
    const alpha = flour.points.geometry.getAttribute('aAlpha') as BufferAttribute;

    expect(flour.tier).toBe('low');
    expect(flour.count).toBe(150);
    expect(alpha.getX(149)).toBeGreaterThan(0);
    expect(alpha.getX(150)).toBe(0);

    flour.setTier('mid');
    expect(flour.count).toBe(175);
    flour.setCount(999);
    expect(flour.count).toBe(200);
    flour.setCount(-5);
    expect(flour.count).toBe(0);

    flour.dispose();
  });

  it('reuses a bounded burst pool and expires particles through shared ticks', () => {
    const flour = new FlourParticles({
      burstCapacity: 3,
      random: fixedRandom(0.5),
    });
    const position = flour.points.geometry.getAttribute('position') as BufferAttribute;
    const alpha = flour.points.geometry.getAttribute('aAlpha') as BufferAttribute;

    expect(flour.burst(0.25, 0.75, 8)).toBe(3);
    expect(flour.activeBurstCount).toBe(3);
    expect(position.getX(MAX_AMBIENT_PARTICLES)).toBeCloseTo(-0.5);
    expect(position.getY(MAX_AMBIENT_PARTICLES)).toBeCloseTo(-0.5);
    expect(alpha.getX(MAX_AMBIENT_PARTICLES)).toBe(1);

    flour.tick(0.1, 0.05);
    expect(flour.activeBurstCount).toBe(3);
    flour.tick(2, 0.05);
    for (let step = 0; step < 20; step += 1) flour.tick(2 + step * 0.05, 0.05);

    expect(flour.activeBurstCount).toBe(0);
    expect(alpha.getX(MAX_AMBIENT_PARTICLES)).toBe(0);
    flour.dispose();
  });

  it('freezes ambient drift and suppresses bursts for reduced motion', () => {
    const flour = new FlourParticles({ reducedMotion: true, random: fixedRandom() });

    expect(flour.burst(0.5, 0.5, 12)).toBe(0);
    flour.tick(10, 1);
    expect(flour.activeBurstCount).toBe(0);

    flour.setReducedMotion(false);
    expect(flour.burst(0.5, 0.5, 2)).toBe(2);
    flour.setReducedMotion(true);
    expect(flour.activeBurstCount).toBe(0);
    flour.dispose();
  });

  it('disposes its GPU resources, removes itself, and is idempotent', () => {
    const flour = new FlourParticles({ random: fixedRandom() });
    const scene = new Scene();
    scene.add(flour.points);
    const geometryDispose = vi.fn();
    const materialDispose = vi.fn();
    flour.points.geometry.addEventListener('dispose', geometryDispose);
    flour.points.material.addEventListener('dispose', materialDispose);

    flour.dispose();
    flour.dispose();

    expect(flour.isDisposed).toBe(true);
    expect(flour.points.parent).toBeNull();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(flour.burst(0.5, 0.5)).toBe(0);
  });
});
