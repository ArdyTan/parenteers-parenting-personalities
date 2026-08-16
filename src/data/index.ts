import configJson from './config.json';
import enJson from './i18n/en.json';
import idJson from './i18n/id.json';
import productsJson from './products.json';
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
  products: productsJson,
  sceneArt: sceneArtJson,
  translations: { en: enJson, id: idJson },
  config: configJson,
} as unknown as ValidatedAppData;

export function validateBundledData(options: ValidationOptions = {}): ValidationReport {
  return validateAppData(appData, options);
}

/**
 * Maps a full-size character path to its 360px thumbnail. Shared by the gallery
 * shelves and the baking marquee — 16 thumbs total ~232 KB, which keeps both
 * screens inside the plan §10 per-screen image budget. The full set is ~1 MB.
 */
export function characterThumbnail(characterPath: string): string {
  const filename = characterPath.split('/').at(-1);
  return filename ? `/characters/thumbs/${filename}` : characterPath;
}
