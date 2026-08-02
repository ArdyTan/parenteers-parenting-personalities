import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { appData, validateBundledData } from '.';
import { score } from '../core/scoring';
import type { Pole, TypeCode } from '../core/quiz-types';
import { EXPECTED_TYPE_CODES, REQUIRED_I18N_KEYS } from './validation';

describe('bundled data integrity', () => {
  it('passes structural validation and reports unresolved launch links in non-release mode', () => {
    const report = validateBundledData();
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]).toMatch(/config\.links\.(activities|site)/);
  });

  it('blocks a release while launch configuration still contains TBD values', () => {
    expect(() => validateBundledData({ release: true })).toThrow(/still contains TBD/i);
  });

  it('contains the complete question, type, and translation registries', () => {
    expect(appData.questions).toHaveLength(12);
    expect(appData.types.map(({ code }) => code)).toEqual(EXPECTED_TYPE_CODES);

    const enKeys = Object.keys(appData.translations.en).sort();
    const idKeys = Object.keys(appData.translations.id).sort();
    expect(enKeys).toEqual(idKeys);
    expect(enKeys).toEqual([...REQUIRED_I18N_KEYS].sort());
  });

  it('preserves every stable UI key from the editorial source table', () => {
    const source = readFileSync(resolve(process.cwd(), 'quiz-02-ui-strings.md'), 'utf8');
    const sourceKeys = [...source.matchAll(/^\| `([^`]+)` \|/gm)].map(([, key]) => key);

    expect(sourceKeys).toHaveLength(73);
    expect(Object.keys(appData.translations.en)).toEqual(expect.arrayContaining(sourceKeys));
  });

  it.each(appData.types)('$code references an optimized WebP within the UI size ceiling', async (type) => {
    const imagePath = resolve(process.cwd(), 'public', type.image.replace(/^\//, ''));
    expect(existsSync(imagePath), imagePath).toBe(true);

    const metadata = await sharp(imagePath).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBeLessThanOrEqual(1024);
    expect(metadata.height).toBeLessThanOrEqual(1024);
    expect(metadata.width).toBeGreaterThanOrEqual(720);
    expect(metadata.height).toBeGreaterThanOrEqual(720);
  });

  it('keeps every declared result code reachable from its majority poles', () => {
    for (const code of EXPECTED_TYPE_CODES) {
      expect(score(majorityPoles(code))).toBe(code);
    }
  });
});

function majorityPoles(code: TypeCode): Pole[] {
  const opposite = {
    P: 'F', F: 'P', C: 'G', G: 'C', T: 'D', D: 'T', E: 'N', N: 'E',
  } as const satisfies Readonly<Record<Pole, Pole>>;

  return [...code].flatMap((pole) => {
    const typedPole = pole as Pole;
    return [typedPole, typedPole, opposite[typedPole]];
  });
}
