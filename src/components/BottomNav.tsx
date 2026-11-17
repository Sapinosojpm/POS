import React from 'react';
import { NAV_ITEMS } from './Sidebar';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * Phone / narrow-portrait navigation (< 768px).
 * Thumb-reachable bottom tab bar; the left Sidebar takes over from md (768px) upward.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-stretch px-1 select-none shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition"
          >
            <span
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-colors ${
                isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
            </span>
            <span
              className={`text-[10px] leading-none font-bold truncate max-w-full px-0.5 ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {item.short}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
