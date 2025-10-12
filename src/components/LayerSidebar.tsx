import BackgroundPanel from "./BackgroundPanel";
import PortraitPanel from "./PortraitPanel";
import OverlaysPanel from "./OverlaysPanel";
import TextPanel from "./TextPanel";

export default function LayerSidebar() {
  return (
    <aside className="w-80 border-l h-full flex flex-col overflow-auto bg-gray-50">
      <div className="p-3 border-b bg-white">
        <h2 className="text-lg font-bold">Layer Editor</h2>
      </div>
      
      <BackgroundPanel />
      <PortraitPanel />
      <OverlaysPanel />
      <TextPanel />
    </aside>
  );
}

