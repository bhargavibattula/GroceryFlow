import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Configured in app.json extra.apiUrl
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl) return configUrl;

  if (Platform.OS === 'android') {
    // Android emulator standard loopback to host
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Bearer token
apiClient.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    if (Platform.OS !== 'web') {
      token = await SecureStore.getItemAsync('freshstock_auth_token');
    } else {
      token = typeof window !== 'undefined' ? localStorage.getItem('freshstock_auth_token') : null;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('[ApiClient] Failed to retrieve auth token:', err);
  }
  return config;
});

// Interceptor for error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.message === 'Network Error'
        ? 'Cannot connect to FreshStock server. Check connection.'
        : error.message);
    return Promise.reject(new Error(message));
  }
);
