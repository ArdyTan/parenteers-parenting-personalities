/**
 * Builds the 16-page personality booklet, one PDF per type per language, into
 * `public/pdf/{lang}/{slug}.pdf`. Content comes from the bundled JSON database
 * exactly as the app does; nothing here is hardcoded copy except layout labels,
 * which live in i18n under `pdf.*`.
 *
 * The booklet is a committed derivative, never a runtime feature — this script
 * is deliberately excluded from `npm run build` so Workers Builds never needs a
 * browser. See docs/personality-pdf-plan.md.
 *
 * Usage: node ./scripts/generate-pdf-booklets.mjs [--lang id] [--slug pcte]
 *   [--output output/pdf/pcte-review.pdf]
 */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import QRCode from 'qrcode';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const read = async (relative) => JSON.parse(await readFile(resolve(root, relative), 'utf8'));

const types = await read('src/data/types.json');
const parentCare = await read('src/data/parent-care.json');
const childActivities = await read('src/data/child-activities.json');
const weeklyExtras = await read('src/data/weekly-extras.json');
const config = await read('src/data/config.json');
const translations = {
  id: await read('src/data/i18n/id.json'),
  en: await read('src/data/i18n/en.json'),
};

const argument = (flag) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
};
const onlyLang = argument('--lang');
const onlySlug = argument('--slug');
const reviewOutput = argument('--output');

if (reviewOutput && (!onlyLang || !onlySlug)) {
  throw new Error('--output requires both --lang and --slug so it can never overwrite a batch.');
}

const BANDS = ['0-12m', '1-2y', '2-3y', '3-4y', '4-5y'];
/** Which dimension letter selects within each band. Adventure picks at both ends. */
const BAND_DIMENSION = [3, 0, 1, 2, 3];
const BAND_LABEL = {
  '0-12m': { id: '0–12 bulan', en: '0–12 months' },
  '1-2y': { id: '1–2 tahun', en: '1–2 years' },
  '2-3y': { id: '2–3 tahun', en: '2–3 years' },
  '3-4y': { id: '3–4 tahun', en: '3–4 years' },
  '4-5y': { id: '4–5 tahun', en: '4–5 years' },
};
const METHOD_LABEL = {
  'serve-return': { id: 'Serve & return (Harvard)', en: 'Serve and return (Harvard)' },
  'cprt-special-play': { id: 'Filial therapy — waktu main spesial', en: 'Filial therapy — special play time' },
  'cprt-reflect': { id: 'Play therapy — memantulkan perasaan', en: 'Play therapy — reflecting feelings' },
  'montessori-practical-life': { id: 'Montessori — practical life', en: 'Montessori — practical life' },
  'montessori-sensorial': { id: 'Montessori — sensorial', en: 'Montessori — sensorial' },
  'montessori-movement': { id: 'Montessori — kebebasan bergerak', en: 'Montessori — freedom of movement' },
  'montessori-order': { id: 'Montessori — keteraturan', en: 'Montessori — order' },
  'montessori-heuristic': { id: 'Heuristic play / treasure basket', en: 'Heuristic play / treasure basket' },
};
const DIMENSIONS = [
  { key: 'structure', poles: { P: { id: 'Planner', en: 'Planner' }, F: { id: 'Flow', en: 'Flow' } },
    title: { id: 'Cara kamu menata hari', en: 'How you organize the day' } },
  { key: 'guidance', poles: { C: { id: 'Captain', en: 'Captain' }, G: { id: 'Gardener', en: 'Gardener' } },
    title: { id: 'Siapa yg menentukan arah', en: 'Who sets the direction' } },
  { key: 'emotion', poles: { T: { id: 'Talker', en: 'Talker' }, D: { id: 'Doer', en: 'Doer' } },
    title: { id: 'Saat perasaannya meledak', en: 'When the feelings get big' } },
  { key: 'adventure', poles: { E: { id: 'Explorer', en: 'Explorer' }, N: { id: 'Nester', en: 'Nester' } },
    title: { id: 'Nyaman atau menantang', en: 'Comfort zone or stretch zone' } },
];

