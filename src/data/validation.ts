import {
  DIMENSIONS,
  LANGUAGES,
  POLES_BY_DIMENSION,
  type AppConfig,
  type Dimension,
  type PersonalityType,
  type Product,
  type Question,
  type SceneArtManifest,
  type TranslationTable,
  type TypeCode,
} from '../core/quiz-types';

export const EXPECTED_TYPE_CODES = [
  'PCTE',
  'PCTN',
  'PCDE',
  'PCDN',
  'PGTE',
  'PGTN',
  'PGDE',
  'PGDN',
  'FCTE',
  'FCTN',
  'FCDE',
  'FCDN',
  'FGTE',
  'FGTN',
  'FGDE',
  'FGDN',
] as const satisfies readonly TypeCode[];

export const REQUIRED_I18N_KEYS = [
  'nav.lang_toggle_label', 'nav.lang_en', 'nav.lang_id', 'nav.back', 'nav.next',
  'nav.continue', 'nav.close', 'nav.home', 'nav.sound_label',
  'landing.cta_start', 'landing.meta_time', 'landing.meta_questions', 'landing.meta_share',
  'landing.by_brand', 'landing.h1', 'landing.subtitle', 'landing.trust',
  // Phase 5.5 placeholder — the reference wording pending the user's copy pass.
  'landing.eyebrow',
  'intro.cta_begin', 'intro.disclaimer_short', 'intro.h2', 'intro.point1', 'intro.point2',
  'intro.point3',
  'quiz.progress', 'quiz.select_hint', 'quiz.answer_a_label', 'quiz.answer_b_label',
  // Phase 5.5 placeholder — the "nothing picked yet" CTA label.
  'quiz.cta_pick',
  'quiz.change_answer', 'quiz.exit_confirm_title', 'quiz.exit_confirm_body',
  'quiz.exit_confirm_stay', 'quiz.exit_confirm_leave', 'quiz.interstitial_q6',
  'quiz.interstitial_q9',
  'loading.title', 'loading.a11y', 'loading.line1', 'loading.line2', 'loading.line3',
  'loading.line4',
  'result.intro_label', 'result.story_label', 'result.summary_label',
  'result.real_life_label', 'result.guilt_release_label', 'result.care_for_you_label',
  'result.for_child_label', 'result.try_this_week_label',
  'result.superpowers_label', 'result.watchout_label',
  'result.popcousin_label', 'result.other_types_label',
  'result.share_ig', 'result.save_image', 'result.copy_link',
  'result.copied', 'result.see_all', 'result.retake', 'result.activities_cta',
  'result.products_heading', 'result.products_coming_soon', 'result.products_cta',
  'result.your_code', 'result.softsell_body', 'result.scroll_hint',
  'gallery.title', 'gallery.your_type_badge', 'gallery.send_quiz', 'gallery.back_to_result',
  'gallery.intro',
  'share.title', 'share.caption_template', 'share.whatsapp', 'share.instagram', 'share.other',
  'share.hold_hint', 'share.image_shared', 'share.image_saved', 'share.link_shared',
  // Phase 5.5 placeholder in EN: the ID line is transcribed from the result-card
  // artwork, the English wording still needs a copy pass.
  'share.card_cta',
  'footer.disclaimer', 'footer.made_by', 'footer.copyright', 'footer.privacy',
  'error.generic', 'error.offline', 'error.save_failed', 'error.retry',
  'error.notfound_title', 'error.notfound_cta',
  'meta.title', 'meta.description', 'meta.og_title', 'meta.og_description',
  'a11y.progressbar', 'a11y.type_illustration_alt', 'a11y.lang_switch', 'a11y.loading',
  'a11y.sound_on', 'a11y.sound_off',
  'activity.P', 'activity.F', 'activity.C', 'activity.G', 'activity.T', 'activity.D',
  'activity.E', 'activity.N',
] as const;

type RawAppData = Readonly<{
  questions: unknown;
  types: unknown;
  products: unknown;
  sceneArt: unknown;
  translations: Readonly<{ en: unknown; id: unknown }>;
  config: unknown;
}>;

export type ValidationOptions = Readonly<{ release?: boolean }>;
export type ValidationReport = Readonly<{ warnings: readonly string[] }>;

