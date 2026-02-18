import { useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import Sidebar from "./components/Sidebar";
import CanvasComposer, { CanvasComposerHandle } from "./components/CanvasComposer";
import Toolbar from "./components/Toolbar";
import LayerSidebar from "./components/LayerSidebar";

export default function App() {
  const composerRef = useRef<CanvasComposerHandle>(null);

  const handleExport = async (fmt: "png" | "webp", size: number) => {
    await composerRef.current?.exportImage(fmt, size);
  };

  return (
    <div className="h-screen flex flex-col">
      <Toolbar onExport={handleExport} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto">
            <CanvasComposer ref={composerRef} />
          </div>
          <div className="flex-shrink-0 w-full max-w-md mx-auto px-2 py-3 text-center text-xs text-gray-500 border-t border-gray-200">
            <div className="font-medium text-gray-600 mb-1">Changelog</div>
            <ul className="space-y-0.5 mb-3">
              <li>Fixed: Some mask files were not working correctly</li>
            </ul>
            <div>
              Please report bugs and issues to{" "}
              <a href="mailto:syntheticoak@proton.me" className="text-blue-600 hover:underline">
                syntheticoak@proton.me
              </a>
            </div>
          </div>
        </div>
        <LayerSidebar />
      </div>
      <Analytics />
    </div>
  );
}


