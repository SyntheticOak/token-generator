import { CanvasDoc, ImageLayer, TextLayer } from "../types";

export async function loadImage(src: string): Promise<HTMLImageElement> {
  // For R2 URLs, proxy through our Vercel API endpoint to add CORS headers
  // R2 public URLs don't respect bucket CORS policies, so we need a proxy
  if (src.startsWith('https://pub-') && src.includes('.r2.dev')) {
    // Use Vercel proxy endpoint that adds CORS headers
    // Use window.location.origin to work in both dev (with Vercel CLI) and production
    const proxyUrl = `${window.location.origin}/api/proxy-r2?url=${encodeURIComponent(src)}`;
    
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Can use crossOrigin with our proxy
      img.onload = () => res(img);
      img.onerror = (err) => {
        console.error("Image load failed via proxy:", src, err);
        rej(new Error(`Failed to load image: ${src}`));
      };
      img.src = proxyUrl;
    });
  }
  
  // For non-R2 URLs (local files, other CDNs), use crossOrigin approach
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = (err) => {
      console.error("Image load failed:", src, err);
      rej(new Error(`Failed to load image: ${src}. This may be a CORS issue.`));
    };
    img.src = src;
  });
}

// Resize image if it exceeds maxDimension, maintaining aspect ratio
export async function resizeImageIfNeeded(img: HTMLImageElement, maxDimension: number = 1024): Promise<HTMLImageElement> {
  const { width, height } = img;
  
  // If image is within bounds, return original
  if (width <= maxDimension && height <= maxDimension) {
    return img;
  }
  
  // Calculate new dimensions maintaining aspect ratio
  const longestSide = Math.max(width, height);
  const scale = maxDimension / longestSide;
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  // Create canvas and resize
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  
  // Create new image from canvas and wait for it to load
  return new Promise((resolve) => {
    const resizedImg = new Image();
    resizedImg.onload = () => resolve(resizedImg);
    resizedImg.src = canvas.toDataURL('image/png');
  });
}

// Convert RGB mask to alpha mask (white=visible, black=transparent)
function convertMaskToAlpha(maskImg: HTMLImageElement, size: number): HTMLCanvasElement {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = tempCanvas.height = size;
  const tempCtx = tempCanvas.getContext("2d")!;
  
  tempCtx.drawImage(maskImg, 0, 0, size, size);
  const imageData = tempCtx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const luminance = data[i];
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = luminance;
  }
  
  tempCtx.putImageData(imageData, 0, 0);
  return tempCanvas;
}

// Render a layer with transform
function renderImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  img: HTMLImageElement | undefined,
  canvasSize: number,
  displaySize: number = 512
) {
  if (!layer.visible) return;
  
  const scaleFactor = canvasSize / displaySize;
  const t = layer.transform;
  
  ctx.save();
  ctx.globalAlpha = layer.opacity ?? 1;
  
  // All layers use standard transform (background, character, overlays)
  ctx.translate(
    canvasSize / 2 + t.x * scaleFactor,
    canvasSize / 2 + t.y * scaleFactor
  );
  ctx.rotate((t.rotation * Math.PI) / 180);
  
  // Apply brightness filter for character layer
  if (layer.type === 'character' && layer.brightness !== undefined) {
    ctx.filter = `brightness(${layer.brightness}%)`;
  }
  
  if (img) {
    const w = img.width * t.scale * scaleFactor;
    const h = img.height * t.scale * scaleFactor;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else if (layer.type === 'background' && layer.backgroundColor) {
    // Render solid color background
    ctx.fillStyle = layer.backgroundColor;
    ctx.fillRect(-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize);
  }
  
  ctx.restore();
}

// Render text layer
function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  canvasSize: number,
  displaySize: number = 512
) {
  if (!layer.visible) return;
  
  const scaleFactor = canvasSize / displaySize;
  const t = layer.transform;
  
  ctx.save();
  ctx.translate(
    canvasSize / 2 + t.x * scaleFactor,
    canvasSize / 2 + t.y * scaleFactor
  );
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.scale(t.scale, t.scale);
  
  // Set font
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
  ctx.textAlign = layer.align;
  ctx.textBaseline = 'middle';
  
  // Apply shadow
  if (layer.shadow) {
    ctx.shadowColor = layer.shadow.color;
    ctx.shadowBlur = layer.shadow.blur;
    ctx.shadowOffsetX = layer.shadow.offsetX;
    ctx.shadowOffsetY = layer.shadow.offsetY;
  }
  
  // Draw stroke
  if (layer.stroke) {
    ctx.strokeStyle = layer.stroke.color;
    ctx.lineWidth = layer.stroke.width;
    ctx.strokeText(layer.text, 0, 0);
  }
  
  // Draw fill
  ctx.fillStyle = layer.color;
  ctx.fillText(layer.text, 0, 0);
  
  ctx.restore();
}

