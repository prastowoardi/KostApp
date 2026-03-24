import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Pastikan nama-nama ini sesuai dengan nama file di folder admin */}
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="complaint/index" /> 
            <Stack.Screen name="complaint/[id]" />
            <Stack.Screen name="manage-tenant" />
            <Stack.Screen name="payment" />
            <Stack.Screen name="verify-payment" />
        </Stack>
    );
}