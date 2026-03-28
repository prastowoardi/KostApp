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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../components/GlobalAlert';
import { registerForPushNotificationsAsync } from '../helpers/notificationHelper';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertConfig({ 
            visible: true, 
            title, 
            message, 
            type, 
            onConfirm: onConfirm
        });
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert(
                "Oops!", 
                "Email dan password tidak boleh kosong.", 
                "warning"
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
                showAlert(
                    "Login Berhasil", 
                    `Selamat datang, *${user.name}*!`,
                    "info", 
                );
                router.replace(user.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard');
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Email atau password salah.";
            showAlert("Login Gagal", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setAlertConfig({
            visible: true,
            title: "Konfirmasi Keluar",
            message: "Apakah Anda yakin ingin keluar dari aplikasi?",
            type: "confirmation",
            onConfirm: async () => {
                await AsyncStorage.multiRemove(['userToken', 'userData']);
                setAlertConfig(prev => ({ ...prev, visible: false }));
                router.replace('/');
            },
            onCancel: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
                <StatusBar barStyle="light-content" />
                
                <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Image 
                            source={require('../assets/serrata.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.logoText}>Serrata Kost</Text>
                    <Text style={styles.tagline}>Chill & Comfort Living.</Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Silakan Masuk</Text>
                        
                        <View style={styles.inputGroup}>
                            <Ionicons name="mail-outline" size={20} color="#4e73df" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Email" 
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                                placeholderTextColor={"#858796"}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Ionicons name="lock-closed-outline" size={20} color="#4e73df" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Password" 
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureText}
                                editable={!loading}
                                placeholderTextColor={"#858796"}
                            />
                            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                                <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="#858796" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.button, loading && { opacity: 0.8 }]} 
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <LinearGradient 
                                colors={['#4e73df', '#224abe']} 
                                start={{ x: 0, y: 0 }} 
                                end={{ x: 1, y: 0 }} 
                                style={styles.gradientBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>LOGIN SEKARANG</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.footerText}>© 2026 Serrata Kost Management System</Text>
                </View>
            </ScrollView>

            <GlobalAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm} 
                confirmText="Ya, Lanjutkan"
                cancelText="Batal"
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: { height: 300, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 60 },
    logoCircle: { width: 100, height: 100, backgroundColor: 'white', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, overflow: 'hidden' },
    logoImage: { width: '100%', height: '100%' },
    logoText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
    tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    formContainer: { flex: 1, backgroundColor: '#F8F9FC', marginTop: -50, paddingHorizontal: 30 },
    card: { marginTop:100, backgroundColor: 'white', borderRadius: 25, padding: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 25, textAlign: 'center' },
    inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f9', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e1e8ef' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#2c3e50' },
    button: { marginTop: 10, borderRadius: 15, overflow: 'hidden' },
    gradientBtn: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    footerText: { textAlign: 'center', marginTop: 40, color: '#bdc3c7', fontSize: 12, paddingBottom: 20 }
});