import { describe, expect, it } from 'vitest';

import { appData } from '../data';
import { randomizeQuestionAnswers, shuffleAnswerPair } from './randomize';

describe('answer randomization', () => {
  it('can swap or preserve positions without mutating the source pair', () => {
    const first = { pole: 'P', copy: 'first' } as const;
    const second = { pole: 'F', copy: 'second' } as const;
    const source = [first, second] as const;

    expect(shuffleAnswerPair(source, () => 0)).toEqual([second, first]);
    expect(shuffleAnswerPair(source, () => 0.999)).toEqual([first, second]);
    expect(source).toEqual([first, second]);
  });

  it('moves the answer object and its pole together', () => {
    const question = appData.questions[0];
    expect(question).toBeDefined();
    if (!question) return;

    const randomized = randomizeQuestionAnswers(question, () => 0);

    expect(randomized.answers[0]).toBe(question.answers[1]);
    expect(randomized.answers[1]).toBe(question.answers[0]);
    expect(randomized.answers[0].pole).toBe(question.answers[1].pole);
    expect(question.answers.map(({ pole }) => pole)).toEqual(['P', 'F']);
  });

  it('rejects an invalid random source', () => {
    expect(() => shuffleAnswerPair([1, 2], () => 1)).toThrow(/\[0, 1\)/);
    expect(() => shuffleAnswerPair([1, 2], () => Number.NaN)).toThrow(/finite value/);
  });
});
