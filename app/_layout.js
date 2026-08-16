import '../global.css';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { PortalHost } from '@rn-primitives/portal';
import 'react-native-reanimated';

const isExpoGo = Constants.appOwnership === 'expo';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function Layout() {
  const router = useRouter();

  useEffect(() => {
    if (isExpoGo) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const Notifications = await import('expo-notifications');
      if (cancelled) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log("Notifikasi diklik dengan data:", data);
        if (data.type === 'payment_verified' || data.type === "payment_rejected") {
          router.push({
            pathname: '/tenant/payment/detail',
            params: { id: data.id },
          });
        }

        if (data && data.type === 'complaint_update') {
          router.push('/tenant/complaint-history');
        }
      });

      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notifikasi diterima:", notification);
      });

      cleanup = () => {
        subscription.remove();
        notificationListener.remove();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="admin" options={{ gestureEnabled: false }} />
        <Stack.Screen name="tenant/dashboard" options={{ gestureEnabled: false }} />
      </Stack>
      <PortalHost />
    </>
  );
}