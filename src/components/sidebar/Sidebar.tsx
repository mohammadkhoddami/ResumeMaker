import type { User } from "firebase/auth";
import { useUIStore } from "../../store/uiStore";
import { useCloudSync } from "../../hooks/useCloudSync";
import { ThemeSelector } from "./ThemeSelector";
import { AccentColorPicker } from "./AccentColorPicker";
import { FontSizeSlider } from "./FontSizeSlider";
import { SectionAdder } from "./SectionAdder";
import { ExportPanel } from "./ExportPanel";

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { saveToCloud } = useCloudSync(user);

  return (
    <div className="relative flex h-full shrink-0">
      <aside
        className={`flex h-full flex-col bg-gray-900 text-gray-100 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        {sidebarOpen && (
          <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">
              تنظیمات رزومه
            </h2>

            <ThemeSelector />
            <AccentColorPicker />
            <FontSizeSlider />
            <SectionAdder />
            <ExportPanel saveToCloud={saveToCloud} />
          </div>
        )}
      </aside>

      <button
        onClick={toggleSidebar}
        className={`absolute top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs text-gray-300 hover:bg-gray-600 ${
          sidebarOpen ? "-right-3" : "left-0"
        }`}
        aria-label={sidebarOpen ? "بستن پنل" : "باز کردن پنل"}
      >
        {sidebarOpen ? "‹" : "›"}
      </button>
    </div>
  );
}