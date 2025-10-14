import { useRef } from "react";
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
        <div className="flex-1 flex items-center justify-center">
          <CanvasComposer ref={composerRef} />
        </div>
        <LayerSidebar />
      </div>
    </div>
  );
}