export class DataValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid bundled data:\n- ${issues.join('\n- ')}`);
    this.name = 'DataValidationError';
    this.issues = issues;
  }
}

export function validateAppData(
  data: RawAppData,
  options: ValidationOptions = {},
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  validateQuestions(data.questions, errors);
  validateTypes(data.types, errors);
  validateProducts(data.products, errors);
  validateSceneArt(data.sceneArt, errors);
  validateTranslations(data.translations.en, data.translations.id, errors);
  validateConfig(data.config, errors, warnings, options.release === true);

  if (errors.length > 0) {
    throw new DataValidationError(errors);
  }

  return { warnings };
}

function validateProducts(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('products must be an array.');
    return;
  }

  if (value.length !== 9) errors.push(`products must contain 9 unique records; found ${value.length}.`);
  const ids = new Set<string>();
  value.forEach((rawProduct, index) => {
    const path = `products[${index}]`;
    const product = asRecord(rawProduct, path, errors);
    if (!product) return;
    for (const key of ['id', 'meta', 'title', 'alt']) {
      expectNonEmptyString(product[key], `${path}.${key}`, errors);
    }
    validateRuntimeImagePath(product.image, `${path}.image`, errors);
    if (typeof product.id === 'string') {
      if (ids.has(product.id)) errors.push(`${path}.id must be unique.`);
      ids.add(product.id);
    }
  });
}

function validateSceneArt(value: unknown, errors: string[]): void {
  const manifest = asRecord(value, 'sceneArt', errors);
  if (!manifest) return;

  if (!Array.isArray(manifest.questions) || manifest.questions.length !== 12) {
    errors.push('sceneArt.questions must contain exactly 12 records.');
  } else {
    manifest.questions.forEach((rawAsset, index) => {
      const path = `sceneArt.questions[${index}]`;
      const asset = asRecord(rawAsset, path, errors);
      if (!asset) return;
      if (asset.id !== index + 1) errors.push(`${path}.id must be ${index + 1}.`);
      validateSceneArtAsset(asset, path, errors);
    });
  }

  if (!Array.isArray(manifest.checkpoints) || manifest.checkpoints.length !== 2) {
    errors.push('sceneArt.checkpoints must contain exactly two records.');
  } else {
    const expected = [6, 9];
    manifest.checkpoints.forEach((rawAsset, index) => {
      const path = `sceneArt.checkpoints[${index}]`;
      const asset = asRecord(rawAsset, path, errors);
      if (!asset) return;
      if (asset.afterQuestion !== expected[index]) {
        errors.push(`${path}.afterQuestion must be ${expected[index]}.`);
      }
      validateSceneArtAsset(asset, path, errors);
    });
  }

  const continuity = asRecord(manifest.continuity, 'sceneArt.continuity', errors);
  if (continuity) {
    for (const key of ['landing', 'intro', 'calculating', 'gate']) {
      validateRuntimeImagePath(continuity[key], `sceneArt.continuity.${key}`, errors);
    }
    // The preloader is the one motion surface, so it is the one path that is
    // not a still.
    validateRuntimeVideoPath(continuity.preloader, 'sceneArt.continuity.preloader', errors);
  }
}

function validateSceneArtAsset(
  asset: Record<string, unknown>,
  path: string,
  errors: string[],
): void {
  validateRuntimeImagePath(asset.image, `${path}.image`, errors);
  expectNonEmptyString(asset.objectPosition, `${path}.objectPosition`, errors);
}

function validateRuntimeImagePath(value: unknown, path: string, errors: string[]): void {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    !value.endsWith('.webp')
  ) {
    errors.push(`${path} must be a root-relative WebP path.`);
  }
}

function validateRuntimeVideoPath(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'string' || !value.startsWith('/') || !value.endsWith('.mp4')) {
    errors.push(`${path} must be a root-relative MP4 path.`);
  }
}

function validateQuestions(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('questions must be an array.');
    return;
  }

  if (value.length !== 12) errors.push(`questions must contain 12 records; found ${value.length}.`);

  value.forEach((rawQuestion, index) => {
    const path = `questions[${index}]`;
    const question = asRecord(rawQuestion, path, errors);
    if (!question) return;

    const expectedId = index + 1;
    if (question.id !== expectedId) errors.push(`${path}.id must be ${expectedId}.`);

    const expectedDimension = DIMENSIONS[Math.floor(index / 3)];
    if (question.dimension !== expectedDimension) {
      errors.push(`${path}.dimension must be ${expectedDimension ?? '(out of range)'}.`);
    }

    validateLocalizedText(question.scenario, `${path}.scenario`, errors);

    if (!Array.isArray(question.answers) || question.answers.length !== 2) {
      errors.push(`${path}.answers must contain exactly two answers.`);
      return;
    }

    const poles: unknown[] = [];
    question.answers.forEach((rawAnswer, answerIndex) => {
      const answerPath = `${path}.answers[${answerIndex}]`;
      const answer = asRecord(rawAnswer, answerPath, errors);
      if (!answer) return;
      poles.push(answer.pole);
      expectNonEmptyString(answer.en, `${answerPath}.en`, errors);
      expectNonEmptyString(answer.id, `${answerPath}.id`, errors);
    });

    if (expectedDimension) {
      const expectedPoles = new Set<string>(POLES_BY_DIMENSION[expectedDimension]);
      const actualPoles = new Set(poles);
      if (
        actualPoles.size !== 2 ||
        [...actualPoles].some((pole) => typeof pole !== 'string' || !expectedPoles.has(pole))
      ) {
        errors.push(
          `${path}.answers must carry the opposing ${expectedDimension} poles ${[...expectedPoles].join('/')}.`,
        );
      }
    }
  });
}

function validateTypes(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('types must be an array.');
    return;
  }

  if (value.length !== EXPECTED_TYPE_CODES.length) {
    errors.push(`types must contain 16 records; found ${value.length}.`);
  }

  const seenCodes = new Set<unknown>();
  const seenSlugs = new Set<unknown>();

  value.forEach((rawType, index) => {
    const path = `types[${index}]`;
    const type = asRecord(rawType, path, errors);
    if (!type) return;

    const expectedCode = EXPECTED_TYPE_CODES[index];
    if (type.code !== expectedCode) errors.push(`${path}.code must be ${expectedCode ?? '(unexpected)'}.`);
    if (seenCodes.has(type.code)) errors.push(`${path}.code must be unique.`);
    seenCodes.add(type.code);

    const expectedSlug = typeof type.code === 'string' ? type.code.toLowerCase() : '';
    if (type.slug !== expectedSlug) errors.push(`${path}.slug must be the lowercase code.`);
    if (seenSlugs.has(type.slug)) errors.push(`${path}.slug must be unique.`);
    seenSlugs.add(type.slug);

    expectNonEmptyString(type.emoji, `${path}.emoji`, errors);
    validateLocalizedText(type.name, `${path}.name`, errors);
    validateLocalizedText(type.tagline, `${path}.tagline`, errors);
    validateLocalizedText(type.watchout, `${path}.watchout`, errors);
    validateLocalizedText(type.popCousin, `${path}.popCousin`, errors);
    validateLocalizedLists(type.superpowers, `${path}.superpowers`, errors);

    const parentStory = asRecord(type.parentStory, `${path}.parentStory`, errors);
    if (parentStory) {
      if (parentStory.image !== `/story-illustrations/${expectedSlug}-story.webp`) {
        errors.push(
          `${path}.parentStory.image must be /story-illustrations/${expectedSlug}-story.webp.`,
        );
      }
      validateLocalizedText(parentStory.imageAlt, `${path}.parentStory.imageAlt`, errors);
      if (parentStory.imageAfterParagraph !== 2) {
        errors.push(`${path}.parentStory.imageAfterParagraph must be 2.`);
      }
      validateLocalizedText(parentStory.title, `${path}.parentStory.title`, errors);
      validateLocalizedText(parentStory.body, `${path}.parentStory.body`, errors);
    }

    const parentSupport = asRecord(type.parentSupport, `${path}.parentSupport`, errors);
    if (parentSupport) {
      for (const key of ['realLife', 'guiltRelease', 'careForYou', 'forYourChild']) {
        validateLocalizedText(parentSupport[key], `${path}.parentSupport.${key}`, errors);
      }
      validateLocalizedLists(
        parentSupport.tryThisWeek,
        `${path}.parentSupport.tryThisWeek`,
        errors,
      );
    }

    const name = isRecord(type.name) ? type.name : null;
    if (name && name.en !== name.id) errors.push(`${path}.name must match across languages.`);

    if (
      typeof type.image !== 'string' ||
      !type.image.startsWith(`/characters/${expectedSlug}-`) ||
      !type.image.endsWith('.webp')
    ) {
      errors.push(`${path}.image must follow /characters/{slug}-{bake}.webp.`);
    }

    if (typeof type.accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(type.accent)) {
      errors.push(`${path}.accent must be a six-digit hex color.`);
    }

    if (!Array.isArray(type.activityTags) || type.activityTags.length !== 2) {
      errors.push(`${path}.activityTags must contain exactly two tags.`);
    } else {
      const [firstTag, secondTag] = type.activityTags;
      if (firstTag === secondTag) errors.push(`${path}.activityTags must be distinct.`);
      for (const tag of type.activityTags) {
        if (typeof type.code !== 'string' || typeof tag !== 'string' || !type.code.includes(tag)) {
          errors.push(`${path}.activityTags values must be letters from the type code.`);
        }
      }
    }
  });

  const expectedCodeSet = new Set(EXPECTED_TYPE_CODES);
  if (
    seenCodes.size !== expectedCodeSet.size ||
    [...seenCodes].some((code) => typeof code !== 'string' || !expectedCodeSet.has(code as TypeCode))
  ) {
    errors.push('types codes must equal the complete 16-code cartesian product.');
  }
}

function validateTranslations(enValue: unknown, idValue: unknown, errors: string[]): void {
  const en = asRecord(enValue, 'i18n.en', errors);
  const id = asRecord(idValue, 'i18n.id', errors);
  if (!en || !id) return;

  const enKeys = Object.keys(en).sort();
  const idKeys = Object.keys(id).sort();

  if (enKeys.join('\n') !== idKeys.join('\n')) {
    errors.push('i18n EN and ID files must have identical key sets.');
  }

  for (const requiredKey of REQUIRED_I18N_KEYS) {
    if (!(requiredKey in en) || !(requiredKey in id)) {
      errors.push(`i18n key ${requiredKey} is required in both languages.`);
    }
  }

  for (const key of new Set([...enKeys, ...idKeys])) {
    const enText = en[key];
    const idText = id[key];
    expectNonEmptyString(enText, `i18n.en.${key}`, errors);
    expectNonEmptyString(idText, `i18n.id.${key}`, errors);

    if (typeof enText === 'string' && typeof idText === 'string') {
      const enVariables = interpolationVariables(enText);
      const idVariables = interpolationVariables(idText);
      if (enVariables.join('|') !== idVariables.join('|')) {
        errors.push(`i18n interpolation variables differ for ${key}.`);
      }
    }
  }
}

function validateConfig(
  value: unknown,
  errors: string[],
  warnings: string[],
  release: boolean,
): void {
  const config = asRecord(value, 'config', errors);
  if (!config) return;

  const links = asRecord(config.links, 'config.links', errors);
  const flags = asRecord(config.flags, 'config.flags', errors);
  const loading = asRecord(config.loading, 'config.loading', errors);
  const gate = asRecord(config.gate, 'config.gate', errors);
  const story = asRecord(config.story, 'config.story', errors);
  const utm = asRecord(config.utm, 'config.utm', errors);

  if (links) {
    for (const key of ['activities', 'instagram', 'site']) {
      expectNonEmptyString(links[key], `config.links.${key}`, errors);
    }
  }
  if (flags) {
    for (const key of ['founderNote', 'sound', 'desktopEscapeHatch']) {
      if (typeof flags[key] !== 'boolean') errors.push(`config.flags.${key} must be boolean.`);
    }
    if (flags.analytics !== 'plausible' && flags.analytics !== false) {
      errors.push('config.flags.analytics must be "plausible" or false.');
    }
  }
  if (loading) expectPositiveNumber(loading.holdMs, 'config.loading.holdMs', errors);
  if (gate) expectPositiveNumber(gate.minDesktopWidth, 'config.gate.minDesktopWidth', errors);
  if (story) expectPositiveNumber(story.panels, 'config.story.panels', errors);
  if (utm) {
    for (const key of ['source', 'medium', 'campaign']) {
      expectNonEmptyString(utm[key], `config.utm.${key}`, errors);
    }
  }

  const tbdPaths = findTbdPaths(config);
  if (tbdPaths.length > 0) {
    const message = `Launch configuration still contains TBD at: ${tbdPaths.join(', ')}.`;
    if (release) errors.push(message);
    else warnings.push(message);
  }
}

function validateLocalizedText(value: unknown, path: string, errors: string[]): void {
  const localized = asRecord(value, path, errors);
  if (!localized) return;
  for (const language of LANGUAGES) {
    expectNonEmptyString(localized[language], `${path}.${language}`, errors);
  }
}

function validateLocalizedLists(value: unknown, path: string, errors: string[]): void {
  const localized = asRecord(value, path, errors);
  if (!localized) return;
  for (const language of LANGUAGES) {
    const list = localized[language];
    if (!Array.isArray(list) || list.length !== 3) {
      errors.push(`${path}.${language} must contain exactly three strings.`);
      continue;
    }
    list.forEach((item, index) => expectNonEmptyString(item, `${path}.${language}[${index}]`, errors));
  }
}

function asRecord(value: unknown, path: string, errors: string[]): Record<string, unknown> | null {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return null;
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectNonEmptyString(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${path} must be a non-empty string.`);
  }
}

function expectPositiveNumber(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    errors.push(`${path} must be a positive number.`);
  }
}

function interpolationVariables(text: string): string[] {
  return [...text.matchAll(/\{[a-zA-Z0-9_]+\}/g)].map(([match]) => match).sort();
}

function findTbdPaths(record: Record<string, unknown>, prefix = 'config'): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    const path = `${prefix}.${key}`;
    if (value === 'TBD') paths.push(path);
    else if (isRecord(value)) paths.push(...findTbdPaths(value, path));
  }
  return paths;
}

export type ValidatedAppData = Readonly<{
  questions: readonly Question[];
  types: readonly PersonalityType[];
  products: readonly Product[];
  sceneArt: SceneArtManifest;
  translations: Readonly<{ en: TranslationTable; id: TranslationTable }>;
  config: AppConfig;
}>;