// Main composition function - always renders at 1024px internally
export async function composeToken(opts: {
  doc: CanvasDoc;
  images: Map<string, HTMLImageElement>;
  frameImg?: HTMLImageElement;
  maskImg?: HTMLImageElement;
  includeBackground?: boolean;
}): Promise<HTMLCanvasElement> {
  const { doc, images, frameImg, maskImg, includeBackground = true } = opts;
  const size = 1024; // Always render at 1024px internally
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  
  // Create temp canvas for masked layers (background + character)
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = tempCanvas.height = size;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";
  
  // Layer 1: Background (rendered to temp canvas, will be masked)
  if (includeBackground && doc.background) {
    const bgImg = images.get(doc.background.id);
    // Render even if no image (for solid color backgrounds)
    renderImageLayer(tempCtx, doc.background, bgImg, size);
  }
  
  // Layer 2: Character (rendered to temp canvas, will be masked)
  if (doc.character) {
    const charImg = images.get(doc.character.id);
    if (charImg) {
      renderImageLayer(tempCtx, doc.character, charImg, size);
    }
  }
  
  // Apply mask to both background and character together
  if (maskImg) {
    try {
      const alphaMask = convertMaskToAlpha(maskImg, size);
      tempCtx.globalCompositeOperation = "destination-in";
      tempCtx.drawImage(alphaMask, 0, 0, size, size);
    } catch (e) {
      console.error("Mask application failed (likely CORS):", e);
      // Continue without mask so overlays/frames still render
    }
  }
  
  // Draw masked layers to main canvas
  ctx.drawImage(tempCanvas, 0, 0);
  
  // Layer 3: Frame
  if (doc.frame && frameImg) {
    ctx.drawImage(frameImg, 0, 0, size, size);
  }
  
  // Layer 4: Overlays
  for (const overlay of doc.overlays) {
    const overlayImg = images.get(overlay.id);
    if (overlayImg) {
      renderImageLayer(ctx, overlay, overlayImg, size);
    }
  }
  
  // Layer 5: Text
  if (doc.text) {
    renderTextLayer(ctx, doc.text, size);
  }
  
  return c;
}

// Legacy wrapper for backward compatibility
export function composeTokenLegacy(opts: {
  size: number;
  portrait?: HTMLImageElement;
  frameImg: HTMLImageElement;
  maskImg: HTMLImageElement;
  transform: { scale: number; pos: { x: number; y: number }; rotation: number };
}): HTMLCanvasElement {
  const { size, portrait, frameImg, maskImg, transform } = opts;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const displaySize = 512;
  const scaleFactor = size / displaySize;

  if (portrait) {
    ctx.save();
    ctx.translate(
      size / 2 + transform.pos.x * scaleFactor,
      size / 2 + transform.pos.y * scaleFactor
    );
    ctx.rotate((transform.rotation * Math.PI) / 180);
    const scale = transform.scale;
    const w = portrait.width * scale * scaleFactor;
    const h = portrait.height * scale * scaleFactor;
    ctx.drawImage(portrait, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  const alphaMask = convertMaskToAlpha(maskImg, size);
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(alphaMask, 0, 0, size, size);
  ctx.restore();

  ctx.drawImage(frameImg, 0, 0, size, size);

  return c;
}

// Export canvas at specific size with high-quality scaling
export async function exportAtSize(canvas: HTMLCanvasElement, size: number): Promise<HTMLCanvasElement> {
  if (canvas.width === size) {
    return canvas;
  }
  
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = size;
  exportCanvas.height = size;
  
  const ctx = exportCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = 'high';
  
  ctx.drawImage(canvas, 0, 0, size, size);
  
  return exportCanvas;
}

export function exportCanvas(c: HTMLCanvasElement, format: "png" | "webp" = "png"): Promise<Blob> {
  const type = format === "png" ? "image/png" : "image/webp";
  return new Promise((res, rej) => {
    c.toBlob((b) => {
      if (b) {
        res(b);
      } else {
        rej(new Error(`Failed to create ${format} blob`));
      }
    }, type, 1.0); // quality 1.0 for lossless webp
  });
}


