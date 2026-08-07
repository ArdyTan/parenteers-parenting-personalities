import QRCode from 'qrcode';

import { BRAND_COLORS } from './brand';

export type LocationPath = Readonly<{
  origin: string;
  pathname: string;
  search?: string;
  hash?: string;
}>;

export type QrSvgOptions = Readonly<{
  label?: string;
}>;

export const QR_CANVAS = BRAND_COLORS.canvas;
export const QR_INK = BRAND_COLORS.blue;

const DEFAULT_QR_LABEL = 'Scan to open Parenting Bakes on your phone';
const QR_SIZE = 256;

const APP_ROUTE_SUFFIX = new RegExp(
  String.raw`/(?:intro|q/(?:[1-9]|1[0-2])|baking|r/[a-z0-9-]+|story|gallery)/?$`,
  'i',
);

/**
 * Builds the quiz landing URL for the desktop gate.
 *
 * Route, query, and hash state are intentionally discarded so scanning the QR
 * always starts a fresh mobile visit. A deployment subdirectory is preserved.
 */
export function deriveMobileQuizUrl(location: LocationPath): string {
  const origin = parseHttpUrl(location.origin, 'location origin');
  const current = new URL(location.pathname || '/', origin);
  const appBasePath = current.pathname.replace(APP_ROUTE_SUFFIX, '') || '/';

  current.pathname = withTrailingSlash(appBasePath);
  current.search = '';
  current.hash = '';

  return current.href;
}

/** Returns a deterministic, accessible brand-blue-on-canvas inline QR SVG. */
export async function createQrSvg(url: string, options: QrSvgOptions = {}): Promise<string> {
  const normalizedUrl = parseHttpUrl(url, 'QR URL').href;
  const label = options.label?.trim() || DEFAULT_QR_LABEL;
  const svg = await QRCode.toString(normalizedUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: QR_SIZE,
    color: {
      dark: QR_INK,
      light: QR_CANVAS,
    },
  });

  const accessibleSvgStart = `<svg role="img" aria-label="${escapeXml(label)}" focusable="false" `;
  const title = `<title>${escapeXml(label)}</title>`;

  return svg.replace('<svg ', accessibleSvgStart).replace('><path', `>${title}<path`);
}

function parseHttpUrl(value: string, label: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError(`${label} must be an absolute HTTP(S) URL.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError(`${label} must use the http: or https: protocol.`);
  }

  return parsed;
}

function withTrailingSlash(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[character] ?? character,
  );
}
