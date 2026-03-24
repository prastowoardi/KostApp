import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ComplaintDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null);

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const STORAGE_URL = API_URL.replace('/api', '');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const res = await axios.get(`${API_URL}/complaints/${id}`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "ngrok-skip-browser-warning": "69420"
                    }
                });
                setComplaint(res.data.data);
            } catch (e) {
                console.error("Gagal ambil detail:", e.response?.data);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'open': return { color: '#4e73df', bg: '#eef2ff' };
            case 'in_progress': return { color: '#f6c23e', bg: '#fffbe6' };
            case 'resolved': return { color: '#1cc88a', bg: '#e6fffa' };
            case 'closed': return { color: '#858796', bg: '#f8f9fc' };
            default: return { color: '#4e73df', bg: '#f1f3f9' };
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4e73df" />
        </View>
    );

    if (!complaint) return (
        <View style={styles.center}>
            <Text>Data tidak ditemukan.</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
                <Text style={{color: 'white'}}>Kembali</Text>
            </TouchableOpacity>
        </View>
    );

    const statusStyle = getStatusStyle(complaint.status);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* --- MODAL PREVIEW MULAI --- */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={45} color="white" />
                    </TouchableOpacity>
                    <Image 
                        source={{ uri: selectedImg }} 
                        style={styles.fullImg} 
                        resizeMode="contain" 
                    />
                </View>
            </Modal>
            {/* --- MODAL PREVIEW SELESAI --- */}
            
            <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detail Laporan</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.mainCard}>
                    <View style={styles.statusRow}>
                        <Text style={styles.categoryBadge}>{complaint.category.toUpperCase()}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                {complaint.status.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{complaint.title}</Text>
                    
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color="#95a5a6" />
                        <Text style={styles.dateText}>
                            {new Date(complaint.created_at).toLocaleString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </Text>
                    </View>

                    <View style={styles.divider} />
                    <Text style={styles.label}>Deskripsi Keluhan</Text>
                    <Text style={styles.description}>{complaint.description}</Text>
                    <View style={styles.divider} />

                    <Text style={styles.label}>Foto Lampiran</Text>
                    <View style={styles.imageGrid}>
                        {complaint.images && complaint.images.length > 0 ? (
                            complaint.images.map((img, index) => {
                                const finalUrl = `${STORAGE_URL}/storage/${img.image_path}`;
                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={styles.imageWrapper}
                                        onPress={() => {
                                            setSelectedImg(finalUrl);
                                            setModalVisible(true);
                                        }}
                                    >
                                        <Image source={{ uri: finalUrl }} style={styles.img} />
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={styles.noImage}>
                                <Ionicons name="image-outline" size={40} color="#d1d8e0" />
                                <Text style={{color: '#95a5a6', marginTop: 5}}>Tidak ada foto</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 60, paddingHorizontal: 20, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 10 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, marginTop: 25 },
    mainCard: { backgroundColor: 'white', borderRadius: 25, padding: 22, elevation: 10 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    categoryBadge: { fontSize: 12, fontWeight: 'bold', color: '#4e73df', letterSpacing: 1 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    dateText: { fontSize: 13, color: '#95a5a6', marginLeft: 5 },
    divider: { height: 1, backgroundColor: '#f1f3f9', marginVertical: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#4e73df', marginBottom: 10 },
    description: { fontSize: 15, color: '#34495e', lineHeight: 24 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 5 },
    imageWrapper: { width: (width - 100) / 2, height: 120, borderRadius: 15, overflow: 'hidden', backgroundColor: '#f8f9fc' },
    img: { width: '100%', height: '100%' },
    noImage: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fc', borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d8e0' },
    retryBtn: { marginTop: 20, backgroundColor: '#4e73df', padding: 10, borderRadius: 10 },
    
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    fullImg: { width: width, height: height * 0.8 },
    closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 11 }
});