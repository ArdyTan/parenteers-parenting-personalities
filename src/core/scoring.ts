import type { PersistedAnswer, Pole, TypeCode } from './quiz-types';

const SCORING_GROUPS = [
  { offset: 0, left: 'P', right: 'F', label: 'structure' },
  { offset: 3, left: 'C', right: 'G', label: 'guidance' },
  { offset: 6, left: 'T', right: 'D', label: 'emotion' },
  { offset: 9, left: 'E', right: 'N', label: 'adventure' },
] as const satisfies readonly Readonly<{
  offset: number;
  left: Pole;
  right: Pole;
  label: string;
}>[];

export function score(poles: readonly Pole[]): TypeCode {
  if (poles.length !== 12) {
    throw new RangeError(`Scoring requires exactly 12 poles; received ${poles.length}.`);
  }

  const code = SCORING_GROUPS.map(({ offset, left, right, label }) =>
    majority(poles.slice(offset, offset + 3), left, right, label),
  ).join('');

  return code as TypeCode;
}

export function scorePersistedAnswers(answers: readonly PersistedAnswer[]): TypeCode {
  if (answers.length !== 12) {
    throw new RangeError(`Scoring requires exactly 12 persisted answers; received ${answers.length}.`);
  }

  const sorted = [...answers].sort((answerA, answerB) => answerA.q - answerB.q);

  sorted.forEach((answer, index) => {
    const expectedQuestion = index + 1;
    if (answer.q !== expectedQuestion) {
      throw new TypeError(
        `Persisted answers must contain each question id 1–12 exactly once; expected ${expectedQuestion}, received ${answer.q}.`,
      );
    }
  });

  return score(sorted.map(({ pole }) => pole));
}

function majority(
  selections: readonly Pole[],
  left: Pole,
  right: Pole,
  dimension: string,
): Pole {
  if (selections.length !== 3) {
    throw new RangeError(`${dimension} requires exactly three selections.`);
  }

  selections.forEach((selection) => {
    if (selection !== left && selection !== right) {
      throw new TypeError(
        `Invalid ${dimension} pole "${selection}"; expected "${left}" or "${right}".`,
      );
    }
  });

  const leftCount = selections.filter((selection) => selection === left).length;
  return leftCount >= 2 ? left : right;
}
