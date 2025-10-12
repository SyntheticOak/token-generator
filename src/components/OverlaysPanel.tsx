import { useRef, useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { loadImage, resizeImageIfNeeded } from "../lib/canvas";

export default function OverlaysPanel() {
  const { canvasDoc, addOverlay, updateOverlay, removeOverlay, bringOverlayForward, sendOverlayBackward, selectLayer, selectedLayerId } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit. Please choose a smaller file.');
      e.target.value = ''; // Reset input
      return;
    }

    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    const resizedImg = await resizeImageIfNeeded(img, 1024);
    const id = addOverlay(resizedImg.src, resizedImg);
    selectLayer(id);
  };

  const handleLibrarySelect = async (fileName: string) => {
    const src = `/assets/overlays/${fileName}`;
    const img = await loadImage(src);
    const id = addOverlay(src, img);
    selectLayer(id);
  };

  const overlayLibrary = ['fx_01.png'];

  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-3 pb-2">
        <h3 className="font-bold">Overlays</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-800 text-xl leading-none"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-3 py-2 bg-blue-500 text-white rounded mb-2 hover:bg-blue-600"
      >
        Upload Overlay
      </button>

      {/* Overlay library */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {overlayLibrary.map(fileName => (
          <button
            key={fileName}
            onClick={() => handleLibrarySelect(fileName)}
            className="aspect-square border rounded overflow-hidden hover:border-blue-500 bg-gray-100"
          >
            <img
              src={`/assets/overlays/${fileName}`}
              alt={fileName}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>

      {/* Active overlays list */}
      {canvasDoc.overlays.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Active Overlays</h4>
          {canvasDoc.overlays.map((overlay, idx) => (
            <div
              key={overlay.id}
              className={`border rounded p-2 ${selectedLayerId === overlay.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <input
                  type="text"
                  value={overlay.name || `Overlay ${idx + 1}`}
                  onChange={(e) => updateOverlay(overlay.id, { name: e.target.value })}
                  className="text-sm font-medium px-2 py-1 border rounded flex-1 mr-2 bg-white"
                  placeholder={`Overlay ${idx + 1}`}
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => selectLayer(overlay.id)}
                    className={`px-2 py-1 text-xs rounded ${selectedLayerId === overlay.id ? 'bg-green-500 text-white cursor-default hover:bg-green-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                    title={selectedLayerId === overlay.id ? 'Selected' : 'Select'}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => removeOverlay(overlay.id)}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Opacity */}
              <label className="block text-xs mb-1">Opacity: {Math.round((overlay.opacity || 1) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={overlay.opacity || 1}
                onChange={(e) => updateOverlay(overlay.id, { opacity: Number(e.target.value) })}
                className="w-full mb-2"
              />

              {/* Reorder buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => sendOverlayBackward(overlay.id)}
                  disabled={idx === 0}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  ↓ Back
                </button>
                <button
                  onClick={() => bringOverlayForward(overlay.id)}
                  disabled={idx === canvasDoc.overlays.length - 1}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  ↑ Forward
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      )}
    </div>
  );
}

