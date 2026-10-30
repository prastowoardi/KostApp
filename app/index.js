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
    StyleSheet,
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
                    colors={['#1a2a6c', '#2a5298', '#b21f1f']}
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
                            <Ionicons name="mail-outline" size={20} color="#4e73df" style={styles.inputIcon} />
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
                            <Ionicons name="lock-closed-outline" size={20} color="#4e73df" style={styles.inputIcon} />
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
                                colors={['#1a2a6c', '#b21f1f']}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FC',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingHorizontal: 20,
    },
    logoCircle: {
        width: 86,
        height: 86,
        backgroundColor: '#ffffff',
        borderRadius: 43,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        overflow: 'hidden',
    },
    logoImage: {
        width: '85%',
        height: '85%',
    },
    logoText: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    tagline: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
    formContainer: {
        flex: 1,
        marginTop: -35,
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        elevation: 4,
        shadowColor: '#1a2a6c',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        borderWidth: 1,
        borderColor: '#edf2f7',
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    },
    welcomeSub: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 22,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
        marginLeft: 2,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1e293b',
    },
    button: {
        marginTop: 10,
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#b21f1f',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    gradientBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.8,
    },
    footerText: {
        textAlign: 'center',
        marginTop: 32,
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
});
