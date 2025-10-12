import { useRef, useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { loadImage, resizeImageIfNeeded } from "../lib/canvas";

export default function BackgroundPanel() {
  const { canvasDoc, addBackground, removeBackground, updateBackground, selectLayer, selectedLayerId } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const bg = canvasDoc.background;
  const isSelected = selectedLayerId === 'background';
  const backgroundColor = bg?.backgroundColor || '#808080';

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
    addBackground(resizedImg.src, resizedImg);
    selectLayer('background');
  };

  const handleLibrarySelect = async (fileName: string) => {
    const src = `/assets/backgrounds/${fileName}`;
    const img = await loadImage(src);
    addBackground(src, img);
    selectLayer('background');
  };

  const backgroundLibrary = [
    'bg_01.jpg', 'bg_02.jpg', 'bg_03.jpg', 'bg_04.jpg', 
    'bg_05.jpg', 'bg_06.jpg', 'bg_07.jpg', 'bg_08.jpg',
    'bg_09.jpg', 'bg_10.jpg', 'bg_11.jpg'
  ];

  return (
    <div className={`border-b ${isSelected ? 'bg-blue-50' : ''}`}>
      <div className="flex items-center justify-between p-3 pb-2">
        <h3 className={`font-bold ${isSelected ? 'text-blue-600' : ''}`}>Background</h3>
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
        Upload Background
      </button>

      {/* Color Fill Option */}
      <div className="mb-3">
        <label className="text-sm text-gray-700 block mb-1">Solid Color:</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => {
              const color = e.target.value;
              if (bg) {
                updateBackground({ backgroundColor: color });
              } else {
                addBackground('', undefined);
                setTimeout(() => updateBackground({ backgroundColor: color }), 0);
              }
            }}
            className="h-8 w-16 cursor-pointer border border-gray-300 rounded"
          />
          <button
            onClick={() => {
              if (bg) {
                updateBackground({ backgroundColor: backgroundColor });
              } else {
                addBackground('', undefined);
                setTimeout(() => updateBackground({ backgroundColor: backgroundColor }), 0);
              }
              selectLayer('background');
            }}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Apply Color
          </button>
        </div>
      </div>

      {/* Background library */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {backgroundLibrary.map(fileName => (
          <button
            key={fileName}
            onClick={() => handleLibrarySelect(fileName)}
            className={`aspect-square border-2 rounded overflow-hidden hover:border-blue-500 ${
              bg?.src.includes(fileName) ? 'border-blue-500' : 'border-gray-300'
            }`}
          >
            <img
              src={`/assets/backgrounds/${fileName}`}
              alt={fileName}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {bg && (
        <div className="flex gap-2">
          <button
            onClick={() => selectLayer('background')}
            className={`flex-1 px-3 py-1 rounded ${isSelected ? 'bg-green-500 text-white cursor-default hover:bg-green-500' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
          <button
            onClick={removeBackground}
            className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      )}
        </div>
      )}
    </div>
  );
}

