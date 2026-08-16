import { BRAND_ASSETS, BRAND_COLORS } from './brand';
import type { AppConfig, Language, PersonalityType } from './quiz-types';

export const STORY_IMAGE_WIDTH = 1080;
export const STORY_IMAGE_HEIGHT = 1920;

/**
 * `images/Result Card.jpg` is authored at 390x768: a phone screen, not the
 * 9:16 the export has to be. Rather than stretch the design into a different
 * aspect, every position below stays in the artwork's own units and is scaled
 * uniformly to the card's *height*, then centred. Type sizes, gaps and margins
 * therefore keep their authored proportions; the card simply carries a little
 * more air down each side than the source file does.
 */
const CARD_REFERENCE_WIDTH = 390;
const CARD_REFERENCE_HEIGHT = 768;
const CARD_SCALE = STORY_IMAGE_HEIGHT / CARD_REFERENCE_HEIGHT;
const CARD_INSET = (STORY_IMAGE_WIDTH - CARD_REFERENCE_WIDTH * CARD_SCALE) / 2;

/** The pill behind the type code: one step warmer than the canvas. */
const CARD_CODE_PILL = '#F3E3CA';

/** From the approved outline family, already drawn in `--color-blue`. */
const INSTAGRAM_GLYPH = '/icons/instagram.svg';

/**
 * The reference geometry, in its own 390x768 units. Values are the measured
 * ink bounds of the source file, so `baseline` really is a text baseline and
 * `y` really is the top edge of a drawn box.
 */
const CARD_LAYOUT = {
  wordmark: { x: 128, y: 42, width: 134, height: 21 },
  /**
   * Full-bleed square. The character WebPs carry the same opaque cream as the
   * canvas, so a card-width square reads as bleed with no visible edge, and
   * `y` is the *image* top. Where each character's ink lands inside its own
   * 900x900 frame is the illustrator's decision, not the layout's.
   */
  character: { y: 70.7, size: CARD_REFERENCE_WIDTH },
  eyebrow: { baseline: 488, size: 11.3, tracking: 2, maxWidth: 300 },
  name: { baseline: 537, size: 47, minimumSize: 28, maxWidth: 340 },
  code: { y: 549, height: 36, baseline: 573, size: 15.3, tracking: 3.45, paddingX: 25 },
  tagline: { baseline: 614.5, lineHeight: 18.5, size: 13, maxWidth: 285, maxLines: 3 },
  footer: {
    left: 35,
    right: 354,
    cta: { baseline: 700.5, size: 10 },
    link: { baseline: 714.8, size: 10, underline: 718, underlineWeight: 1.2 },
    handle: { baseline: 707.5, size: 12 },
    icon: { size: 12, y: 698, gap: 7 },
  },
} as const;

export type ShareCardLabels = Readonly<{
  /** The eyebrow above the name, "Kamu adalah…". */
  intro: string;
  /** The footer invitation that precedes the quiz host. */
  cta: string;
}>;

export type ShareCardInput = Readonly<{
  personality: PersonalityType;
  language: Language;
  shareUrl: string;
  instagramUrl: string;
  labels: ShareCardLabels;
}>;

export type ImageDeliveryOutcome =
  | 'shared'
  | 'downloaded'
  | 'screenshot'
  | 'cancelled';

export type LinkDeliveryOutcome = 'shared' | 'copied' | 'failed' | 'cancelled';

export type ShareAdapter = Readonly<{
  shareFile?: (
    blob: Blob,
    filename: string,
    data: Readonly<{ title: string; text: string; url: string }>,
  ) => Promise<void>;
  download?: (blob: Blob, filename: string) => boolean;
  shareLink?: (data: Readonly<{ title: string; text: string; url: string }>) => Promise<void>;
  copyText?: (text: string) => Promise<boolean>;
}>;

export function buildResultShareUrl(
  path: string,
  config: AppConfig,
  currentHref: string,
): string {
  const base = isConfiguredLink(config.links.site)
    ? new URL(config.links.site)
    : new URL('/', currentHref);
  const url = new URL(path, base);

  url.searchParams.set('utm_source', config.utm.source);
  url.searchParams.set('utm_medium', config.utm.medium);
  url.searchParams.set('utm_campaign', config.utm.campaign);
  return url.href;
}

