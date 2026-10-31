import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomSplashScreen from '../components/CustomSplashScreen';
import GlobalAlert from '../components/GlobalAlert';
import { registerForPushNotificationsAsync } from '../helpers/notificationHelper';
import { API_URL } from '../helpers/api';
import styles from '../styles/auth.styles';

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authResult, setAuthResult] = useState(null);
    const [splashFinished, setSplashFinished] = useState(false);
    const [secureText, setSecureText] = useState(true);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        confirmText: 'OK',
    });

    // Check if the user is already logged in
    useEffect(() => {
        let isMounted = true;
        const checkExistingAuth = async () => {
            try {
                SplashScreen.hideAsync().catch(() => {});
                const [token, userData] = await Promise.all([
                    AsyncStorage.getItem('userToken'),
                    AsyncStorage.getItem('userData'),
                ]);

                if (token && userData && isMounted) {
                    const parsedUser = JSON.parse(userData);
                    const target =
                        parsedUser?.role === 'admin' || parsedUser?.role === 'staff'
                            ? '/admin/dashboard'
                            : '/tenant/dashboard';
                    setAuthResult({ isLoggedIn: true, target });
                    return;
                }
            } catch {
                // If parsing fails, allow user to log in again
            }
            if (isMounted) setAuthResult({ isLoggedIn: false });
        };

        checkExistingAuth();
        return () => { isMounted = false; };
    }, []);

    // Transition once both splash animation and auth verification finish
    useEffect(() => {
        if (splashFinished && authResult) {
            if (authResult.isLoggedIn && authResult.target) {
                router.replace(authResult.target);
            } else {
                setCheckingAuth(false);
            }
        }
    }, [splashFinished, authResult, router]);

    const showAlert = (title, message, type = 'info', onConfirm = null, confirmText = 'OK') => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onConfirm: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                if (onConfirm) onConfirm();
            },
            confirmText,
        });
    };

    const handleLogin = async () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            showAlert('Oops', 'Email dan password tidak boleh kosong.', 'warning');
            return;
        }

        setLoading(true);
        try {
            let pushToken = null;
            try {
                pushToken = await registerForPushNotificationsAsync();
            } catch (tokenError) {
                console.log('Push Token Error:', tokenError?.message);
            }

            const response = await axios.post(
                `${API_URL}/login`,
                {
                    email: trimmedEmail,
                    password: trimmedPassword,
                    push_token: pushToken,
                },
                {
                    headers: { Accept: 'application/json' },
                    timeout: 12000,
                }
            );

            if (response.data && response.data.token) {
                const { token, user } = response.data;
                const cleanToken = token.toString().replace(/"/g, '').trim();

                await AsyncStorage.setItem('userToken', cleanToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));

                if (user.role === 'admin' || user.role === 'staff') {
                    router.replace('/admin/dashboard');
                } else {
                    router.replace('/tenant/dashboard');
                }
            } else {
                showAlert('Login Gagal', 'Data autentikasi tidak valid.', 'error');
            }
        } catch (error) {
            console.log('Login Error:', error.response?.data || error.message);
            const msg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Email atau password yang Anda masukkan salah.';
            showAlert('Gagal Masuk', msg, 'error', null, 'Coba Lagi');
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return <CustomSplashScreen onFinish={() => setSplashFinished(true)} />;
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header Gradient */}
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#1e3a8a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 30 }]}
                >
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../assets/serrata.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.logoText}>Serrata Kost</Text>
                    <Text style={styles.tagline}>Chill & Comfort Living</Text>
                </LinearGradient>

                {/* Form Card */}
                <View style={styles.formContainer}>
                    <View style={styles.card}>
                        <Text style={styles.welcomeTitle}>Selamat Datang 👋</Text>
                        <Text style={styles.welcomeSub}>Silakan masuk ke akun Anda</Text>

                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={styles.inputGroup}>
                            <Ionicons name="mail-outline" size={20} color="#2563eb" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="nama@email.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputGroup}>
                            <Ionicons name="lock-closed-outline" size={20} color="#2563eb" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukkan password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureText}
                                editable={!loading}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity
                                onPress={() => setSecureText(!secureText)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={secureText ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#94a3b8"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.8 }]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#0f172a', '#1e3a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.buttonText}>MASUK SEKARANG</Text>
                                        <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerText}>
                        © 2026 Serrata Kost Management System
                    </Text>
                </View>
            </ScrollView>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
                confirmText={alertConfig.confirmText}
            />
        </KeyboardAvoidingView>
    );
}
