import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';

import { API_URL } from '../../helpers/api';

const STATUS_COLORS = {
    available: { bg: '#e8f5e9', text: '#2e7d32', label: 'TERSEDIA' },
    occupied: { bg: '#fff3e0', text: '#e65100', label: 'TERISI' },
    maintenance: { bg: '#ffebee', text: '#c62828', label: 'MAINTENANCE' },
};

const TYPE_LABELS = {
    singlenoac: 'Single No AC',
    singleac: 'Single AC',
    shared: 'Campur',
};

export default function RoomManagement() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const [form, setForm] = useState({
        room_number: '', type: 'singleac', price: '', capacity: '1',
        status: 'available', size: '', description: ''
    });

    const [alertConfig, setAlertConfig] = useState({
        visible: false, title: '', message: '', type: 'success'
    });

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const getHeaders = async () => {
        const token = await AsyncStorage.getItem('userToken');
        return {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420"
        };
    };

    const fetchRooms = useCallback(async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/admin/rooms`, { headers });
            setRooms(res.data?.data || res.data || []);
        } catch (error) {
            console.log("Error fetch rooms:", error);
            Alert.alert("Error", "Gagal mengambil data kamar");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchRooms(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    const openDetail = async (room) => {
        setSelectedRoom(room);
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/admin/rooms/${room.uuid || room.id}`, { headers });
            setSelectedRoom(res.data?.data || res.data);
        } catch (e) {
            console.log("Error fetch room detail:", e);
        }
        setDetailVisible(true);
    };

    const openEdit = (room) => {
        setSelectedRoom(room);
        setForm({
            room_number: room.room_number || '',
            type: room.type || 'singleac',
            price: room.price?.toString() || '',
            capacity: room.capacity?.toString() || '1',
            status: room.status || 'available',
            size: room.size?.toString() || '',
            description: room.description || '',
        });
        setEditVisible(true);
    };

    const handleSave = async () => {
        if (!form.room_number || !form.price) {
            return showAlert("Data Belum Lengkap", "Nomor kamar dan harga wajib diisi.", "warning");
        }

        try {
            const headers = await getHeaders();
            const roomId = selectedRoom?.uuid || selectedRoom?.id;

            await axios.post(`${API_URL}/admin/rooms/${roomId}`, {
                ...form,
                price: parseInt(form.price),
                capacity: parseInt(form.capacity),
                size: form.size ? parseFloat(form.size) : null,
            }, { headers });

            showAlert("Berhasil", "Data kamar berhasil diperbarui.", "success");
            setEditVisible(false);
            fetchRooms();
            if (detailVisible) {
                setDetailVisible(false);
            }
        } catch (e) {
            const msg = e.response?.data?.message || "Gagal menyimpan data.";
            showAlert("Gagal", msg, "error");
        }
    };

    const handleStatusChange = async (room, newStatus) => {
        try {
            const headers = await getHeaders();
            const roomId = room.uuid || room.id;
            await axios.put(`${API_URL}/admin/rooms/${roomId}/status`, { status: newStatus }, { headers });

            showAlert("Berhasil", `Status kamar diubah ke ${STATUS_COLORS[newStatus]?.label || newStatus}`, "success");
            fetchRooms();
            if (selectedRoom?.uuid === room.uuid || selectedRoom?.id === room.id) {
                setSelectedRoom(prev => ({ ...prev, status: newStatus }));
            }
        } catch (e) {
            showAlert("Gagal", e.response?.data?.message || "Gagal mengubah status.", "error");
        }
    };

    const renderItem = ({ item }) => {
        const st = STATUS_COLORS[item.status] || STATUS_COLORS.available;
        return (
            <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
                <View style={styles.cardLeft}>
                    <View style={styles.roomIcon}>
                        <Ionicons name="business" size={24} color="#1a2a6c" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.roomNumber}>Kamar {item.room_number}</Text>
                        <Text style={styles.roomSub}>
                            {TYPE_LABELS[item.type] || item.type} • Rp {parseInt(item.price).toLocaleString('id-ID')}
                        </Text>
                        <Text style={styles.tenantName}>
                            {item.active_tenant ? `Diisi: ${item.active_tenant.name}` : 'Kosong'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.text }]}>{st.label}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailValue = (label, value) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || '-'}</Text>
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
                    <Text style={styles.headerTitle}>Manajemen Kamar</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                        Total: {rooms.length} Kamar
                    </Text>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#b21f1f" />
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    keyExtractor={(item) => (item.uuid || item.id).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#b21f1f']} />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Belum ada data kamar.</Text>
                    }
                />
            )}

            {/* Detail Modal */}
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.detailContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.detailHeader}>
                                <View style={[styles.roomIcon, { width: 60, height: 60, borderRadius: 30 }]}>
                                    <Ionicons name="business" size={30} color="#1a2a6c" />
                                </View>
                                <Text style={styles.detailTitle}>Kamar {selectedRoom?.room_number}</Text>
                                {selectedRoom?.status && (
                                    <View style={[styles.badge, {
                                        backgroundColor: STATUS_COLORS[selectedRoom.status]?.bg || '#e8f5e9',
                                        paddingHorizontal: 16, paddingVertical: 6
                                    }]}>
                                        <Text style={{
                                            fontWeight: 'bold', fontSize: 12,
                                            color: STATUS_COLORS[selectedRoom.status]?.text || '#2e7d32'
                                        }}>
                                            {STATUS_COLORS[selectedRoom.status]?.label || selectedRoom.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.detailBody}>
                                {renderDetailValue('Tipe', TYPE_LABELS[selectedRoom?.type] || selectedRoom?.type)}
                                {renderDetailValue('Harga', selectedRoom?.price ? `Rp ${parseInt(selectedRoom.price).toLocaleString('id-ID')}` : '-')}
                                {renderDetailValue('Kapasitas', selectedRoom?.capacity ? `${selectedRoom.capacity} Orang` : '-')}
                                {renderDetailValue('Ukuran', selectedRoom?.size ? `${selectedRoom.size} m²` : '-')}
                                {renderDetailValue('Deskripsi', selectedRoom?.description)}
                                {renderDetailValue('Penghuni', selectedRoom?.active_tenant?.name || selectedRoom?.active_tenant?.user?.name || 'Kosong')}
                            </View>
                        </ScrollView>

                        <View style={[styles.detailActions, { paddingBottom: insets.bottom }]}>
                            <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#95a5a6' }]}
                                onPress={() => setDetailVisible(false)}>
                                <Text style={styles.detailBtnText}>Tutup</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#1a2a6c' }]}
                                onPress={() => { setDetailVisible(false); openEdit(selectedRoom); }}>
                                <Ionicons name="create-outline" size={16} color="white" />
                                <Text style={styles.detailBtnText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={editVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Kamar</Text>
                        <TouchableOpacity onPress={() => setEditVisible(false)}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.label}>Nomor Kamar</Text>
                        <TextInput style={styles.input}
                            placeholder="Contoh: A-01"
                            value={form.room_number}
                            onChangeText={(v) => setForm({ ...form, room_number: v })}
                        />

                        <Text style={styles.label}>Tipe Kamar</Text>
                        <View style={styles.pickerRow}>
                            {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.pickerOption, form.type === key && styles.pickerActive]}
                                    onPress={() => setForm({ ...form, type: key })}
                                >
                                    <Text style={[styles.pickerText, form.type === key && styles.pickerTextActive]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Status</Text>
                        <View style={styles.pickerRow}>
                            {Object.entries(STATUS_COLORS).map(([key, val]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.pickerOption, form.status === key && styles.pickerActive]}
                                    onPress={() => setForm({ ...form, status: key })}
                                >
                                    <Text style={[styles.pickerText, form.status === key && styles.pickerTextActive]}>
                                        {val.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Harga (Rp)</Text>
                                <TextInput style={styles.input}
                                    placeholder="500000"
                                    keyboardType="numeric"
                                    value={form.price}
                                    onChangeText={(v) => setForm({ ...form, price: v })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Kapasitas</Text>
                                <TextInput style={styles.input}
                                    placeholder="1"
                                    keyboardType="numeric"
                                    value={form.capacity}
                                    onChangeText={(v) => setForm({ ...form, capacity: v })}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Ukuran (m²)</Text>
                        <TextInput style={styles.input}
                            placeholder="3x4"
                            keyboardType="decimal-pad"
                            value={form.size}
                            onChangeText={(v) => setForm({ ...form, size: v })}
                        />

                        <Text style={styles.label}>Deskripsi</Text>
                        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Fasilitas kamar, dll."
                            value={form.description}
                            onChangeText={(v) => setForm({ ...form, description: v })}
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>SIMPAN PERUBAHAN</Text>
                        </TouchableOpacity>
                        <View style={{ height: insets.bottom + 50 }} />
                    </ScrollView>
                </View>
            </Modal>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#95a5a6' },

    card: {
        backgroundColor: 'white', borderRadius: 15, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 2
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    roomIcon: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
    roomNumber: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
    roomSub: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
    tenantName: { fontSize: 11, color: '#4e73df', marginTop: 2, fontWeight: '500' },
    badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },

    /* Detail */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    detailContainer: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '85%' },
    detailHeader: { alignItems: 'center', marginBottom: 20 },
    detailTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginTop: 12, marginBottom: 8 },
    detailBody: { marginBottom: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f3f9' },
    detailLabel: { fontSize: 14, color: '#7f8c8d', flex: 1 },
    detailValue: { fontSize: 14, color: '#2c3e50', fontWeight: '600', flex: 1.5, textAlign: 'right' },
    detailActions: { flexDirection: 'row', gap: 10 },
    detailBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    detailBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },

    /* Edit Modal */
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a2a6c' },
    modalBody: { padding: 20 },
    label: { fontSize: 13, fontWeight: 'bold', marginTop: 18, marginBottom: 8, color: '#34495e' },
    input: { backgroundColor: '#f1f3f9', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#e1e8ef' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pickerOption: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#f1f3f9', borderWidth: 1, borderColor: '#e1e8ef' },
    pickerActive: { backgroundColor: '#1a2a6c', borderColor: '#1a2a6c' },
    pickerText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
    pickerTextActive: { color: 'white' },
    saveBtn: { backgroundColor: '#1a2a6c', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 3 },
});
