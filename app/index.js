import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
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

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {}
    });

    const router = useRouter();

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({ 
            visible: true, 
            title, 
            message, 
            type, 
            onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false })))
        });
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert("Error", "Email dan password harus diisi!",
                "error"
            );
            return;
        }

        setLoading(true);
        console.log("--- Trying to Login ---");
        console.log("URL Target:", `${API_URL}/login`);

        try {
            let pushToken = null;
            try {
                pushToken = await registerForPushNotificationsAsync();
                console.log("Push Token Created Successfully:", pushToken);
            } catch (tokenError) {
                console.log("Failed Get Push Token:", tokenError.message);
            }

            const response = await axios.post(`${API_URL}/login`, {
                email: email,
                password: password,
                push_token: pushToken 
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '69420'
                },
                timeout: 10000
            });

            console.log("Response from Server:", response.data);

            if (response.data.token) {
                const { token, user } = response.data;
                const cleanToken = token.toString().replace(/"/g, '').trim();

                console.log("Clean token saved:", cleanToken);

                await AsyncStorage.setItem('userToken', cleanToken);
                await AsyncStorage.setItem('userData', JSON.stringify(user));

                console.log("Navigating to dashboard role:", user.role);

                showAlert(
                    "Berhasil Masuk", 
                    `Selamat datang kembali, ${user.name}!`, 
                    "success", 
                    () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        if (user.role === 'admin') {
                            router.replace('/admin/dashboard');
                        } else {
                            router.replace('/tenant/dashboard');
                        }
                    }
                );
            }
        } catch (error) {
            console.log("Detail Error Login:");
            if (error.response) {
                console.log("Data Error:", error.response.data);
                console.log("Status Error:", error.response.status);
                showAlert(
                    "Login Gagal", "Email atau password salah.", 
                    "error"
                );
            } else if (error.request) {
                console.log("Request Error (Ngrok mati?):", error.request);
                showAlert("Error", "Server tidak merespon. Cek koneksi ke Server!",
                    "error"
                );
            } else {
                console.log("General Error:", error.message);
                showAlert("Error", error.message,
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.headerArea}>
                <Text style={styles.logo}>Serrata Kost</Text>
                <Text style={styles.tagline}>Manajemen kos jadi lebih mudah</Text>
            </View>
            
            <View style={styles.card}>
                <Text style={styles.label}>Email</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Masukkan email anda" 
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Masukkan password" 
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry 
                    editable={!loading}
                />

                <TouchableOpacity 
                    style={[styles.button, loading && { opacity: 0.7 }]} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>MASUK KE AKUN</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>© 2026 Serrata Management</Text>

            {/* Render Custom Alert */}
            <GlobalAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={alertConfig.onConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#f8f9fa' },
    headerArea: { marginBottom: 40 },
    logo: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#1a2a6c' },
    tagline: { fontSize: 14, textAlign: 'center', color: '#7f8c8d', marginTop: 5 },
    card: { 
        backgroundColor: 'white', 
        padding: 25, 
        borderRadius: 20, 
        elevation: 8, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 5 }
    },
    label: { fontSize: 13, fontWeight: 'bold', color: '#34495e', marginBottom: 8 },
    input: { 
        backgroundColor: '#f1f3f9',
        borderRadius: 12,
        padding: 15, 
        marginBottom: 20, 
        fontSize: 16,
        color: '#2c3e50',
        borderWidth: 1,
        borderColor: '#e1e8ef'
    },
    button: { 
        backgroundColor: '#1a2a6c', 
        padding: 18, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginTop: 10,
        shadowColor: '#1a2a6c',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    footer: { textAlign: 'center', marginTop: 50, color: '#bdc3c7', fontSize: 12 }
});