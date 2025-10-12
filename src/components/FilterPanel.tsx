import { useMemo } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { 
  getUniqueSubcategories, 
  getUniqueSubSubcategories,
  getRaceFamilies 
} from "../lib/assetManifest";

export default function FilterPanel() {
  const activeTab = useEditorStore((s) => s.activeTab);
  const selectedSubCategory = useEditorStore((s) => s.selectedSubCategory);
  const selectedSubSubCategory = useEditorStore((s) => s.selectedSubSubCategory);
  const selectedRaceFamily = useEditorStore((s) => s.selectedRaceFamily);
  const searchQuery = useEditorStore((s) => s.searchQuery);
  
  const setSubCategory = useEditorStore((s) => s.setSubCategory);
  const setSubSubCategory = useEditorStore((s) => s.setSubSubCategory);
  const setRaceFamily = useEditorStore((s) => s.setRaceFamily);

  // Compute all data at top level (Rules of Hooks)
  const classes = useMemo(() => getUniqueSubcategories('classes'), []);
  const subclasses = useMemo(
    () => selectedSubCategory && activeTab === 'classes' 
      ? getUniqueSubSubcategories('classes', selectedSubCategory) 
      : [],
    [selectedSubCategory, activeTab]
  );
  const families = useMemo(() => getRaceFamilies(), []);
  const races = useMemo(() => getUniqueSubcategories('races'), []);
  const worldLocations = useMemo(() => getUniqueSubcategories('world'), []);
  const thematicThemes = useMemo(() => getUniqueSubcategories('thematic'), []);
  const seasonalEvents = useMemo(() => getUniqueSubcategories('seasonal'), []);

  // Don't show filters when searching or on 'all' tab
  if (searchQuery.trim() || activeTab === 'all') {
    return null;
  }

  // Classes filter: Class → Subclass
  if (activeTab === 'classes') {
    return (
      <div className="p-3 border-b space-y-2">
        <div>
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

        {selectedSubCategory && subclasses.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Subclass</label>
            <select
              value={selectedSubSubCategory || ''}
              onChange={(e) => setSubSubCategory(e.target.value || undefined)}
              className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subclasses</option>
              {subclasses.map((subcls) => (
                <option key={subcls} value={subcls}>
                  {subcls.charAt(0).toUpperCase() + subcls.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // Races filter: Family → Race
  if (activeTab === 'races') {
    return (
      <div className="p-3 border-b space-y-2">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Family</label>
          <select
            value={selectedRaceFamily || ''}
            onChange={(e) => setRaceFamily(e.target.value ? e.target.value as any : undefined)}
            className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Families</option>
            {families.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>
        </div>

        {races.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Race</label>
            <select
              value={selectedSubCategory || ''}
              onChange={(e) => setSubCategory(e.target.value || undefined)}
              className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Races</option>
              {races.map((race) => (
                <option key={race} value={race}>
                  {race.charAt(0).toUpperCase() + race.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // World filter
  if (activeTab === 'world') {
    return (
      <div className="p-3 border-b">
        <label className="text-xs font-medium text-gray-700 mb-1 block">Location</label>
        <select
          value={selectedSubCategory || ''}
          onChange={(e) => setSubCategory(e.target.value || undefined)}
          className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Locations</option>
          {worldLocations.map((sub) => (
            <option key={sub} value={sub}>
              {sub.charAt(0).toUpperCase() + sub.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
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

  return null;
}