export function formatShareCaption(
  template: string,
  personality: PersonalityType,
  language: Language,
  shareUrl: string,
): string {
  return template
    .replaceAll('{type}', personality.name[language])
    .replaceAll('{emoji}', personality.emoji)
    .replaceAll('{link}', shareUrl);
}

export function formatTypeCode(code: string): string {
  return [...code].join('·');
}

export function instagramHandle(instagramUrl: string): string {
  try {
    const path = new URL(instagramUrl).pathname.replace(/^\/|\/$/g, '');
    return path ? `@${path.split('/')[0]}` : '@parenteers';
  } catch {
    return '@parenteers';
  }
}

export function displayShareHost(shareUrl: string): string {
  try {
    return new URL(shareUrl).host.replace(/^www\./, '');
  } catch {
    return shareUrl;
  }
}

export async function composeResultStoryCard(input: ShareCardInput): Promise<Blob> {
  await document.fonts?.ready;

  const canvas = document.createElement('canvas');
  canvas.width = STORY_IMAGE_WIDTH;
  canvas.height = STORY_IMAGE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  const [character, wordmark, instagram] = await Promise.all([
    loadImage(input.personality.image),
    loadImage(BRAND_ASSETS.wordmarkBlue),
    loadImage(INSTAGRAM_GLYPH),
  ]);
  drawStoryCard(context, { character, wordmark, instagram }, input);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The story image could not be encoded.'));
      },
      'image/png',
    );
  });
}

export async function deliverResultImage(
  blob: Blob,
  filename: string,
  data: Readonly<{ title: string; text: string; url: string }>,
  adapter: ShareAdapter,
): Promise<ImageDeliveryOutcome> {
  if (adapter.shareFile) {
    try {
      await adapter.shareFile(blob, filename, data);
      return 'shared';
    } catch (error) {
      if (isAbortError(error)) return 'cancelled';
    }
  }

  if (adapter.download?.(blob, filename)) return 'downloaded';
  return 'screenshot';
}

export async function deliverShareLink(
  data: Readonly<{ title: string; text: string; url: string }>,
  adapter: ShareAdapter,
): Promise<LinkDeliveryOutcome> {
  if (adapter.shareLink) {
    try {
      await adapter.shareLink(data);
      return 'shared';
    } catch (error) {
      if (isAbortError(error)) return 'cancelled';
    }
  }

  if (!adapter.copyText) return 'failed';
  return (await adapter.copyText(data.url)) ? 'copied' : 'failed';
}

export function createBrowserShareAdapter(
  copyText?: (text: string) => Promise<boolean>,
): ShareAdapter {
  const shareFile = supportsFileShare()
    ? async (
        blob: Blob,
        filename: string,
        data: Readonly<{ title: string; text: string; url: string }>,
      ): Promise<void> => {
        const file = new File([blob], filename, { type: 'image/png' });
        await navigator.share({ ...data, files: [file] });
      }
    : undefined;

  const shareLink = typeof navigator.share === 'function'
    ? async (data: Readonly<{ title: string; text: string; url: string }>): Promise<void> => {
        await navigator.share(data);
      }
    : undefined;

  return {
    ...(shareFile ? { shareFile } : {}),
    ...(shareLink ? { shareLink } : {}),
    ...(copyText ? { copyText } : {}),
    download: (blob, filename) => downloadBlob(blob, filename),
  };
}

export function isConfiguredLink(value: string): boolean {
  const normalized = value.trim();
  return normalized.length > 0 && normalized.toUpperCase() !== 'TBD';
}

/** Reference x to canvas x. */
function rx(value: number): number {
  return CARD_INSET + value * CARD_SCALE;
}

/** Reference y to canvas y. The design and the card share a top edge. */
function ry(value: number): number {
  return value * CARD_SCALE;
}

/** Reference length to canvas length. */
function rs(value: number): number {
  return value * CARD_SCALE;
}

