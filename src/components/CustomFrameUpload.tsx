import { useRef, useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { resizeImageIfNeeded } from "../lib/canvas";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function CustomFrameUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  
  const customFrame = useEditorStore((s) => s.canvasDoc.customFrame);
  const setCustomFrame = useEditorStore((s) => s.setCustomFrame);
  const clearCustomFrame = useEditorStore((s) => s.clearCustomFrame);
  const applyCustomFrame = useEditorStore((s) => s.applyCustomFrame);

  const clearFrame = () => {
    try {
      if (customFrame?.maskUrl) {
        setCustomFrame({ frameUrl: '', maskUrl: customFrame.maskUrl });
      } else {
        clearCustomFrame();
      }
      // Remove frame from canvas when frame is cleared
      useEditorStore.getState().setSelectedFrame(undefined);
    } catch (err) {
      console.error('Error clearing frame:', err);
      setError('Failed to clear frame');
    }
  };

  const clearMask = () => {
    try {
      if (customFrame?.frameUrl) {
        setCustomFrame({ frameUrl: customFrame.frameUrl, maskUrl: '' });
      } else {
        clearCustomFrame();
        // Remove frame from canvas when both frame and mask are cleared
        useEditorStore.getState().setSelectedFrame(undefined);
      }
    } catch (err) {
      console.error('Error clearing mask:', err);
      setError('Failed to clear mask');
    }
  };

  const resetInputs = () => {
    if (frameInputRef.current) frameInputRef.current.value = '';
    if (maskInputRef.current) maskInputRef.current.value = '';
  };

  const validateFile = (file: File): string | null => {
    if (!file) {
      return 'No file selected';
    }
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (PNG, JPG, WebP, etc.)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be under ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    if (file.size === 0) {
      return 'File appears to be empty';
    }
    return null;
  };

  const handleFileUpload = async (file: File, type: 'frame' | 'mask') => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      resetInputs();
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          setError('Failed to read file');
          setIsUploading(false);
          resetInputs();
          return;
        }

        const img = new Image();
        
        img.onload = async () => {
          try {
            // Resize if needed
            const resizedImg = await resizeImageIfNeeded(img, 1024);
            
            // Convert to data URL
            const canvas = document.createElement('canvas');
            canvas.width = resizedImg.width;
            canvas.height = resizedImg.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }
            ctx.drawImage(resizedImg, 0, 0);
            const finalDataUrl = canvas.toDataURL('image/png');

            // Get current state to avoid stale closure
            const currentCustomFrame = useEditorStore.getState().canvasDoc.customFrame;
            
            // Update custom frame with proper state
            setCustomFrame({
              frameUrl: type === 'frame' ? finalDataUrl : (currentCustomFrame?.frameUrl || ''),
              maskUrl: type === 'mask' ? finalDataUrl : (currentCustomFrame?.maskUrl || ''),
            });
            
            // If frame was uploaded, automatically apply it to canvas
            if (type === 'frame') {
              // Use setTimeout to ensure state update completes first
              setTimeout(() => {
                applyCustomFrame();
              }, 0);
            }
            
            resetInputs();
          } catch (err) {
            console.error('Image processing error:', err);
            setError('Failed to process image');
            resetInputs();
          } finally {
            setIsUploading(false);
          }
        };
        
        img.onerror = () => {
          setError('Failed to load image');
          setIsUploading(false);
          resetInputs();
        };
        
        img.src = dataUrl;
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
        resetInputs();
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed');
      setIsUploading(false);
      resetInputs();
    }
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'frame');
    } else {
      resetInputs();
    }
  };

  const handleMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'mask');
    } else {
      resetInputs();
    }
  };

  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="text-sm font-medium text-gray-700 mb-3">Custom Frame</div>
      
      <div className="space-y-2">
        <input
          ref={frameInputRef}
          type="file"
          accept="image/*"
          onChange={handleFrameUpload}
          className="hidden"
          disabled={isUploading}
        />
        <input
          ref={maskInputRef}
          type="file"
          accept="image/*"
          onChange={handleMaskUpload}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={() => frameInputRef.current?.click()}
          disabled={isUploading}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Frame'}
        </button>
        
        <button
          onClick={() => maskInputRef.current?.click()}
          disabled={isUploading}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Mask'}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-600">{error}</div>
      )}

      <div className="mt-3">
        <div className="text-xs text-gray-600 mb-2">Preview:</div>
        <div className="flex gap-2">
          {/* Frame Preview */}
          <div className="flex-1">
            <div className="relative">
              {customFrame?.frameUrl ? (
                <>
                  <img
                    src={customFrame.frameUrl}
                    alt="Custom frame preview"
                    className="w-full h-16 object-contain border border-gray-200 rounded bg-white"
                  />
                  <button
                    onClick={clearFrame}
                    className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center transform translate-x-1 -translate-y-1"
                    title="Remove frame"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="w-full h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
                  <span className="text-xs text-gray-400">No Frame</span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1 text-center">Frame</div>
            </div>
          </div>
          
          {/* Mask Preview */}
          <div className="flex-1">
            <div className="relative">
              {customFrame?.maskUrl ? (
                <>
                  <img
                    src={customFrame.maskUrl}
                    alt="Custom mask preview"
                    className="w-full h-16 object-contain border border-gray-200 rounded bg-white"
                  />
                  <button
                    onClick={clearMask}
                    className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center transform translate-x-1 -translate-y-1"
                    title="Remove mask"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="w-full h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
                  <span className="text-xs text-gray-400">No Mask</span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1 text-center">Mask</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
