# Fixing R2 CORS Issues

Your R2 public URL (`pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev`) is not returning CORS headers. Here are the solutions:

## Solution 1: Cloudflare Transform Rules (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select the zone that has your R2 public domain
3. Go to **Rules** → **Transform Rules** → **Modify Response Header**
4. Create a new rule:
   - **Rule name**: `Add CORS to R2`
   - **When incoming requests match**: `(http.host eq "pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev")`
   - **Then modify response header**:
     - **Set static**: `Access-Control-Allow-Origin` = `*`
     - **Set static**: `Access-Control-Allow-Methods` = `GET, HEAD, OPTIONS`
     - **Set static**: `Access-Control-Allow-Headers` = `*`
5. **Deploy** the rule

## Solution 2: Bucket CORS Policy (Verify)

1. Go to **R2** → Your bucket (`token-generator-assets`)
2. Go to **Settings** → **CORS Policy**
3. Ensure this JSON is set:
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
4. **Save** and wait 5-10 minutes for propagation

## Solution 3: Custom Domain (Best Long-term)

1. In R2 bucket settings, add a custom domain (e.g., `assets.syntheticoak.com`)
2. Configure CORS in the bucket settings
3. Update `R2_PUBLIC_URL` in `.env` to use the custom domain
4. Custom domains respect bucket CORS policies better

## Verification

After applying any solution, test with:
```bash
curl -H "Origin: https://app.syntheticoak.com" -I https://pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev/assets/portraits/portrait_01.jpg
```

You should see `Access-Control-Allow-Origin` in the response headers.


