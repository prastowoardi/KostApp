import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="admin" options={{ gestureEnabled: false }} />
      <Stack.Screen name="tenant/dashboard" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
