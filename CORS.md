# CORS Configuration

## Current Solution: Vercel Proxy

This project uses a **Vercel serverless function proxy** to handle CORS for R2 assets. This is necessary because Cloudflare R2 public URLs (`pub-*.r2.dev`) do not respect bucket-level CORS policies.

### How It Works

1. **Client requests** images from R2 URLs through our proxy endpoint: `/api/proxy-r2`
2. **Proxy fetches** the image from R2 (server-to-server, no CORS needed)
3. **Proxy adds CORS headers** and returns the image to the client
4. **Client receives** the image with proper CORS headers

### Implementation

The proxy is implemented in `api/proxy-r2.ts` as a Vercel serverless function. The client-side code automatically routes R2 URLs through this proxy in `src/lib/canvas.ts`:

```typescript
// R2 URLs are automatically proxied
if (src.startsWith('https://pub-') && src.includes('.r2.dev')) {
  const proxyUrl = `${window.location.origin}/api/proxy-r2?url=${encodeURIComponent(src)}`;
  // ... load image via proxy
}
```

### Why This Solution?

- **R2 public URLs don't support CORS**: Bucket CORS policies don't apply to `pub-*.r2.dev` URLs
- **No domain configuration needed**: Works regardless of nameserver setup (Wix, Cloudflare, etc.)
- **Automatic**: Client code handles routing transparently
- **Secure**: Proxy validates URLs to only allow R2 public URLs

### Verification

To verify CORS is working:

1. Open browser DevTools → Network tab
2. Load an image (overlay, portrait, background)
3. Check the request:
   - **URL**: Should be `/api/proxy-r2?url=...` (proxied)
   - **Response Headers**: Should include `Access-Control-Allow-Origin: *`
   - **Status**: Should be `200 OK`

### Troubleshooting

**Images not loading:**
- Check that `api/proxy-r2.ts` is deployed to Vercel
- Verify the proxy endpoint is accessible: `https://your-app.vercel.app/api/proxy-r2?url=...`
- Check browser console for errors

**Proxy errors:**
- Verify R2 URLs are correctly formatted
- Check Vercel function logs for server-side errors
- Ensure R2 bucket is publicly accessible

### Notes

- The proxy adds long cache headers (`max-age=31536000`) for performance
- Images are proxied on-demand (no pre-fetching or caching)
- This solution works for all deployment platforms that support serverless functions (Vercel, Netlify, etc.)




