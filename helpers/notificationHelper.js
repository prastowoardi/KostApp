import Constants from 'expo-constants';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) return null;
    if (Constants.appOwnership === 'expo') return null;

    try {
        const Notifications = await import('expo-notifications');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return null;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
        console.log('Push token error:', e);
        return null;
    }
}