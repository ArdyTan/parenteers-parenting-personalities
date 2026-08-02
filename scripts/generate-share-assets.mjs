import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import sharp from 'sharp';

const workspace = process.cwd();
const writeStubs = process.argv.includes('--stubs');
const types = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'types.json'), 'utf8'),
);
const config = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'config.json'), 'utf8'),
);
const id = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'i18n', 'id.json'), 'utf8'),
);

if (writeStubs) {
  await prerenderResultRoutes();
} else {
  await generateOgImages();
}

async function generateOgImages() {
  const outputDirectory = resolve(workspace, 'public', 'og');
  await mkdir(outputDirectory, { recursive: true });

  const wordmark = await sharp(
    resolve(workspace, 'public', 'brand', 'parenteers-wordmark-blue.png'),
  )
    .resize({ width: 330, withoutEnlargement: false })
    .png()
    .toBuffer();

  for (const personality of types) {
    const characterPath = resolve(
      workspace,
      'public',
      personality.image.replace(/^\//, ''),
    );
    const character = await roundedImage(characterPath, 700, 58);
    const overlay = Buffer.from(typeCardSvg(personality));

    await sharp({
      create: {
        width: 1080,
        height: 1350,
        channels: 4,
        background: '#FDF2E1', // matches --color-editorial-canvas (the encoder's quantised cream)
      },
    })
      .composite([
        { input: overlay, top: 0, left: 0 },
        { input: wordmark, top: 54, left: 70 },
        { input: character, top: 190, left: 190 },
      ])
      .png({ compressionLevel: 9, palette: true, quality: 92 })
      .toFile(join(outputDirectory, `${personality.slug}.png`));
  }

  const opening = await roundedImage(
    resolve(workspace, 'public', 'opening', 'var-1.webp'),
    520,
    48,
    { width: 520, height: 520 },
  );
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: '#FDF2E1', // matches --color-editorial-canvas (the encoder's quantised cream)
    },
  })
    .composite([
      { input: Buffer.from(defaultCardSvg()), top: 0, left: 0 },
      { input: wordmark, top: 55, left: 70 },
      { input: opening, top: 55, left: 650 },
    ])
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(join(outputDirectory, 'default.png'));

  console.log(`Generated ${types.length} type OG cards plus default.png in public/og/.`);
}

async function prerenderResultRoutes() {
  const distDirectory = resolve(workspace, 'dist');
  const indexPath = join(distDirectory, 'index.html');
  const shell = await readFile(indexPath, 'utf8');
  const configured = isConfiguredLink(config.links.site);
  const siteBase = configured ? new URL(config.links.site) : null;

  const rootHtml = injectShareMeta(shell, {
    title: id['meta.og_title'],
    description: id['meta.og_description'],
    image: absoluteOrRoot('/og/default.png', siteBase),
    url: absoluteOrRoot('/', siteBase),
  });
  await writeFile(indexPath, rootHtml, 'utf8');

  for (const personality of types) {
    const route = `/r/${personality.slug}`;
    const html = injectShareMeta(shell, {
      title: `${personality.name.id} — ${id['meta.og_title']}`,
      description: personality.tagline.id,
      image: absoluteOrRoot(`/og/${personality.slug}.png`, siteBase),
      url: absoluteOrRoot(route, siteBase),
    });
    const routeDirectory = join(distDirectory, 'r', personality.slug);
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(join(routeDirectory, 'index.html'), html, 'utf8');
  }

  console.log(
    `Prerendered ${types.length} result routes in dist/r/.`
      + (configured ? '' : ' Final absolute OG URLs remain pending config.links.site.'),
  );
}