/** Deterministic default per docs/personality-pdf-plan.md §4.3; overridable per type. */
function selectParentCare(personality, index) {
  const override = personality.pdfSelection?.parentCare;
  if (override) return override.map((id) => parentCare.find((record) => record.id === id));
  const universal = parentCare.find((record) => record.pole === '*');
  const picks = personality.code.split('').map((letter) => {
    const variants = parentCare.filter((record) => record.pole === letter);
    return variants[index % variants.length];
  });
  return [universal, ...picks];
}

function selectChildActivities(personality, index) {
  const override = personality.pdfSelection?.childPlay;
  if (override) return override.map((id) => childActivities.find((record) => record.id === id));
  return BANDS.map((band, position) => {
    const letter = personality.code[BAND_DIMENSION[position]];
    const variants = childActivities.filter(
      (record) => record.band === band && record.poleAffinity === letter,
    );
    const peerIndex = types.slice(0, index).filter(
      (type) => type.code[BAND_DIMENSION[position]] === letter,
    ).length;
    return variants[peerIndex % variants.length];
  });
}

/** Four extra weekly actions, one per dimension, keyed to that letter's watch-out. */
function selectWeeklyExtras(personality, index) {
  const override = personality.pdfSelection?.weeklyExtras;
  if (override) return override.map((id) => weeklyExtras.find((record) => record.id === id));
  return personality.code.split('').map((letter) => {
    const variants = weeklyExtras.filter((record) => record.pole === letter);
    return variants[index % variants.length];
  });
}

const escape = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

