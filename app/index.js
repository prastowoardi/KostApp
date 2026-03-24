import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = "http://192.168.1.235:8000/api"; 

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert("Eits!", "Email dan Password harus diisi.");
        }

        try {
            const response = await axios.post(`${API_URL}/login`, {
                email: email,
                password: password
            });

            if (response.data.token) {
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
                
                const userRole = response.data.user.role;
                await AsyncStorage.setItem('userRole', userRole);

                Alert.alert("Berhasil", `Halo ${response.data.user.name}, kamu berhasil login!`);

                if (userRole === 'admin') {
                    router.replace('/admin/dashboard');
                } else {
                    router.replace('/tenant/dashboard');
                }
            }
        } catch (error) {
            console.log("Error Login:", error.response ? error.response.data : error.message);
            Alert.alert("Login Gagal", "Pastikan Email/Password benar!");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.logo}>Serrata Kost</Text>
            
            <View style={styles.card}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Email" 
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput 
                    style={styles.input} 
                    placeholder="Password" 
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry 
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>MASUK</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>© 2026 Serrata Management</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#f5f6fa' },
    logo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#2c3e50' },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    input: { borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 12, marginBottom: 20, fontSize: 16 },
    button: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    footer: { textAlign: 'center', marginTop: 50, color: '#95a5a6', fontSize: 12 }
});