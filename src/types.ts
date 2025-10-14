export type Size = 1024 | 512 | 256;

export type MainCategory = 'classes' | 'races' | 'world' | 'thematic' | 'seasonal' | 'utility';

export type RaceFamily = 
  | 'Humanoid'
  | 'Beastfolk'
  | 'Dragonkin'
  | 'Fey'
  | 'Undead'
  | 'Fiendish'
  | 'Celestial'
  | 'Construct'
  | 'Elemental'
  | 'Giantkin'
  | 'Plantfolk'
  | 'Aberration'
  | 'Ooze'
  | 'Other';

export interface FrameMeta {
  id: string;
  name: string;
  mainCategory: MainCategory;
  subCategory: string;           // e.g. "warlock", "underdark", "elemental"
  subSubCategory?: string;       // e.g. "hexblade" for warlock subclass
  family?: RaceFamily;           // only for races
  thumbnailPath?: string;        // path to 256px thumbnail (WebP preferred)
  masterPath?: string;           // path to 1024px master (PNG)
  basePath: string;
  maskPath?: string;             // for shared masks (e.g. "elite_mask.png")
  tags: string[];                // for cross-category search
  // Legacy field for backwards compatibility
  category?: string;
}

export interface PortraitMeta {
  id: string;
  src: string;
}

export interface AssetRecord {
  frames: FrameMeta[];
  backgrounds: PortraitMeta[];
  overlays: PortraitMeta[];
  portraits: PortraitMeta[];
}

// Layer system types
export type FitMode = 'contain' | 'cover' | 'stretch' | 'center';

export type Transform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type ImageLayer = {
  id: string;
  type: 'background' | 'frame' | 'character' | 'overlay';
  src: string;
  name?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  fit?: FitMode;
  opacity?: number;
  brightness?: number; // 0-200, default 100
  backgroundColor?: string; // for background layer only
  transform: Transform;
  locked?: boolean;
  visible: boolean;
};

export type TextLayer = {
  id: string;
  text: string;
  color: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  stroke?: { color: string; width: number };
  shadow?: { blur: number; offsetX: number; offsetY: number; color: string };
  transform: Transform;
  visible: boolean;
  locked?: boolean;
};

export type CanvasDoc = {
  width: number;
  height: number;
  background?: ImageLayer;
  frame?: ImageLayer;
  character?: ImageLayer;
  overlays: ImageLayer[];
  text?: TextLayer;
};



