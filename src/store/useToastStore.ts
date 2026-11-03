import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, title, message, duration = 2500) => {
    const id = `toast-${Date.now()}`;
    // Replace with single toast only to prevent screen-blocking avalanche
    set({
      toasts: [{ id, type, title, message, duration }],
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
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast('error', title, message),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast('info', title, message),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast('warning', title, message),
};
