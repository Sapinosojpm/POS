import React, { useState } from 'react';
import { Bell, X, Package, AlertTriangle, CheckCircle, Wifi, ArrowRight, ArrowLeft } from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'order' | 'stock' | 'system' | 'sync';
  title: string;
  message: string;
  time: string;
}

interface NotificationStackProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationStack: React.FC<NotificationStackProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'stock',
      title: 'Low Stock Alert',
      message: 'Grilled Steak has only 8 servings remaining in stock.',
      time: '2m ago',
    },
    {
      id: 'notif-2',
      type: 'order',
      title: 'Order Completed',
      message: 'Invoice #ORD-1002 for ₱136.40 was successfully paid.',
      time: '5m ago',
    },
    {
      id: 'notif-3',
      type: 'sync',
      title: 'Offline Sync Ready',
      message: 'Local database is ready to push 3 pending sync events.',
      time: '18m ago',
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notifications.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
  };

  const currentNotif = notifications[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'order':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'sync':
        return <Wifi className="w-4 h-4 text-blue-600" />;
      default:
        return <Package className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'stock':
        return 'bg-amber-50';
      case 'order':
        return 'bg-emerald-50';
      case 'sync':
        return 'bg-blue-50';
      default:
        return 'bg-indigo-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-start justify-end p-6 pt-20 select-none">
      {/* Premium Notification Stack Container */}
      <div className="w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 flex flex-col relative animate-in fade-in slide-in-from-top-4 duration-200">
        
        {/* Header with Title and Purple Pill Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-700" />
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Premium Notification Stack
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 1 && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black text-xs shadow-md shadow-indigo-500/30">
                +{notifications.length - 1}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs font-semibold">No active notifications</p>
          </div>
        ) : (
          <>
            {/* The 3D Stacked Cards Deck */}
            <div className="relative h-28 flex items-center justify-center">
              
              {/* Layer 3 (Deepest card) */}
              {notifications.length > 2 && (
                <div className="absolute top-0 w-[84%] h-20 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs -translate-y-2.5 opacity-40 pointer-events-none" />
              )}

              {/* Layer 2 (Middle stacked card) */}
              {notifications.length > 1 && (
                <div className="absolute top-1 w-[92%] h-22 bg-slate-100/80 border border-slate-200 rounded-2xl shadow-sm -translate-y-1.5 opacity-70 pointer-events-none" />
              )}

              {/* Layer 1: Front Active Card */}
              {currentNotif && (
                <div className="relative z-10 w-full bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 p-4 flex items-start gap-3 transition-all">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(
                      currentNotif.type
                    )}`}
                  >
                    {getIcon(currentNotif.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                      {currentNotif.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                      {currentNotif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                      {currentNotif.time}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDismiss(currentNotif.id, e)}
                    className="text-slate-300 hover:text-slate-600 p-0.5 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Pagination Dots at Bottom matching Screenshot */}
            <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50">
              <button
                disabled={notifications.length <= 1}
                onClick={handlePrev}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 rounded transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                {notifications.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`transition-all ${
                      idx === currentIndex
                        ? 'w-4 h-1.5 bg-indigo-600 rounded-full'
                        : 'w-1.5 h-1.5 bg-indigo-200 rounded-full hover:bg-indigo-300'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={notifications.length <= 1}
                onClick={handleNext}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1 rounded transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
