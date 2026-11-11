import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getCleanToken } from './api';

const DEFAULT_PROJECT_ID = 'e25e49f6-e121-4ac7-8188-3cefe73b3edb';

/**
 * Configure default notification channel for Android (required for Android 8.0+ / API 26+)
 */
export async function setupNotificationChannelAsync() {
    if (Platform.OS !== 'android') return;

    try {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Notifikasi Serrata Kost',
            description: 'Pemberitahuan tagihan, kwitansi pembayaran, dan update laporan kos.',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#2563eb',
            sound: 'default',
            showBadge: true,
            enableLights: true,
            enableVibrate: true,
        });
    } catch (e) {
        console.log('Error setup notification channel:', e?.message || e);
    }
}

/**
 * Request notification permissions from user on OS level.
 * Prompts the system dialog (iOS / Android 13+) if not yet determined.
 * Can be called anytime, including during first app launch before login.
 */
export async function requestNotificationPermissionsAsync() {
    if (Platform.OS === 'web') return false;

    if (Platform.OS === 'android') {
        await setupNotificationChannelAsync();
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        const isGranted = finalStatus === 'granted';
        if (!isGranted) {
            console.log('Push notification permission denied/not granted:', finalStatus);
        }
        return isGranted;
    } catch (e) {
        console.log('Push notification permission request error:', e?.message || e);
        return false;
    }
}

/**
 * Request notification permissions and fetch the Expo Push Token.
 */
export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') return null;

    const hasPermission = await requestNotificationPermissionsAsync();
    if (!hasPermission) {
        return null;
    }

    if (!Device.isDevice) {
        console.log('Info Push: Memerlukan perangkat fisik untuk menerima push notifications.');
        return null;
    }

    if (Constants.appOwnership === 'expo') {
        console.log('Info Push: Remote push notifications memerlukan build APK / Standalone (tidak didukung di Expo Go).');
        return null;
    }

    try {
        const projectId =
            Constants?.easConfig?.projectId ??
            Constants?.expoConfig?.extra?.eas?.projectId ??
            DEFAULT_PROJECT_ID;

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        return tokenData?.data || null;
    } catch (e) {
        console.log('Push token retrieval error:', e?.message || e);
        return null;
    }
}

/**
 * Synchronize the current device push token to backend users table.
 * Safe to call repeatedly: will skip network request if token hasn't changed.
 */
export async function syncPushTokenWithBackend(force = false) {
    if (Platform.OS === 'web') return null;

    try {
        const cleanToken = await getCleanToken();
        if (!cleanToken) {
            // User not authenticated yet, skip
            return null;
        }

        const pushToken = await registerForPushNotificationsAsync();
        if (!pushToken) return null;

        const lastSynced = await AsyncStorage.getItem('last_synced_push_token');
        if (!force && lastSynced === pushToken) {
            return pushToken;
        }

        await api.post('/update-push-token', { token: pushToken });
        await AsyncStorage.setItem('last_synced_push_token', pushToken);
        console.log('Push token successfully synced to backend:', pushToken);
        return pushToken;
    } catch (e) {
        console.log('Push token backend sync skipped/failed:', e?.response?.data || e?.message);
        return null;
    }
}
