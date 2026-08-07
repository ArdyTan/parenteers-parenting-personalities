export const SCENE_NAMES = [
  'gate',
  'landing',
  'intro',
  'question',
  'calculating',
  'result',
  'story',
  'gallery',
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
  | Readonly<{ scene: 'notFound'; path: string }>;
