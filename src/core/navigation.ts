export const SCENE_NAMES = [
  'gate',
  'landing',
  'intro',
  'question',
  'interstitial',
  'calculating',
  'result',
  'story',
  'gallery',
  'end',
  'notFound',
] as const;

export type SceneName = (typeof SCENE_NAMES)[number];

export type AppRoute =
  | Readonly<{ scene: 'landing' }>
  | Readonly<{ scene: 'intro' }>
  | Readonly<{ scene: 'question'; question: number }>
  | Readonly<{ scene: 'calculating' }>
  | Readonly<{ scene: 'result'; slug: string }>
  | Readonly<{ scene: 'story' }>
  | Readonly<{ scene: 'gallery' }>
  | Readonly<{ scene: 'end' }>
  | Readonly<{ scene: 'notFound'; path: string }>;
