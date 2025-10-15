import { create } from "zustand";
import { FrameMeta, Size, MainCategory, CanvasDoc, ImageLayer, TextLayer, Transform, CustomFrame } from "../types";
import { assets, getFramesByCategory, searchFramesByTag } from "../lib/assetManifest";

const STORAGE_KEY = 'tokengen_canvas_v1';
const STORAGE_VERSION = 1;

// Debounce helper
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSave = (data: any) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data }));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, 500);
};

// Load from localStorage
const loadFromStorage = (): Partial<CanvasDoc> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const { version, data } = JSON.parse(stored);
    if (version !== STORAGE_VERSION) return null; // Migration logic would go here
    return data;
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return null;
  }
};

interface EditorState {
  // Canvas document (layered state)
  canvasDoc: CanvasDoc;
  selectedLayerId: string | null;
  
  // Legacy support for frame selection UI
  selectedFrameMeta?: FrameMeta;
  
  // Filter state (unchanged)
  activeTab: MainCategory | 'all';
  selectedSubCategory?: string;
  selectedSubSubCategory?: string;
  searchQuery: string;
  filteredFrames: FrameMeta[];
  
  // Canvas actions
  setCanvasSize: (s: Size) => void;
  setSelectedFrame: (f?: FrameMeta) => void;
  setUserImage: (img: HTMLImageElement) => void;
  updateCharacter: (patch: Partial<ImageLayer>) => void;
  
  // Layer actions
  addBackground: (src: string, img?: HTMLImageElement) => void;
  removeBackground: () => void;
  updateBackground: (patch: Partial<ImageLayer>) => void;
  
  addOverlay: (src: string, img?: HTMLImageElement) => string;
  updateOverlay: (id: string, patch: Partial<ImageLayer>) => void;
  removeOverlay: (id: string) => void;
  bringOverlayForward: (id: string) => void;
  sendOverlayBackward: (id: string) => void;
  
  ensureText: () => void;
  updateText: (patch: Partial<TextLayer>) => void;
  removeText: () => void;
  
  selectLayer: (id: string | null) => void;
  lockLayer: (id: string, locked: boolean) => void;
  toggleVisibility: (id: string) => void;
  updateLayerTransform: (id: string, transform: Partial<Transform>) => void;
  
  serialize: () => CanvasDoc;
  hydrate: (doc: Partial<CanvasDoc>) => void;
  clearAll: () => void;
  
  // Custom frame actions
  setCustomFrame: (customFrame: CustomFrame) => void;
  clearCustomFrame: () => void;
  
  // Filter actions (unchanged)
  setActiveTab: (tab: MainCategory | 'all') => void;
  setSubCategory: (sub?: string) => void;
  setSubSubCategory: (subsub?: string) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  updateFilteredFrames: () => void;
}

const defaultTransform: Transform = { x: 0, y: 0, scale: 1, rotation: 0 };

const createDefaultCanvasDoc = (size: Size = 1024): CanvasDoc => ({
  width: size,
  height: size,
  overlays: [],
});

// Initialize with stored data
const storedData = loadFromStorage();
const initialCanvasDoc = storedData ? { ...createDefaultCanvasDoc(1024), ...storedData } : createDefaultCanvasDoc(1024);

