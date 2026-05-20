/** Public R2 CDN base URL (not secret — also embedded in assetManifest.generated.ts). */
export const R2_PUBLIC_URL_DEFAULT =
  'https://pub-016da068b1e34227b3596a4fcb68d6fd.r2.dev';

export function resolveR2PublicUrl() {
  const url = process.env.R2_PUBLIC_URL?.trim();
  if (url && !url.includes('pub-xxxxx')) return url;
  return R2_PUBLIC_URL_DEFAULT;
}