async function dataUri(relative, mime) {
  const buffer = await readFile(resolve(root, relative));
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

/** The closing page keeps one QR and one purpose: optional Saweria support. */
const supportQrCode = await QRCode.toDataURL(config.links.saweria, {
  margin: 0, width: 480, errorCorrectionLevel: 'M',
  color: { dark: '#182799', light: '#ffffff' },
});
const closingIcons = {
  instagram: await dataUri('public/icons/instagram.svg', 'image/svg+xml'),
  web: await dataUri('public/icons/web.svg', 'image/svg+xml'),
};
const instagramHandle = `@${new URL(config.links.instagram).pathname.replace(/^\/+|\/+$/g, '')}`;

const fonts = {
  display: await dataUri('public/fonts/fraunces-latin-variable.woff2', 'font/woff2'),
  body: await dataUri('public/fonts/plus-jakarta-sans-latin-variable.woff2', 'font/woff2'),
};

/**
 * Skia embeds a decoded bitmap for anything it has to resample, so handing Chrome
 * a 900px WebP for a 118mm circle produced a 3.7 MB file. Pre-encoding to JPEG at
 * the printed pixel size keeps a whole booklet near 300 KB.
 *
 * The 54 commissioned pieces are shared across all 32 booklets, so the encode is
 * memoised: without this the same 45 tiles and 9 bands are re-encoded 32 times.
 */
const encoded = new Map();

async function publicImage(path, printWidth) {
  if (!path) return '';
  const key = `${path}|${printWidth}`;
  if (encoded.has(key)) return encoded.get(key);
  const file = resolve(root, 'public', path.replace(/^\//, ''));
  if (!existsSync(file)) return '';
  const buffer = await sharp(file)
    .resize({ width: printWidth, withoutEnlargement: true })
    .flatten({ background: '#fdf2e1' })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  const uri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  encoded.set(key, uri);
  return uri;
}

/**
 * Printed widths. A tile is a fixed 34x26mm and a band is the full 174mm column,
 * both at roughly the ~180dpi the character and story frames already ship at.
 */
const TILE_WIDTH = 280;
const BAND_WIDTH = 1040;

/** Page furniture, keyed f1-f9 by the slot ids in the art brief §7.3. */
async function loadFurniture() {
  const entries = await Promise.all(Array.from({ length: 9 }, async (_, index) => {
    const id = `f${index + 1}`;
    return [id, await publicImage(`/pdf-art/furniture/${id}.webp`, BAND_WIDTH)];
  }));
  return Object.fromEntries(entries);
}

/** Activity tiles, keyed by record id so `activityCard` can stay synchronous. */
async function loadTiles() {
  const entries = await Promise.all([...parentCare, ...childActivities]
    .map(async (record) => [record.id, await publicImage(record.image, TILE_WIDTH)]));
  return Object.fromEntries(entries);
}

function frame(source, alt, label, modifier = '') {
  const className = `frame ${modifier}`.trim();
  if (!source) {
    return `<figure class="${className} frame--empty"><span>${escape(label)}</span></figure>`;
  }
  return `<figure class="${className}"><img src="${source}" alt="${escape(alt)}"></figure>`;
}

function styles() {
  return `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
@font-face { font-family: 'Fraunces'; src: url(${fonts.display}) format('woff2-variations');
  font-weight: 100 900; font-display: block; }
@font-face { font-family: 'Plus Jakarta Sans'; src: url(${fonts.body}) format('woff2-variations');
  font-weight: 200 800; font-display: block; }
:root {
  --blue: #182799; --orange: #e86811; --canvas: #fdf2e1; --warm: #f3e3cb;
  --outline: #dfc7ab; --muted: rgb(24 39 153 / 72%);
  /* The body line box. Row markers centre against this, so changing the type
     scale moves them with it instead of stranding a hardcoded nudge. */
  --line: calc(10.5pt * 1.55);
}
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: var(--blue);
  background: var(--canvas); font-size: 10.5pt; line-height: 1.55; }
.page { position: relative; width: 210mm; height: 297mm; padding: 18mm 18mm 16mm;
  background: var(--canvas); display: flex; flex-direction: column; gap: 6mm;
  page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.page__folio { position: absolute; left: 18mm; right: 18mm; bottom: 9mm;
  display: flex; justify-content: space-between; font-size: 7.5pt; letter-spacing: .12em;
  text-transform: uppercase; color: var(--muted); }
h1, h2, h3 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; line-height: 1.12; }
h1 { font-size: 34pt; letter-spacing: -0.01em; }
h2 { font-size: 20pt; }
h3 { font-size: 13pt; }
p { margin-bottom: 3mm; }
p:last-child { margin-bottom: 0; }
.eyebrow { font-size: 8pt; letter-spacing: .18em; text-transform: uppercase; color: var(--orange);
  font-weight: 700; }
.lead { font-size: 12pt; color: var(--muted); }
.frame { width: 100%; border-radius: 4mm; overflow: hidden; background: var(--warm); }
.frame img { display: block; width: 100%; height: 100%; object-fit: cover; }
.frame--empty { border: 0.6mm dashed var(--outline); background: rgb(243 227 203 / 45%);
  display: flex; align-items: center; justify-content: center; min-height: 42mm; }
.frame--empty span { font-size: 8pt; letter-spacing: .1em; text-transform: uppercase;
  color: rgb(24 39 153 / 42%); }
.frame--hero { min-height: 96mm; }
.frame--wide { min-height: 56mm; }
.frame--slim { min-height: 34mm; }
.frame--tile { min-height: 26mm; }
.cover { justify-content: center; text-align: center; align-items: center; gap: 5mm; }
.cover .frame { width: 118mm; height: 118mm; border-radius: 50%; }
.code-pill { display: inline-block; background: var(--warm); color: var(--orange);
  padding: 2mm 6mm; border-radius: 20mm; font-weight: 700; letter-spacing: .32em;
  font-size: 11pt; }
/* The letter marks the whole row, so it centres on the body block rather than
   sharing a baseline with the 8pt eyebrow -- baseline alignment pinned a 20pt
   glyph to the smallest line in the row and left the pole name orphaned below.
   The last row drops its rule so the group does not end on a stray hairline. */
.dimension { display: flex; gap: 3mm; align-items: center; padding: 5mm 0;
  border-bottom: 0.3mm solid rgb(24 39 153 / 14%); }
.dimension:last-child { border-bottom: 0; padding-bottom: 0; }
/* margin-top is an optical correction, not a layout nudge: a capital has no
   descender, so centring its em box leaves the glyph sitting ~0.07em high.
   Measured at 0.51mm off centre before this line, 0.03mm after. */
.dimension__letter { font-family: 'Fraunces', Georgia, serif; font-size: 20pt; color: var(--orange);
  width: 9mm; flex: none; line-height: 1; text-align: center; margin-top: 0.07em; }
.dimension__body { flex: 1; }
.dimension__title { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); line-height: 1.35; margin-bottom: 1mm; }
.dimension__pole { font-family: 'Fraunces', Georgia, serif; font-size: 13pt; line-height: 1.2; }
.dimension__pole span { color: var(--muted); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10pt; }
.block { background: rgb(255 255 255 / 55%); border-radius: 4mm; padding: 6mm; }
.block--blue { background: var(--blue); color: var(--canvas); }
.block--blue h2, .block--blue h3 { color: var(--canvas); }
.label { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--orange);
  font-weight: 700; margin-bottom: 1.5mm; }
.block--blue .label { color: var(--warm); }
.checklist { list-style: none; display: flex; flex-direction: column; gap: 4mm; }
.checklist li { display: flex; gap: 4mm; align-items: flex-start; }
.checklist li::before { content: ''; flex: none; width: 6mm; height: 6mm;
  margin-top: calc((var(--line) - 6mm) / 2);
  border: 0.5mm solid var(--orange); border-radius: 1.5mm; }
.powers { list-style: none; display: flex; flex-direction: column; gap: 3mm; counter-reset: power; }
.powers li { display: flex; gap: 4mm; align-items: flex-start; counter-increment: power; }
/* flex-start keeps the marker on line one when the text wraps; the offset then
   centres it on that line instead of on the line box's top edge. */
.powers li::before { content: counter(power); flex: none; width: 7mm; height: 7mm; border-radius: 50%;
  margin-top: calc((var(--line) - 7mm) / 2);
  border: 0.5mm solid var(--orange); color: var(--orange); font-size: 8pt; font-weight: 700;
  display: flex; align-items: center; justify-content: center; line-height: 1; }
.activity { display: flex; flex-direction: column; gap: 3mm; padding: 5mm; border-radius: 4mm;
  background: rgb(255 255 255 / 58%); border: 0.3mm solid rgb(223 199 171 / 70%); }
/* The tile is a fixed 26mm and the copy beside it is two or three lines, so
   flex-start stranded the text against the top edge with the picture running
   far below it. Centring pairs them as one unit. */
.activity__head { display: flex; gap: 4mm; align-items: center; }
.activity__head .frame { width: 34mm; flex: none; min-height: 26mm; height: 26mm; }
.activity__meta { font-size: 8pt; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.activity__steps { padding-left: 5mm; display: flex; flex-direction: column; gap: 1.5mm; }
/* Materials / safety / method are a footnote group, not more description. They
   were three loose siblings, so each picked up the card's 3mm flex gap *and* a
   3mm paragraph margin. Wrapping them makes the group one flex item: a rule and
   a wider gap set it apart above, and the lines sit tight inside. */
.activity__notes { margin-top: 2mm; padding-top: 3mm;
  border-top: 0.3mm solid rgb(223 199 171 / 90%); }
.activity__note { font-size: 9pt; color: var(--muted); line-height: 1.4; margin-bottom: 1.2mm; }
.activity__note:last-child { margin-bottom: 0; }
.activity__note strong { color: var(--orange); }
.stack { display: flex; flex-direction: column; gap: 5mm; }
.stack--tight { gap: 3.5mm; }
.grow { flex: 1; }
.grow--center { display: flex; align-items: center; justify-content: center; }
/* A band wrapped in .grow sizes itself from the flex column, not from its own
   3:2 ratio. Left alone the img reports an intrinsic 116mm at 174mm wide, that
   becomes .grow's min-content height, and the column can no longer shrink --
   which overran page 15 by 5px on the eight longest ID booklets. A zero
   flex-basis breaks that cycle; .frame--wide/.frame--slim still floor the band,
   and object-fit: cover crops whatever height is left over. */
.grow:has(> .frame) { display: flex; flex-direction: column; min-height: 0; }
.grow > .frame { flex: 1 1 0; }
.permission { font-family: 'Fraunces', Georgia, serif; font-size: 14pt; text-align: center;
  color: var(--orange); padding: 4mm 0; }
.closing { display: flex; justify-content: center; }
.closing__card { display: grid; grid-template-columns: 34mm minmax(0, 1fr); gap: 6mm;
  width: 126mm; align-items: center; padding: 5mm; border-radius: 4mm;
  background: rgb(232 104 17 / 9%); }
.closing__qr { width: 34mm; height: 34mm; background: #fff; border-radius: 3mm;
  border: 0.4mm solid var(--outline); padding: 2.5mm; }
.closing__qr img { display: block; width: 100%; height: 100%; }
.closing__body { min-width: 0; }
.closing__link { display: block; color: var(--blue); font-family: 'Fraunces', Georgia, serif;
  font-size: 12pt; line-height: 1.2; overflow-wrap: anywhere; text-decoration: none;
  margin-bottom: 1.2mm; }
.closing__hint { font-size: 8.5pt; color: var(--muted); line-height: 1.4; }
.closing__contacts { display: flex; align-items: center; justify-content: center; gap: 12mm; }
.closing__contact { display: inline-flex; align-items: center; gap: 2mm; color: var(--blue);
  font-size: 9pt; font-weight: 700; text-decoration: none; }
.closing__contact img { display: block; width: 5mm; height: 5mm; }
/* The colophon is one block, not three stray sentences. The spacer above the
   closing row anchors CTA + colophon together at the foot of the page; it used
   to sit between them, which is what pulled them apart. */
.colophon { border-top: 0.3mm solid rgb(24 39 153 / 14%); margin-top: 7mm; padding-top: 4mm; }
.colophon p { font-size: 8.5pt; color: var(--muted); line-height: 1.45; margin-bottom: 1mm; }
.colophon p:last-child { margin-bottom: 0; }
.footer-note { font-size: 8.5pt; color: var(--muted); }
`;
}

function buildHtml({ personality, language, care, play, extras, art }) {
  const t = (key) => translations[language][key] ?? key;
  const name = personality.name[language];
  const paragraphs = personality.parentStory.body[language].split('\n\n');
  const after = personality.parentStory.imageAfterParagraph ?? 2;
  const placeholder = t('pdf.image_placeholder');
  const folio = (n) => `<div class="page__folio"><span>${escape(name)}</span><span>${escape(personality.code)} · ${n}/16</span></div>`;

  const supportPairs = [
    ['realLife', 'result.real_life_label'],
    ['guiltRelease', 'result.guilt_release_label'],
    ['careForYou', 'result.care_for_you_label'],
    ['forYourChild', 'result.for_child_label'],
  ];

  const activityCard = (record, kind) => {
    if (!record) return '';
    const meta = kind === 'play'
      ? `${escape(BAND_LABEL[record.band][language])} · ${record.minutes} ${escape(t('pdf.minutes_suffix'))}`
      : `${escape(t('pdf.time_label'))} ${record.minutes} ${escape(t('pdf.minutes_suffix'))}`;
    const steps = kind === 'play'
      ? `<ol class="activity__steps">${record.steps[language].map((step) => `<li>${escape(step)}</li>`).join('')}</ol>`
      : `<p>${escape(record.how[language])}</p>`;
    const extras = kind === 'play'
      ? `<div class="activity__notes">`
        + `<p class="activity__note"><strong>${escape(t('pdf.materials_label'))}:</strong> ${escape(record.materials[language])}</p>`
        + (record.safety[language]
          ? `<p class="activity__note"><strong>${escape(t('pdf.safety_label'))}:</strong> ${escape(record.safety[language])}</p>`
          : '')
        + `<p class="activity__note"><strong>${escape(t('pdf.method_label'))}:</strong> ${escape(METHOD_LABEL[record.method][language])}</p>`
        + `</div>`
      : '';
    return `<article class="activity">
      <div class="activity__head">
        ${frame(art.tiles[record.id] ?? '', record.imageAlt[language], placeholder, 'frame--tile')}
        <div>
          <p class="activity__meta">${meta}</p>
          <h3>${escape(record.title[language])}</h3>
        </div>
      </div>
      <p>${escape(record.why[language])}</p>
      ${steps}
      ${extras}
    </article>`;
  };

  const pages = [];

  // 1 — Cover
  pages.push(`<section class="page cover">
    <p class="eyebrow">${escape(t('pdf.cover_eyebrow'))}</p>
    ${frame(art.character, name, placeholder, 'frame--hero')}
    <h1>${escape(name)}</h1>
    <p class="code-pill">${escape(personality.code.split('').join(' '))}</p>
    <p class="lead">${escape(personality.tagline[language])}</p>
    ${folio(1)}
  </section>`);

  // 2 — The code
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('result.your_code'))}</p>
    <h2>${escape(t('pdf.code_page_title'))}</h2>
    <p class="lead">${escape(t('pdf.code_page_intro'))}</p>
    ${frame(art.furniture.f1, '', placeholder, 'frame--slim')}
    <div class="grow">
      ${DIMENSIONS.map((dimension, index) => {
        const letter = personality.code[index];
        return `<div class="dimension">
          <div class="dimension__letter">${escape(letter)}</div>
          <div class="dimension__body">
            <p class="dimension__title">${escape(dimension.title[language])}</p>
            <p class="dimension__pole">${escape(dimension.poles[letter][language])}</p>
          </div>
        </div>`;
      }).join('')}
    </div>
    <p class="footer-note">${escape(t('footer.disclaimer'))}</p>
    ${folio(2)}
  </section>`);

  // 3–4 — The story
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('result.story_label'))}</p>
    <h2>${escape(personality.parentStory.title[language])}</h2>
    ${paragraphs.slice(0, after).map((text) => `<p>${escape(text)}</p>`).join('')}
    ${frame(art.story, personality.parentStory.imageAlt[language], placeholder, 'frame--wide')}
    ${folio(3)}
  </section>`);
  pages.push(`<section class="page">
    ${paragraphs.slice(after).map((text) => `<p>${escape(text)}</p>`).join('')}
    <div class="grow">${frame(art.furniture.f2, '', placeholder, 'frame--wide')}</div>
    ${folio(4)}
  </section>`);

  // 5 — Real life + guilt release
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('result.summary_label'))}</p>
    <div class="stack">
      ${supportPairs.slice(0, 2).map(([field, label]) => `<div class="block">
        <p class="label">${escape(t(label))}</p>
        <p>${escape(personality.parentSupport[field][language])}</p>
      </div>`).join('')}
    </div>
    <div class="grow">${frame(art.furniture.f3, '', placeholder, 'frame--wide')}</div>
    ${folio(5)}
  </section>`);

  // 6 — Superpowers, watch-out, pop cousin
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('result.superpowers_label'))}</p>
    <ul class="powers">${personality.superpowers[language].map((power) => `<li><span>${escape(power)}</span></li>`).join('')}</ul>
    <div class="block">
      <p class="label">${escape(t('result.watchout_label'))}</p>
      <p>${escape(personality.watchout[language])}</p>
    </div>
    <div class="block">
      <p class="label">${escape(t('result.popcousin_label'))}</p>
      <p>${escape(personality.popCousin[language])}</p>
    </div>
    <div class="grow">${frame(art.furniture.f4, '', placeholder, 'frame--slim')}</div>
    ${folio(6)}
  </section>`);

  // 7 — Try this week. The three authored actions lead; four more are drawn from
  // `weekly-extras.json` by dimension letter, so the checklist is a week's worth
  // without asking types.json to carry seven per type.
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('result.summary_label'))}</p>
    <h2>${escape(t('result.try_this_week_label'))}</h2>
    <ul class="checklist">${personality.parentSupport.tryThisWeek[language].map((action) => `<li><span>${escape(action)}</span></li>`).join('')}</ul>
    <p class="label">${escape(t('pdf.weekly_extra_label'))}</p>
    <ul class="checklist">${extras.map((record) => `<li><span>${escape(record.action[language])}</span></li>`).join('')}</ul>
    <div class="grow">${frame(art.furniture.f5, '', placeholder, 'frame--slim')}</div>
    ${folio(7)}
  </section>`);

  // 8–9 — Care opener. Two pages: the argument for why the parent comes first,
  // then the personal read. The four drain lines come from the code letters, so
  // it reads as written for this type without 16 bespoke passages.
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('result.care_for_you_label'))}</p>
    <h2>${escape(t('pdf.care_title'))}</h2>
    <p class="lead">${escape(t('pdf.care_intro'))}</p>
    <p>${escape(t('pdf.care_story_1'))}</p>
    <p>${escape(t('pdf.care_story_2'))}</p>
    <p>${escape(t('pdf.care_story_3'))}</p>
    <div class="grow" style="margin-top:6mm">${frame(art.furniture.f6, '', placeholder, 'frame--wide')}</div>
    ${folio(8)}
  </section>`);
  pages.push(`<section class="page">
    <div class="block">
      <p class="label">${escape(t('pdf.care_drain_label'))}</p>
      ${personality.code.split('').map((letter, position) => `<div class="dimension">
        <div class="dimension__letter">${escape(letter)}</div>
        <div class="dimension__body">
          <p class="dimension__title">${escape(DIMENSIONS[position].title[language])}</p>
          <p>${escape(t(`pdf.drain_${letter}`))}</p>
        </div>
      </div>`).join('')}
    </div>
    <div class="block block--blue">
      <p class="label">${escape(t('result.care_for_you_label'))}</p>
      <p>${escape(personality.parentSupport.careForYou[language])}</p>
    </div>
    <div class="block">
      <p class="label">${escape(t('pdf.care_howto_label'))}</p>
      <p>${escape(t('pdf.care_howto'))}</p>
    </div>
    <div class="grow grow--center">
      <p class="permission">${escape(t('pdf.care_permission'))}</p>
    </div>
    ${folio(9)}
  </section>`);

  // 10–11 — Parent care activities
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('pdf.care_title'))}</p>
    <div class="stack stack--tight grow">${care.slice(0, 3).map((record) => activityCard(record, 'care')).join('')}</div>
    ${folio(10)}
  </section>`);
  pages.push(`<section class="page">
    <div class="stack stack--tight grow">${care.slice(3).map((record) => activityCard(record, 'care')).join('')}</div>
    ${folio(11)}
  </section>`);

  // 12 — For your child opener
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('result.for_child_label'))}</p>
    <h2>${escape(t('pdf.play_title'))}</h2>
    <p class="lead">${escape(t('pdf.play_intro'))}</p>
    <div class="grow">${frame(art.furniture.f7, '', placeholder, 'frame--wide')}</div>
    <div class="block">
      <p class="label">${escape(t('result.for_child_label'))}</p>
      <p>${escape(personality.parentSupport.forYourChild[language])}</p>
    </div>
    ${folio(12)}
  </section>`);

  // 13–15 — Child activities. Two cards per page: a play card carries steps,
  // materials, safety and method, and three of those overflow A4 on every type.
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('pdf.play_title'))}</p>
    <div class="stack stack--tight grow">${play.slice(0, 2).map((record) => activityCard(record, 'play')).join('')}</div>
    ${folio(13)}
  </section>`);
  pages.push(`<section class="page">
    <div class="stack stack--tight grow">${play.slice(2, 4).map((record) => activityCard(record, 'play')).join('')}</div>
    ${folio(14)}
  </section>`);
  pages.push(`<section class="page">
    <div class="stack stack--tight">${play.slice(4).map((record) => activityCard(record, 'play')).join('')}</div>
    <div class="grow">${frame(art.furniture.f8, '', placeholder, 'frame--wide')}</div>
    <p class="permission">${escape(t('pdf.skip_permission'))}</p>
    ${folio(15)}
  </section>`);

  // 16 — Closing
  const year = new Date().getFullYear();
  pages.push(`<section class="page">
    <p class="eyebrow">${escape(t('pdf.closing_title'))}</p>
    <h2>${escape(t('pdf.closing_title'))}</h2>
    <p class="lead">${escape(t('pdf.closing_body'))}</p>
    ${frame(art.furniture.f9, '', placeholder, 'frame--wide')}
    <div class="grow"></div>
    <div class="closing">
      <div class="closing__card">
        <div class="closing__qr"><img src="${supportQrCode}" alt=""></div>
        <div class="closing__body">
          <p class="label">${escape(t('pdf.support_label'))}</p>
          <a class="closing__link" href="${escape(config.links.saweria)}">saweria.co/parenteers</a>
          <p class="closing__hint">${escape(t('pdf.support_hint'))}</p>
        </div>
      </div>
    </div>
    <div class="closing__contacts">
      <a class="closing__contact" href="${escape(config.links.instagram)}">
        <img src="${closingIcons.instagram}" alt="">${escape(instagramHandle)}
      </a>
      <a class="closing__contact" href="${escape(config.links.activities)}">
        <img src="${closingIcons.web}" alt="">parenteers.id
      </a>
    </div>
    <div class="colophon">
      <p>${escape(t('footer.made_by'))} · ${escape(t('footer.copyright').replace('{year}', String(year)))}</p>
      <p>${escape(t('footer.disclaimer'))}</p>
    </div>
    ${folio(16)}
  </section>`);

  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8">
<title>${escape(name)} — ${escape(personality.code)}</title><style>${styles()}</style></head>
<body>${pages.join('')}</body></html>`;
}

