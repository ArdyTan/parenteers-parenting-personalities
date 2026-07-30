import type { Language, TranslationTable } from './quiz-types';

export type InterpolationValue = string | number;
export type InterpolationValues = Readonly<Record<string, InterpolationValue>>;

export function createTranslator(
  translations: Readonly<Record<Language, TranslationTable>>,
  language: Language,
): (key: string, values?: InterpolationValues) => string {
  const table = translations[language];
  return (key, values = {}) => translate(table, key, values);
}

export function translate(
  table: TranslationTable,
  key: string,
  values: InterpolationValues = {},
): string {
  const template = table[key];

  if (template === undefined) {
    throw new ReferenceError(`Missing translation key: ${key}`);
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (token, variable: string) => {
    const value = values[variable];
    if (value === undefined) {
      throw new ReferenceError(`Missing interpolation value ${token} for translation key: ${key}`);
    }
    return String(value);
  });
}
