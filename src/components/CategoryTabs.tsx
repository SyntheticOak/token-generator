import { useEditorStore } from "../store/useEditorStore";
import { MainCategory } from "../types";

const tabs: Array<{ id: MainCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'classes', label: 'Classes' },
  { id: 'races', label: 'Races' },
  { id: 'world', label: 'World' },
  { id: 'thematic', label: 'Thematic' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'utility', label: 'Utility' },
];

export default function CategoryTabs() {
  const activeTab = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  return (
    <div className="flex border-b overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

