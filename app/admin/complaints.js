import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [reply, setReply] = useState('');
    const router = useRouter();

    const fetchComplaints = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/admin/complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComplaints(response.data);
        } catch (error) {
            console.log("Error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchComplaints(); }, []);

    const handleUpdateStatus = async (status) => {
        if (!reply && status === 'resolved') {
            return Alert.alert("Oops", "Berikan pesan solusi sebelum menyelesaikan laporan.");
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(`${API_URL}/admin/complaints/${selectedItem.id}/respond`, {
                status: status,
                response: reply
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Berhasil", "Laporan telah diperbarui.");
            setModalVisible(false);
            setReply('');
            fetchComplaints();
        } catch (e) {
            Alert.alert("Gagal", "Gagal memperbarui laporan.");
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.card, { borderLeftColor: item.status === 'pending' ? '#e74a3b' : '#f6c23e' }]}
            onPress={() => {
                setSelectedItem(item);
                setReply(item.response || '');
                setModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.roomText}>Kamar {item.tenant?.room?.room_number} - {item.tenant?.user?.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#ffeaea' : '#fff4e5' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'pending' ? '#e74a3b' : '#d39e00' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('id-ID')}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1a2a6c', '#b21f1f']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Laporan Tenant</Text>
                    <TouchableOpacity onPress={fetchComplaints} style={styles.backBtn}>
                        <Ionicons name="refresh" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color="#b21f1f" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={complaints}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada laporan aktif.</Text>}
                />
            )}

            {/* MODAL RESPON ADMIN */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Respon Laporan</Text>
                        <Text style={styles.modalLabel}>Keluhan:</Text>
                        <Text style={styles.modalDesc}>{selectedItem?.description}</Text>
                        
                        <TextInput 
                            style={styles.input}
                            placeholder="Tulis balasan atau solusi..."
                            multiline
                            numberOfLines={4}
                            value={reply}
                            onChangeText={setReply}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: '#f6c23e' }]}
                                onPress={() => handleUpdateStatus('process')}
                            >
                                <Text style={styles.btnText}>Proses</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: '#1cc88a' }]}
                                onPress={() => handleUpdateStatus('resolved')}
                            >
                                <Text style={styles.btnText}>Selesai</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: '#858796' }}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f9' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    card: { backgroundColor: 'white', borderRadius: 15, padding: 18, marginBottom: 15, borderLeftWidth: 6, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    roomText: { fontWeight: 'bold', color: '#4e73df', fontSize: 13 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    titleText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    descText: { fontSize: 13, color: '#858796', marginTop: 5 },
    dateText: { fontSize: 11, color: '#ccc', marginTop: 10, textAlign: 'right' },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#858796' },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    modalLabel: { fontSize: 12, color: '#858796', marginBottom: 5 },
    modalDesc: { fontSize: 14, color: '#2c3e50', marginBottom: 20, backgroundColor: '#f8f9fc', padding: 10, borderRadius: 10 },
    input: { backgroundColor: '#f1f3f9', borderRadius: 12, padding: 15, textAlignVertical: 'top', marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
    modalBtn: { flex: 0.48, padding: 15, borderRadius: 12, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold' },
    closeBtn: { alignItems: 'center', marginTop: 20 }
});