export const useEditorStore = create<EditorState>((set, get) => ({
  // Canvas document defaults
  canvasDoc: initialCanvasDoc,
  selectedLayerId: null,
  selectedFrameMeta: undefined,
  
  // Filter defaults (unchanged)
  activeTab: 'all',
  selectedSubCategory: undefined,
  selectedSubSubCategory: undefined,
  searchQuery: '',
  filteredFrames: assets.frames,
  
  // Canvas actions
  setCanvasSize: (size) => set((s) => {
    const newDoc = { ...s.canvasDoc, width: size, height: size };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  updateCharacter: (patch: Partial<ImageLayer>) => set((s) => {
    const newDoc = {
      ...s.canvasDoc,
      character: s.canvasDoc.character ? { ...s.canvasDoc.character, ...patch } : undefined
    };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  setSelectedFrame: (frameMeta) => {
    if (!frameMeta) {
      set((s) => {
        const newDoc = { ...s.canvasDoc, frame: undefined };
        debouncedSave(newDoc);
        return { selectedFrameMeta: undefined, canvasDoc: newDoc };
      });
      return;
    }
    
    set((s) => {
      const newDoc = {
        ...s.canvasDoc,
        frame: {
          id: 'frame',
          type: 'frame' as const,
          src: frameMeta.basePath,
          transform: defaultTransform,
          visible: true,
        }
      };
      debouncedSave(newDoc);
      return { selectedFrameMeta: frameMeta, canvasDoc: newDoc };
    });
  },
  
  setUserImage: (img) => {
    set((s) => {
      const newDoc = {
        ...s.canvasDoc,
        character: {
          id: 'character',
          type: 'character' as const,
          src: img.src,
          naturalWidth: img.width,
          naturalHeight: img.height,
          brightness: s.canvasDoc.character?.brightness || 100,
          transform: s.canvasDoc.character?.transform || defaultTransform,
          visible: true,
        }
      };
      debouncedSave(newDoc);
      return { canvasDoc: newDoc };
    });
  },
  
  // Background actions
  addBackground: (src, img) => set((s) => {
    // Always replace existing background
    const newDoc = {
      ...s.canvasDoc,
      background: {
        id: 'background',
        type: 'background' as const,
        src,
        naturalWidth: img?.width,
        naturalHeight: img?.height,
        opacity: 1,
        backgroundColor: s.canvasDoc.background?.backgroundColor,
        transform: { ...defaultTransform, scale: 1 },
        visible: true,
      }
    };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  removeBackground: () => set((s) => {
    const newDoc = { ...s.canvasDoc, background: undefined };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  updateBackground: (patch) => set((s) => {
    const newDoc = {
      ...s.canvasDoc,
      background: s.canvasDoc.background ? { ...s.canvasDoc.background, ...patch } : undefined
    };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  // Overlay actions
  addOverlay: (src, img) => {
    const id = `overlay-${Date.now()}`;
    set((s) => {
      const overlayNumber = s.canvasDoc.overlays.length + 1;
      const newDoc = {
        ...s.canvasDoc,
        overlays: [
          ...s.canvasDoc.overlays,
          {
            id,
            type: 'overlay' as const,
            src,
            name: `Overlay ${overlayNumber}`,
            naturalWidth: img?.width,
            naturalHeight: img?.height,
            opacity: 1,
            transform: { ...defaultTransform, scale: 1 },
            visible: true,
          }
        ]
      };
      debouncedSave(newDoc);
      return { canvasDoc: newDoc };
    });
    return id;
  },
  
  updateOverlay: (id, patch) => set((s) => {
    const newDoc = {
      ...s.canvasDoc,
      overlays: s.canvasDoc.overlays.map(o => o.id === id ? { ...o, ...patch } : o)
    };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  removeOverlay: (id) => set((s) => {
    const newDoc = {
      ...s.canvasDoc,
      overlays: s.canvasDoc.overlays.filter(o => o.id !== id)
    };
    debouncedSave(newDoc);
    return {
      canvasDoc: newDoc,
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId
    };
  }),
  
  bringOverlayForward: (id) => set((s) => {
    const idx = s.canvasDoc.overlays.findIndex(o => o.id === id);
    if (idx === -1 || idx === s.canvasDoc.overlays.length - 1) return s;
    const overlays = [...s.canvasDoc.overlays];
    [overlays[idx], overlays[idx + 1]] = [overlays[idx + 1], overlays[idx]];
    const newDoc = { ...s.canvasDoc, overlays };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  sendOverlayBackward: (id) => set((s) => {
    const idx = s.canvasDoc.overlays.findIndex(o => o.id === id);
    if (idx <= 0) return s;
    const overlays = [...s.canvasDoc.overlays];
    [overlays[idx], overlays[idx - 1]] = [overlays[idx - 1], overlays[idx]];
    const newDoc = { ...s.canvasDoc, overlays };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  // Text actions
  ensureText: () => set((s) => {
    if (s.canvasDoc.text) return s;
    const newDoc = {
      ...s.canvasDoc,
      text: {
        id: 'text-0',
        text: 'Your Title',
        color: '#FFFFFF',
        fontFamily: 'Cinzel',
        fontWeight: 700,
        fontSize: 64,
        align: 'center' as const,
        shadow: { blur: 4, offsetX: 2, offsetY: 2, color: 'rgba(0,0,0,0.5)' },
        transform: defaultTransform,
        visible: true,
      }
    };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  updateText: (patch) => set((s) => {
    const newDoc = {
      ...s.canvasDoc,
      text: s.canvasDoc.text ? { ...s.canvasDoc.text, ...patch } : undefined
    };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  removeText: () => set((s) => {
    const newDoc = { ...s.canvasDoc, text: undefined };
    debouncedSave(newDoc);
    return {
      canvasDoc: newDoc,
      selectedLayerId: s.selectedLayerId === 'text-0' ? null : s.selectedLayerId
    };
  }),
  
  // Layer selection & manipulation
  selectLayer: (id) => set({ selectedLayerId: id }),
  
  lockLayer: (id, locked) => set((s) => {
    let newDoc = s.canvasDoc;
    if (id === 'background' && s.canvasDoc.background) {
      newDoc = { ...s.canvasDoc, background: { ...s.canvasDoc.background, locked } };
    } else if (id === 'character' && s.canvasDoc.character) {
      newDoc = { ...s.canvasDoc, character: { ...s.canvasDoc.character, locked } };
    } else if (id.startsWith('overlay-')) {
      newDoc = {
        ...s.canvasDoc,
        overlays: s.canvasDoc.overlays.map(o => o.id === id ? { ...o, locked } : o)
      };
    } else if (id === 'text-0' && s.canvasDoc.text) {
      newDoc = { ...s.canvasDoc, text: { ...s.canvasDoc.text, locked } };
    }
    if (newDoc !== s.canvasDoc) debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  toggleVisibility: (id) => set((s) => {
    let newDoc = s.canvasDoc;
    if (id === 'background' && s.canvasDoc.background) {
      newDoc = { ...s.canvasDoc, background: { ...s.canvasDoc.background, visible: !s.canvasDoc.background.visible } };
    } else if (id === 'frame' && s.canvasDoc.frame) {
      newDoc = { ...s.canvasDoc, frame: { ...s.canvasDoc.frame, visible: !s.canvasDoc.frame.visible } };
    } else if (id === 'character' && s.canvasDoc.character) {
      newDoc = { ...s.canvasDoc, character: { ...s.canvasDoc.character, visible: !s.canvasDoc.character.visible } };
    } else if (id.startsWith('overlay-')) {
      newDoc = {
        ...s.canvasDoc,
        overlays: s.canvasDoc.overlays.map(o => o.id === id ? { ...o, visible: !o.visible } : o)
      };
    } else if (id === 'text-0' && s.canvasDoc.text) {
      newDoc = { ...s.canvasDoc, text: { ...s.canvasDoc.text, visible: !s.canvasDoc.text.visible } };
    }
    if (newDoc !== s.canvasDoc) debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  updateLayerTransform: (id, transform) => set((s) => {
    let newDoc = s.canvasDoc;
    if (id === 'background' && s.canvasDoc.background) {
      newDoc = { ...s.canvasDoc, background: { ...s.canvasDoc.background, transform: { ...s.canvasDoc.background.transform, ...transform } } };
    } else if (id === 'character' && s.canvasDoc.character) {
      newDoc = { ...s.canvasDoc, character: { ...s.canvasDoc.character, transform: { ...s.canvasDoc.character.transform, ...transform } } };
    } else if (id.startsWith('overlay-')) {
      newDoc = {
        ...s.canvasDoc,
        overlays: s.canvasDoc.overlays.map(o => 
          o.id === id ? { ...o, transform: { ...o.transform, ...transform } } : o
        )
      };
    } else if (id === 'text-0' && s.canvasDoc.text) {
      newDoc = { ...s.canvasDoc, text: { ...s.canvasDoc.text, transform: { ...s.canvasDoc.text.transform, ...transform } } };
    }
    if (newDoc !== s.canvasDoc) debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  // Serialization
  serialize: () => get().canvasDoc,
  
  hydrate: (doc) => set((s) => {
    const newDoc = { ...createDefaultCanvasDoc(s.canvasDoc.width as Size), ...doc };
    return { canvasDoc: newDoc };
  }),

  clearAll: () => {
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
    
    // Reset to default state
    set({
      canvasDoc: createDefaultCanvasDoc(1024),
      selectedLayerId: null,
      selectedFrameMeta: undefined,
    });
  },
  
  // Custom frame actions
  setCustomFrame: (customFrame) => set((s) => {
    // Validate and clean the custom frame data
    const cleanFrameUrl = customFrame.frameUrl?.trim() || '';
    const cleanMaskUrl = customFrame.maskUrl?.trim() || '';
    
    // If both frameUrl and maskUrl are empty, remove customFrame entirely
    const hasFrame = cleanFrameUrl !== '';
    const hasMask = cleanMaskUrl !== '';
    
    const newCustomFrame = (hasFrame || hasMask) ? {
      frameUrl: cleanFrameUrl,
      maskUrl: cleanMaskUrl
    } : undefined;
    
    const newDoc = { 
      ...s.canvasDoc, 
      customFrame: newCustomFrame
    };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  clearCustomFrame: () => set((s) => {
    const newDoc = { ...s.canvasDoc, customFrame: undefined };
    debouncedSave(newDoc);
    return { canvasDoc: newDoc };
  }),
  
  // Filter actions (unchanged)
  setActiveTab: (activeTab) => {
    set({ 
      activeTab, 
      selectedSubCategory: undefined, 
      selectedSubSubCategory: undefined
    });
    get().updateFilteredFrames();
  },
  
  setSubCategory: (selectedSubCategory) => {
    set({ selectedSubCategory, selectedSubSubCategory: undefined });
    get().updateFilteredFrames();
  },
  
  setSubSubCategory: (selectedSubSubCategory) => {
    set({ selectedSubSubCategory });
    get().updateFilteredFrames();
  },
  
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().updateFilteredFrames();
  },
  
  clearFilters: () => {
    set({ 
      activeTab: 'all',
      selectedSubCategory: undefined,
      selectedSubSubCategory: undefined,
      searchQuery: '',
      filteredFrames: assets.frames
    });
  },
  
  updateFilteredFrames: () => {
    const state = get();
    
    if (state.searchQuery.trim()) {
      set({ filteredFrames: searchFramesByTag(state.searchQuery) });
      return;
    }
    
    let frames = getFramesByCategory(
      state.activeTab,
      state.selectedSubCategory,
      state.selectedSubSubCategory
    );
    
    set({ filteredFrames: frames });
  }
}));



