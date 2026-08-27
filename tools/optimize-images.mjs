/**
 * Dev-only image optimisation. Not part of the deployed site.
 *
 *   cd tools && npm install && npm run images
 *
 * Reads originals from assets/img/_src/ and writes responsive AVIF + WebP
 * derivatives into assets/img/. Originals stay out of the deploy via
 * .vercelignore.
 *
 * The crop matters more than the codec here. The portfolio sources are
 * full-page screenshots — 1366x6900 in places — but the layout only ever shows
 * a 16:10 band from the top of each one. Encoding the full height would ship
 * roughly seven times the pixels any visitor can see, so each image is cropped
 * to its display aspect ratio *before* being resized.
 */
import sharp from 'sharp';
import { readdir, mkdir, stat, access } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'assets/img/_src');

const JOBS = [
  // aspect + position must match the CSS that renders these
  { dir: 'portfolio', widths: [640, 1024, 1366], aspect: 16 / 10, position: 'top' },
  { dir: 'profile', widths: [480, 720], aspect: 4 / 5, position: 'top' },
];

const fmt = (n) => (n / 1024 / 1024).toFixed(2) + 'MB';

/** Encoding is slow; skipping finished outputs makes re-runs resumable. */
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  let before = 0;
  let after = 0;
  let count = 0;

  for (const job of JOBS) {
    const srcDir = join(SRC, job.dir);
    const outDir = join(ROOT, 'assets/img', job.dir);
    await mkdir(outDir, { recursive: true });

    let files;
    try {
      files = await readdir(srcDir);
    } catch {
      console.log(`skip ${job.dir} (no _src dir)`);
      continue;
    }

    for (const file of files) {
      const { name, ext } = parse(file);
      if (!/\.(png|jpe?g|webp)$/i.test(ext)) continue;

      const srcPath = join(srcDir, file);
      before += (await stat(srcPath)).size;

      const meta = await sharp(srcPath).metadata();

      for (const w of job.widths) {
        const width = Math.min(w, meta.width);
        const height = Math.round(width / job.aspect);

        const avifPath = join(outDir, `${name}-${w}.avif`);
        const webpPath = join(outDir, `${name}-${w}.webp`);

        const base = () =>
          sharp(srcPath)
            .rotate()
            .resize({ width, height, fit: 'cover', position: job.position, withoutEnlargement: true });

        if (!(await exists(avifPath))) {
          await base().avif({ quality: 55, effort: 4 }).toFile(avifPath);
        }
        if (!(await exists(webpPath))) {
          await base().webp({ quality: 78, effort: 4 }).toFile(webpPath);
        }

        after += (await stat(avifPath)).size + (await stat(webpPath)).size;
      }

      count++;
      console.log(`${job.dir}/${name}  ${meta.width}x${meta.height}`);
    }
  }

  console.log(`\n${count} sources: ${fmt(before)} -> ${fmt(after)} of derivatives`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
