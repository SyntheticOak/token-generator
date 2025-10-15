import CustomFrameUpload from "./CustomFrameUpload";
import SearchBar from "./SearchBar";
import CategoryTabs from "./CategoryTabs";
import FilterPanel from "./FilterPanel";
import FrameGrid from "./FrameGrid";

export default function Sidebar() {
  return (
    <aside className="w-80 border-r h-full flex flex-col">
      <CustomFrameUpload />
      <SearchBar />
      <CategoryTabs />
      <FilterPanel />
      <div className="flex-1 overflow-auto">
        <FrameGrid />
      </div>
    </aside>
  );
}