function drawStoryCard(
  context: CanvasRenderingContext2D,
  art: Readonly<{
    character: HTMLImageElement;
    wordmark: HTMLImageElement;
    instagram: HTMLImageElement;
  }>,
  input: ShareCardInput,
): void {
  const { personality, language, labels, shareUrl, instagramUrl } = input;
  const centre = rx(CARD_REFERENCE_WIDTH / 2);

  // Matches `--color-editorial-canvas`: the encoder quantises the authored
  // #FEF2E1 to #FDF2E1 in every derivative, so filling with the source value
  // would leave a one-unit halo around the composited character.
  context.fillStyle = '#FDF2E1';
  context.fillRect(0, 0, STORY_IMAGE_WIDTH, STORY_IMAGE_HEIGHT);

  const { wordmark } = CARD_LAYOUT;
  drawContainedImage(
    context,
    art.wordmark,
    rx(wordmark.x),
    ry(wordmark.y),
    rs(wordmark.width),
    rs(wordmark.height),
  );

  const { character } = CARD_LAYOUT;
  const characterSize = rs(character.size);
  context.drawImage(art.character, rx(0), ry(character.y), characterSize, characterSize);

  const { eyebrow } = CARD_LAYOUT;
  const introText = labels.intro.toUpperCase();
  context.textAlign = 'center';
  context.fillStyle = BRAND_COLORS.blue;
  // Tracked type overflows long before its untracked width does, so the
  // eyebrow is sized against the width it will actually occupy.
  const eyebrowScale = Math.min(
    1,
    rs(eyebrow.maxWidth)
      / trackedTextWidth(
        setFont(context, `800 ${rs(eyebrow.size)}px "Plus Jakarta Sans", sans-serif`),
        introText,
        rs(eyebrow.tracking),
      ),
  );
  context.font = `800 ${rs(eyebrow.size) * eyebrowScale}px "Plus Jakarta Sans", sans-serif`;
  drawTrackedText(
    context,
    introText,
    centre,
    ry(eyebrow.baseline),
    rs(eyebrow.tracking) * eyebrowScale,
  );

  const { name } = CARD_LAYOUT;
  const nameText = personality.name[language];
  const nameSize = fitFontSize(
    context,
    nameText,
    rs(name.size),
    rs(name.minimumSize),
    rs(name.maxWidth),
    'Fraunces',
  );
  context.font = `800 ${nameSize}px Fraunces, Georgia, serif`;
  context.fillText(nameText, centre, ry(name.baseline));

  drawCodePill(context, personality.code);

  const { tagline } = CARD_LAYOUT;
  context.fillStyle = BRAND_COLORS.blue;
  context.font = `700 ${rs(tagline.size)}px "Plus Jakarta Sans", sans-serif`;
  drawWrappedText(
    context,
    personality.tagline[language],
    centre,
    ry(tagline.baseline),
    rs(tagline.maxWidth),
    rs(tagline.lineHeight),
    tagline.maxLines,
  );

  drawFooter(context, art.instagram, labels.cta, shareUrl, instagramUrl);
}

/**
 * The type code sits in a warm pill that hugs its own tracked width, so a card
 * is never laid out around a fixed box that the letters may not fill.
 */
function drawCodePill(context: CanvasRenderingContext2D, code: string): void {
  const { code: layout } = CARD_LAYOUT;
  const tracking = rs(layout.tracking);
  const centre = rx(CARD_REFERENCE_WIDTH / 2);

  context.font = `800 ${rs(layout.size)}px "Plus Jakarta Sans", sans-serif`;
  const textWidth = trackedTextWidth(context, code, tracking);
  const pillWidth = textWidth + rs(layout.paddingX) * 2;
  const pillHeight = rs(layout.height);
  const pillY = ry(layout.y);

  context.fillStyle = CARD_CODE_PILL;
  roundedRect(context, centre - pillWidth / 2, pillY, pillWidth, pillHeight, pillHeight / 2);
  context.fill();

  context.fillStyle = BRAND_COLORS.orange;
  context.textAlign = 'center';
  drawTrackedText(context, code, centre, ry(layout.baseline), tracking);
}

/**
 * Two blocks on one line: the invitation plus the quiz host on the left, the
 * Instagram glyph plus handle on the right. Both are pinned to the reference
 * margins rather than to each other, so a longer host cannot push the handle.
 */
