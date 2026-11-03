import { create } from 'zustand';
import type { Product, CartItem, PaymentMethod } from '../types';

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  amountTendered: number;
  cashierName: string;
  isOnline: boolean;
  currency: string;
  
  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountTendered: (amount: number) => void;
  setCashierName: (name: string) => void;
  setIsOnline: (status: boolean) => void;
  setCurrency: (currency: string) => void;

  // Computed totals
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getChangeDue: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: 'CASH',
  amountTendered: 0,
  cashierName: 'Juan Dela Cruz (Cashier 1)',
  isOnline: navigator.onLine,
  currency: '₱',

  addItem: (product: Product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += 1;
        return { items: newItems };
      }
      return { items: [...state.items, { product, quantity: 1, discount: 0 }] };
    });
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [], amountTendered: 0, paymentMethod: 'CASH' });
  },

  setPaymentMethod: (paymentMethod: PaymentMethod) => set({ paymentMethod }),
  setAmountTendered: (amountTendered: number) => set({ amountTendered }),
  setCashierName: (cashierName: string) => set({ cashierName }),
  setIsOnline: (isOnline: boolean) => set({ isOnline }),
  setCurrency: (currency: string) => set({ currency }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  },

  getTax: () => {
    // 12% VAT inclusive calculation or standard zero tax for simplified mode
    return Math.round(get().getSubtotal() * 0.12 * 100) / 100;
  },

  getTotal: () => {
    return get().getSubtotal();
  },

  getChangeDue: () => {
    const total = get().getTotal();
    const tendered = get().amountTendered;
    return tendered > total ? Math.round((tendered - total) * 100) / 100 : 0;
  },
}));
