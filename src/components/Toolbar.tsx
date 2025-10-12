import { useEditorStore } from "../store/useEditorStore";

export default function Toolbar({ onExport }: { onExport: (fmt: "png" | "webp") => Promise<void> }) {
  const { canvasDoc, setCanvasSize } = useEditorStore();

  const canvasSize = canvasDoc.width;

  return (
    <div className="flex items-center gap-3 p-2 border-b">
      <label className="font-medium">Size:</label>
      <select
        value={canvasSize}
        onChange={(e) => setCanvasSize(Number(e.target.value) as any)}
        className="px-2 py-1 border border-gray-300 rounded"
      >
        <option value={1024}>1024</option>
        <option value={512}>512</option>
        <option value={256}>256</option>
      </select>

      <div className="flex-1 text-center text-sm text-gray-600 px-4">
        <span className="font-medium">Quick Guide:</span> Upload Portrait | Select Frame | Adjust Layers (drag/scroll) | Export
      </div>

      <div className="flex gap-3 items-center">
        <button 
          onClick={() => onExport("png")}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          Export PNG
        </button>
        <button 
          onClick={() => onExport("webp")}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Export WebP
        </button>
      </div>
    </div>
  );
}



