import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions, Image, Modal, ScrollView,
    StatusBar, StyleSheet, Text,
    TextInput,
    TouchableOpacity, View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AdminComplaintDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    const [adminResponse, setAdminResponse] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null);

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const STORAGE_URL = API_URL.replace('/api', '');

    useEffect(() => { fetchDetail(); }, [id]);

    const fetchDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.get(`${API_URL}/admin/complaint/${id}`, {
                headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "69420" }
            });
            setComplaint(res.data.data);
            setAdminResponse(res.data.data.response || '');
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    };

    const handleUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.patch(`${API_URL}/admin/complaint/${id}/status`, 
                { status: newStatus, response: adminResponse },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            Alert.alert("Berhasil", "Laporan telah diperbarui");
            fetchDetail();
        } catch (e) {
            Alert.alert("Gagal", "Gagal memperbarui laporan");
        } finally { setUpdating(false); }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e74c3c" /></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Modal Preview */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={45} color="white" />
                    </TouchableOpacity>
                    <Image source={{ uri: selectedImg }} style={styles.fullImg} resizeMode="contain" />
                </View>
            </Modal>
            
            <LinearGradient colors={['#e74c3c', '#c0392b']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Keluhan (Admin)</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.mainCard}>
                    {/* Info Tenant */}
                    <View style={styles.tenantBox}>
                        <Ionicons name="person-circle" size={45} color="#e74c3c" />
                        <View style={{marginLeft: 10}}>
                            <Text style={styles.tenantName}>{complaint.tenant?.name}</Text>
                            <Text style={styles.roomText}>Kamar: {complaint.room?.room_number}</Text>
                        </View>
                    </View>

                    <Text style={styles.label}>JUDUL & DESKRIPSI</Text>
                    <Text style={styles.title}>{complaint.title}</Text>
                    <Text style={styles.description}>{complaint.description}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>FOTO LAMPIRAN (KLIK UNTUK PREVIEW)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgList}>
                        {complaint.images?.map((img, index) => (
                            <TouchableOpacity key={index} onPress={() => { setSelectedImg(`${STORAGE_URL}/storage/${img.image_path}`); setModalVisible(true); }}>
                                <Image source={{ uri: `${STORAGE_URL}/storage/${img.image_path}` }} style={styles.thumbImg} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.divider} />

                    {/* Form Tanggapan Admin */}
                    <Text style={styles.label}>TANGGAPAN ADMIN</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tulis balasan atau instruksi..."
                        multiline
                        value={adminResponse}
                        onChangeText={setAdminResponse}
                    />

                    <Text style={styles.label}>GANTI STATUS</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.btn, {backgroundColor: '#f1c40f'}]} onPress={() => handleUpdate('in_progress')} disabled={updating}>
                            <Text style={styles.btnText}>Proses</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor: '#2ecc71'}]} onPress={() => handleUpdate('resolved')} disabled={updating}>
                            <Text style={styles.btnText}>Selesai</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor: '#95a5a6'}]} onPress={() => handleUpdate('closed')} disabled={updating}>
                            <Text style={styles.btnText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginLeft: 15 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 10 },
    scrollContent: { padding: 20 },
    mainCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 4 },
    tenantBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5', padding: 15, borderRadius: 15, marginBottom: 20 },
    tenantName: { fontWeight: 'bold', fontSize: 17, color: '#2c3e50' },
    roomText: { color: '#e74c3c', fontSize: 14, fontWeight: '600' },
    label: { fontSize: 10, fontWeight: 'bold', color: '#bdc3c7', marginBottom: 8, letterSpacing: 1 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
    description: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#f1f3f9', marginVertical: 20 },
    imgList: { marginTop: 5 },
    thumbImg: { width: 110, height: 110, borderRadius: 12, marginRight: 12 },
    input: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15, height: 100, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    actionRow: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
    fullImg: { width: width, height: height * 0.8 },
    closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 }
});