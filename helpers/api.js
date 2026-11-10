import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const rawUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000').trim();

// Strip trailing /api or trailing slashes to obtain the clean base origin
export const BASE_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_URL = `${BASE_URL}/api`;

// Cloudflare R2 / S3 custom files domain in production
export const FILES_URL = (process.env.EXPO_PUBLIC_FILES_URL || 'https://files.serrata.xyz').replace(/\/+$/, '');

// If BASE_URL is production serrata.xyz, default files storage is FILES_URL
export const IS_PROD = BASE_URL.includes('serrata.xyz');
export const STORAGE_URL = IS_PROD ? FILES_URL : `${BASE_URL}/storage`;

export const getCleanToken = async () => {
    try {
        const token = await AsyncStorage.getItem("userToken");
        return token ? token.replace(/"/g, "").trim() : "";
    } catch {
        return "";
    }
};

export const clearAuthSession = async () => {
    try {
        await AsyncStorage.multiRemove([
            "userToken",
            "userData",
            "cached_admin_stats",
            "cached_tenant_data",
            "last_synced_push_token",
        ]);
    } catch {
        // Ignore cleanup errors
    }
};

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    try {
        const cleanToken = await getCleanToken();
        if (cleanToken && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${cleanToken}`;
        }
    } catch {
        // Fallback if AsyncStorage fails
    }
    
    config.headers.Accept = 'application/json';
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    config.headers['ngrok-skip-browser-warning'] = '69420';
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        if (!config || config.__isRetryExhausted) {
            return Promise.reject(error);
        }

        // Only retry safe, idempotent methods
        const method = (config.method || 'get').toLowerCase();
        const isIdempotent = ['get', 'head', 'options'].includes(method);

        // Transient failures: network offline/waking, timeout, 502/503/504 gateway errors
        const isNetworkError = !error.response;
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
        const isServerError = error.response && [502, 503, 504].includes(error.response.status);

        const shouldRetry = isIdempotent && (isNetworkError || isTimeout || isServerError);

        config.__retryCount = config.__retryCount || 0;

        if (shouldRetry && config.__retryCount < 2) {
            config.__retryCount += 1;
            const delay = config.__retryCount * 800; // 800ms, then 1600ms
            await new Promise((resolve) => setTimeout(resolve, delay));
            return api(config);
        }

        config.__isRetryExhausted = true;
        return Promise.reject(error);
    }
);

export default api;
