import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const API_URL = BASE_URL + '/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    const cleanToken = token ? token.replace(/"/g, "").trim() : "";
    config.headers.Authorization = `Bearer ${cleanToken}`;
    config.headers.Accept = 'application/json';
    return config;
});

export default api;