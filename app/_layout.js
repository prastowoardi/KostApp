import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function Layout() {
  const router = useRouter();

  // Hide system navigation bar (Android) & keep hidden on resume
  useEffect(() => {
    const hideSystemNavBar = async () => {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setPositionAsync('absolute');
          await NavigationBar.setBackgroundColorAsync('#ffffff00');
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('inset-swipe');
        } catch {
          // Graceful fallback for non-supported device/emulators
        }
      }
    };

    hideSystemNavBar();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        hideSystemNavBar();
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
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
      subscription.remove();
      notificationListener.remove();
    };
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        autoHideHomeIndicator: true,
      }}
    >
      <Stack.Screen name="index" options={{ autoHideHomeIndicator: true }} />
      <Stack.Screen name="admin" options={{ gestureEnabled: false, autoHideHomeIndicator: true }} />
      <Stack.Screen name="tenant/dashboard" options={{ gestureEnabled: false, autoHideHomeIndicator: true }} />
    </Stack>
  );
}
