import { describe, expect, it } from 'vitest';

import { appData } from '../data';
import { createTranslator, translate, type InterpolationValues } from './i18n';
import { LANGUAGES } from './quiz-types';

const EXAMPLE_VALUES = {
  n: 4,
  total: 12,
  type: 'The Croquembouche',
  emoji: '🍮',
  link: 'https://example.test/r/pcte',
  year: 2026,
  lang: 'EN',
} as const satisfies InterpolationValues;

describe('i18n rendering', () => {
  it.each(LANGUAGES)('renders every %s string without unresolved variables', (language) => {
    const t = createTranslator(appData.translations, language);

    for (const key of Object.keys(appData.translations[language])) {
      expect(t(key, EXAMPLE_VALUES), `${language}:${key}`).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
    }
  });

  it('throws for missing keys and missing interpolation values', () => {
    expect(() => translate(appData.translations.en, 'missing.key')).toThrow(/missing translation key/i);
    expect(() => translate(appData.translations.en, 'quiz.progress')).toThrow(
      /missing interpolation value/i,
    );
  });

  it('interpolates values without changing the source table', () => {
    const source = appData.translations.id['quiz.progress'];
    expect(translate(appData.translations.id, 'quiz.progress', EXAMPLE_VALUES)).toBe(
      'Pertanyaan 4 dr 12',
    );
    expect(appData.translations.id['quiz.progress']).toBe(source);
  });
});
