# CORS Diagnostic: Why Frames Work But Overlays/Portraits/Backgrounds Don't

## Key Finding: All Use Same R2 URL Format ✅

Both frames and overlays/portraits/backgrounds use the same R2 URL format:
- Frames: `https://pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev/assets/frames/...`
- Overlays: `https://pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev/assets/overlays/...`

Both use `loadImage()` function which sets `crossOrigin = "anonymous"` ✅

## Potential Issues to Check

### Issue 1: Files Not Actually Uploaded to R2 ⚠️
**Check**: Are the new overlay/portrait/background files actually in R2?

**How to verify:**
1. Go to Cloudflare Dashboard → **R2** → `token-generator-assets` bucket
2. Navigate to `assets/overlays/` folder
3. **Count the files** - you should see:
   - butterflies_01.png
   - fire_ring01.png
   - fire_ring02.png
   - fire_ring03.png
   - fx_01.png
   - glitter_01.png
   - glow_01.png
   - glow_02.png
   - glow_03.png
   - glow_04.png
   - stars_01.png

**If files are missing:**
- Run `npm run upload-assets` to upload files to R2
- Or check if `npm run add-assets` actually uploaded them

### Issue 2: Browser Cache ⚠️
**Check**: Browser might be caching old responses without CORS headers.

**How to fix:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache for the site
3. Test in incognito/private window
4. Check browser DevTools → Network tab → see if requests show CORS headers

### Issue 3: Different Request Timing ⚠️
**Observation**: 
- Frames load when the component mounts (in `useEffect`)
- Overlays/portraits/backgrounds load on-demand when clicked

**Potential issue**: If CORS headers were added after frames were cached, new requests for overlays might fail while cached frames work.

**How to check:**
- Open browser DevTools → Network tab
- Filter by "img" or the R2 domain
- Try loading an overlay and check:
  - **Request headers**: Should show `Origin: https://app.syntheticoak.com` (or your app URL)
  - **Response headers**: Should show `Access-Control-Allow-Origin: *`
  - **Status code**: Should be 200, not blocked

### Issue 4: CORS Policy Not Applied to All Paths ⚠️
**Check**: R2 CORS policy might not be correctly configured for all paths.

**How to verify in R2:**
1. Go to R2 bucket → **Settings** → **CORS Policy**
2. Ensure the JSON includes wildcards or specific paths:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

### Issue 5: Manifest Has Old URLs (Not R2 URLs) ⚠️
**Check**: The manifest might have local paths instead of R2 URLs.

**How to verify:**
1. Check `src/lib/assetManifest.generated.ts`
2. Look at overlay URLs - they should be:
   - ✅ `https://pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev/assets/overlays/...`
   - ❌ NOT `/assets/overlays/...` (local path)

**If they're local paths:**
- The manifest was generated in development mode
- Run: `NODE_ENV=production npm run generate-manifest`
- Or run: `npm run add-assets` (which runs in production mode)

### Issue 6: Files Uploaded to Wrong Location ⚠️
**Check**: Files might be in a different path structure in R2 than expected.

**Expected paths in R2:**
- `assets/overlays/butterflies_01.png`
- `assets/portraits/portrait_01.jpg`
- `assets/backgrounds/bg_01.jpg`

**If files are in wrong location:**
- Check R2 bucket folder structure
- Ensure upload script matches manifest generation paths

### Issue 7: File Extensions Mismatch ⚠️
**Check**: Manifest might expect `.png` but file is `.PNG` or vice versa.

**How to verify:**
- Check actual file extensions in R2
- Check manifest file extensions
- They must match exactly (case-sensitive on some systems)

## Diagnostic Steps

1. **Check if files exist in R2:**
   ```bash
   # List files in overlays folder
   aws s3 ls s3://token-generator-assets/assets/overlays/ --endpoint-url=https://<account-id>.r2.cloudflarestorage.com
   ```

2. **Test CORS headers directly:**
   ```bash
   curl -H "Origin: https://app.syntheticoak.com" -I https://pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev/assets/overlays/butterflies_01.png
   ```
   
   **Should see:**
   ```
   HTTP/1.1 200 OK
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, HEAD
   Access-Control-Allow-Headers: *
   ```

3. **Check browser console:**
   - Open DevTools → Console
   - Try loading an overlay
   - Look for CORS errors like:
     - `Access to image at '...' from origin '...' has been blocked by CORS policy`
     - `No 'Access-Control-Allow-Origin' header is present`

4. **Check Network tab:**
   - Open DevTools → Network
   - Filter by the R2 domain
   - Click an overlay to load it
   - Check the request:
     - **Status**: Should be 200, not "CORS error" or "blocked"
     - **Response Headers**: Should include CORS headers
     - **Request Headers**: Should include `Origin` header

## Most Likely Causes

Based on the code structure, the **most likely issues** are:

1. **Files not uploaded to R2** - Check R2 bucket first
2. **Manifest generated in dev mode** - URLs are local paths, not R2 URLs
3. **Browser cache** - Old responses cached without CORS headers
4. **CORS policy not propagated** - Wait 10-15 minutes after setting CORS policy

