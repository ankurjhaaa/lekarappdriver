import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('driver_auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(`[DRIVER API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
  } catch (e) {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('driver_auth_token');
      await AsyncStorage.removeItem('driver_user');
    }
    return Promise.reject(error);
  }
);

export default api;
