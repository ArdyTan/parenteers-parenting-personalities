import { describe, expect, it } from 'vitest';

import { EXPECTED_TYPE_CODES } from '../data/validation';
import type { PersistedAnswer, Pole, TypeCode } from './quiz-types';
import { score, scorePersistedAnswers } from './scoring';

const OPPOSITE_POLE = {
  P: 'F', F: 'P',
  C: 'G', G: 'C',
  T: 'D', D: 'T',
  E: 'N', N: 'E',
} as const satisfies Readonly<Record<Pole, Pole>>;

describe('score', () => {
  it.each(EXPECTED_TYPE_CODES)('makes %s reachable', (code) => {
    expect(score(polesForCode(code))).toBe(code);
  });

  it('sorts persisted records by question id before scoring', () => {
    const poles = polesForCode('FGDN');
    const persisted = poles
      .map((pole, index) => ({ q: index + 1, pole }))
      .reverse() satisfies PersistedAnswer[];

    expect(scorePersistedAnswers(persisted)).toBe('FGDN');
  });

  it('rejects incomplete, duplicate, or dimension-invalid inputs', () => {
    expect(() => score(['P'])).toThrow(/exactly 12/i);

    const duplicateQuestionIds = polesForCode('PCTE').map((pole, index) => ({
      q: index === 11 ? 11 : index + 1,
      pole,
    }));
    expect(() => scorePersistedAnswers(duplicateQuestionIds)).toThrow(/each question id/i);

    const invalidDimension = polesForCode('PCTE');
    invalidDimension[3] = 'P';
    expect(() => score(invalidDimension)).toThrow(/invalid guidance pole/i);
  });
});

function polesForCode(code: TypeCode): Pole[] {
  return [...code].flatMap((pole) => {
    const typedPole = pole as Pole;
    return [typedPole, OPPOSITE_POLE[typedPole], typedPole];
  });
}
