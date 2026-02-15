import { useState } from "react";
import { frameSrc } from "../lib/assetManifest";
import type { FrameMeta } from "../types";
import { useEditorStore } from "../store/useEditorStore";
import LazyImage from "./LazyImage";

function FrameThumbnail({ meta }: { meta: FrameMeta }) {
  const masterSrc = frameSrc(meta, "master");
  const [src, setSrc] = useState(() => frameSrc(meta, "thumbnail"));
  const [usedFallback, setUsedFallback] = useState(false);
  const handleError = () => {
    if (!usedFallback) {
      setUsedFallback(true);
      setSrc(masterSrc);
    }
  };
  return (
    <LazyImage
      src={src}
      alt={meta.name}
      width={128}
      height={128}
      style={{ objectFit: "contain" }}
      onError={handleError}
    />
  );
}

export default function FrameGrid() {
  const setSelectedFrame = useEditorStore((s) => s.setSelectedFrame);
  const filteredFrames = useEditorStore((s) => s.filteredFrames);

  if (filteredFrames.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">No frames found</p>
        <p className="text-xs mt-1">Try adjusting your filters or search</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="text-xs text-gray-600 px-1 mb-2">
        Showing {filteredFrames.length} frame{filteredFrames.length !== 1 ? 's' : ''}
      </div>
      <div className="grid grid-cols-2 gap-8">
        {filteredFrames.map((meta) => (
          <button
            key={meta.id}
            className="rounded-lg border p-2 hover:shadow"
            onClick={() => setSelectedFrame(meta)}
            title={meta.name}
          >
            <FrameThumbnail meta={meta} />
            <div className="text-xs mt-1">{meta.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}



