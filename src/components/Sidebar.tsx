import React from 'react';
import { LayoutGrid, Package, Receipt, Calendar, BarChart2, Settings, LogOut, PanelLeftClose } from 'lucide-react';
import { toast } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NAV_ITEMS = [
  { id: 'pos', icon: LayoutGrid, label: 'Menu & Cashier', short: 'Menu' },
  { id: 'inventory', icon: Package, label: 'Stock & Inventory', short: 'Stock' },
  { id: 'orders', icon: Receipt, label: 'Order History', short: 'Orders' },
  { id: 'calendar', icon: Calendar, label: 'Shift Schedule', short: 'Shifts' },
  { id: 'analytics', icon: BarChart2, label: 'Sales Reports', short: 'Reports' },
  { id: 'settings', icon: Settings, label: 'Store & POS Settings', short: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const logout = useAuthStore((s) => s.logout);
  if (isCollapsed) return null;
  const navItems = NAV_ITEMS;

  return (
    <aside className="hidden md:flex w-20 lg:w-[84px] min-w-20 lg:min-w-[84px] bg-white border-r border-slate-200 flex-col items-center py-4 lg:py-6 shrink-0 justify-between select-none z-20 animate-in slide-in-from-left duration-150">
      {/* Brand Logo (POS Terminal & Fast Cart) */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition active:scale-95"
            title="Collapse sidebar to maximize product screen"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}

        <div className="relative group flex items-center justify-center">
          <div
            onClick={() => setActiveTab('pos')}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0 transition-all hover:border-blue-400 hover:shadow-blue-500/20 active:scale-95 cursor-pointer overflow-hidden"
          >
            <img
              src="/logo.png"
              alt="Universal POS Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Logo Tooltip */}
          <div className="absolute left-[calc(100%+14px)] px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out transform -translate-x-1 group-hover:translate-x-0 z-50 flex items-center">
            Universal POS
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </div>

        {/* Navigation Icon List with Smooth Tooltips */}
        <nav className="flex flex-col items-center gap-2.5 sm:gap-3 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative flex items-center justify-center group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2]" />
                </button>

                {/* Smooth Custom Hover Tooltip */}
                <div className="absolute left-[calc(100%+14px)] px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out transform -translate-x-1.5 group-hover:translate-x-0 z-50 flex items-center">
                  {item.label}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Icons with Smooth Tooltips */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Exit / Logout */}
        <div className="relative flex items-center justify-center group">
          <button
            onClick={() => {
              logout();
              toast.info('Terminal Locked', 'Logged out safely. Enter PIN to resume.');
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition shrink-0 active:scale-95 cursor-pointer"
            title="Lock terminal / Logout"
          >
            <LogOut className="w-5 h-5 stroke-[2]" />
          </button>
          <div className="absolute left-[calc(100%+14px)] px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out transform -translate-x-1.5 group-hover:translate-x-0 z-50 flex items-center">
            Lock / Logout
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-600 rotate-45" />
          </div>
        </div>
      </div>
    </aside>
  );
};
