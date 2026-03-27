import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-reanimated';

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
      console.log("Notifikasi diklik dengan data:", data);
      if (data.type === 'payment_verified') {
        router.push({
              pathname: '/tenant/payment/payment-detail', 
              params: { id: data.id } 
          });
      }

      if (data && data.type === 'complaint_update') {
        router.push('/tenant/complaint-history'); 
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notifikasi diterima:", notification);
    });

    return () => {
      subscription.remove();
      notificationListener.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="admin" options={{ gestureEnabled: false }} />
      <Stack.Screen name="tenant/dashboard" options={{ gestureEnabled: false }} />
    </Stack>
  );
}