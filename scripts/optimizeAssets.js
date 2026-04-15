import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: This script only processes frames (not overlays, portraits, or backgrounds).
// This is intentional - frames need optimization (remove 512px, convert 256px to WebP)
// while other asset types don't require optimization.
const ASSETS_DIR = path.join(__dirname, '../public/assets/frames');

// Convert PNG to WebP using sharp
async function convertToWebP(inputPath, outputPath) {
  try {
    const sharp = await import('sharp');
    
    return sharp.default(inputPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath);
  } catch (err) {
    console.error(`Failed to convert ${inputPath} to WebP:`, err.message);
    return null;
  }
}

// Resize PNG to 256x256 and convert to WebP using sharp
async function resizeAndConvertToWebP(inputPath, outputPath) {
  try {
    const sharp = await import('sharp');

    return sharp.default(inputPath)
      .resize(256, 256, { fit: 'fill' })
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath);
  } catch (err) {
    console.error(`Failed to resize/convert ${inputPath} to WebP:`, err.message);
    return null;
  }
}

// Recursively scan directory for files
function scanDirectory(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, callback);
    } else if (entry.isFile()) {
      callback(fullPath);
    }
  }
}

async function optimizeAssets() {
  console.log('Starting asset optimization...');
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }
  
  let deleted512 = 0;
  let converted256 = 0;
  let skipped256 = 0;
  let hasSharp = false;
  
  // Test if Sharp is available
  try {
    await import('sharp');
    hasSharp = true;
    console.log('Sharp detected - will convert PNG to WebP');
  } catch (e) {
    console.warn('Warning: Sharp not available. Install with: npm install sharp');
    console.warn('Will skip WebP conversion and only delete 512px files.');
  }
  
  // Process files
  const filePromises = [];
  
  scanDirectory(ASSETS_DIR, (filePath) => {
    const fileName = path.basename(filePath);

    const match = fileName.match(/^(.*)_(256|512)\.png$/);
    if (!match) return;

    const frameId = match[1];
    const size = match[2];
    const dir = path.dirname(filePath);
    const png256Path = path.join(dir, `${frameId}_256.png`);
    const png512Path = path.join(dir, `${frameId}_512.png`);
    const webp256Path = path.join(dir, `${frameId}_256.webp`);

    // If 256.webp already exists, just remove any 512.png
    if (fs.existsSync(webp256Path)) {
      if (size === '512' && fs.existsSync(filePath)) {
        console.log(`Deleting: ${fileName} (256.webp already exists)`);
        fs.unlinkSync(filePath);
        deleted512++;
      } else if (size === '256') {
        console.log(`Skipping: ${fileName} (WebP already exists)`);
        skipped256++;
      }
      return;
    }

    // Prefer converting existing 256.png source
    if (size === '256') {
      if (!hasSharp) {
        console.log(`Skipping: ${fileName} (Sharp not available)`);
        skipped256++;
        return;
      }

      console.log(`Converting: ${fileName} -> ${path.basename(webp256Path)}`);

      filePromises.push(
        convertToWebP(filePath, webp256Path).then(result => {
          if (result) {
            // Delete original 256 PNG after successful conversion
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            // Clean up sibling 512 PNG if present
            if (fs.existsSync(png512Path)) {
              console.log(`Deleting: ${path.basename(png512Path)} (replaced by 256.webp)`);
              fs.unlinkSync(png512Path);
              deleted512++;
            }
            converted256++;
          } else {
            console.error(`Failed to convert ${fileName}`);
          }
        })
      );
      return;
    }

    // Fallback: no 256 source, but 512 exists -> resize to 256.webp
    if (size === '512') {
      if (fs.existsSync(png256Path)) {
        // 256 handler will take care of conversion + 512 cleanup
        return;
      }
      if (!hasSharp) {
        console.log(`Skipping: ${fileName} (Sharp not available)`);
        skipped256++;
        return;
      }

      console.log(`Resizing fallback: ${fileName} -> ${path.basename(webp256Path)}`);
      filePromises.push(
        resizeAndConvertToWebP(filePath, webp256Path).then(result => {
          if (result) {
            // Delete 512 source after successful fallback conversion
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              deleted512++;
            }
            converted256++;
          } else {
            console.error(`Failed fallback conversion for ${fileName}`);
          }
        })
      );
    }
  });
  
  // Wait for all conversions to complete
  await Promise.all(filePromises);
  
  console.log('\nOptimization complete:');
  console.log(`- Deleted ${deleted512} 512px files`);
  console.log(`- Converted ${converted256} 256px PNG files to WebP`);
  console.log(`- Skipped ${skipped256} 256px PNG files`);
  
  if (hasSharp && converted256 > 0) {
    console.log('\nNext steps:');
    console.log('1. Run: npm run build (to regenerate manifest)');
    console.log('2. Test the application');
    console.log('3. Upload optimized assets to R2');
  }
}

// Run optimization
optimizeAssets();
