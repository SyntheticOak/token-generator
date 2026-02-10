import { useState } from "react";

export default function Toolbar({ onExport }: { onExport: (fmt: "png" | "webp", size: number) => Promise<void> }) {
  const [exportSize, setExportSize] = useState(1024);

  return (
    <div className="flex items-center gap-3 p-2 border-b">
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href="https://www.etsy.com/shop/SyntheticOak"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title="Visit our Etsy shop"
        >
          <img
            src="/assets/ETSY_SHOP.png"
            alt="Etsy Shop"
            className="h-16 w-auto"
          />
        </a>
        <a
          href="https://syntheticoak.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title="Visit Synthetic Oak homepage"
        >
          <img
            src="/assets/SOAK_LOGO.png"
            alt="Synthetic Oak"
            className="h-16 w-auto"
          />
        </a>
      </div>
      <div className="flex-1 text-center text-sm text-gray-600 px-4">
        <span className="font-medium">Quick Guide:</span> Upload Portrait | Select Frame | Adjust Layers (drag/scroll) | Export
      </div>

      <div className="flex gap-3 items-center">
        <label className="font-medium">Export Size:</label>
        <select
          value={exportSize}
          onChange={(e) => setExportSize(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded"
        >
          <option value={1024}>1024px</option>
          <option value={512}>512px</option>
          <option value={256}>256px</option>
        </select>
        
        <button 
          onClick={() => onExport("png", exportSize)}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          Export PNG
        </button>
        <button 
          onClick={() => onExport("webp", exportSize)}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Export WebP
        </button>
      </div>
    </div>
  );
}



