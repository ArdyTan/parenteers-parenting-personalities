import { describe, expect, it, vi } from 'vitest';

import type { AppConfig, PersonalityType } from './quiz-types';
import {
  buildResultShareUrl,
  deliverResultImage,
  deliverShareLink,
  displayShareHost,
  formatShareCaption,
  formatTypeCode,
  instagramHandle,
} from './share';

const config = {
  links: {
    activities: 'TBD',
    instagram: 'https://instagram.com/parenteers',
    saweria: 'https://saweria.co/parenteers',
    site: 'https://quiz.parenteers.com/',
  },
  flags: {
    founderNote: true,
    sound: true,
    desktopEscapeHatch: true,
    analytics: 'plausible',
  },
  loading: { holdMs: 5000 },
  gate: { minDesktopWidth: 900 },
  story: { panels: 3 },
  utm: { source: 'quiz', medium: 'share', campaign: 'parenting-bakes' },
} as const satisfies AppConfig;

const personality = {
  code: 'PCTE',
  slug: 'pcte',
  emoji: '🍮',
  name: { en: 'The Croquembouche', id: 'The Croquembouche' },
  tagline: { en: 'EN', id: 'ID' },
  superpowers: { en: ['A', 'B', 'C'], id: ['A', 'B', 'C'] },
  watchout: { en: 'EN', id: 'ID' },
  parentStory: {
    image: '/story-illustrations/pcte-story.webp',
    imageAlt: { en: 'Story scene', id: 'Adegan cerita' },
    imageAfterParagraph: 2,
    title: { en: 'Story', id: 'Cerita' },
    body: { en: 'One\n\nTwo\n\nThree\n\nFour', id: 'Satu\n\nDua\n\nTiga\n\nEmpat' },
  },
  parentSupport: {
    realLife: { en: 'EN', id: 'ID' },
    guiltRelease: { en: 'EN', id: 'ID' },
    careForYou: { en: 'EN', id: 'ID' },
    forYourChild: { en: 'EN', id: 'ID' },
    tryThisWeek: { en: ['A', 'B', 'C'], id: ['A', 'B', 'C'] },
  },
  popCousin: { en: 'EN', id: 'ID' },
  image: '/characters/pcte-croquembouche.webp',
  accent: '#D69E62',
  activityTags: ['C', 'T'],
} as const satisfies PersonalityType;

describe('share helpers', () => {
  it('builds a canonical result URL with campaign parameters', () => {
    expect(
      buildResultShareUrl('/r/pcte', config, 'https://preview.example.dev/q/2'),
    ).toBe(
      'https://quiz.parenteers.com/r/pcte?utm_source=quiz&utm_medium=share&utm_campaign=parenting-bakes',
    );
  });

  it('falls back to the current origin before the final domain is configured', () => {
    const pending = {
      ...config,
      links: { ...config.links, site: 'TBD' },
    } satisfies AppConfig;
    expect(buildResultShareUrl('/r/pcte', pending, 'https://preview.example.dev/q/2')).toMatch(
      /^https:\/\/preview\.example\.dev\/r\/pcte\?/,
    );
  });

  it('formats captions, codes, handles, and display hosts', () => {
    const link = 'https://quiz.parenteers.com/r/pcte';
    expect(
      formatShareCaption(
        "I'm {type} {emoji}. What's yours? {link}",
        personality,
        'en',
        link,
      ),
    ).toBe(`I'm The Croquembouche 🍮. What's yours? ${link}`);
    expect(formatTypeCode('PCTE')).toBe('P·C·T·E');
    expect(instagramHandle(config.links.instagram)).toBe('@parenteers');
    expect(displayShareHost('https://www.quiz.parenteers.com/r/pcte')).toBe(
      'quiz.parenteers.com',
    );
  });

  it('uses file share first, then download, then the screenshot fallback', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    const data = { title: 'Title', text: 'Caption', url: 'https://example.com' };
    const download = vi.fn(() => true);
    const shareFile = vi.fn(async () => undefined);

    await expect(
      deliverResultImage(blob, 'result.png', data, { shareFile, download }),
    ).resolves.toBe('shared');
    expect(download).not.toHaveBeenCalled();

    await expect(
      deliverResultImage(blob, 'result.png', data, {
        shareFile: async () => {
          throw new Error('unavailable');
        },
        download,
      }),
    ).resolves.toBe('downloaded');

    await expect(
      deliverResultImage(blob, 'result.png', data, { download: () => false }),
    ).resolves.toBe('screenshot');
  });

  it('does not trigger a fallback after the user cancels a share sheet', async () => {
    const download = vi.fn(() => true);
    const error = new Error('cancelled');
    error.name = 'AbortError';
    await expect(
      deliverResultImage(
        new Blob(),
        'result.png',
        { title: 'Title', text: 'Caption', url: 'https://example.com' },
        {
          shareFile: async () => {
            throw error;
          },
          download,
        },
      ),
    ).resolves.toBe('cancelled');
    expect(download).not.toHaveBeenCalled();
  });

  it('shares links natively and copies only when native share is unavailable', async () => {
    const data = { title: 'Title', text: 'Caption', url: 'https://example.com' };
    const copyText = vi.fn(async () => true);
    await expect(
      deliverShareLink(data, { shareLink: async () => undefined, copyText }),
    ).resolves.toBe('shared');
    expect(copyText).not.toHaveBeenCalled();

    await expect(deliverShareLink(data, { copyText })).resolves.toBe('copied');
  });
});
