/**
 * Find and optionally resize undersized mask files (< 1024x1024) to 1024x1024.
 * Run: node scripts/resizeMasks.js           # Scan only, list undersized masks
 * Run: node scripts/resizeMasks.js --resize  # Resize undersized masks to 1024x1024
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets/frames');
const TARGET_SIZE = 1024;

function findMaskFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findMaskFiles(fullPath, files);
    } else if (entry.name.endsWith('_mask.png')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function getDimensions(filePath) {
  try {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(filePath).metadata();
    return { width: meta.width || 0, height: meta.height || 0 };
  } catch (err) {
    return null;
  }
}

async function resizeMask(filePath) {
  try {
    const sharp = (await import('sharp')).default;
    const tmpPath = path.join(tmpdir(), `resize-mask-${path.basename(filePath)}`);
    await sharp(filePath)
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'fill' })
      .png()
      .toFile(tmpPath);
    fs.copyFileSync(tmpPath, filePath);
    fs.unlinkSync(tmpPath);
    return true;
  } catch (err) {
    console.error(`  ✗ Failed to resize ${filePath}:`, err.message);
    return false;
  }
}

async function main() {
  const shouldResize = process.argv.includes('--resize');

  console.log('Scanning for mask files...');
  console.log(`Directory: ${ASSETS_DIR}`);
  console.log('');

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`✗ Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }

  const maskFiles = findMaskFiles(ASSETS_DIR);
  console.log(`Found ${maskFiles.length} mask file(s)\n`);

  if (maskFiles.length === 0) {
    console.log('No mask files found.');
    process.exit(0);
  }

  const undersized = [];
  for (const filePath of maskFiles) {
    const dims = await getDimensions(filePath);
    if (!dims) {
      console.log(`  ? ${path.relative(ASSETS_DIR, filePath)} (could not read)`);
      continue;
    }
    if (dims.width < TARGET_SIZE || dims.height < TARGET_SIZE) {
      undersized.push({ path: filePath, ...dims });
    }
  }

  if (undersized.length === 0) {
    console.log('✓ All masks are 1024x1024 or larger.');
    process.exit(0);
  }

  console.log(`Found ${undersized.length} undersized mask(s) (< ${TARGET_SIZE}x${TARGET_SIZE}):\n`);
  for (const { path: filePath, width, height } of undersized) {
    const rel = path.relative(ASSETS_DIR, filePath);
    console.log(`  ${rel}  (${width}x${height})`);
  }
  console.log('');

  if (!shouldResize) {
    console.log('To resize these masks to 1024x1024, run:');
    console.log('  node scripts/resizeMasks.js --resize');
    console.log('');
    process.exit(0);
  }

  console.log('Resizing undersized masks...\n');
  let resized = 0;
  for (const { path: filePath } of undersized) {
    const rel = path.relative(ASSETS_DIR, filePath);
    process.stdout.write(`  Resizing ${rel}... `);
    if (await resizeMask(filePath)) {
      console.log('✓');
      resized++;
    }
  }
  console.log(`\n✓ Resized ${resized} mask(s) to ${TARGET_SIZE}x${TARGET_SIZE}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
