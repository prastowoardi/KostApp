import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../components/GlobalAlert';
import { registerForPushNotificationsAsync } from '../helpers/notificationHelper';
import { API_URL } from '../helpers/api';
import { Button } from '../components/ui/button';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });

    const router = useRouter();

    const showAlert = (title, message, type = 'info', onConfirm = null, confirmText = null) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onConfirm,
            confirmText
        });
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert(
                "Oops!",
                "Email dan password tidak boleh kosong.",
                "warning",
                () => setAlertConfig(prev => ({ ...prev, visible: false }))
            );
            return;
        }

        setLoading(true);
        try {
            let pushToken = null;
            try {
                pushToken = await registerForPushNotificationsAsync();
            } catch (tokenError) {
                console.log("Token Error:", tokenError.message);
            }

            const response = await axios.post(`${API_URL}/login`, {
                email: email,
                password: password,
                push_token: pushToken
            }, {
                headers: { 'Accept': 'application/json' },
                timeout: 10000
            });

            if (response.data.token) {
                const { token, user } = response.data;
                const cleanToken = token.toString().replace(/"/g, '').trim();

                await AsyncStorage.setItem('userToken', cleanToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));
                router.replace(user.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard');
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Email atau password salah.";
            showAlert("Login Gagal", msg, "error", () => setAlertConfig(prev => ({ ...prev, visible: false })), "Coba Lagi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
                <StatusBar barStyle="light-content" />

                <LinearGradient colors={['#1a2a6c', '#b21f1f']} className="h-[320px] items-center justify-center rounded-b-[60px] px-8">
                    <View className="mb-4 h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white shadow-lg">
                        <Image
                            source={require('../assets/serrata.png')}
                            className="h-full w-full p-2"
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-3xl font-bold text-white">Serrata Kost</Text>
                    <Text className="mt-1 text-sm text-white/80">Chill & Comfort Living.</Text>
                </LinearGradient>

                <View className="-mt-12 flex-1 bg-background px-7">
                    <View className="mt-24 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5">
                        <Text className="mb-6 text-center text-xl font-bold text-foreground">Silakan Masuk</Text>

                        <View className="mb-4 flex-row items-center rounded-xl border border-border bg-muted/50 px-4">
                            <Ionicons name="mail-outline" size={20} color="hsl(var(--primary))" className="mr-2.5" />
                            <TextInput
                                className="flex-1 py-3.5 text-base text-foreground"
                                placeholder="Email"
                                placeholderTextColor="hsl(var(--muted-foreground))"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                            />
                        </View>

                        <View className="mb-4 flex-row items-center rounded-xl border border-border bg-muted/50 px-4">
                            <Ionicons name="lock-closed-outline" size={20} color="hsl(var(--primary))" className="mr-2.5" />
                            <TextInput
                                className="flex-1 py-3.5 text-base text-foreground"
                                placeholder="Password"
                                placeholderTextColor="hsl(var(--muted-foreground))"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureText}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                                <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="hsl(var(--muted-foreground))" />
                            </TouchableOpacity>
                        </View>

                        <Button
                            className="mt-3 h-14 rounded-xl"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#1a2a6c', '#b21f1f']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="h-full w-full items-center justify-center rounded-xl"
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-base font-bold tracking-wider text-white">LOGIN SEKARANG</Text>
                                )}
                            </LinearGradient>
                        </Button>
                    </View>
                    <Text className="mt-10 pb-5 text-center text-xs text-muted-foreground">© 2026 Serrata Kost Management System</Text>
                </View>
            </ScrollView>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
                confirmText={alertConfig.confirmText || "OK"}
                cancelText="Batal"
            />
        </KeyboardAvoidingView>
    );
}
