import { useRef, useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { loadImage, resizeImageIfNeeded } from "../lib/canvas";

export default function PortraitPanel() {
  const { canvasDoc, setUserImage, selectLayer, selectedLayerId, updateCharacter } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const character = canvasDoc.character;
  const isSelected = selectedLayerId === 'character';
  const brightness = character?.brightness || 100;

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
    setUserImage(resizedImg);
    selectLayer('character');
  };

  return (
    <div className={`border-b ${isSelected ? 'bg-blue-50' : ''}`}>
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold ${isSelected ? 'text-blue-600' : ''}`}>Portrait</h3>
          <span className={`text-xs font-semibold ${character ? 'text-green-600' : 'text-red-600'}`}>
            {character ? 'Active' : 'No Portrait'}
          </span>
        </div>
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
        Upload Portrait
      </button>

      {character && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Brightness:</label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => updateCharacter({ brightness: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-10">{brightness}%</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => selectLayer('character')}
              className={`flex-1 px-3 py-1 rounded ${isSelected ? 'bg-green-500 text-white cursor-default hover:bg-green-500' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
