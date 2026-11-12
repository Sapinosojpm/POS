import { create } from 'zustand';
import { useCartStore } from './useCartStore';

export interface EnabledPaymentMethods {
  cash: boolean;
  card: boolean;
  gcash: boolean;
  maya: boolean;
  paylater: boolean;
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  storeAddress: string;
  storePhone: string;
  tin: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
  currencyCode: string;
  enableTax: boolean;
  taxRate: number;
  isTaxInclusive: boolean;
  enabledPaymentMethods: EnabledPaymentMethods;
  paperWidth: '58mm' | '80mm';
  autoPrintReceipt: boolean;
  autoKickDrawer: boolean;
  managerPin: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'RESTOE CAFE & BISTRO',
  branchName: 'Main Branch - BGC',
  storeAddress: '123 Bonifacio St, Bonifacio Global City, Taguig',
  storePhone: '+63 917 123 4567',
  tin: '123-456-789-000 VAT',
  receiptHeader: 'OFFICIAL RECEIPT',
  receiptFooter: 'THANK YOU FOR DINING WITH US!\nPLEASE COME AGAIN.',
  currency: '₱',
  currencyCode: 'PHP',
  enableTax: true,
  taxRate: 12,
  isTaxInclusive: true,
  enabledPaymentMethods: {
    cash: true,
    gcash: true,
    maya: true,
    card: false,
    paylater: false,
  },
  paperWidth: '58mm',
  autoPrintReceipt: true,
  autoKickDrawer: true,
  managerPin: '1234',
};

const STORAGE_KEY = 'restoe_pos_settings_v1';

const loadSavedSettings = (): StoreSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        enableTax: parsed.enableTax !== undefined ? parsed.enableTax : true,
        enabledPaymentMethods: {
          ...DEFAULT_SETTINGS.enabledPaymentMethods,
          ...(parsed.enabledPaymentMethods || {}),
        },
      };
    }
  } catch (err) {
    console.warn('Failed to parse saved settings, using defaults:', err);
  }
  return DEFAULT_SETTINGS;
};

interface SettingsStoreState {
  settings: StoreSettings;
  updateSettings: (partial: Partial<StoreSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: loadSavedSettings(),

  updateSettings: (partial) => {
    set((state) => {
      const updated = { ...state.settings, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
      }

      // Sync currency to Cart Store if changed
      if (partial.currency) {
        useCartStore.getState().setCurrency(partial.currency);
      }

      return { settings: updated };
    });
  },

  resetSettings: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ settings: DEFAULT_SETTINGS });
    useCartStore.getState().setCurrency(DEFAULT_SETTINGS.currency);
  },
}));
