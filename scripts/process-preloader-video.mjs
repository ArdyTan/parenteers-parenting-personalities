/**
 * Builds the runtime preloader clip from its master.
 *
 * The master (`images/web-component/Preloader2.mp4`) is written with its `moov`
 * atom *after* `mdat`, which is the worst possible shape for a preloader: a
 * browser cannot decode a single frame until it has fetched the whole 1.8 MB
 * file, so the animation would only appear once the thing it is covering for
 * had already finished loading.
 *
 * This moves `moov` in front of `mdat` ("faststart") and rewrites the chunk
 * offset tables to match, so playback starts from the first few chunks and the
 * rest streams in. Nothing is re-encoded: the sample data is copied verbatim,
 * so the output is bit-identical in picture to the master. Trimming or
 * re-compressing needs a real encoder (ffmpeg), which this project does not
 * carry.
 *
 * Usage: npm run assets:preloader
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SOURCE = resolve('images/web-component/Preloader2.mp4');
const OUTPUT = resolve('public/motion/preloader.mp4');

const source = await readFile(SOURCE);
const boxes = readBoxes(source, 0, source.length);
const ftyp = boxes.find((box) => box.type === 'ftyp');
const moov = boxes.find((box) => box.type === 'moov');
const mdat = boxes.find((box) => box.type === 'mdat');

if (!ftyp || !moov || !mdat) {
  throw new Error(`Expected ftyp, moov and mdat at the top level, found: ${boxes.map((b) => b.type).join(', ')}`);
}

if (moov.start < mdat.start) {
  console.log('moov already precedes mdat; copying the master unchanged.');
} else {
  console.log(`moov sits after mdat (offset ${moov.start}); relocating.`);
}

// `stco` holds absolute file offsets, so every entry shifts by however far the
// media data moves. moov keeps its size (the tables stay 32-bit), which is what
// makes the delta knowable up front.
const relocated = Buffer.from(source.subarray(moov.start, moov.end));
const mediaStart = ftyp.size + moov.size;
const delta = mediaStart - mdat.start;

let patched = 0;
for (const stco of findBoxes(relocated, 0, relocated.length, 'stco')) {
  const entries = relocated.readUInt32BE(stco.start + 12);
  for (let index = 0; index < entries; index += 1) {
    const at = stco.start + 16 + index * 4;
    const next = relocated.readUInt32BE(at) + delta;
    if (next > 0xffff_ffff || next < 0) {
      throw new Error('Chunk offset no longer fits in stco; the file needs co64.');
    }
    relocated.writeUInt32BE(next, at);
    patched += 1;
  }
}
if (findBoxes(relocated, 0, relocated.length, 'co64').length > 0) {
  throw new Error('This file uses co64 offsets, which this script does not rewrite.');
}
if (patched === 0) throw new Error('No chunk offsets were found to patch.');

const output = Buffer.concat([
  source.subarray(ftyp.start, ftyp.end),
  relocated,
  source.subarray(mdat.start, mdat.end),
]);

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, output);

const before = (await stat(SOURCE)).size;
const after = (await stat(OUTPUT)).size;
console.log(
  `Wrote ${OUTPUT}: ${(after / 1024).toFixed(0)} KB (master ${(before / 1024).toFixed(0)} KB), `
  + `${patched} chunk offsets shifted by ${delta}. moov now starts at ${ftyp.size}.`,
);

/** Every box between `start` and `end`, one level deep. */
function readBoxes(buffer, start, end) {
  const found = [];
  let offset = start;
  while (offset + 8 <= end) {
    const size = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    if (size < 8 || offset + size > end) break;
    found.push({ type, start: offset, end: offset + size, size });
    offset += size;
  }
  return found;
}

/** Every box of `type` at any depth, for the container types that can nest one. */
function findBoxes(buffer, start, end, type) {
  const NESTS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'udta']);
  const found = [];
  for (const box of readBoxes(buffer, start, end)) {
    if (box.type === type) found.push(box);
    else if (NESTS.has(box.type)) found.push(...findBoxes(buffer, box.start + 8, box.end, type));
  }
  return found;
}
