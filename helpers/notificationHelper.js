import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
    let token;

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
    }

    if (Constants.appOwnership === 'expo') {
        console.warn('Push Notifications (Remote) tidak didukung di Expo Go SDK 53. Gunakan Development Build.');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        return null;
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
        console.log('Error ambil token:', e);
    }

    return token;
}