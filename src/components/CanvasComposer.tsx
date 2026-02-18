import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { frameSrc } from "../lib/assetManifest";
import { composeToken, exportCanvas, exportAtSize, loadImage } from "../lib/canvas";

export interface CanvasComposerHandle {
  exportImage: (fmt: "png" | "webp", size: number) => Promise<void>;
  clearAll: () => void;
}

const CanvasComposer = forwardRef<CanvasComposerHandle>((_, ref) => {
  const { canvasDoc, selectedFrameMeta, clearAll: storeClearAll, selectedLayerId, updateLayerTransform } = useEditorStore();
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canvasSize = canvasDoc.width;

  // Load frame and mask images (custom or library)
  useEffect(() => {
    let mounted = true;
    (async () => {
      // Priority: custom frame > library frame
      if (canvasDoc.customFrame) {
        try {
          const [f, m] = await Promise.all([
            loadImage(canvasDoc.customFrame.frameUrl),
            canvasDoc.customFrame.maskUrl ? loadImage(canvasDoc.customFrame.maskUrl) : Promise.resolve(null),
          ]);
          if (mounted) { 
            setFrameImg(f); 
            setMaskImg(m); 
          }
        } catch (err) {
          console.error("Failed to load custom frame/mask:", err);
        }
      } else if (selectedFrameMeta) {
        const framePath = frameSrc(selectedFrameMeta, "master");
        const maskPath = frameSrc(selectedFrameMeta, "mask");
        
        try {
          const [f, m] = await Promise.all([
            loadImage(framePath).catch(err => {
              console.error("Failed to load frame:", framePath, err);
              throw err;
            }),
            loadImage(maskPath).catch(err => {
              console.error("Failed to load mask:", maskPath, err);
              // Allow mask to fail gracefully - return null instead of throwing
              return null;
            }),
          ]);
          if (mounted) { 
            setFrameImg(f); 
            setMaskImg(m); 
          }
        } catch (err) {
          console.error("Failed to load frame:", framePath, err);
          if (mounted) {
            setFrameImg(null);
            setMaskImg(null);
          }
        }
      } else {
        setFrameImg(null); 
        setMaskImg(null); 
      }
    })();
    return () => { mounted = false; };
  }, [selectedFrameMeta, canvasDoc]);

  // Load and cache layer images
  useEffect(() => {
    const loadLayerImages = async () => {
      const newCache = new Map(imageCache);
      
      // Load background (skip if solid color only - no src)
      if (canvasDoc.background && canvasDoc.background.src) {
        const cached = newCache.get(canvasDoc.background.id);
        // Reload if src changed
        if (!cached || (cached as any).__src !== canvasDoc.background.src) {
          try {
            const img = await loadImage(canvasDoc.background.src);
            (img as any).__src = canvasDoc.background.src; // Track src for cache invalidation
            newCache.set(canvasDoc.background.id, img);
          } catch (err) {
            console.error("Failed to load background:", canvasDoc.background.src, err);
          }
        }
      } else if (canvasDoc.background && !canvasDoc.background.src && canvasDoc.background.backgroundColor) {
        // Solid color background - remove from cache if previously was an image
        newCache.delete(canvasDoc.background.id);
      }
      
      // Load character
      if (canvasDoc.character) {
        const cached = newCache.get(canvasDoc.character.id);
        if (!cached || (cached as any).__src !== canvasDoc.character.src) {
          try {
            const img = await loadImage(canvasDoc.character.src);
            (img as any).__src = canvasDoc.character.src;
            newCache.set(canvasDoc.character.id, img);
          } catch (err) {
            console.error("Failed to load character:", canvasDoc.character.src, err);
          }
        }
      }
      
      // Load overlays
      for (const overlay of canvasDoc.overlays) {
        const cached = newCache.get(overlay.id);
        if (!cached || (cached as any).__src !== overlay.src) {
          try {
            const img = await loadImage(overlay.src);
            (img as any).__src = overlay.src;
            newCache.set(overlay.id, img);
          } catch (err) {
            console.error("Failed to load overlay:", overlay.src, err);
          }
        }
      }
      
      setImageCache(newCache);
    };
    
    loadLayerImages();
  }, [canvasDoc]);

  // Repaint preview on changes
  useEffect(() => {
    if (!previewRef.current) return;
    
    (async () => {
      const ctx = previewRef.current!.getContext("2d")!;
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      
      try {
        const composed = await composeToken({
          doc: canvasDoc,
          images: imageCache,
          frameImg: frameImg || undefined,
          maskImg: maskImg || undefined,
          includeBackground: true,
        });
        ctx.drawImage(composed, 0, 0);
      } catch (err) {
        console.error("Composition error:", err);
      }
    })();
  }, [canvasDoc, imageCache, frameImg, maskImg]);

  const handleExport = async (fmt: "png" | "webp", size: number) => {
    try {
      const composed = await composeToken({
        doc: canvasDoc,
        images: imageCache,
        frameImg: frameImg || undefined,
        maskImg: maskImg || undefined,
        includeBackground: true,
      });
      
      // Scale to requested size if different from 1024
      const scaledCanvas = await exportAtSize(composed, size);
      const blob = await exportCanvas(scaledCanvas, fmt);
      const name = `${selectedFrameMeta?.id ?? "token"}_${size}.${fmt}`;
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Export failed:", err);
      alert(`Export failed: ${err}`);
    }
  };

  // Canvas drag functionality for moving selected layer
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startTransform: any = null;

    const handleMouseDown = (e: MouseEvent) => {
      const { selectedLayerId, canvasDoc } = useEditorStore.getState();
      if (!selectedLayerId) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      // Get current transform
      if (selectedLayerId === 'background') startTransform = canvasDoc.background?.transform;
      else if (selectedLayerId === 'character') startTransform = canvasDoc.character?.transform;
      else if (selectedLayerId === 'text-0') startTransform = canvasDoc.text?.transform;
      else startTransform = canvasDoc.overlays.find(o => o.id === selectedLayerId)?.transform;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !startTransform) return;

      const { selectedLayerId, updateLayerTransform } = useEditorStore.getState();
      if (!selectedLayerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      updateLayerTransform(selectedLayerId, {
        x: startTransform.x + dx,
        y: startTransform.y + dy,
      });
    };

    const handleMouseUp = () => {
      isDragging = false;
      startTransform = null;
    };

    const handleWheel = (e: WheelEvent) => {
      const { selectedLayerId, updateLayerTransform, canvasDoc } = useEditorStore.getState();
      if (!selectedLayerId) return;

      e.preventDefault();

      // Get current scale
      let currentScale = 1;
      if (selectedLayerId === 'background' && canvasDoc.background) currentScale = canvasDoc.background.transform.scale;
      else if (selectedLayerId === 'character' && canvasDoc.character) currentScale = canvasDoc.character.transform.scale;
      else if (selectedLayerId === 'text-0' && canvasDoc.text) currentScale = canvasDoc.text.transform.scale;
      else {
        const overlay = canvasDoc.overlays.find(o => o.id === selectedLayerId);
        if (overlay) currentScale = overlay.transform.scale;
      }

      const delta = e.deltaY > 0 ? -0.05 : 0.05; // Scroll down = smaller, scroll up = larger
      const newScale = Math.max(0.1, Math.min(3, currentScale + delta));

      updateLayerTransform(selectedLayerId, { scale: newScale });
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleClearAll = () => {
    if (!confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      return;
    }
    
    // Clear image cache
    setImageCache(new Map());
    
    // Revoke blob URLs to prevent memory leaks
    const doc = canvasDoc;
    if (doc.background?.src.startsWith('blob:')) {
      URL.revokeObjectURL(doc.background.src);
    }
    if (doc.character?.src.startsWith('blob:')) {
      URL.revokeObjectURL(doc.character.src);
    }
    if (doc.customFrame?.frameUrl.startsWith('blob:')) {
      URL.revokeObjectURL(doc.customFrame.frameUrl);
    }
    if (doc.customFrame?.maskUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(doc.customFrame.maskUrl);
    }
    doc.overlays.forEach(overlay => {
      if (overlay.src.startsWith('blob:')) {
        URL.revokeObjectURL(overlay.src);
      }
    });
    
    // Clear store
    storeClearAll();
  };

  useImperativeHandle(ref, () => ({
    exportImage: handleExport,
    clearAll: handleClearAll
  }));

  // Get current layer's rotation and scale
  const getCurrentRotation = (): number => {
    if (!selectedLayerId) return 0;
    if (selectedLayerId === 'background' && canvasDoc.background) return canvasDoc.background.transform.rotation;
    if (selectedLayerId === 'character' && canvasDoc.character) return canvasDoc.character.transform.rotation;
    if (selectedLayerId === 'text-0' && canvasDoc.text) return canvasDoc.text.transform.rotation;
    const overlay = canvasDoc.overlays.find(o => o.id === selectedLayerId);
    return overlay?.transform.rotation || 0;
  };

  const getCurrentScale = (): number => {
    if (!selectedLayerId) return 1;
    if (selectedLayerId === 'background' && canvasDoc.background) return canvasDoc.background.transform.scale;
    if (selectedLayerId === 'character' && canvasDoc.character) return canvasDoc.character.transform.scale;
    if (selectedLayerId === 'text-0' && canvasDoc.text) return canvasDoc.text.transform.scale;
    const overlay = canvasDoc.overlays.find(o => o.id === selectedLayerId);
    return overlay?.transform.scale || 1;
  };

  const handleRotateLeft = () => {
    if (!selectedLayerId) return;
    const currentRotation = getCurrentRotation();
    updateLayerTransform(selectedLayerId, { rotation: currentRotation - 15 });
  };

  const handleRotateRight = () => {
    if (!selectedLayerId) return;
    const currentRotation = getCurrentRotation();
    updateLayerTransform(selectedLayerId, { rotation: currentRotation + 15 });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedLayerId) return;
    const newScale = Number(e.target.value);
    updateLayerTransform(selectedLayerId, { scale: newScale });
  };

  const handleScaleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (!selectedLayerId) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.05 : 0.05; // Scroll down = smaller, scroll up = larger
    const currentScale = getCurrentScale();
    const newScale = Math.max(0.1, Math.min(3, currentScale + delta));
    
    updateLayerTransform(selectedLayerId, { scale: newScale });
  };

  const currentScale = getCurrentScale();

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <div ref={containerRef} className="relative">
        <canvas
          ref={previewRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            width: 512,
            height: 512,
            background: "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 20px 20px",
            cursor: selectedLayerId ? 'move' : 'default',
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        {/* Scale Slider */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Scale:</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.01"
            value={currentScale}
            onChange={handleScaleChange}
            onWheel={handleScaleWheel}
            disabled={!selectedLayerId}
            className="w-32 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Scale selected layer (use mouse wheel to adjust)"
          />
          <span className="text-sm text-gray-600 w-10">{currentScale.toFixed(2)}</span>
        </div>

        {/* Rotation Buttons */}
        <button
          onClick={handleRotateLeft}
          disabled={!selectedLayerId}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xl"
          title="Rotate left (counter-clockwise)"
        >
          ↶
        </button>
        <button
          onClick={handleRotateRight}
          disabled={!selectedLayerId}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xl"
          title="Rotate right (clockwise)"
        >
          ↷
        </button>

        {/* Reset Layer */}
        {selectedLayerId && (
          <button 
            onClick={() => updateLayerTransform(selectedLayerId, { x: 0, y: 0, scale: 1, rotation: 0 })}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            title="Reset layer transform"
          >
            Reset Layer
          </button>
        )}

        {/* Clear Canvas */}
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          title="Clear all layers and reset canvas"
        >
          Clear Canvas
        </button>
      </div>
      <div className="w-full max-w-md mt-3 px-2 py-3 text-center text-xs text-gray-500 border-t border-gray-200">
        <div className="font-medium text-gray-600 mb-1">Changelog</div>
        <ul className="space-y-0.5 mb-3">
          <li>Fixed: Some mask files were not working correctly</li>
        </ul>
        <div>
          Please report bugs and issues to{" "}
          <a
            href="mailto:syntheticoak@proton.me"
            className="text-blue-600 hover:underline"
          >
            syntheticoak@proton.me
          </a>
        </div>
      </div>
    </div>
  );
});

CanvasComposer.displayName = "CanvasComposer";

export default CanvasComposer;
