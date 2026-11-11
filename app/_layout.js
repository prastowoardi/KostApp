import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';
import {
  requestNotificationPermissionsAsync,
  setupNotificationChannelAsync,
  syncPushTokenWithBackend,
} from '../helpers/notificationHelper';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function Layout() {
  const router = useRouter();

  // Set system status bar & navigation bar to dark navy with light icons (Android)
  useEffect(() => {
    const setupSystemBars = async () => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#0f172a');
        try {
          await NavigationBar.setVisibilityAsync('visible');
          await NavigationBar.setBackgroundColorAsync('#0f172a');
          await NavigationBar.setButtonStyleAsync('light');
        } catch {
          // Graceful fallback for non-supported device/emulators
        }
      }
    };

    setupSystemBars();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setupSystemBars();
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    setupNotificationChannelAsync();
    requestNotificationPermissionsAsync();
    syncPushTokenWithBackend();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncPushTokenWithBackend();
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (!data) return;

      if (data.type === 'payment_verified' || data.type === 'payment_rejected') {
        router.push({
          pathname: '/tenant/payment/detail',
          params: { id: data.id || data.uuid },
        });
      }

      if (data.type === 'complaint_update') {
        router.push('/tenant/complaint-history');
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(() => {
      // Notification received in foreground
    });

    return () => {
      appStateSub.remove();
      subscription?.remove?.();
      notificationListener?.remove?.();
    };
  }, [router]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          autoHideHomeIndicator: false,
        }}
      >
        <Stack.Screen name="index" options={{ autoHideHomeIndicator: false }} />
        <Stack.Screen name="admin" options={{ gestureEnabled: false, autoHideHomeIndicator: false }} />
        <Stack.Screen name="tenant/dashboard" options={{ gestureEnabled: false, autoHideHomeIndicator: false }} />
      </Stack>
    </>
  );
}