function drawFooter(
  context: CanvasRenderingContext2D,
  instagram: HTMLImageElement,
  cta: string,
  shareUrl: string,
  instagramUrl: string,
): void {
  const { footer } = CARD_LAYOUT;

  context.textAlign = 'left';
  context.fillStyle = BRAND_COLORS.orange;
  context.font = `500 ${rs(footer.cta.size)}px "Plus Jakarta Sans", sans-serif`;
  context.fillText(cta, rx(footer.left), ry(footer.cta.baseline));

  const host = displayShareHost(shareUrl);
  context.font = `800 ${rs(footer.link.size)}px "Plus Jakarta Sans", sans-serif`;
  context.fillText(host, rx(footer.left), ry(footer.link.baseline));
  context.fillRect(
    rx(footer.left),
    ry(footer.link.underline),
    context.measureText(host).width,
    rs(footer.link.underlineWeight),
  );

  const handle = instagramHandle(instagramUrl);
  context.textAlign = 'right';
  context.fillStyle = BRAND_COLORS.blue;
  context.font = `600 ${rs(footer.handle.size)}px "Plus Jakarta Sans", sans-serif`;
  context.fillText(handle, rx(footer.right), ry(footer.handle.baseline));

  const iconSize = rs(footer.icon.size);
  const iconRight = rx(footer.right) - context.measureText(handle).width - rs(footer.icon.gap);
  context.drawImage(instagram, iconRight - iconSize, ry(footer.icon.y), iconSize, iconSize);
}

/**
 * Canvas `letterSpacing` is not available everywhere `navigator.share` is, so
 * tracking is applied by hand: the string is drawn glyph by glyph from a left
 * edge derived from the tracked width and the requested alignment.
 */
function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
): void {
  const characters = [...text];
  const total = trackedTextWidth(context, text, tracking);
  const align = context.textAlign;
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;

  context.textAlign = 'left';
  for (const character of characters) {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + tracking;
  }
  context.textAlign = align;
}

/** Sets a font and hands the context back, so a measurement can be inlined. */
function setFont(
  context: CanvasRenderingContext2D,
  font: string,
): CanvasRenderingContext2D {
  context.font = font;
  return context;
}

function trackedTextWidth(
  context: CanvasRenderingContext2D,
  text: string,
  tracking: number,
): number {
  const characters = [...text];
  if (characters.length === 0) return 0;
  const glyphs = characters.reduce(
    (total, character) => total + context.measureText(character).width,
    0,
  );
  // Trailing tracking is not part of the visible run.
  return glyphs + tracking * (characters.length - 1);
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load share image asset: ${source}`));
    image.src = source;
  });
}

function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const sourceWidth = 'naturalWidth' in image ? image.naturalWidth : width;
  const sourceHeight = 'naturalHeight' in image ? image.naturalHeight : height;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(image, x, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  align: CanvasTextAlign = 'center',
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    const lastIndex = visible.length - 1;
    let last = visible[lastIndex] ?? '';
    while (last && context.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    visible[lastIndex] = `${last.trimEnd()}…`;
  }

  context.textAlign = align;
  visible.forEach((line, index) => context.fillText(line, x, startY + index * lineHeight));
  return startY + visible.length * lineHeight;
}

function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maximum: number,
  minimum: number,
  maxWidth: number,
  family: string,
): number {
  for (let size = maximum; size >= minimum; size -= 2) {
    context.font = `800 ${size}px ${family}, Georgia, serif`;
    if (context.measureText(text).width <= maxWidth) return size;
  }
  return minimum;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function supportsFileShare(): boolean {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    const probe = new File(['share'], 'share.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string): boolean {
  if (isEmbeddedBrowser(navigator.userAgent)) return false;

  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    return true;
  } catch {
    return false;
  }
}

function isEmbeddedBrowser(userAgent: string): boolean {
  return /(Instagram|FBAN|FBAV|Line\/|WhatsApp)/i.test(userAgent);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : typeof error === 'object'
      && error !== null
      && 'name' in error
      && error.name === 'AbortError';
}
