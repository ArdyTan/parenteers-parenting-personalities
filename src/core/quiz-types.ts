export const LANGUAGES = ['en', 'id'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIMENSIONS = ['structure', 'guidance', 'emotion', 'adventure'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const POLES_BY_DIMENSION = {
  structure: ['P', 'F'],
  guidance: ['C', 'G'],
  emotion: ['T', 'D'],
  adventure: ['E', 'N'],
} as const;

export type StructurePole = (typeof POLES_BY_DIMENSION.structure)[number];
export type GuidancePole = (typeof POLES_BY_DIMENSION.guidance)[number];
export type EmotionPole = (typeof POLES_BY_DIMENSION.emotion)[number];
export type AdventurePole = (typeof POLES_BY_DIMENSION.adventure)[number];
export type Pole = StructurePole | GuidancePole | EmotionPole | AdventurePole;
export type TypeCode = `${StructurePole}${GuidancePole}${EmotionPole}${AdventurePole}`;

export type LocalizedText = Readonly<Record<Language, string>>;
export type LocalizedList = Readonly<Record<Language, readonly string[]>>;

export type QuestionAnswer = Readonly<{
  pole: Pole;
  en: string;
  id: string;
}>;

export type Question = Readonly<{
  id: number;
  dimension: Dimension;
  scenario: LocalizedText;
  answers: readonly [QuestionAnswer, QuestionAnswer];
}>;

export type PersonalityType = Readonly<{
  code: TypeCode;
  slug: Lowercase<TypeCode>;
  emoji: string;
  name: LocalizedText;
  tagline: LocalizedText;
  superpowers: LocalizedList;
  watchout: LocalizedText;
  popCousin: LocalizedText;
  image: string;
  accent: string;
  activityTags: readonly [Pole, Pole];
}>;

export type SceneArtAsset = Readonly<{
  image: string;
  objectPosition: string;
}>;

export type SceneArtManifest = Readonly<{
  questions: readonly (SceneArtAsset & Readonly<{ id: number }>)[];
  checkpoints: readonly (SceneArtAsset & Readonly<{ afterQuestion: 6 | 9 }>)[];
  continuity: Readonly<{
    landing: string;
    intro: string;
    calculating: string;
    end: string;
    gate: string;
    preloader: string;
  }>;
}>;

export type PersistedAnswer = Readonly<{
  q: number;
  pole: Pole;
}>;

export type TranslationTable = Readonly<Record<string, string>>;

export type AppConfig = Readonly<{
  links: Readonly<{
    activities: string;
    instagram: string;
    site: string;
  }>;
  flags: Readonly<{
    founderNote: boolean;
    sound: boolean;
    desktopEscapeHatch: boolean;
    analytics: 'plausible' | false;
  }>;
  loading: Readonly<{
    lineMs: number;
    skippableAfterLine: number;
  }>;
  gate: Readonly<{
    minDesktopWidth: number;
  }>;
  story: Readonly<{
    panels: number;
  }>;
  utm: Readonly<{
    source: string;
    medium: string;
    campaign: string;
  }>;
}>;
