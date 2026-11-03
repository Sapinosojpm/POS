import React from 'react';
import { LayoutGrid, Package, Receipt, Calendar, BarChart2, Settings, LogOut } from 'lucide-react';
import { toast } from '../store/useToastStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'pos', icon: LayoutGrid, label: 'Menu & Cashier' },
    { id: 'inventory', icon: Package, label: 'Stock & Inventory' },
    { id: 'orders', icon: Receipt, label: 'Order History' },
    { id: 'calendar', icon: Calendar, label: 'Shift Schedule' },
    { id: 'analytics', icon: BarChart2, label: 'Sales Reports' },
    { id: 'settings', icon: Settings, label: 'Store & POS Settings' },
  ];

  return (
    <aside className="w-[84px] min-w-[84px] bg-white border-r border-slate-200 flex flex-col items-center py-6 shrink-0 justify-between select-none z-20">
      {/* Brand Logo (Restoe Geometric Rosette Blossom) */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="relative group flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 transition-transform active:scale-95 cursor-pointer">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Restoe 4-Petal Geometric Flower Logo */}
              <circle cx="12" cy="7" r="3" />
              <circle cx="12" cy="17" r="3" />
              <circle cx="7" cy="12" r="3" />
              <circle cx="17" cy="12" r="3" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>

          {/* Logo Tooltip */}
          <div className="absolute left-[calc(100%+14px)] px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out transform -translate-x-1 group-hover:translate-x-0 z-50 flex items-center">
            Restoe POS
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </div>

        {/* Navigation Icon List with Smooth Tooltips */}
        <nav className="flex flex-col items-center gap-3 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative flex items-center justify-center group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 active:scale-95 ${
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
            onClick={() =>
              toast.info('Cashier Logged Out', 'Current shift session saved safely. Re-enter PIN to resume.')
            }
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition shrink-0 active:scale-95"
          >
            <LogOut className="w-5 h-5 stroke-[2]" />
          </button>
          <div className="absolute left-[calc(100%+14px)] px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out transform -translate-x-1.5 group-hover:translate-x-0 z-50 flex items-center">
            Logout Cashier
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-600 rotate-45" />
          </div>
        </div>
      </div>
    </aside>
  );
};
