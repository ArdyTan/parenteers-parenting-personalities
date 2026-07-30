import configJson from './config.json';
import enJson from './i18n/en.json';
import idJson from './i18n/id.json';
import questionsJson from './questions.json';
import sceneArtJson from './scene-art.json';
import typesJson from './types.json';
import {
  validateAppData,
  type ValidatedAppData,
  type ValidationOptions,
  type ValidationReport,
} from './validation';

export const appData = {
  questions: questionsJson,
  types: typesJson,
  sceneArt: sceneArtJson,
  translations: { en: enJson, id: idJson },
  config: configJson,
} as unknown as ValidatedAppData;

export function validateBundledData(options: ValidationOptions = {}): ValidationReport {
  return validateAppData(appData, options);
}
