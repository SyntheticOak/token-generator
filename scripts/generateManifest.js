import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const FRAMES_DIR = path.join(ASSETS_DIR, 'frames');
const OUTPUT_FILE = path.join(__dirname, '../src/lib/assetManifest.generated.ts');

// Get R2 public URL from environment
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-xxxxx.r2.dev';

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';

// Scan directory structure and generate manifest
function scanFrames(baseDir, category) {
  const frames = [];
  const categoryPath = path.join(baseDir, category);
  
  if (!fs.existsSync(categoryPath)) {
    return frames;
  }

  // Track shared masks for variants
  const sharedMasks = new Map();
  
  function scanRecursive(dir, depth = 0, parentCategory = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    // First pass: collect shared masks
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('_mask.png')) {
        const baseName = entry.name.replace('_mask.png', '');
        sharedMasks.set(baseName, entry.name);
      }
    }
    
    // Second pass: process directories and files
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        const frameId = entry.name;
        
        // Check if this directory contains frame files (has _1024.png or _mask.png)
        const hasMask = fs.existsSync(path.join(fullPath, `${frameId}_mask.png`));
        const has1024 = fs.existsSync(path.join(fullPath, `${frameId}_1024.png`));
        const has256WebP = fs.existsSync(path.join(fullPath, `${frameId}_256.webp`));
        const has256PNG = fs.existsSync(path.join(fullPath, `${frameId}_256.png`));
        
        // Check if this directory contains flat files with shared masks (like elite/)
        const files = fs.readdirSync(fullPath);
        const frameFiles = files.filter(f => f.match(/^(.+)_(1024|256)\.(png|webp)$/));
        
        if (frameFiles.length > 0) {
          // This is a directory with flat files (like elite/)
          
          // Group files by base name (e.g., elite_bronze, elite_gold)
          const frameGroups = new Map();
          for (const file of frameFiles) {
            const match = file.match(/^(.+)_(1024|256)\.(png|webp)$/);
            if (match) {
              const baseName = match[1];
              const size = parseInt(match[2]);
              const ext = match[3];
              
              if (!frameGroups.has(baseName)) {
                frameGroups.set(baseName, { sizes: [], thumbnailPath: null, masterPath: null });
              }
              frameGroups.get(baseName).sizes.push(size);
              
              // Set paths
              if (size === 256) {
                frameGroups.get(baseName).thumbnailPath = `${baseName}_256.${ext}`;
              } else if (size === 1024) {
                frameGroups.get(baseName).masterPath = `${baseName}_1024.png`;
              }
            }
          }
          
          // Create frames for each group
          for (const [baseName, frameData] of frameGroups) {
            // Check for shared mask
            let maskPath = null;
            if (fs.existsSync(path.join(fullPath, `${baseName}_mask.png`))) {
              maskPath = `${baseName}_mask.png`;
            } else {
              // Check for shared mask pattern (e.g., elite_mask.png for elite_bronze)
              const basePattern = baseName.split('_')[0]; // Extract "elite" from "elite_bronze"
              if (fs.existsSync(path.join(fullPath, `${basePattern}_mask.png`))) {
                maskPath = `${basePattern}_mask.png`;
              }
            }
            
            const relativePath = path.relative(categoryPath, fullPath);
            const pathParts = relativePath === '' ? [] : relativePath.split(path.sep);
            const subCategory = pathParts.length > 0 ? pathParts[pathParts.length - 1] : baseName;
            
            const r2Path = `/assets/frames/${category}/${path.relative(categoryPath, fullPath).replace(/\\/g, '/')}`;
            const basePath = isProduction && R2_PUBLIC_URL
              ? `${R2_PUBLIC_URL}${r2Path}`
              : r2Path;
            
            const frame = {
              id: baseName,
              name: capitalize(baseName),
              mainCategory: category,
              subCategory,
              thumbnailPath: frameData.thumbnailPath,
              masterPath: frameData.masterPath,
              basePath,
              ...(maskPath && { maskPath }),
              tags: generateTags(baseName, category, subCategory),
            };
            
            frames.push(frame);
          }
        } else if (hasMask || has1024) {
          // This is a frame directory
          const thumbnailPath = has256WebP ? `${frameId}_256.webp` : (has256PNG ? `${frameId}_256.png` : null);
          const masterPath = has1024 ? `${frameId}_1024.png` : null;
          
          // Determine categories based on depth and path
          const relativePath = path.relative(categoryPath, dir);
          const pathParts = relativePath === '' ? [] : relativePath.split(path.sep);
          
          let subCategory = pathParts[0] || frameId;
          let subSubCategory = undefined;
          let family = undefined;
          
          // For classes: subCategory = class, subSubCategory = subclass
          if (category === 'classes') {
            subCategory = pathParts[0] || frameId;
            if (pathParts.length > 0) {
              subSubCategory = frameId;
            }
          }
          
          // For races: subCategory = race name, family = race family
          if (category === 'races') {
            if (pathParts.length > 0) {
              family = capitalize(pathParts[0]);
              subCategory = frameId;
            } else {
              subCategory = frameId;
            }
          }
          
          // For world/thematic/seasonal/utility: subCategory = direct parent
          if (['world', 'thematic', 'seasonal', 'utility'].includes(category)) {
            subCategory = pathParts.length > 0 ? pathParts[pathParts.length - 1] : frameId;
          }
          
          // Generate paths based on environment
          const r2Path = `/assets/frames/${category}/${path.relative(categoryPath, fullPath).replace(/\\/g, '/')}`;
          const basePath = isProduction && R2_PUBLIC_URL
            ? `${R2_PUBLIC_URL}${r2Path}`
            : r2Path;  // Use local path for dev
          
          const frame = {
            id: frameId,
            name: capitalize(frameId),
            mainCategory: category,
            subCategory,
            ...(subSubCategory && { subSubCategory }),
            ...(family && { family }),
            thumbnailPath,
            masterPath,
            basePath,
            tags: generateTags(frameId, category, subCategory, subSubCategory, family),
          };
          
          frames.push(frame);
        } else {
          // Continue scanning subdirectories
          scanRecursive(fullPath, depth + 1, entry.name);
        }
      } else if (entry.isFile()) {
        // Handle flat files (like nature_acorn_1024.png or elite_bronze_1024.png)
        const fileName = entry.name;
        const sizeMatch = fileName.match(/^(.+)_(1024|256)\.(png|webp)$/);
        
        if (sizeMatch) {
          const frameId = sizeMatch[1];
          const size = parseInt(sizeMatch[2]);
          const ext = sizeMatch[3];
          
          // Check if we already processed this frame
          if (frames.some(f => f.id === frameId)) continue;
          
          // Find thumbnail and master paths
          let thumbnailPath = null;
          let masterPath = null;
          const files = fs.readdirSync(dir);
          
          for (const file of files) {
            const match = file.match(new RegExp(`^${frameId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_(1024|256)\\.(png|webp)$`));
            if (match) {
              const fileSize = parseInt(match[1]);
              const fileExt = match[2];
              
              if (fileSize === 256) {
                thumbnailPath = `${frameId}_256.${fileExt}`;
              } else if (fileSize === 1024) {
                masterPath = `${frameId}_1024.png`;
              }
            }
          }
          
          // Skip if no valid paths found
          if (!thumbnailPath && !masterPath) continue;
          
          // Check for mask (either specific or shared)
          let maskPath = null;
          if (fs.existsSync(path.join(dir, `${frameId}_mask.png`))) {
            maskPath = `${frameId}_mask.png`;
          } else {
            // Check for shared mask pattern
            for (const [baseName, maskFile] of sharedMasks) {
              if (frameId.startsWith(baseName + '_')) {
                maskPath = maskFile;
                break;
              }
            }
          }
          
          // Determine subcategory from directory structure
          const relativePath = path.relative(categoryPath, dir);
          const pathParts = relativePath === '' ? [] : relativePath.split(path.sep);
          const subCategory = pathParts.length > 0 ? pathParts[pathParts.length - 1] : frameId;
          
          // Generate paths based on environment
          const r2Path = `/assets/frames/${category}/${path.relative(categoryPath, dir).replace(/\\/g, '/')}`;
          const basePath = isProduction && R2_PUBLIC_URL
            ? `${R2_PUBLIC_URL}${r2Path}`
            : r2Path;
          
          const frame = {
            id: frameId,
            name: capitalize(frameId),
            mainCategory: category,
            subCategory,
            thumbnailPath,
            masterPath,
            basePath,
            ...(maskPath && { maskPath }),
            tags: generateTags(frameId, category, subCategory),
          };
          
          frames.push(frame);
        }
      }
    }
  }
  
  scanRecursive(categoryPath);
  return frames;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateTags(id, mainCategory, subCategory, subSubCategory, family) {
  const tags = [id];
  
  if (mainCategory === 'classes') {
    tags.push('class', subCategory);
    if (subSubCategory) tags.push(subSubCategory);
  } else if (mainCategory === 'races') {
    tags.push('race', subCategory);
    if (family) tags.push(family.toLowerCase());
  } else {
    tags.push(mainCategory, subCategory);
  }
  
  return tags;
}

