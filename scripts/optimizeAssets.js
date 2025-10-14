import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets/frames');

// Check if sharp is available for WebP conversion
function checkSharpAvailability() {
  try {
    require.resolve('sharp');
    return true;
  } catch (e) {
    return false;
  }
}

// Convert PNG to WebP using sharp
function convertToWebP(inputPath, outputPath) {
  try {
    const sharp = require('sharp');
    
    return sharp(inputPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath);
  } catch (err) {
    console.error(`Failed to convert ${inputPath} to WebP:`, err.message);
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

function optimizeAssets() {
  console.log('Starting asset optimization...');
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }
  
  const hasSharp = checkSharpAvailability();
  if (!hasSharp) {
    console.warn('Warning: Sharp not available. Install with: npm install sharp');
    console.warn('Will skip WebP conversion and only delete 512px files.');
  }
  
  let deleted512 = 0;
  let converted256 = 0;
  let skipped256 = 0;
  
  scanDirectory(ASSETS_DIR, (filePath) => {
    const fileName = path.basename(filePath);
    
    // Delete 512px files
    if (fileName.includes('_512.png')) {
      console.log(`Deleting: ${fileName}`);
      fs.unlinkSync(filePath);
      deleted512++;
    }
    
    // Convert 256px PNG to WebP
    else if (fileName.includes('_256.png')) {
      if (hasSharp) {
        const webpPath = filePath.replace('.png', '.webp');
        
        // Skip if WebP already exists
        if (fs.existsSync(webpPath)) {
          console.log(`Skipping: ${fileName} (WebP already exists)`);
          skipped256++;
        } else {
          console.log(`Converting: ${fileName} -> ${path.basename(webpPath)}`);
          const result = convertToWebP(filePath, webpPath);
          
          if (result) {
            // Delete original PNG after successful conversion
            fs.unlinkSync(filePath);
            converted256++;
          } else {
            console.error(`Failed to convert ${fileName}`);
          }
        }
      } else {
        console.log(`Skipping: ${fileName} (Sharp not available)`);
        skipped256++;
      }
    }
  });
  
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
