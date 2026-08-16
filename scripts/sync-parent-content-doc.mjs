import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const typesPath = resolve(process.cwd(), 'src', 'data', 'types.json');
const documentPath = resolve(process.cwd(), 'docs', 'personality-parent-first-content.md');
const marker = '## The 16 parent-first profiles';

const types = JSON.parse(await readFile(typesPath, 'utf8'));
let document = await readFile(documentPath, 'utf8');
const markerIndex = document.indexOf(marker);

if (markerIndex < 0) {
  throw new Error(`Missing marker in ${documentPath}: ${marker}`);
}

const sections = types.map((type) => {
  const paragraphs = type.parentStory.body.id.split('\n\n');
  const imageIndex = type.parentStory.imageAfterParagraph;
  const beforeImage = paragraphs.slice(0, imageIndex).join('\n\n');
  const afterImage = paragraphs.slice(imageIndex).join('\n\n');
  const imagePath = `../public${type.parentStory.image}`;
  const actions = type.parentSupport.tryThisWeek.id
    .map((action) => `  - ${action}`)
    .join('\n');

  return [
    `### ${type.code}, ${type.name.id}`,
    '',
    `#### Cerita, ${type.parentStory.title.id}`,
    '',
    beforeImage,
    '',
    `![${type.parentStory.imageAlt.id}](${imagePath})`,
    '',
    afterImage,
    '',
    '#### Kesimpulan',
    '',
    `- **Real life:** ${type.parentSupport.realLife.id}`,
    `- **Guilt release:** ${type.parentSupport.guiltRelease.id}`,
    `- **Care for you:** ${type.parentSupport.careForYou.id}`,
    `- **For your child:** ${type.parentSupport.forYourChild.id}`,
    '- **Try this week:**',
    actions,
  ].join('\n');
});

const preamble = document.slice(0, markerIndex).trimEnd();
document = `${preamble}\n\n${marker}\n\n${sections.join('\n\n')}\n`;
document = document.replace(/\s*—\s*/g, ', ');

await writeFile(documentPath, document, 'utf8');
console.log(`Synced ${types.length} parent-first profiles to ${documentPath}.`);
