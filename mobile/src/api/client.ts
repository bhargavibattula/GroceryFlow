import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // 1. Web browser running locally
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // 2. Automatically derive the host machine's IP from Expo's Metro host URI
  // (e.g. "192.168.0.130:8081" -> "192.168.0.130")
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // 3. Configured explicit URL in app.json if provided
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl && !configUrl.includes('10.0.2.2')) {
    return configUrl;
  }

  // 4. Default to current computer's LAN IP for physical device / Expo Go
  return 'http://192.168.0.130:5000/api';
};

export const API_URL = getBaseUrl();
console.log('[FreshStock API] Connecting to:', API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
      (error.message === 'Network Error' || error.code === 'ECONNABORTED'
        ? `Cannot connect to FreshStock server at ${API_URL}. Ensure backend is running and phone is on the same Wi-Fi.`
        : error.message);
    return Promise.reject(new Error(message));
  }
);
