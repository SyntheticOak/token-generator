# Cloudflare R2 Asset Storage Setup

This guide explains how to set up Cloudflare R2 for external asset storage to support unlimited asset growth.

## 1. Create Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Choose a bucket name (e.g., `token-generator-assets`)
5. Enable **Public access** for the bucket
6. Note your **Account ID** from the R2 dashboard

## 2. Create R2 API Token

1. Go to **Manage R2 API tokens**
2. Click **Create API token**
3. Choose **Custom token**
4. Set permissions:
   - **Object**: Edit
   - **Bucket**: Select your bucket
5. Copy the **Access Key ID** and **Secret Access Key**

## 3. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your R2 credentials:
   ```env
   R2_ACCOUNT_ID=your_account_id_here
   R2_ACCESS_KEY_ID=your_access_key_here
   R2_SECRET_ACCESS_KEY=your_secret_key_here
   R2_BUCKET_NAME=your_bucket_name_here
   R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
   ```

3. Find your **R2_PUBLIC_URL**:
   - Go to your bucket settings
   - Look for **Public access** section
   - Copy the public domain (format: `https://pub-xxxxx.r2.dev`)

## 4. Install Dependencies

```bash
npm install
```

## 5. Upload Assets

Upload your existing assets to R2:

```bash
npm run upload-assets
```

This will:
- Upload all files from `public/assets/` to your R2 bucket
- Skip files that already exist
- Show progress for each uploaded file

## 6. Generate Manifest

Generate the asset manifest with R2 URLs:

```bash
npm run generate-manifest
```

## 7. Deploy

Your app is now ready to deploy with external asset storage:

```bash
npm run build
```

The build will be under 100MB since assets are served from R2.

## Development vs Production

### Development (Local Assets)
- Uses local assets from `public/assets/`
- Fast iteration and testing
- Run with: `npm run dev`

### Production (R2 CDN)
- Uses assets from Cloudflare R2 CDN
- Optimized for deployment
- Run with: `npm run build`

## Asset Addition Workflows

### Option 1: One-Command Workflow (Recommended)
After adding new assets to `public/assets/`:
```bash
npm run add-assets
```
This single command:
1. Uploads assets to R2
2. Regenerates manifest with R2 URLs
3. Builds the app for production

### Option 2: Manual Steps
If you prefer manual control:
1. **Add new assets** to `public/assets/` directory
2. **Upload to R2**:
   ```bash
   npm run upload-assets
   ```
3. **Build for production**:
   ```bash
   npm run build
   ```

### Development Testing
To test with local assets:
```bash
npm run dev
```

## Benefits

- ✅ Deployment bundle stays under 100MB
- ✅ Unlimited asset growth potential
- ✅ Zero egress fees with R2
- ✅ Fast global CDN delivery
- ✅ Automatic asset deduplication (skips existing files)

## Troubleshooting

**Upload fails with "Access Denied"**
- Check your R2 API token permissions
- Ensure bucket has public access enabled

**Images don't load in development**
- Make sure you're running `npm run dev` (uses local assets)
- Check that assets exist in `public/assets/` directory
- Hard refresh browser (Ctrl+Shift+R) to clear cache

**Images don't load in production**
- Verify R2_PUBLIC_URL is correct in .env file
- Check CORS settings in bucket configuration
- Ensure files were uploaded successfully to R2

**New assets don't appear after adding them**
- Run `npm run add-assets` to upload and rebuild
- For development: restart dev server with `npm run dev`
- For production: ensure you built with `npm run build`

**Manifest shows wrong URLs**
- Development: should show `/assets/frames/...` paths
- Production: should show `https://pub-xxxxx.r2.dev/assets/frames/...` URLs
- Check NODE_ENV is set correctly for the build
