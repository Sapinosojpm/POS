import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, title, message, duration = 2500, action) => {
    const id = `toast-${Date.now()}`;
    // Replace with single toast only to prevent screen-blocking avalanche
    set({
      toasts: [{ id, type, title, message, duration, action }],
    });

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Convenience helper object
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast('success', title, message),
  error: (
    title: string,
    message?: string,
    action?: { label: string; onClick: () => void },
    duration = 4000
  ) => useToastStore.getState().addToast('error', title, message, duration, action),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast('info', title, message),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast('warning', title, message),
};
