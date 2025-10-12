import { useState } from "react";
import { useEditorStore } from "../store/useEditorStore";

const FONTS = [
  'Cinzel',
  'Uncial Antiqua',
  'MedievalSharp',
  'Grenze Gotisch',
  'Forum',
  'Alegreya SC',
  'Gwendolyn',
  'Rye',
  'Press Start 2P',
];

const FONT_WEIGHTS = [
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
];

export default function TextPanel() {
  const { canvasDoc, ensureText, updateText, removeText, selectLayer, selectedLayerId } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const text = canvasDoc.text;
  const isSelected = selectedLayerId === 'text-0';

  if (!text) {
    return (
      <div className={`border-b ${isSelected ? 'bg-blue-50' : ''}`}>
        <div className="flex items-center justify-between p-3 pb-2">
          <h3 className={`font-bold ${isSelected ? 'text-blue-600' : ''}`}>Text</h3>
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
            <button
              onClick={() => {
                ensureText();
                selectLayer('text-0');
              }}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Text Layer
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border-b ${isSelected ? 'bg-blue-50' : ''}`}>
      <div className="flex items-center justify-between p-3 pb-2">
        <h3 className={`font-bold ${isSelected ? 'text-blue-600' : ''}`}>Text</h3>
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

      {/* Text input */}
      <label className="block mb-1 text-sm">Text</label>
      <textarea
        value={text.text}
        onChange={(e) => updateText({ text: e.target.value })}
        className="w-full px-2 py-1 border rounded mb-2"
        rows={3}
      />

      {/* Font */}
      <label className="block mb-1 text-sm">Font</label>
      <select
        value={text.fontFamily}
        onChange={(e) => updateText({ fontFamily: e.target.value })}
        className="w-full px-2 py-1 border rounded mb-2"
        style={{ fontFamily: text.fontFamily }}
      >
        {FONTS.map(font => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>

      {/* Size & Weight */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block mb-1 text-sm">Size</label>
          <input
            type="number"
            min="10"
            max="200"
            value={text.fontSize}
            onChange={(e) => updateText({ fontSize: Number(e.target.value) })}
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Weight</label>
          <select
            value={text.fontWeight}
            onChange={(e) => updateText({ fontWeight: Number(e.target.value) })}
            className="w-full px-2 py-1 border rounded"
          >
            {FONT_WEIGHTS.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Color */}
      <label className="block mb-1 text-sm">Color</label>
      <div className="flex gap-2 mb-2">
        <input
          type="color"
          value={text.color}
          onChange={(e) => updateText({ color: e.target.value })}
          className="w-12 h-8 border rounded"
        />
        <input
          type="text"
          value={text.color}
          onChange={(e) => updateText({ color: e.target.value })}
          className="flex-1 px-2 py-1 border rounded"
        />
      </div>

      {/* Stroke */}
      <details className="mb-2">
        <summary className="cursor-pointer text-sm font-medium mb-1">Stroke (Outline)</summary>
        <div className="ml-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!text.stroke}
              onChange={(e) => {
                if (e.target.checked) {
                  updateText({ stroke: { color: '#000000', width: 2 } });
                } else {
                  updateText({ stroke: undefined });
                }
              }}
            />
            <span className="text-sm">Enable Stroke</span>
          </div>
          {text.stroke && (
            <>
              <div>
                <label className="block text-xs mb-1">Stroke Color</label>
                <input
                  type="color"
                  value={text.stroke.color}
                  onChange={(e) => updateText({ stroke: { ...text.stroke!, color: e.target.value } })}
                  className="w-full h-8 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Width: {text.stroke.width}px</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={text.stroke.width}
                  onChange={(e) => updateText({ stroke: { ...text.stroke!, width: Number(e.target.value) } })}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </details>

      {/* Shadow */}
      <details className="mb-2">
        <summary className="cursor-pointer text-sm font-medium mb-1">Shadow</summary>
        <div className="ml-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!text.shadow}
              onChange={(e) => {
                if (e.target.checked) {
                  updateText({ shadow: { blur: 4, offsetX: 2, offsetY: 2, color: '#000000' } });
                } else {
                  updateText({ shadow: undefined });
                }
              }}
            />
            <span className="text-sm">Enable Shadow</span>
          </div>
          {text.shadow && (
            <>
              <div>
                <label className="block text-xs mb-1">Blur: {text.shadow.blur}px</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={text.shadow.blur}
                  onChange={(e) => updateText({ shadow: { ...text.shadow!, blur: Number(e.target.value) } })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Offset X: {text.shadow.offsetX}px</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={text.shadow.offsetX}
                  onChange={(e) => updateText({ shadow: { ...text.shadow!, offsetX: Number(e.target.value) } })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Offset Y: {text.shadow.offsetY}px</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={text.shadow.offsetY}
                  onChange={(e) => updateText({ shadow: { ...text.shadow!, offsetY: Number(e.target.value) } })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Shadow Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={text.shadow.color.startsWith('#') ? text.shadow.color : '#000000'}
                    onChange={(e) => updateText({ shadow: { ...text.shadow!, color: e.target.value } })}
                    className="w-12 h-8 border rounded"
                  />
                  <input
                    type="text"
                    value={text.shadow.color}
                    onChange={(e) => updateText({ shadow: { ...text.shadow!, color: e.target.value } })}
                    className="flex-1 px-2 py-1 border rounded text-xs"
                    placeholder="rgba(0,0,0,0.5) or #000000"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      {/* Select & Remove */}
      <div className="flex gap-2">
        <button
          onClick={() => selectLayer('text-0')}
          className={`flex-1 px-3 py-1 rounded ${isSelected ? 'bg-green-500 text-white cursor-default hover:bg-green-500' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
        <button
          onClick={removeText}
          className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Remove Text
        </button>
      </div>
        </div>
      )}
    </div>
  );
}

