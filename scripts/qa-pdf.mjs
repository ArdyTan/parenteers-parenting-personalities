import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

const types = await readJson('src/data/types.json');
const parentCare = await readJson('src/data/parent-care.json');
const childActivities = await readJson('src/data/child-activities.json');
const weeklyExtras = await readJson('src/data/weekly-extras.json');
const config = await readJson('src/data/config.json');
const translations = {
  id: await readJson('src/data/i18n/id.json'),
  en: await readJson('src/data/i18n/en.json'),
};

const BANDS = ['0-12m', '1-2y', '2-3y', '3-4y', '4-5y'];
const BAND_DIMENSION = [3, 0, 1, 2, 3];
const METHOD_LABEL = {
  'serve-return': { id: 'Serve & return (Harvard)', en: 'Serve and return (Harvard)' },
  'cprt-special-play': { id: 'Filial therapy - waktu main spesial', en: 'Filial therapy - special play time' },
  'cprt-reflect': { id: 'Play therapy - memantulkan perasaan', en: 'Play therapy - reflecting feelings' },
  'montessori-practical-life': { id: 'Montessori - practical life', en: 'Montessori - practical life' },
  'montessori-sensorial': { id: 'Montessori - sensorial', en: 'Montessori - sensorial' },
  'montessori-movement': { id: 'Montessori - kebebasan bergerak', en: 'Montessori - freedom of movement' },
  'montessori-order': { id: 'Montessori - keteraturan', en: 'Montessori - order' },
  'montessori-heuristic': { id: 'Heuristic play / treasure basket', en: 'Heuristic play / treasure basket' },
};
const MAX_BYTES = 1_200_000;
const issues = [];
const rows = [];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

