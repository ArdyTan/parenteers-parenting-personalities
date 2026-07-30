import type { Question, QuestionAnswer } from './quiz-types';

export type RandomSource = () => number;

export function shuffleAnswerPair<const Pair extends readonly [unknown, unknown]>(
  answers: Pair,
  random: RandomSource = Math.random,
): [Pair[number], Pair[number]] {
  const sample = random();

  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError(`Random source must return a finite value in [0, 1); received ${sample}.`);
  }

  const shuffled: [Pair[number], Pair[number]] = [answers[0], answers[1]];
  const swapIndex = Math.floor(sample * shuffled.length);
  const finalAnswer = shuffled[1];
  shuffled[1] = shuffled[swapIndex] as Pair[number];
  shuffled[swapIndex] = finalAnswer;

  return shuffled;
}

export function randomizeQuestionAnswers(
  question: Question,
  random: RandomSource = Math.random,
): Question {
  return {
    ...question,
    answers: shuffleAnswerPair(question.answers, random) as [QuestionAnswer, QuestionAnswer],
  };
}
