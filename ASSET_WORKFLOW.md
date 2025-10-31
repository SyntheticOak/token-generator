# Asset Workflow Guide

Complete guide for adding and managing assets in the token generator.

## Overview

The asset pipeline handles:
- **Frames**: Hierarchical frame library (classes, races, world, thematic, seasonal, utility)
- **Overlays**: Decorative overlay effects (fire rings, glows, stars, etc.)
- **Portraits**: Example portrait images
- **Backgrounds**: Background color/texture images

## Workflow Overview

```
Add Assets → Upload to R2 → Generate Manifest → Build → Commit → Deploy
```

## Adding Assets

### Step 1: Add Files to Local Directory

Add your asset files to the appropriate directories:

- **Frames**: `public/assets/frames/{category}/{subcategory}/...`
- **Overlays**: `public/assets/overlays/`
- **Portraits**: `public/assets/portraits/`
- **Backgrounds**: `public/assets/backgrounds/`

**Frame Naming Convention:**
- `{id}_1024.png` - Master frame (required)
- `{id}_256.png` or `{id}_256.webp` - Thumbnail (required)
- `{id}_mask.png` - Mask file (optional, can be shared)

**Other Assets:**
- Use descriptive filenames: `fire_ring01.png`, `portrait_01.jpg`, `bg_01.jpg`
- Supported formats: PNG, JPG, JPEG, GIF, WebP

### Step 2: Run Asset Pipeline

Run the complete asset workflow:

```bash
npm run add-assets
```

This script:
1. **Uploads assets to R2** (`scripts/uploadToR2.js`)
   - Only uploads new files (skips existing)
   - Uploads to `assets/` prefix in R2 bucket
2. **Generates manifest** (`scripts/generateManifest.js`)
   - Scans all asset directories
   - Creates `src/lib/assetManifest.generated.ts`
   - Uses production R2 URLs in manifest
3. **Builds for production** (`scripts/buildProduction.js`)
   - Runs TypeScript compilation
   - Runs Vite build
   - Outputs to `dist/` directory

### Step 3: Optional - Optimize Frame Assets

**Only needed for frames** - optimizes frame files:

```bash
npm run optimize-assets
```

This script (frames only):
- Deletes `_512.png` files (not needed)
- Converts `_256.png` → `_256.webp` (smaller file size)
- Requires `sharp` package installed

**After optimization:**
- Run `npm run add-assets` again to upload optimized files

## Git Workflow

### Assets Only (No Code Changes)

When you only add/modify assets:

1. **Run asset pipeline:**
   ```bash
   npm run add-assets
   ```

2. **Commit changes:**
   ```bash
   git add public/assets/
   git add src/lib/assetManifest.generated.ts
   git commit -m "Add new assets: [describe what you added]"
   git push
   ```

3. **What gets committed:**
   - New/modified asset files in `public/assets/`
   - Updated `src/lib/assetManifest.generated.ts` (auto-generated)
   - **Note**: `dist/` is in `.gitignore` (not committed)

4. **Vercel deployment:**
   - Vercel automatically runs `npm run build` on push
   - Build generates fresh manifest and creates `dist/`
   - New assets are live in 2-5 minutes

### Code Changes Only (No New Assets)

When you modify code:

1. **Make code changes**

2. **Build locally (optional, to test):**
   ```bash
   npm run build
   ```

3. **Commit and push:**
   ```bash
   git add src/
   git commit -m "Fix: [describe changes]"
   git push
   ```

4. **Vercel deployment:**
   - Vercel runs `npm run build` automatically
   - Build includes manifest generation (from existing assets)

### Assets + Code Changes

When you add assets AND modify code:

1. **Add assets and run pipeline:**
   ```bash
   npm run add-assets
   ```

2. **Make code changes**

3. **Build (optional, to test):**
   ```bash
   npm run build
   ```

