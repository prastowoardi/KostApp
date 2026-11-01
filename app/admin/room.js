import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../components/GlobalAlert';
import LoadingScreen from '../../components/LoadingScreen';
import { API_URL } from '../../helpers/api';
import { formatRupiah } from '../../helpers/formatters';
import styles from '../../styles/adminRoom.styles';

const STATUS_CONFIG = {
    available: { bg: '#ecfdf5', text: '#10b981', label: 'TERSEDIA' },
    occupied: { bg: '#fffbeb', text: '#f59e0b', label: 'TERISI' },
    maintenance: { bg: '#fef2f2', text: '#ef4444', label: 'MAINTENANCE' },
};

const TYPE_LABELS = {
    singlenoac: 'Single Non-AC',
    singleac: 'Single AC',
    shared: 'Campur (Shared)',
};

export default function RoomManagement() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    const [detailVisible, setDetailVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const [form, setForm] = useState({
        room_number: '',
        type: 'singleac',
        price: '',
        capacity: '1',
        status: 'available',
        size: '',
        description: '',
    });

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {},
    });

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onConfirm: () => {
                setAlertConfig((p) => ({ ...p, visible: false }));
                if (onConfirm) onConfirm();
            },
        });
    };

    const getHeaders = async () => {
        const token = await AsyncStorage.getItem('userToken');
        const cleanToken = token ? token.replace(/"/g, '').trim() : '';
        return {
            Authorization: `Bearer ${cleanToken}`,
            Accept: 'application/json',
        };
    };

    const fetchRooms = useCallback(async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/admin/rooms`, { headers });
            setRooms(res.data?.data || res.data || []);
        } catch (error) {
            console.log('Error fetch rooms:', error);
            Alert.alert('Error', 'Gagal mengambil data kamar');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    const openDetail = async (room) => {
        setSelectedRoom(room);
        setDetailVisible(true);
        try {
            const headers = await getHeaders();
            const roomId = room.uuid || room.id;
            const res = await axios.get(`${API_URL}/admin/rooms/${roomId}`, { headers });
            if (res.data?.data) {
                setSelectedRoom(res.data.data);
            }
        } catch (e) {
            console.log('Error fetch room detail:', e.response?.data || e.message);
        }
    };

    const openEdit = (room) => {
        setSelectedRoom(room);
        setForm({
            room_number: room.room_number || '',
            type: room.type || 'singleac',
            price: room.price ? room.price.toString() : '',
            capacity: room.capacity ? room.capacity.toString() : '1',
            status: room.status || 'available',
            size: room.size ? room.size.toString() : '',
            description: room.description || '',
        });
        setDetailVisible(false);
        setEditVisible(true);
    };

    const handleSave = async () => {
        if (!form.room_number.trim() || !form.price) {
            return showAlert('Data Belum Lengkap', 'Nomor kamar dan harga wajib diisi.', 'warning');
        }

        try {
            const headers = await getHeaders();
            const roomId = selectedRoom?.uuid || selectedRoom?.id;

            await axios.post(
                `${API_URL}/admin/rooms/${roomId}`,
                {
                    ...form,
                    price: parseInt(form.price.toString().replace(/\D/g, '')),
                    capacity: parseInt(form.capacity) || 1,
                    size: form.size ? parseFloat(form.size) : null,
                },
                { headers }
            );

            showAlert('Berhasil', 'Data kamar berhasil diperbarui.', 'success', fetchRooms);
            setEditVisible(false);
        } catch (e) {
            console.log('Save Room Error:', e.response?.data || e.message);
            const msg = e.response?.data?.message || 'Gagal menyimpan data kamar.';
            showAlert('Gagal', msg, 'error');
        }
    };

    const handleStatusChange = async (room, newStatus) => {
        try {
            const headers = await getHeaders();
            const roomId = room.uuid || room.id;
            await axios.put(`${API_URL}/admin/rooms/${roomId}/status`, { status: newStatus }, { headers });

            showAlert('Berhasil', `Status kamar diubah ke ${STATUS_CONFIG[newStatus]?.label || newStatus}`, 'success', () => {
                fetchRooms();
                setSelectedRoom((prev) => ({ ...prev, status: newStatus }));
            });
        } catch (e) {
            showAlert('Gagal', e.response?.data?.message || 'Gagal mengubah status kamar.', 'error');
        }
    };

    const filteredRooms = rooms.filter((r) => {
        if (filterStatus === 'all') return true;
        return r.status === filterStatus;
    });

    const renderItem = ({ item }) => {
        const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.available;
        const tenantName = item.active_tenant?.name || item.active_tenant?.user?.name;

        return (
            <TouchableOpacity style={styles.card} onPress={() => openDetail(item)} activeOpacity={0.8}>
                <View style={styles.cardLeft}>
                    <View style={styles.roomIcon}>
                        <Ionicons name="bed" size={22} color="#1e3a8a" />
                    </View>
                    <View style={{ marginLeft: 14, flex: 1 }}>
                        <Text style={styles.roomNumber}>Kamar {item.room_number}</Text>
                        <Text style={styles.roomSub}>
                            {TYPE_LABELS[item.type] || item.type} • {formatRupiah(item.price)}
                        </Text>
                        <Text style={[styles.tenantName, { color: tenantName ? '#4e73df' : '#94a3b8' }]}>
                            {tenantName ? `Penghuni: ${tenantName}` : 'Belum Ada Penghuni'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.text }]}>{st.label}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailRow = (label, value) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || '-'}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#1e3a8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.headerTitle}>Kelola Kamar</Text>
                        <Text style={styles.headerSub}>Total: {rooms.length} Kamar Unit</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterRow}>
                    {[
                        { key: 'all', label: 'Semua' },
                        { key: 'available', label: 'Tersedia' },
                        { key: 'occupied', label: 'Terisi' },
                        { key: 'maintenance', label: 'Maintenance' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.filterTab,
                                filterStatus === tab.key && styles.filterTabActive,
                            ]}
                            onPress={() => setFilterStatus(tab.key)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    filterStatus === tab.key && styles.filterTabTextActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            {loading ? (
                <LoadingScreen
                    title="Data Kamar"
                    message="Memuat informasi kamar kos..."
                    icon="bed-outline"
                    fullscreen={false}
                />
            ) : (
                <FlatList
                    data={filteredRooms}
                    keyExtractor={(item) => (item.uuid || item.id || Math.random()).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="bed-outline" size={56} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>Kamar Tidak Ditemukan</Text>
                            <Text style={styles.emptySubtitle}>Tidak ada kamar dengan status yang dipilih.</Text>
                        </View>
                    }
                />
            )}

            {/* DETAIL MODAL */}
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.detailContainer, { paddingBottom: insets.bottom + 16 }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.detailHeader}>
                                <View style={styles.roomIconBig}>
                                    <Ionicons name="business" size={28} color="#1e3a8a" />
                                </View>
                                <Text style={styles.detailTitle}>Kamar {selectedRoom?.room_number}</Text>
                                {selectedRoom?.status ? (
                                    <View
                                        style={[
                                            styles.badge,
                                            {
                                                backgroundColor:
                                                    STATUS_CONFIG[selectedRoom.status]?.bg || '#ecfdf5',
                                                paddingHorizontal: 14,
                                                paddingVertical: 4,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                fontWeight: 'bold',
                                                fontSize: 12,
                                                color: STATUS_CONFIG[selectedRoom.status]?.text || '#10b981',
                                            }}
                                        >
                                            {STATUS_CONFIG[selectedRoom.status]?.label ||
                                                selectedRoom.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.detailBody}>
                                {renderDetailRow('Tipe Kamar', TYPE_LABELS[selectedRoom?.type] || selectedRoom?.type)}
                                {renderDetailRow('Harga Sewa', formatRupiah(selectedRoom?.price))}
                                {renderDetailRow('Kapasitas', selectedRoom?.capacity ? `${selectedRoom.capacity} Orang` : '-')}
                                {renderDetailRow('Luas Kamar', selectedRoom?.size ? `${selectedRoom.size} m²` : '-')}
                                {renderDetailRow('Penghuni Saat Ini', selectedRoom?.active_tenant?.name || selectedRoom?.active_tenant?.user?.name || 'Kosong')}
                                {renderDetailRow('Deskripsi / Fasilitas', selectedRoom?.description)}
                            </View>

                            {/* Status Quick Switch */}
                            <Text style={styles.statusSwitchLabel}>Ubah Status Kamar:</Text>
                            <View style={styles.statusSwitchRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.statusSwitchBtn,
                                        selectedRoom?.status === 'available' && styles.statusSwitchBtnActive,
                                    ]}
                                    onPress={() => handleStatusChange(selectedRoom, 'available')}
                                >
                                    <Text
                                        style={[
                                            styles.statusSwitchText,
                                            selectedRoom?.status === 'available' && styles.statusSwitchTextActive,
                                        ]}
                                    >
                                        Tersedia
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.statusSwitchBtn,
                                        selectedRoom?.status === 'maintenance' && styles.statusSwitchBtnActive,
                                    ]}
                                    onPress={() => handleStatusChange(selectedRoom, 'maintenance')}
                                >
                                    <Text
                                        style={[
                                            styles.statusSwitchText,
                                            selectedRoom?.status === 'maintenance' && styles.statusSwitchTextActive,
                                        ]}
                                    >
                                        Maintenance
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={styles.detailActions}>
                            <TouchableOpacity
                                style={[styles.detailBtn, { backgroundColor: '#1e3a8a' }]}
                                onPress={() => openEdit(selectedRoom)}
                            >
                                <Ionicons name="create-outline" size={18} color="white" />
                                <Text style={styles.detailBtnText}>Edit Info</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.detailBtn, { backgroundColor: '#64748b' }]}
                                onPress={() => setDetailVisible(false)}
                            >
                                <Ionicons name="close" size={18} color="white" />
                                <Text style={styles.detailBtnText}>Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* EDIT MODAL */}
            <Modal visible={editVisible} animationType="slide">
                <View style={[styles.modalFull, { paddingTop: insets.top }]}>
                    <View style={styles.modalFullHeader}>
                        <Text style={styles.modalFullTitle}>Edit Kamar {selectedRoom?.room_number}</Text>
                        <TouchableOpacity onPress={() => setEditVisible(false)}>
                            <Ionicons name="close" size={26} color="#334155" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ paddingHorizontal: 20 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.formLabel}>Nomor Kamar *</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="Contoh: 101"
                            placeholderTextColor="#94a3b8"
                            value={form.room_number}
                            onChangeText={(v) => setForm({ ...form, room_number: v })}
                        />

                        <Text style={styles.formLabel}>Tipe Kamar</Text>
                        <View style={styles.typeRow}>
                            {[
                                { key: 'singleac', label: 'Single AC' },
                                { key: 'singlenoac', label: 'Single Non-AC' },
                                { key: 'shared', label: 'Campur' },
                            ].map((t) => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[
                                        styles.typeChip,
                                        form.type === t.key && styles.typeChipActive,
                                    ]}
                                    onPress={() => setForm({ ...form, type: t.key })}
                                >
                                    <Text
                                        style={[
                                            styles.typeChipText,
                                            form.type === t.key && styles.typeChipTextActive,
                                        ]}
                                    >
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.formLabel}>Harga Sewa Per Bulan (Rp) *</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={form.price ? parseInt(form.price).toLocaleString('id-ID') : ''}
                            onChangeText={(v) => {
                                const raw = v.replace(/\D/g, '');
                                setForm({ ...form, price: raw });
                            }}
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>Kapasitas (Orang)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="1"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={form.capacity}
                                    onChangeText={(v) => setForm({ ...form, capacity: v })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>Luas (m²)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="12"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={form.size}
                                    onChangeText={(v) => setForm({ ...form, size: v })}
                                />
                            </View>
                        </View>

                        <Text style={styles.formLabel}>Deskripsi & Fasilitas</Text>
                        <TextInput
                            style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Contoh: Kamar mandi dalam, springbed, lemari baju..."
                            placeholderTextColor="#94a3b8"
                            value={form.description}
                            onChangeText={(v) => setForm({ ...form, description: v })}
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>SIMPAN PERUBAHAN</Text>
                        </TouchableOpacity>

                        <View style={{ height: insets.bottom + 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                onConfirm={alertConfig.onConfirm}
            />
        </View>
    );
}