/* ------------------------------------------------------------------ Chrome */

const chromeBinary = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const port = 9224;
const profile = await mkdtemp(join(tmpdir(), 'pb-pdf-'));
const chrome = spawn(chromeBinary, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  '--allow-file-access-from-files', 'about:blank',
], { stdio: 'ignore' });

async function endpoint() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return (await response.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Chrome did not expose a debugging endpoint.');
}

const browserSocketUrl = await endpoint();
const socket = new WebSocket(browserSocketUrl);
await new Promise((res, rej) => {
  socket.addEventListener('open', res, { once: true });
  socket.addEventListener('error', rej, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(message.error.message));
  else handler.resolve(message.result);
});
function command(method, params = {}, sessionId) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((res, rej) => pending.set(id, { resolve: res, reject: rej }));
}

const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
await command('Page.enable', {}, sessionId);
await command('Runtime.enable', {}, sessionId);

/** printToPDF stamps a clock into every file; without this all 32 re-commit each run. */
function normalize(buffer) {
  let text = buffer.toString('latin1');
  text = text.replace(/\/CreationDate\s*\(D:[^)]*\)/g, '/CreationDate(D:20260101000000+00\'00\')');
  text = text.replace(/\/ModDate\s*\(D:[^)]*\)/g, '/ModDate(D:20260101000000+00\'00\')');
  text = text.replace(/\/ID\s*\[\s*<[^>]*>\s*<[^>]*>\s*\]/g,
    '/ID [<00000000000000000000000000000000><00000000000000000000000000000000>]');
  return Buffer.from(text, 'latin1');
}

