import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { appData, validateBundledData } from '.';
import { score } from '../core/scoring';
import type { Pole, TypeCode } from '../core/quiz-types';
import { EXPECTED_TYPE_CODES, REQUIRED_I18N_KEYS, validateAppData } from './validation';

describe('bundled data integrity', () => {
  it('passes structural and release validation with resolved launch links', () => {
    const report = validateBundledData();
    expect(report.warnings).toEqual([]);
    expect(() => validateBundledData({ release: true })).not.toThrow();
  });

  it('warns before release and blocks release when launch configuration contains TBD', () => {
    const unresolvedData = {
      ...appData,
      config: {
        ...appData.config,
        links: { ...appData.config.links, site: 'TBD' },
      },
    };

    expect(validateAppData(unresolvedData).warnings).toEqual([
      expect.stringMatching(/config\.links\.site/),
    ]);
    expect(() => validateAppData(unresolvedData, { release: true })).toThrow(/still contains TBD/i);
  });

  it('contains the complete question, type, and translation registries', () => {
    expect(appData.questions).toHaveLength(12);
    expect(appData.types.map(({ code }) => code)).toEqual(EXPECTED_TYPE_CODES);
    expect(appData.products).toHaveLength(9);

    const enKeys = Object.keys(appData.translations.en).sort();
    const idKeys = Object.keys(appData.translations.id).sort();
    expect(enKeys).toEqual(idKeys);
    expect(enKeys).toEqual([...REQUIRED_I18N_KEYS].sort());
  });

  it('preserves every stable UI key from the editorial source table', () => {
    const source = readFileSync(resolve(process.cwd(), 'quiz-02-ui-strings.md'), 'utf8');
    const sourceKeys = [...source.matchAll(/^\| `([^`]+)` \|/gm)].map(([, key]) => key);

    expect(sourceKeys).toHaveLength(78);
    expect(Object.keys(appData.translations.en)).toEqual(expect.arrayContaining(sourceKeys));
    expect(sourceKeys).toContain('share.card_cta');
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

  it.each(appData.types)('$code carries the complete parent-first support contract', async (type) => {
    expect(type.parentStory.imageAfterParagraph).toBe(2);
    expect(type.parentStory.imageAlt.id).toBeTruthy();
    expect(type.parentStory.imageAlt.en).toBeTruthy();
    expect(type.parentStory.title.id).toBeTruthy();
    expect(type.parentStory.title.en).toBeTruthy();
    expect(type.parentStory.body.id.split('\n\n').length).toBeGreaterThanOrEqual(4);
    expect(type.parentStory.body.en.split('\n\n').length).toBeGreaterThanOrEqual(4);
    expect(type.parentSupport.realLife.id).toBeTruthy();
    expect(type.parentSupport.guiltRelease.id).toBeTruthy();
    expect(type.parentSupport.careForYou.id).toBeTruthy();
    expect(type.parentSupport.forYourChild.id).toBeTruthy();
    expect(type.parentSupport.tryThisWeek.id).toHaveLength(3);
    expect(type.parentSupport.tryThisWeek.en).toHaveLength(3);

    const storyImagePath = resolve(
      process.cwd(),
      'public',
      type.parentStory.image.replace(/^\//, ''),
    );
    expect(existsSync(storyImagePath), storyImagePath).toBe(true);
    const metadata = await sharp(storyImagePath).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(800);
  });

  it.each(appData.products)('$id references a compact 400px product WebP', async (product) => {
    const imagePath = resolve(process.cwd(), 'public', product.image.replace(/^\//, ''));
    expect(existsSync(imagePath), imagePath).toBe(true);

    const metadata = await sharp(imagePath).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(400);
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
