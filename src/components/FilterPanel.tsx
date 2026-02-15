import { useMemo } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { 
  getUniqueSubcategories
} from "../lib/assetManifest";

export default function FilterPanel() {
  const activeTab = useEditorStore((s) => s.activeTab);
  const selectedSubCategory = useEditorStore((s) => s.selectedSubCategory);
  const searchQuery = useEditorStore((s) => s.searchQuery);
  
  const setSubCategory = useEditorStore((s) => s.setSubCategory);

  // Compute all data at top level (Rules of Hooks)
  const classes = useMemo(() => getUniqueSubcategories('classes'), []);
  const thematicThemes = useMemo(() => getUniqueSubcategories('thematic'), []);
  const seasonalEvents = useMemo(() => getUniqueSubcategories('seasonal'), []);
  const utilityCategories = useMemo(() => getUniqueSubcategories('utility'), []);

  // Don't show filters when searching or on 'all' tab
  if (searchQuery.trim() || activeTab === 'all') {
    return null;
  }

  // Classes filter: Class only (no subclass dropdown)
  if (activeTab === 'classes') {
    return (
      <div className="p-3 border-b">
        <label className="text-xs font-medium text-gray-700 mb-1 block">Class</label>
        <select
          value={selectedSubCategory || ''}
          onChange={(e) => setSubCategory(e.target.value || undefined)}
          className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>
              {cls.charAt(0).toUpperCase() + cls.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Races filter: No dropdowns, search only
  if (activeTab === 'races') {
    return null;
  }

  // World filter: No dropdowns (same as races)
  if (activeTab === 'world') {
    return null;
  }

  // Thematic filter
  if (activeTab === 'thematic') {
    return (
      <div className="p-3 border-b">
        <label className="text-xs font-medium text-gray-700 mb-1 block">Theme</label>
        <select
          value={selectedSubCategory || ''}
          onChange={(e) => setSubCategory(e.target.value || undefined)}
          className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Themes</option>
          {thematicThemes.map((sub) => (
            <option key={sub} value={sub}>
              {sub.charAt(0).toUpperCase() + sub.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Seasonal filter
  if (activeTab === 'seasonal') {
    return (
      <div className="p-3 border-b">
        <label className="text-xs font-medium text-gray-700 mb-1 block">Event</label>
        <select
          value={selectedSubCategory || ''}
          onChange={(e) => setSubCategory(e.target.value || undefined)}
          className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Events</option>
          {seasonalEvents.map((sub) => (
            <option key={sub} value={sub}>
              {sub.charAt(0).toUpperCase() + sub.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Utility filter
  if (activeTab === 'utility') {
    return (
      <div className="p-3 border-b">
        <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
        <select
          value={selectedSubCategory || ''}
          onChange={(e) => setSubCategory(e.target.value || undefined)}
          className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {utilityCategories.map((sub) => (
            <option key={sub} value={sub}>
              {sub.charAt(0).toUpperCase() + sub.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}

