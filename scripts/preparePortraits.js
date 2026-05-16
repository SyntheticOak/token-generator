/**
 * Convert portrait PNGs: resize (~1000px long edge), JPG, strip _bg suffix, remove sources.
 * Run: node scripts/preparePortraits.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORTRAITS_DIR = path.join(__dirname, '../public/assets/portraits');
const MAX_EDGE = 1000;
const JPG_QUALITY = 85;
const PLACEHOLDER_PATTERN = /^portrait_\d+\.jpe?g$/i;

function outputName(pngName) {
  const base = path.parse(pngName).name;
  const id = base.endsWith('_bg') ? base.slice(0, -3) : base;
  return `${id}.jpg`;
}

async function convertOne(sharp, pngPath) {
  const outName = outputName(path.basename(pngPath));
  const outPath = path.join(PORTRAITS_DIR, outName);
  const tmpPath = path.join(tmpdir(), `portrait-${outName}`);

  await sharp(pngPath)
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPG_QUALITY, mozjpeg: true })
    .toFile(tmpPath);

  fs.copyFileSync(tmpPath, outPath);
  fs.unlinkSync(tmpPath);
  fs.unlinkSync(pngPath);
  return outName;
}

async function main() {
  const sharp = (await import('sharp')).default;

  if (!fs.existsSync(PORTRAITS_DIR)) {
    console.error(`✗ Not found: ${PORTRAITS_DIR}`);
    process.exit(1);
  }

  const pngs = fs
    .readdirSync(PORTRAITS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'));

  if (pngs.length === 0) {
    console.log('No PNG portraits to convert.');
  } else {
    console.log(`Converting ${pngs.length} PNG(s) → JPG (max ${MAX_EDGE}px)...\n`);
    let ok = 0;
    for (const file of pngs.sort()) {
      const pngPath = path.join(PORTRAITS_DIR, file);
      try {
        const out = await convertOne(sharp, pngPath);
        console.log(`  ✓ ${file} → ${out}`);
        ok++;
      } catch (err) {
        console.error(`  ✗ ${file}:`, err.message);
      }
    }
    console.log(`\n✓ Converted ${ok}/${pngs.length}.`);
  }

  const placeholders = fs
    .readdirSync(PORTRAITS_DIR)
    .filter((f) => PLACEHOLDER_PATTERN.test(f));

  if (placeholders.length > 0) {
    console.log(`\nRemoving ${placeholders.length} placeholder(s)...`);
    for (const file of placeholders) {
      fs.unlinkSync(path.join(PORTRAITS_DIR, file));
      console.log(`  ✓ removed ${file}`);
    }
  }

  console.log('\nNext: npm run generate-manifest && npm run upload-assets');
  console.log('Delete portrait_01–07.jpg from R2 bucket (upload does not remove old keys).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
