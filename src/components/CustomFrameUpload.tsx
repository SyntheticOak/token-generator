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

  const clearFrame = () => {
    if (customFrame?.maskUrl) {
      setCustomFrame({ frameUrl: '', maskUrl: customFrame.maskUrl });
    } else {
      clearCustomFrame();
    }
  };

  const clearMask = () => {
    if (customFrame?.frameUrl) {
      setCustomFrame({ frameUrl: customFrame.frameUrl, maskUrl: '' });
    } else {
      clearCustomFrame();
    }
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be under ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  const handleFileUpload = async (file: File, type: 'frame' | 'mask') => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        
        img.onload = async () => {
          try {
            // Resize if needed
            const resizedImg = await resizeImageIfNeeded(img, 1024);
            
            // Convert to data URL
            const canvas = document.createElement('canvas');
            canvas.width = resizedImg.width;
            canvas.height = resizedImg.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(resizedImg, 0, 0);
            const finalDataUrl = canvas.toDataURL('image/png');

            // Update custom frame
            setCustomFrame({
              frameUrl: type === 'frame' ? finalDataUrl : (customFrame?.frameUrl || ''),
              maskUrl: type === 'mask' ? finalDataUrl : (customFrame?.maskUrl || ''),
            });
          } catch (err) {
            setError('Failed to process image');
          } finally {
            setIsUploading(false);
          }
        };
        
        img.onerror = () => {
          setError('Failed to load image');
          setIsUploading(false);
        };
        
        img.src = dataUrl;
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed');
      setIsUploading(false);
    }
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'frame');
    }
  };

  const handleMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'mask');
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

      {(customFrame?.frameUrl || customFrame?.maskUrl) && (
        <div className="mt-3">
          <div className="text-xs text-gray-600 mb-2">Preview:</div>
          <div className="space-y-2">
            {customFrame?.frameUrl && (
              <div className="relative">
                <img
                  src={customFrame.frameUrl}
                  alt="Custom frame preview"
                  className="w-full h-20 object-contain border border-gray-200 rounded"
                />
                <button
                  onClick={clearFrame}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center"
                  title="Remove frame"
                >
                  ×
                </button>
                <div className="text-xs text-gray-500 mt-1 text-center">Frame</div>
              </div>
            )}
            
            {customFrame?.maskUrl && (
              <div className="relative">
                <img
                  src={customFrame.maskUrl}
                  alt="Custom mask preview"
                  className="w-full h-20 object-contain border border-gray-200 rounded"
                />
                <button
                  onClick={clearMask}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center"
                  title="Remove mask"
                >
                  ×
                </button>
                <div className="text-xs text-gray-500 mt-1 text-center">Mask</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
