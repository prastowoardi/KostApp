import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const STORAGE_URL = "process.env.EXPO_PUBLIC_API_URL;:8000/storage/"; // URL publik foto di Laravel

export default function VerifyPayment() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(null);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    const fetchPendingPayments = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/admin/payments/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(response.data);
        } catch (error) {
            console.log("Error Fetch:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPendingPayments(); }, []);

    const handleAction = async (id, status) => {
        const actionLabel = status === 'success' ? 'MENERIMA' : 'MENOLAK';
        
        Alert.alert("Konfirmasi", `Apakah Anda yakin ingin ${actionLabel} pembayaran ini?`, [
            { text: "Batal", style: "cancel" },
            { text: "Ya, Proses", onPress: async () => {
                setProcessing(true);
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    await axios.post(`${API_URL}/admin/payments/${id}/verify`, { status }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    Alert.alert("Berhasil", `Status pembayaran diperbarui menjadi ${status}.`);
                    fetchPendingPayments();
                } catch (e) {
                    Alert.alert("Gagal", "Gagal memperbarui status.");
                } finally {
                    setProcessing(false);
                }
            }}
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <View style={styles.tenantInitial}>
                    <Text style={styles.initialText}>{item.tenant?.user?.name?.charAt(0) || '?'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.tenantName}>{item.tenant?.user?.name || 'Tenant'}</Text>
                    <Text style={styles.invoiceText}>{item.invoice_number}</Text>
                    <Text style={styles.roomText}>Kamar: {item.room?.room_number || '-'}</Text>
                </View>
                <Text style={styles.amountText}>Rp {parseInt(item.total).toLocaleString('id-ID')}</Text>
            </View>

            {/* Tombol Preview Bukti */}
            <TouchableOpacity 
                style={styles.proofPreview} 
                onPress={() => setSelectedImg(STORAGE_URL + item.receipt_file)}
            >
                <Ionicons name="image-outline" size={20} color="#4e73df" />
                <Text style={styles.proofText}>Lihat Bukti Transfer</Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={[styles.btn, styles.btnReject]} 
                    onPress={() => handleAction(item.id, 'rejected')}
                >
                    <Ionicons name="close-outline" size={20} color="#e74a3b" />
                    <Text style={styles.btnTextReject}>Tolak</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btn, styles.btnApprove]} 
                    onPress={() => handleAction(item.id, 'success')}
                >
                    <Ionicons name="checkmark-outline" size={20} color="white" />
                    <Text style={styles.btnTextApprove}>Terima</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1a2a6c', '#b21f1f']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verifikasi Bayar</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color="#b21f1f" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-done-circle-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>Semua tagihan sudah terverifikasi!</Text>
                        </View>
                    }
                />
            )}

            {/* MODAL ZOOM GAMBAR */}
            <Modal visible={!!selectedImg} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeModal} onPress={() => setSelectedImg(null)}>
                        <Ionicons name="close-circle" size={45} color="white" />
                    </TouchableOpacity>
                    <Image source={{ uri: selectedImg }} style={styles.fullImage} resizeMode="contain" />
                </View>
            </Modal>

            {processing && (
                <View style={styles.overlayLoader}>
                    <ActivityIndicator size="large" color="white" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f9' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    listContainer: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 15, elevation: 4 },
    cardInfo: { flexDirection: 'row', alignItems: 'center' },
    tenantInitial: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f3f9', justifyContent: 'center', alignItems: 'center' },
    initialText: { fontSize: 20, fontWeight: 'bold', color: '#4e73df' },
    tenantName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    invoiceText: { fontSize: 11, color: '#4e73df', fontWeight: '600' },
    roomText: { fontSize: 12, color: '#858796' },
    amountText: { fontSize: 16, fontWeight: 'bold', color: '#1cc88a' },
    proofPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', padding: 12, borderRadius: 12, marginVertical: 15, justifyContent: 'center' },
    proofText: { marginLeft: 8, color: '#4e73df', fontWeight: 'bold', fontSize: 13 },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    btn: { flex: 0.48, flexDirection: 'row', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    btnApprove: { backgroundColor: '#1cc88a' },
    btnReject: { borderWidth: 1.5, borderColor: '#e74a3b' },
    btnTextApprove: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
    btnTextReject: { color: '#e74a3b', fontWeight: 'bold', marginLeft: 5 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#858796', fontSize: 14 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: width, height: width * 1.5 },
    closeModal: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
    overlayLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});