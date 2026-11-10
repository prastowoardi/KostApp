import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';

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

  // Set system navigation bar to always visible & dark navy with light icons (Android)
  useEffect(() => {
    const setupSystemNavBar = async () => {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('visible');
          await NavigationBar.setBackgroundColorAsync('#0f172a');
          await NavigationBar.setButtonStyleAsync('light');
        } catch {
          // Graceful fallback for non-supported device/emulators
        }
      }
    };

    setupSystemNavBar();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setupSystemNavBar();
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

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
      subscription?.remove?.();
      notificationListener?.remove?.();
    };
  }, [router]);

  return (
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
  );
}
