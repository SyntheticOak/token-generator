import { useState } from "react";
import { useEditorStore } from "../store/useEditorStore";

export default function Toolbar({ onExport }: { onExport: (fmt: "png" | "webp", size: number) => Promise<void> }) {
  const [exportSize, setExportSize] = useState(1024);
  const exportAllowed = useEditorStore((s) => s.exportAllowed);

  return (
    <div className="flex items-center gap-3 p-2 border-b bg-white">
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
          disabled={!exportAllowed}
          title={exportAllowed ? undefined : "Select a frame before exporting"}
          className={`px-6 py-2 font-semibold rounded-lg transition-colors shadow-md ${
            exportAllowed
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-green-600/50 text-white/70 cursor-not-allowed"
          }`}
        >
          Export PNG
        </button>
        <button 
          onClick={() => onExport("webp", exportSize)}
          disabled={!exportAllowed}
          title={exportAllowed ? undefined : "Select a frame before exporting"}
          className={`px-6 py-2 font-semibold rounded-lg transition-colors shadow-md ${
            exportAllowed
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-600/50 text-white/70 cursor-not-allowed"
          }`}
        >
          Export WebP
        </button>
      </div>
    </div>
  );
}



