import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    const cleanToken = token ? token.replace(/"/g, "").trim() : "";
    config.headers.Authorization = `Bearer ${cleanToken}`;
    config.headers.Accept = 'application/json';
    return config;
});

export default api;