function normalized(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[–—−]/g, '-')
    // pdftotext keeps a line break after a printed hyphen. Joining it back
    // prevents ordinary wrapping ("toilet-\npaper") from looking like lost copy.
    .replace(/-\s+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function selectParentCare(personality, index) {
  const override = personality.pdfSelection?.parentCare;
  if (override) return override.map((id) => parentCare.find((record) => record.id === id));
  const universal = parentCare.find((record) => record.pole === '*');
  return [universal, ...personality.code.split('').map((letter) => {
    const variants = parentCare.filter((record) => record.pole === letter);
    return variants[index % variants.length];
  })];
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

function selectWeeklyExtras(personality, index) {
  const override = personality.pdfSelection?.weeklyExtras;
  if (override) return override.map((id) => weeklyExtras.find((record) => record.id === id));
  return personality.code.split('').map((letter) => {
    const variants = weeklyExtras.filter((record) => record.pole === letter);
    return variants[index % variants.length];
  });
}

function requireText(text, expected, label, file) {
  const needle = normalized(expected);
  if (needle && !text.includes(needle)) issues.push(`${file}: missing ${label}: ${needle}`);
}

function requireTrackedText(text, expected, label, file) {
  const haystack = normalized(text).replace(/\s+/g, '').toLowerCase();
  const needle = normalized(expected).replace(/\s+/g, '').toLowerCase();
  if (needle && !haystack.includes(needle)) issues.push(`${file}: missing ${label}: ${normalized(expected)}`);
}

function rejectText(text, forbidden, label, file) {
  const needle = normalized(forbidden);
  if (needle.length > 4 && text.includes(needle)) {
    issues.push(`${file}: contains ${label}: ${needle}`);
  }
}

if (childActivities.some((record) => !normalized(record.safety.id) || !normalized(record.safety.en))) {
  issues.push('child-activities.json: every activity must have a safety line in both languages');
}

const selectedChildIds = new Set(
  types.flatMap((personality, index) =>
    selectChildActivities(personality, index).map((record) => record.id)),
);
if (selectedChildIds.size !== childActivities.length) {
  const unused = childActivities.filter((record) => !selectedChildIds.has(record.id)).map(({ id }) => id);
  issues.push(`child-activities.json: deterministic selection leaves unused records: ${unused.join(', ')}`);
}

for (const language of ['id', 'en']) {
  const opposite = language === 'id' ? 'en' : 'id';
  const directory = resolve(root, 'public', 'pdf', language);
  const expectedFiles = types.map(({ slug }) => `${slug}.pdf`).sort();
  const actualFiles = (await readdir(directory)).filter((file) => file.endsWith('.pdf')).sort();

  for (const missing of expectedFiles.filter((file) => !actualFiles.includes(file))) {
    issues.push(`public/pdf/${language}: missing ${missing}`);
  }
  for (const extra of actualFiles.filter((file) => !expectedFiles.includes(file))) {
    issues.push(`public/pdf/${language}: unexpected ${extra}`);
  }

  for (const [index, personality] of types.entries()) {
    const relative = `public/pdf/${language}/${personality.slug}.pdf`;
    const file = resolve(root, relative);
    if (!existsSync(file)) continue;

    const bytes = (await stat(file)).size;
    if (bytes > MAX_BYTES) issues.push(`${relative}: ${bytes} bytes exceeds ${MAX_BYTES}`);

    const info = run('pdfinfo', [file]);
    const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0);
    if (pages !== 16) issues.push(`${relative}: expected 16 pages, found ${pages}`);
    if (!/^Page size:\s+594\.9\d* x 841\.9\d* pts \(A4\)$/m.test(info)) {
      issues.push(`${relative}: expected A4 page size`);
    }

    const text = normalized(run('pdftotext', ['-layout', file, '-']));
    const page9 = normalized(run('pdftotext', ['-f', '9', '-l', '9', '-layout', file, '-']));
    const page15 = normalized(run('pdftotext', ['-f', '15', '-l', '15', '-layout', file, '-']));
    const page16 = normalized(run('pdftotext', ['-f', '16', '-l', '16', '-layout', file, '-']));
    const urls = [...run('pdfinfo', ['-url', file]).matchAll(/Annotation\s+(\S+)/g)]
      .map((match) => match[1]);
    const care = selectParentCare(personality, index);
    const play = selectChildActivities(personality, index);
    const extras = selectWeeklyExtras(personality, index);

    const required = [
      ['type name', personality.name[language]],
      ['type code', personality.code],
      ['tagline', personality.tagline[language]],
      ['story title', personality.parentStory.title[language]],
      ...personality.parentStory.body[language].split('\n\n').map((value) => ['story paragraph', value]),
      ...personality.superpowers[language].map((value) => ['superpower', value]),
      ['watch-out', personality.watchout[language]],
      ['pop cousin', personality.popCousin[language]],
      ['real-life support', personality.parentSupport.realLife[language]],
      ['guilt release', personality.parentSupport.guiltRelease[language]],
      ['parent care', personality.parentSupport.careForYou[language]],
      ['child connection', personality.parentSupport.forYourChild[language]],
      ...personality.parentSupport.tryThisWeek[language].map((value) => ['weekly action', value]),
      ...extras.map((record) => ['weekly extra', record.action[language]]),
      ...care.flatMap((record) => [
        ['parent-care title', record.title[language]],
        ['parent-care why', record.why[language]],
        ['parent-care how', record.how[language]],
      ]),
      ...play.flatMap((record) => [
        ['child-activity title', record.title[language]],
        ['child-activity why', record.why[language]],
        ...record.steps[language].map((value) => ['child-activity step', value]),
        ['child-activity materials', record.materials[language]],
        ['child-activity safety', record.safety[language]],
        ['child-activity method', METHOD_LABEL[record.method][language]],
      ]),
      ['parent permission', translations[language]['pdf.care_permission']],
      ['child permission', translations[language]['pdf.skip_permission']],
      ['support impact', translations[language]['pdf.support_hint']],
    ];
    required.forEach(([label, value]) => requireText(text, value, label, relative));
    requireText(page9, translations[language]['pdf.care_permission'], 'page 9 parent permission', relative);
    requireText(page15, translations[language]['pdf.skip_permission'], 'page 15 child permission', relative);
    requireTrackedText(page16, translations[language]['pdf.support_label'], 'page 16 support label', relative);
    requireText(page16, translations[language]['pdf.support_hint'], 'page 16 support impact', relative);
    requireText(page16, '@parenteers', 'page 16 Instagram handle', relative);
    requireText(page16, 'parenteers.id', 'page 16 website', relative);
    rejectText(page16, 'quiz.parenteers.id', 'page 16 quiz URL', relative);

    const expectedUrls = [config.links.saweria, config.links.instagram, config.links.activities];
    for (const expectedUrl of expectedUrls) {
      if (!urls.includes(expectedUrl)) {
        issues.push(`${relative}: missing page 16 URL annotation: ${expectedUrl}`);
      }
    }
    if (urls.includes(config.links.site)) {
      issues.push(`${relative}: page 16 still links to the quiz: ${config.links.site}`);
    }
    if (urls.length !== expectedUrls.length) {
      issues.push(`${relative}: expected ${expectedUrls.length} URL annotations, found ${urls.length}`);
    }

    for (const record of [...care, ...play]) {
      if (record.title[language] !== record.title[opposite]) {
        rejectText(text, record.title[opposite], `${opposite} activity title`, relative);
      }
    }
    rejectText(text, translations.id['pdf.image_placeholder'], 'placeholder copy', relative);
    rejectText(text, translations.en['pdf.image_placeholder'], 'placeholder copy', relative);

    const fontRows = run('pdffonts', [file]).split('\n').slice(2).filter((line) => line.trim());
    if (fontRows.length === 0) issues.push(`${relative}: no embedded fonts reported`);
    for (const row of fontRows) {
      const flags = row.match(/\s+(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/);
      if (!flags || flags[1] !== 'yes') issues.push(`${relative}: unembedded font row: ${row.trim()}`);
    }

    rows.push({
      file: `${language}/${personality.slug}.pdf`,
      pages,
      kb: Math.ceil(bytes / 1024),
      fonts: fontRows.length,
      links: urls.length,
      issues: issues.filter((issue) => issue.startsWith(`${relative}:`)).length,
    });
  }
}

console.table(rows);
if (issues.length > 0) {
  console.error(`PDF QA failed with ${issues.length} issue(s):`);
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PDF QA passed: ${rows.length} files, 16 pages each, bilingual content complete, 3 closing links, fonts embedded.`);
}
