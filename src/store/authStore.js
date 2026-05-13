import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/driver';
import { registerForPushNotifications, setupNotificationListeners } from '../services/notifications';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('driver_auth_token');
      const userStr = await AsyncStorage.getItem('driver_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true, isLoading: false });
        try {
          const res = await authAPI.me();
          set({ user: res.data.user });
          await AsyncStorage.setItem('driver_user', JSON.stringify(res.data.user));
        } catch (e) {
          if (e.response?.status === 401) await get().logout();
        }
        // Register push notifications
        registerForPushNotifications().catch(() => {});
        setupNotificationListeners();
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },

  setAuth: async (token, user) => {
    await AsyncStorage.setItem('driver_auth_token', token);
    await AsyncStorage.setItem('driver_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
    // Register push after login
    registerForPushNotifications().catch(() => {});
    setupNotificationListeners();
  },

  logout: async () => {
    try { await authAPI.logout(); } catch (e) {}
    await AsyncStorage.removeItem('driver_auth_token');
    await AsyncStorage.removeItem('driver_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
