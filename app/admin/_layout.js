import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" /> 
            {/* <Stack.Screen name="complaint/index" /> 
            <Stack.Screen name="complaint/[id]" /> */}
            <Stack.Screen name="finances/index" />
            <Stack.Screen name="finances/[id]" />
            <Stack.Screen name="finances/create" />
            <Stack.Screen name="manage-tenant" />
            <Stack.Screen name="verify-payment" />
        </Stack>
    );
}