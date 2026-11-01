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

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem("userToken");
        const cleanToken = token ? token.replace(/"/g, "").trim() : "";
        if (cleanToken) {
            config.headers.Authorization = `Bearer ${cleanToken}`;
        }
    } catch {
        // Fallback if AsyncStorage fails
    }
    
    config.headers.Accept = 'application/json';
    config.headers['ngrok-skip-browser-warning'] = '69420';
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                await AsyncStorage.multiRemove(['userToken', 'userData']);
            } catch {
                // Ignore cleanup errors
            }
        }
        return Promise.reject(error);
    }
);

export default api;
