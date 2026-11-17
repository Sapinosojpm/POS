import { create } from 'zustand';
import type { StaffUser } from '../types';
import { useSettingsStore } from './useSettingsStore';

const STORAGE_USERS_KEY = 'universal_pos_staff_users_v1';
const STORAGE_CURRENT_KEY = 'universal_pos_current_user_v1';
const STORAGE_AUTH_SESSION_KEY = 'universal_pos_auth_session_v1';

export const DEFAULT_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-courtney',
    name: 'Courtney Henry',
    role: 'CASHIER',
    pin: '1111',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    color: 'bg-emerald-500',
  },
  {
    id: 'staff-alexander',
    name: 'Alexander Wright',
    role: 'CASHIER',
    pin: '2222',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    color: 'bg-blue-500',
  },
  {
    id: 'staff-manager',
    name: 'Store Manager',
    role: 'MANAGER',
    pin: '1234',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    color: 'bg-purple-600',
  },
];

const loadUsers = (): StaffUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse staff users from storage:', err);
  }
  return DEFAULT_STAFF_USERS;
};

const loadCurrentUser = (): StaffUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const loadSessionState = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
};

interface AuthState {
  users: StaffUser[];
  currentUser: StaffUser | null;
  isAuthenticated: boolean;
  selectedStaffId: string | null;

  setSelectedStaffId: (id: string | null) => void;
  loginWithPin: (pin: string) => { success: boolean; user?: StaffUser; error?: string };
  loginAsUser: (userId: string, pin: string) => { success: boolean; user?: StaffUser; error?: string };
  logout: () => void;
  addUser: (userData: Omit<StaffUser, 'id'>) => StaffUser;
  updateUser: (id: string, updates: Partial<Omit<StaffUser, 'id'>>) => void;
  deleteUser: (id: string) => void;
  resetUsersToDefault: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  users: loadUsers(),
  currentUser: loadCurrentUser(),
  isAuthenticated: loadSessionState(),
  selectedStaffId: null,

  setSelectedStaffId: (id) => set({ selectedStaffId: id }),

  loginWithPin: (pin: string) => {
    const { users } = get();
    const cleanPin = pin.trim();

    // 1. Check matching staff user PIN
    let matched = users.find((u) => u.pin === cleanPin);

    // 2. Fallback check: settings.managerPin
    if (!matched) {
      const settings = useSettingsStore.getState().settings;
      if (settings?.managerPin && cleanPin === settings.managerPin) {
        matched = users.find((u) => u.role === 'MANAGER') || {
          id: 'staff-manager-fallback',
          name: 'Store Manager',
          role: 'MANAGER',
          pin: settings.managerPin,
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
          color: 'bg-purple-600',
        };
      }
    }

    if (matched) {
      try {
        localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(matched));
        localStorage.setItem(STORAGE_AUTH_SESSION_KEY, 'true');
      } catch {}

      set({
        currentUser: matched,
        isAuthenticated: true,
        selectedStaffId: null,
      });
      return { success: true, user: matched };
    }

    return { success: false, error: 'Incorrect 4-digit PIN. Please try again.' };
  },

  loginAsUser: (userId: string, pin: string) => {
    const { users } = get();
    const cleanPin = pin.trim();
    const targetUser = users.find((u) => u.id === userId);

    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    const settings = useSettingsStore.getState().settings;
    const isManagerPinOverride = targetUser.role === 'MANAGER' && settings?.managerPin === cleanPin;

    if (targetUser.pin === cleanPin || isManagerPinOverride) {
      try {
        localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(targetUser));
        localStorage.setItem(STORAGE_AUTH_SESSION_KEY, 'true');
      } catch {}

      set({
        currentUser: targetUser,
        isAuthenticated: true,
        selectedStaffId: null,
      });
      return { success: true, user: targetUser };
    }

    return { success: false, error: 'Invalid PIN for selected staff.' };
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_AUTH_SESSION_KEY);
    } catch {}

    set({
      isAuthenticated: false,
      selectedStaffId: null,
    });
  },

  addUser: (userData) => {
    const newUser: StaffUser = {
      ...userData,
      id: `staff-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    set((state) => {
      const updated = [...state.users, newUser];
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
      } catch {}
      return { users: updated };
    });

    return newUser;
  },

  updateUser: (id, updates) => {
    set((state) => {
      const updated = state.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
      } catch {}

      const current = state.currentUser;
      const updatedCurrent = current && current.id === id ? { ...current, ...updates } : current;
      if (updatedCurrent) {
        try {
          localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(updatedCurrent));
        } catch {}
      }

      return { users: updated, currentUser: updatedCurrent };
    });
  },

  deleteUser: (id) => {
    set((state) => {
      if (state.users.length <= 1) return state; // Prevent deleting the last user
      const updated = state.users.filter((u) => u.id !== id);
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
      } catch {}

      return {
        users: updated,
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
        isAuthenticated: state.currentUser?.id === id ? false : state.isAuthenticated,
      };
    });
  },

  resetUsersToDefault: () => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_STAFF_USERS));
    } catch {}
    set({ users: DEFAULT_STAFF_USERS });
  },
}));