async function roundedImage(path, size, radius, dimensions = { width: size, height: size }) {
  const image = await sharp(path)
    .resize(dimensions.width, dimensions.height, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();
  const mask = Buffer.from(
    `<svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${dimensions.width}" height="${dimensions.height}" rx="${radius}" fill="#fff"/>
    </svg>`,
  );
  return sharp(image)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

function typeCardSvg(personality) {
  const nameLines = wrapText(personality.name.id, 22, 2);
  const taglineLines = wrapText(personality.tagline.id, 46, 3);
  const nameY = 1010;
  const taglineY = nameY + nameLines.length * 70 + 30;

  return `
    <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
      <circle cx="1000" cy="95" r="260" fill="${escapeXml(personality.accent)}" opacity=".22"/>
      <circle cx="70" cy="1260" r="240" fill="#3073E9" opacity=".12"/>
      <rect x="182" y="182" width="716" height="716" rx="64" fill="none"
        stroke="${escapeXml(personality.accent)}" stroke-width="12"/>
      <text x="1010" y="92" text-anchor="end" fill="#182799"
        font-family="Arial, sans-serif" font-size="26" font-weight="800"
        letter-spacing="5">${escapeXml(formatCode(personality.code))}</text>
      <text x="540" y="955" text-anchor="middle" fill="#E86811"
        font-family="Arial, sans-serif" font-size="25" font-weight="800"
        letter-spacing="3">${escapeXml(id['result.intro_label'].toUpperCase())}</text>
      ${svgTextLines(nameLines, 540, nameY, 70, {
        align: 'middle',
        color: '#182799',
        family: 'Georgia, serif',
        size: 66,
        weight: 800,
      })}
      ${svgTextLines(taglineLines, 540, taglineY, 44, {
        align: 'middle',
        color: '#182799',
        family: 'Georgia, serif',
        size: 34,
        weight: 600,
      })}
      <text x="70" y="1292" fill="#182799" font-family="Arial, sans-serif"
        font-size="23" font-weight="800">@parenteers</text>
      <text x="1010" y="1292" text-anchor="end" fill="#182799"
        font-family="Arial, sans-serif" font-size="20" font-weight="600">
        ${escapeXml(id['meta.og_description'])}
      </text>
    </svg>`;
}

function defaultCardSvg() {
  const title = wrapText(id['meta.og_title'], 19, 4);
  const description = wrapText(id['meta.og_description'], 34, 2);
  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="610" r="250" fill="#3073E9" opacity=".13"/>
      <circle cx="1130" cy="10" r="270" fill="#E86811" opacity=".14"/>
      ${svgTextLines(title, 70, 175, 60, {
        align: 'start',
        color: '#182799',
        family: 'Georgia, serif',
        size: 50,
        weight: 800,
      })}
      ${svgTextLines(description, 70, 445, 38, {
        align: 'start',
        color: '#182799',
        family: 'Arial, sans-serif',
        size: 28,
        weight: 600,
      })}
      <text x="70" y="575" fill="#E86811" font-family="Arial, sans-serif"
        font-size="24" font-weight="800" letter-spacing="3">12 PERTANYAAN · 3 MENIT</text>
    </svg>`;
}

function injectShareMeta(html, meta) {
  const cleaned = html.replace(/\s*<meta\s+data-share-meta[^>]*>\s*/g, '\n');
  const tags = [
    ['property', 'og:type', 'website'],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', meta.description],
    ['property', 'og:image', meta.image],
    ['property', 'og:image:width', meta.image.includes('default') ? '1200' : '1080'],
    ['property', 'og:image:height', meta.image.includes('default') ? '630' : '1350'],
    ['property', 'og:url', meta.url],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', meta.title],
    ['name', 'twitter:description', meta.description],
    ['name', 'twitter:image', meta.image],
  ]
    .map(
      ([attribute, key, value]) =>
        `    <meta data-share-meta ${attribute}="${escapeHtmlAttribute(key)}" content="${escapeHtmlAttribute(value)}" />`,
    )
    .join('\n');

  return cleaned.replace('</head>', `${tags}\n  </head>`);
}

function absoluteOrRoot(path, siteBase) {
  return siteBase ? new URL(path, siteBase).href : path;
}

function isConfiguredLink(value) {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.trim().toUpperCase() !== 'TBD';
}

function wrapText(text, maxCharacters, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharacters || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1].replace(/[.,;:!?]?$/, '')}…`;
  return visible;
}

function svgTextLines(lines, x, y, lineHeight, style) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${style.align}"
          fill="${style.color}" font-family="${style.family}" font-size="${style.size}"
          font-weight="${style.weight}">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

function formatCode(code) {
  return [...code].join('·');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtmlAttribute(value) {
  return escapeXml(value).replaceAll('\n', ' ');
}