4. **Commit everything:**
   ```bash
   git add public/assets/
   git add src/lib/assetManifest.generated.ts
   git add src/
   git commit -m "Add assets and [describe code changes]"
   git push
   ```

## Script Reference

### `npm run add-assets`
**Purpose**: Complete asset workflow  
**Steps**:
1. Upload new assets to R2
2. Generate asset manifest with R2 URLs
3. Build production bundle

**When to use**: Every time you add/modify assets

### `npm run optimize-assets`
**Purpose**: Optimize frame assets (frames only)  
**Steps**:
1. Delete unnecessary `_512.png` files
2. Convert `_256.png` to `_256.webp`

**When to use**: After adding new frame assets, before running `add-assets`

### `npm run upload-assets`
**Purpose**: Upload assets to R2 only  
**Steps**:
1. Upload new assets to R2 (skip existing)

**When to use**: Only if you need to re-upload without rebuilding

### `npm run generate-manifest`
**Purpose**: Generate manifest only (development mode)  
**Steps**:
1. Scan asset directories
2. Generate `assetManifest.generated.ts` with local paths

**When to use**: For local development/testing

### `npm run build`
**Purpose**: Full production build  
**Steps**:
1. Generate manifest with R2 URLs
2. TypeScript compilation
3. Vite build to `dist/`

**When to use**: Before deploying, or after code changes

## Asset Manifest

The manifest (`src/lib/assetManifest.generated.ts`) is **auto-generated** and includes:

- **Frames**: Full metadata with categories, paths, tags
- **Overlays**: Simple list with `id` and `src` (R2 URL)
- **Portraits**: Simple list with `id` and `src` (R2 URL)
- **Backgrounds**: Simple list with `id` and `src` (R2 URL)

**Important**: 
- Do NOT manually edit the generated manifest
- Regenerate by running `npm run add-assets` or `npm run build`
- Manifest uses production R2 URLs when `NODE_ENV=production`

## Troubleshooting

### Assets Not Appearing

1. **Check if files uploaded to R2:**
   - Go to Cloudflare Dashboard → R2 → Your bucket
   - Verify files exist in `assets/` folder

2. **Check manifest generation:**
   - Open `src/lib/assetManifest.generated.ts`
   - Verify your assets are listed
   - Check that URLs are R2 URLs (not local paths)

3. **Check build output:**
   - Run `npm run build` locally
   - Check `dist/assets/` folder
   - Verify files are included

### Upload Errors

- **Missing environment variables**: Check `.env` file has all R2 credentials
- **Permission errors**: Verify R2 access keys have write permissions
- **File already exists**: Script skips existing files automatically (this is normal)

### Manifest Not Updating

- **Check environment**: Manifest uses R2 URLs only in production mode
- **Run full workflow**: Use `npm run add-assets` not just `generate-manifest`
- **Clear cache**: Delete `assetManifest.generated.ts` and regenerate

## Best Practices

1. **Batch assets**: Add multiple assets at once before running pipeline
2. **Test locally**: Use `npm run dev` to test assets before deploying
3. **Descriptive commits**: Use clear commit messages describing what assets were added
4. **Verify uploads**: Check R2 bucket after upload to confirm files are there
5. **Optimize frames**: Run `optimize-assets` for frames to reduce file sizes

## File Structure Reference

```
public/assets/
├── frames/
│   ├── classes/
│   │   └── {class}/
│   │       └── {subclass}/
│   │           ├── {id}_1024.png
│   │           ├── {id}_256.webp
│   │           └── {id}_mask.png
│   ├── races/
│   │   └── {family}/
│   │       └── {race}/
│   │           ├── {id}_1024.png
│   │           ├── {id}_256.webp
│   │           └── {id}_mask.png
│   └── ...
├── overlays/
│   ├── fire_ring01.png
│   ├── glow_01.png
│   └── ...
├── portraits/
│   ├── portrait_01.jpg
│   └── ...
└── backgrounds/
    ├── bg_01.jpg
    └── ...
```