const furniture = await loadFurniture();
const tiles = await loadTiles();

const languages = onlyLang ? [onlyLang] : ['id', 'en'];
const overflows = [];
let written = 0;
for (const language of languages) {
  if (!reviewOutput) await mkdir(resolve(root, 'public/pdf', language), { recursive: true });
  for (const [index, personality] of types.entries()) {
    if (onlySlug && personality.slug !== onlySlug) continue;
    const html = buildHtml({
      personality,
      language,
      care: selectParentCare(personality, index),
      play: selectChildActivities(personality, index),
      extras: selectWeeklyExtras(personality, index),
      art: {
        character: await publicImage(personality.image, 760),
        story: await publicImage(personality.parentStory.image, 1040),
        furniture,
        tiles,
      },
    });
    const file = join(profile, `${language}-${personality.slug}.html`);
    await writeFile(file, html, 'utf8');
    await command('Page.navigate', { url: `file://${file}` }, sessionId);
    await new Promise((res) => setTimeout(res, 220));
    await command('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => true)',
      awaitPromise: true,
    }, sessionId);
    const overflow = await command('Runtime.evaluate', {
      expression: `JSON.stringify([...document.querySelectorAll('.page')]
        .map((page, index) => ({ page: index + 1, over: page.scrollHeight - page.clientHeight }))
        .filter((entry) => entry.over > 2))`,
      returnByValue: true,
    }, sessionId);
    const clipped = JSON.parse(overflow.result.value);
    if (clipped.length > 0) {
      overflows.push(`${language}/${personality.slug}: ${clipped.map((entry) => `p${entry.page} +${entry.over}px`).join(', ')}`);
    }

    const { data } = await command('Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: true,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    }, sessionId);
    const target = reviewOutput
      ? resolve(root, reviewOutput)
      : resolve(root, 'public/pdf', language, `${personality.slug}.pdf`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, normalize(Buffer.from(data, 'base64')));
    written += 1;
    process.stdout.write(`  ${reviewOutput ?? `${language}/${personality.slug}.pdf`}\n`);
  }
}

socket.close();
chrome.kill();
// Chrome flushes its cache on the way out; removing the profile underneath it
// raced with ENOTEMPTY, so wait for the process and retry the cleanup.
await new Promise((res) => chrome.once('exit', res));
for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
    await rm(profile, { recursive: true, force: true });
    break;
  } catch {
    await new Promise((res) => setTimeout(res, 300));
  }
}
console.log(`\n${written} booklet${written === 1 ? '' : 's'} written to ${reviewOutput ?? 'public/pdf/'}`);
if (overflows.length > 0) {
  console.error(`\n${overflows.length} page(s) clipped content:`);
  overflows.forEach((line) => console.error(`  ${line}`));
  process.exitCode = 1;
} else {
  console.log('No page clipped its content.');
}
