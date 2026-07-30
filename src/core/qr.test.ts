import { describe, expect, it } from 'vitest';

import { createQrSvg, deriveMobileQuizUrl, QR_CANVAS, QR_INK } from './qr';

describe('createQrSvg', () => {
  it('creates a deterministic, accessible brand-blue-on-canvas inline SVG', async () => {
    const first = await createQrSvg('https://quiz.example.test/');
    const second = await createQrSvg('https://quiz.example.test/');

    expect(first).toBe(second);
    expect(first).toMatch(/^<svg\b/);
    expect(first).toContain('role="img"');
    expect(first).toContain('aria-label="Scan to open Parenting Bakes on your phone"');
    expect(first).toContain('<title>Scan to open Parenting Bakes on your phone</title>');
    expect(first).toContain('focusable="false"');
    expect(first).toContain(`fill="${QR_CANVAS}"`);
    expect(first).toContain(`stroke="${QR_INK}"`);
    expect(first).toContain('width="256" height="256"');
  });

  it('escapes a caller-supplied accessible label', async () => {
    const svg = await createQrSvg('https://quiz.example.test/', {
      label: 'Scan & open <the "quiz">',
    });

    expect(svg).toContain('aria-label="Scan &amp; open &lt;the &quot;quiz&quot;&gt;"');
    expect(svg).toContain('<title>Scan &amp; open &lt;the &quot;quiz&quot;&gt;</title>');
    expect(svg).not.toContain('aria-label="Scan & open');
  });

  it.each([
    '/r/pcte',
    'quiz.example.test',
    'mailto:hello@example.test',
    'javascript:alert(1)',
  ])('rejects non-absolute or non-HTTP(S) URL %s', async (url) => {
    await expect(createQrSvg(url)).rejects.toThrow(/absolute HTTP\(S\)|http: or https:/i);
  });
});

describe('deriveMobileQuizUrl', () => {
  it('drops a result route plus query and hash state', () => {
    expect(
      deriveMobileQuizUrl({
        origin: 'https://quiz.example.test',
        pathname: '/r/pcte',
        search: '?utm_source=result',
        hash: '#share',
      }),
    ).toBe('https://quiz.example.test/');
  });

  it('drops the calculating route instead of treating it as a deployment folder', () => {
    expect(
      deriveMobileQuizUrl({
        origin: 'https://quiz.example.test',
        pathname: '/baking',
      }),
    ).toBe('https://quiz.example.test/');
  });

  it('preserves a deployment base path while dropping app route state', () => {
    expect(
      deriveMobileQuizUrl({
        origin: 'https://example.test',
        pathname: '/parenting-bakes/q/7/',
      }),
    ).toBe('https://example.test/parenting-bakes/');
  });

  it('keeps an existing landing path and gives it a trailing slash', () => {
    expect(
      deriveMobileQuizUrl({
        origin: 'https://example.test',
        pathname: '/parenting-bakes',
      }),
    ).toBe('https://example.test/parenting-bakes/');
  });

  it.each(['file:///quiz', 'not-an-origin'])('rejects invalid HTTP(S) origin %s', (origin) => {
    expect(() => deriveMobileQuizUrl({ origin, pathname: '/r/pcte' })).toThrow(
      /absolute HTTP\(S\)|http: or https:/i,
    );
  });
});
