import { MainCategory, RaceFamily, FrameMeta } from "../types";

// Import auto-generated assets (exists in production after build)
// If this file doesn't exist, the build will fail, which is expected
import { assets as generatedAssets } from "./assetManifest.generated";
export const assets = generatedAssets;

export function frameSrc(meta: { basePath: string; id: string; maskPath?: string; thumbnailPath?: string; masterPath?: string }, kind: "thumbnail" | "master" | "mask") {
  // Normalize basePath: remove trailing slash to avoid double slashes
  const normalizedBasePath = meta.basePath.replace(/\/+$/, '');
  
  if (kind === "mask") {
    // Use shared mask if available, otherwise fallback to specific mask
    if (meta.maskPath) {
      return `${normalizedBasePath}/${meta.maskPath}`;
    }
    return `${normalizedBasePath}/${meta.id}_mask.png`;
  }
  
  if (kind === "thumbnail") {
    return meta.thumbnailPath ? `${normalizedBasePath}/${meta.thumbnailPath}` : `${normalizedBasePath}/${meta.id}_256.png`;
  }
  
  // kind === "master"
  return meta.masterPath ? `${normalizedBasePath}/${meta.masterPath}` : `${normalizedBasePath}/${meta.id}_1024.png`;
}

// Helper: Filter frames by category hierarchy
export function getFramesByCategory(
  mainCategory?: MainCategory | 'all',
  subCategory?: string,
  subSubCategory?: string
): FrameMeta[] {
  let frames = assets.frames;

  if (mainCategory && mainCategory !== 'all') {
    frames = frames.filter(f => f.mainCategory === mainCategory);
  }

  if (subCategory) {
    frames = frames.filter(f => f.subCategory === subCategory);
  }

  if (subSubCategory) {
    frames = frames.filter(f => f.subSubCategory === subSubCategory);
  }

  return frames;
}

// Helper: Search frames by tag or name (cross-category)
export function searchFramesByTag(query: string): FrameMeta[] {
  if (!query.trim()) return assets.frames;
  
  const lowerQuery = query.toLowerCase().trim();
  return assets.frames.filter(frame => 
    frame.name.toLowerCase().includes(lowerQuery) ||
    frame.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Helper: Get unique subcategories for a main category
export function getUniqueSubcategories(mainCategory: MainCategory): string[] {
  const frames = assets.frames.filter(f => f.mainCategory === mainCategory);
  const subcategories = new Set(frames.map(f => f.subCategory));
  return Array.from(subcategories).sort();
}

// Helper: Get unique subSubcategories for a subcategory
export function getUniqueSubSubcategories(mainCategory: MainCategory, subCategory: string): string[] {
  const frames = assets.frames.filter(
    f => f.mainCategory === mainCategory && f.subCategory === subCategory && f.subSubCategory
  );
  const subSubcategories = new Set(frames.map(f => f.subSubCategory).filter(Boolean) as string[]);
  return Array.from(subSubcategories).sort();
}

// Helper: Get all race families that have frames
export function getRaceFamilies(): RaceFamily[] {
  const frames = assets.frames.filter(f => f.mainCategory === 'races' && f.family);
  const families = new Set(frames.map(f => f.family).filter(Boolean) as RaceFamily[]);
  return Array.from(families).sort();
}

// Helper: Get backgrounds
export function getBackgrounds() {
  return assets.backgrounds || [];
}

// Helper: Get overlays
export function getOverlays() {
  return assets.overlays || [];
}

// Helper: Get portraits
export function getPortraits() {
  return assets.portraits || [];
}

