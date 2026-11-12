import { create } from 'zustand';
import type { Product, CartItem, PaymentMethod, CartDiscount } from '../types';
import { useSettingsStore } from './useSettingsStore';

export interface DiscountBreakdown {
  grossSubtotal: number;
  vatExemptAmount: number;
  discountAmount: number;
  netOfVat: number;
  tax: number;
  finalTotal: number;
  discountLabel: string;
}

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  amountTendered: number;
  cashierName: string;
  isOnline: boolean;
  currency: string;
  discount: CartDiscount | null;

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
  setDiscount: (discount: CartDiscount | null) => void;
  clearDiscount: () => void;
  restoreCart: (items: CartItem[], discount: CartDiscount | null) => void;

  // Computed totals
  getSubtotal: () => number;
  getDiscountBreakdown: () => DiscountBreakdown;
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
  discount: null,

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
    set({ items: [], amountTendered: 0, paymentMethod: 'CASH', discount: null });
  },

  setPaymentMethod: (paymentMethod: PaymentMethod) => set({ paymentMethod }),
  setAmountTendered: (amountTendered: number) => set({ amountTendered }),
  setCashierName: (cashierName: string) => set({ cashierName }),
  setIsOnline: (isOnline: boolean) => set({ isOnline }),
  setCurrency: (currency: string) => set({ currency }),
  setDiscount: (discount: CartDiscount | null) => set({ discount }),
  clearDiscount: () => set({ discount: null }),
  restoreCart: (items: CartItem[], discount: CartDiscount | null) =>
    set({ items, discount, amountTendered: 0, paymentMethod: 'CASH' }),

  getSubtotal: () => {
    return Math.round(
      get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100
    ) / 100;
  },

  getDiscountBreakdown: (): DiscountBreakdown => {
    const grossSubtotal = get().getSubtotal();
    const discount = get().discount;
    const settings = useSettingsStore.getState()?.settings;
    const isTaxEnabled = settings?.enableTax ?? true;
    const taxRate = (settings?.taxRate ?? 12) / 100;
    const vatDivisor = 1 + taxRate;

    if (!discount || discount.type === 'NONE' || grossSubtotal <= 0) {
      const netOfVat = isTaxEnabled
        ? Math.round((grossSubtotal / vatDivisor) * 100) / 100
        : grossSubtotal;
      const tax = isTaxEnabled
        ? Math.round((grossSubtotal - netOfVat) * 100) / 100
        : 0;
      return {
        grossSubtotal,
        vatExemptAmount: 0,
        discountAmount: 0,
        netOfVat,
        tax,
        finalTotal: grossSubtotal,
        discountLabel: '',
      };
    }

    if (discount.type === 'SENIOR' || discount.type === 'PWD') {
      const totalGuests = Math.max(1, discount.totalGuests || 1);
      const seniorCount = Math.max(1, Math.min(discount.seniorCount || 1, totalGuests));
      const ratio = seniorCount / totalGuests;

      const seniorGross = grossSubtotal * ratio;
      const regularGross = grossSubtotal - seniorGross;

      if (!isTaxEnabled) {
        // Non-VAT calculation: Direct 20% discount on senior portion, 0 VAT
        const seniorDiscountVal = Math.round(seniorGross * 0.2 * 100) / 100;
        const finalTotal = Math.max(0, Math.round((grossSubtotal - seniorDiscountVal) * 100) / 100);

        const typeLabel = discount.type === 'SENIOR' ? 'Senior Citizen (20%)' : 'PWD (20%)';
        const label = totalGuests > 1 ? `${typeLabel} [${seniorCount}/${totalGuests} Pax]` : typeLabel;

        return {
          grossSubtotal,
          vatExemptAmount: 0,
          discountAmount: seniorDiscountVal,
          netOfVat: grossSubtotal,
          tax: 0,
          finalTotal,
          discountLabel: label,
        };
      }

      // Senior portion: strip VAT, then take 20% discount
      const seniorNetOfVat = Math.round((seniorGross / vatDivisor) * 100) / 100;
      const vatExempt = Math.round((seniorGross - seniorNetOfVat) * 100) / 100;
      const seniorDiscountVal = Math.round(seniorNetOfVat * 0.2 * 100) / 100;
      const seniorDue = Math.round((seniorNetOfVat - seniorDiscountVal) * 100) / 100;

      // Regular portion (if mixed guests in group)
      const regularNetOfVat = Math.round((regularGross / vatDivisor) * 100) / 100;
      const regularTax = Math.round((regularGross - regularNetOfVat) * 100) / 100;
      const regularDue = regularGross;

      const finalTotal = Math.max(0, Math.round((seniorDue + regularDue) * 100) / 100);

      const typeLabel = discount.type === 'SENIOR' ? 'Senior Citizen (20%)' : 'PWD (20%)';
      const label = totalGuests > 1 ? `${typeLabel} [${seniorCount}/${totalGuests} Pax]` : typeLabel;

      return {
        grossSubtotal,
        vatExemptAmount: vatExempt,
        discountAmount: seniorDiscountVal,
        netOfVat: Math.round((seniorNetOfVat + regularNetOfVat) * 100) / 100,
        tax: regularTax,
        finalTotal,
        discountLabel: label,
      };
    }

    if (discount.type === 'PERCENT') {
      const pct = Math.min(100, Math.max(0, discount.value));
      const discountVal = Math.round(((grossSubtotal * pct) / 100) * 100) / 100;
      const finalTotal = Math.max(0, Math.round((grossSubtotal - discountVal) * 100) / 100);
      const netOfVat = isTaxEnabled ? Math.round((finalTotal / vatDivisor) * 100) / 100 : finalTotal;
      const tax = isTaxEnabled ? Math.round((finalTotal - netOfVat) * 100) / 100 : 0;

      return {
        grossSubtotal,
        vatExemptAmount: 0,
        discountAmount: discountVal,
        netOfVat,
        tax,
        finalTotal,
        discountLabel: `${discount.label || 'Discount'} (${pct}%)`,
      };
    }

    if (discount.type === 'FIXED') {
      const discountVal = Math.min(discount.value, grossSubtotal);
      const finalTotal = Math.max(0, Math.round((grossSubtotal - discountVal) * 100) / 100);
      const netOfVat = isTaxEnabled ? Math.round((finalTotal / vatDivisor) * 100) / 100 : finalTotal;
      const tax = isTaxEnabled ? Math.round((finalTotal - netOfVat) * 100) / 100 : 0;

      return {
        grossSubtotal,
        vatExemptAmount: 0,
        discountAmount: discountVal,
        netOfVat,
        tax,
        finalTotal,
        discountLabel: `${discount.label || 'Voucher'} (₱${discount.value})`,
      };
    }

    return {
      grossSubtotal,
      vatExemptAmount: 0,
      discountAmount: 0,
      netOfVat: grossSubtotal,
      tax: 0,
      finalTotal: grossSubtotal,
      discountLabel: '',
    };
  },

  getTax: () => {
    return get().getDiscountBreakdown().tax;
  },

  getTotal: () => {
    return get().getDiscountBreakdown().finalTotal;
  },

  getChangeDue: () => {
    const total = get().getTotal();
    const tendered = get().amountTendered;
    return tendered > total ? Math.round((tendered - total) * 100) / 100 : 0;
  },
}));
