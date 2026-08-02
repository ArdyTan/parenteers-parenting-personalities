import { BRAND_ASSETS, BRAND_COLORS } from './brand';
import type { AppConfig, Language, PersonalityType } from './quiz-types';

export const STORY_IMAGE_WIDTH = 1080;
export const STORY_IMAGE_HEIGHT = 1920;

export type ShareCardLabels = Readonly<{
  intro: string;
  superpowers: string;
  watchout: string;
  disclaimer: string;
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

  const [character, wordmark] = await Promise.all([
    loadImage(input.personality.image),
    loadImage(BRAND_ASSETS.wordmarkBlue),
  ]);
  drawStoryCard(context, character, wordmark, input);

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

function drawStoryCard(
  context: CanvasRenderingContext2D,
  character: HTMLImageElement,
  wordmark: HTMLImageElement,
  input: ShareCardInput,
): void {
  const { personality, language, labels, shareUrl, instagramUrl } = input;
  const name = personality.name[language];
  const margin = 84;

  // Matches `--color-editorial-canvas`: the encoder quantises the authored
  // #FEF2E1 to #FDF2E1 in every derivative, so filling with the source value
  // would leave a one-unit halo around the composited character.
  context.fillStyle = '#FDF2E1';
  context.fillRect(0, 0, STORY_IMAGE_WIDTH, STORY_IMAGE_HEIGHT);

  context.save();
  context.globalAlpha = 0.16;
  context.fillStyle = personality.accent;
  context.beginPath();
  context.arc(930, 210, 300, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = BRAND_COLORS.brightBlue;
  context.beginPath();
  context.arc(80, 1500, 270, 0, Math.PI * 2);
  context.fill();
  context.restore();

  drawContainedImage(context, wordmark, margin, 70, 360, 78);
  context.fillStyle = BRAND_COLORS.blue;
  context.font = '700 25px "Plus Jakarta Sans", sans-serif';
  context.textAlign = 'right';
  context.fillText(formatTypeCode(personality.code), STORY_IMAGE_WIDTH - margin, 116);

  context.textAlign = 'center';
  context.font = '800 26px "Plus Jakarta Sans", sans-serif';
  context.letterSpacing = '3px';
  context.fillText(labels.intro.toUpperCase(), STORY_IMAGE_WIDTH / 2, 188);
  context.letterSpacing = '0px';

  const imageX = 190;
  const imageY = 230;
  const imageSize = 700;
  context.save();
  roundedRect(context, imageX, imageY, imageSize, imageSize, 74);
  context.clip();
  drawCoverImage(context, character, imageX, imageY, imageSize, imageSize);
  context.restore();
  context.strokeStyle = personality.accent;
  context.lineWidth = 9;
  roundedRect(context, imageX, imageY, imageSize, imageSize, 74);
  context.stroke();

  context.fillStyle = BRAND_COLORS.blue;
  context.textAlign = 'center';
  const nameSize = fitFontSize(context, name, 88, 58, STORY_IMAGE_WIDTH - margin * 2, 'Fraunces');
  context.font = `800 ${nameSize}px Fraunces, Georgia, serif`;
  context.fillText(name, STORY_IMAGE_WIDTH / 2, 1024);

  context.font = '800 30px "Plus Jakarta Sans", sans-serif';
  context.fillStyle = BRAND_COLORS.brightBlue;
  context.fillText(formatTypeCode(personality.code), STORY_IMAGE_WIDTH / 2, 1082);

  context.fillStyle = BRAND_COLORS.blue;
  context.font = '600 38px Fraunces, Georgia, serif';
  let y = drawWrappedText(
    context,
    personality.tagline[language],
    STORY_IMAGE_WIDTH / 2,
    1150,
    860,
    48,
    3,
  );

  context.textAlign = 'left';
  context.font = '800 25px "Plus Jakarta Sans", sans-serif';
  context.fillStyle = BRAND_COLORS.orange;
  context.fillText(labels.superpowers.toUpperCase(), margin, y + 40);
  y += 84;

  context.font = '600 27px "Plus Jakarta Sans", sans-serif';
  context.fillStyle = BRAND_COLORS.blue;
  for (const power of personality.superpowers[language]) {
    context.fillStyle = personality.accent;
    context.beginPath();
    context.arc(margin + 10, y - 10, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = BRAND_COLORS.blue;
    y = drawWrappedText(context, power, margin + 36, y, 870, 36, 2, 'left') + 12;
  }

  context.font = '800 23px "Plus Jakarta Sans", sans-serif';
  context.fillStyle = BRAND_COLORS.orange;
  context.fillText(labels.watchout.toUpperCase(), margin, y + 12);
  context.font = '500 23px "Plus Jakarta Sans", sans-serif';
  context.fillStyle = BRAND_COLORS.blue;
  y = drawWrappedText(
    context,
    personality.watchout[language],
    margin,
    y + 50,
    910,
    32,
    3,
    'left',
  );

  context.fillStyle = 'rgba(24, 39, 153, 0.72)';
  context.font = '500 18px "Plus Jakarta Sans", sans-serif';
  context.textAlign = 'center';
  drawWrappedText(
    context,
    labels.disclaimer,
    STORY_IMAGE_WIDTH / 2,
    Math.min(1790, y + 38),
    900,
    26,
    2,
  );

  context.fillStyle = BRAND_COLORS.blue;
  context.font = '800 24px "Plus Jakarta Sans", sans-serif';
  context.textAlign = 'left';
  context.fillText(instagramHandle(instagramUrl), margin, 1860);
  context.textAlign = 'right';
  context.fillText(displayShareHost(shareUrl), STORY_IMAGE_WIDTH - margin, 1860);
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

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
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
