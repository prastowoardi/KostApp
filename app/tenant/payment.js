import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function PaymentScreen() {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {}
    });

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({ 
            visible: true, title, message, type, 
            onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false })))
        });
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return showAlert("Izin Ditolak", "Aplikasi butuh akses galeri untuk mengupload bukti bayar.", "error");
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const submitPayment = async () => {
        if (!image) return showAlert("Opps!", "Pilih foto bukti transfer dulu ya.", "warning");
        
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();
            
            const uri = Platform.OS === 'android' ? image : image.replace('file://', '');
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('proof_image', {
                uri: uri,
                name: filename || 'payment_proof.jpg',
                type: type,
            });

            await axios.post(`${API_URL}/payments/upload`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                    'ngrok-skip-browser-warning': '69420'
                }
            });

            showAlert("Berhasil", "Bukti bayar terkirim! Admin akan segera melakukan verifikasi.", "success", () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                router.back();
            });

        } catch (e) {
            console.log("Upload Error:", e.response?.data || e.message);
            showAlert("Gagal Upload", e.response?.data?.message || "Terjadi kesalahan server saat mengirim gambar.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Konfirmasi Bayar</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Detail Tagihan</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Bulan</Text>
                        <Text style={styles.value}>Maret 2026</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Bayar</Text>
                        <Text style={[styles.value, {color: '#1cc88a', fontWeight: 'bold'}]}>Rp 1.500.000</Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.bankTitle}>Transfer Ke:</Text>
                    <Text style={styles.bankInfo}>Bank Mandiri (Serrata Kost)</Text>
                    <Text style={styles.bankInfo}>No. Rek: 136-001-440-6059</Text>
                    <Text style={styles.bankInfo}>A/N Prastowo Ardi Widigdo</Text>
                </View>

                <Text style={styles.sectionTitle}>Upload Bukti Transfer</Text>
                
                <TouchableOpacity style={styles.uploadBox} onPress={pickImage} disabled={loading}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.preview} />
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="cloud-upload-outline" size={50} color="#4e73df" />
                            <Text style={styles.uploadText}>Klik untuk pilih foto dari galeri</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.submitBtn, loading && { backgroundColor: '#bdc3c7' }]} 
                    onPress={submitPayment}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.btnText}>KONFIRMASI SEKARANG</Text>
                    )}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* 4. Komponen Alert Global */}
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
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    scrollContent: { padding: 25 },
    infoCard: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 20, 
        elevation: 10, 
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 25 
    },
    infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    label: { color: '#858796' },
    value: { color: '#2c3e50', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    bankTitle: { fontSize: 14, fontWeight: 'bold', color: '#4e73df', marginBottom: 5 },
    bankInfo: { fontSize: 15, color: '#2c3e50' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
    uploadBox: { height: 250, backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#4e73df', overflow: 'hidden', elevation: 2 },
    preview: { width: '100%', height: '100%' },
    uploadText: { color: '#4e73df', marginTop: 10, fontWeight: '600' },
    submitBtn: { backgroundColor: '#1cc88a', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 5 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});