// Scan backgrounds
function scanBackgrounds() {
  const backgroundsDir = path.join(ASSETS_DIR, 'backgrounds');
  if (!fs.existsSync(backgroundsDir)) return [];
  
  const files = fs.readdirSync(backgroundsDir);
  return files
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .map(file => {
      const id = path.parse(file).name;
      const r2Path = `/assets/backgrounds/${file}`;
      const src = isProduction && R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}${r2Path}`
        : r2Path;
      return { id, src };
    });
}

// Scan overlays
function scanOverlays() {
  const overlaysDir = path.join(ASSETS_DIR, 'overlays');
  if (!fs.existsSync(overlaysDir)) return [];
  
  const files = fs.readdirSync(overlaysDir);
  return files
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .map(file => {
      const id = path.parse(file).name;
      const r2Path = `/assets/overlays/${file}`;
      const src = isProduction && R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}${r2Path}`
        : r2Path;
      return { id, src };
    });
}

// Scan portraits
function scanPortraits() {
  const portraitsDir = path.join(ASSETS_DIR, 'portraits');
  if (!fs.existsSync(portraitsDir)) return [];
  
  const files = fs.readdirSync(portraitsDir);
  return files
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .map(file => {
      const id = path.parse(file).name;
      const r2Path = `/assets/portraits/${file}`;
      const src = isProduction && R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}${r2Path}`
        : r2Path;
      return { id, src };
    });
}

function generateManifest() {
  console.log('Generating asset manifest...');
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`Using ${isProduction ? 'R2 CDN' : 'local'} paths`);
  
  // Auto-detect categories from frames directory
  const categories = [];
  if (fs.existsSync(FRAMES_DIR)) {
    const entries = fs.readdirSync(FRAMES_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        categories.push(entry.name);
      }
    }
  }
  
  console.log(`Detected categories: ${categories.join(', ')}`);
  
  const allFrames = [];
  for (const category of categories) {
    const frames = scanFrames(FRAMES_DIR, category);
    allFrames.push(...frames);
    console.log(`  Found ${frames.length} frames in ${category}`);
  }
  
  console.log(`Total frames: ${allFrames.length}`);
  
  // Scan other asset types
  const backgrounds = scanBackgrounds();
  const overlays = scanOverlays();
  const portraits = scanPortraits();
  
  console.log(`Found ${backgrounds.length} backgrounds, ${overlays.length} overlays, ${portraits.length} portraits`);
  
  // Generate TypeScript file
  const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated by scripts/generateManifest.js
// Run 'npm run build' to regenerate

import { AssetRecord } from "../types";

export const assets: AssetRecord = {
  frames: ${JSON.stringify(allFrames, null, 2)},
  backgrounds: ${JSON.stringify(backgrounds, null, 2)},
  overlays: ${JSON.stringify(overlays, null, 2)},
  portraits: ${JSON.stringify(portraits, null, 2)},
};
`;
  
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`Manifest written to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

generateManifest();