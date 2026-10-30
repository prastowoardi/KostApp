import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const rawUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000').trim();

// Strip trailing /api or trailing slashes to obtain the clean base origin
export const BASE_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_URL = `${BASE_URL}/api`;
export const STORAGE_URL = `${BASE_URL}/storage`;

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

export default api;
