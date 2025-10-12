import { useEditorStore } from "../store/useEditorStore";

export default function SearchBar() {
  const searchQuery = useEditorStore((s) => s.searchQuery);
  const setSearchQuery = useEditorStore((s) => s.setSearchQuery);

  return (
    <div className="p-3 border-b">
      <div className="relative">
        <input
          type="text"
          placeholder="Search frames by name or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

