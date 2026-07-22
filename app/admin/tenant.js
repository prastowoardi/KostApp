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
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ManageTenant() {
    const router = useRouter();
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });
    const [tenants, setTenants] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [roomModalVisible, setRoomModalVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const [form, setForm] = useState({
        name: '', email: '', password: 'password123',
        room_id: '', phone: '', id_card: '', address: '',
        entry_date: new Date().toISOString().split('T')[0],
        emergency_contact_name: '', emergency_contact_phone: ''
    });

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const headers = { 
                Authorization: `Bearer ${token}`,
                "ngrok-skip-browser-warning": "69420"
            };
            const [resTenants, resRooms, resAllRooms] = await Promise.all([
                axios.get(`${API_URL}/admin/tenants`, { headers }),
                axios.get(`${API_URL}/admin/rooms/available`, { headers }),
                axios.get(`${API_URL}/admin/rooms`, { headers }).catch(() => null)
            ]);
            setTenants(resTenants.data);
            setRooms(resRooms.data);
            if (resAllRooms) setAllRooms(resAllRooms.data || resAllRooms);
        } catch (error) {
            console.log("Error fetch:", error);
            Alert.alert("Error", "Gagal mengambil data dari server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setForm({
            name: '', email: '', password: 'password123',
            room_id: '', phone: '', id_card: '', address: '',
            entry_date: new Date().toISOString().split('T')[0],
            emergency_contact_name: '', emergency_contact_phone: ''
        });
    };

    const openAddModal = () => {
        setEditMode(false);
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (tenant) => {
        setEditMode(true);
        setForm({
            name: tenant.name || tenant.user?.name || '',
            email: tenant.email || tenant.user?.email || '',
            password: '',
            room_id: tenant.room_id || tenant.room?.id || '',
            phone: tenant.phone || '',
            id_card: tenant.id_card || '',
            address: tenant.address || '',
            entry_date: tenant.entry_date ? tenant.entry_date.split('T')[0] : new Date().toISOString().split('T')[0],
            emergency_contact_name: tenant.emergency_contact_name || '',
            emergency_contact_phone: tenant.emergency_contact_phone || ''
        });
        setDetailVisible(false);
        setModalVisible(true);
    };

    const handleSave = async () => {
        const requiredFields = {
            room_id: "Kamar belum dipilih",
            name: "Nama lengkap wajib diisi",
            email: "Email wajib diisi",
            phone: "Nomor telepon wajib diisi",
            id_card: "Nomor KTP wajib diisi"
        };

        for (const [key, msg] of Object.entries(requiredFields)) {
            if (!form[key]) {
                return showAlert("Data Belum Lengkap", msg, "warning");
            }
        }

        if (!form.email.includes('@')) {
            return showAlert("Email Salah", "Format email tidak valid", "warning");
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const headers = { 
                Authorization: `Bearer ${token}`,
                "ngrok-skip-browser-warning": "69420"
            };

            if (editMode) {
                const tenantId = selectedTenant?.id || selectedTenant?.uuid;
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await axios.post(`${API_URL}/admin/tenants/update/${tenantId}`, payload, { headers });
                showAlert("Berhasil!", "Data penyewa sudah diperbarui.", "success");
            } else {
                await axios.post(`${API_URL}/admin/tenants/store`, form, { headers });
                showAlert("Berhasil!", "Data penyewa sudah tersimpan.", "success");
            }

            setModalVisible(false);
            resetForm();
            fetchData();
        } catch (e) {
            console.log("Error detail:", e.response?.data);
            const serverMessage = e.response?.data?.message;
            showAlert("Gagal Simpan", serverMessage || "Server lagi pusing, coba lagi nanti.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (tenant) => {
        setAlertConfig({
            visible: true,
            title: "Hapus Penyewa",
            message: `Yakin ingin menghapus *${tenant.name || tenant.user?.name}*?`,
            type: 'confirmation',
            onConfirm: async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    const tenantId = tenant.id || tenant.uuid;
                    await axios.post(`${API_URL}/admin/tenants/delete/${tenantId}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setDetailVisible(false);
                    setSelectedTenant(null);
                    showAlert("Berhasil", "Penyewa berhasil dihapus.", "success");
                    fetchData();
                } catch (e) {
                    showAlert("Gagal", e.response?.data?.message || "Gagal menghapus data.", "error");
                }
                setAlertConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    const roomList = editMode ? (allRooms.length ? allRooms : rooms) : rooms;

    const renderTenantItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                setSelectedTenant(item);
                setDetailVisible(true);
            }}
        >
            <View style={styles.cardInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.name || item.user?.name || "U").charAt(0)}</Text>
                </View>
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.name}>{item.name || item.user?.name}</Text>
                    <Text style={styles.sub}>
                        Kamar {item.room?.room_number || '??'} • {item.phone}
                    </Text>
                </View>
            </View>
            <View style={[styles.badge, { backgroundColor: item.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
                <Text style={{ color: item.status === 'active' ? '#2e7d32' : '#c62828', fontSize: 10, fontWeight: 'bold' }}>
                    {item.status?.toUpperCase()}
                </Text>
            </View>
        </TouchableOpacity>
    );

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
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={styles.backBtn}
                        >
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </TouchableOpacity>

                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.headerTitle}>Manajemen Tenant</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                                Total: {tenants.length} Penghuni
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
                        <Ionicons name="person-add" size={16} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 5 }}>Tambah</Text>
                    </TouchableOpacity>
                </View> 
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#b21f1f" />
                </View>
            ) : (
                <FlatList
                    data={tenants}
                    keyExtractor={(item) => (item.id || item.uuid).toString()}
                    renderItem={renderTenantItem}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Belum ada data tenant.</Text>}
                    onRefresh={fetchData}
                    refreshing={loading}
                />
            )}

            {/* Detail Modal */}
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View style={styles.detailOverlay}>
                    <View style={styles.detailContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.detailHeader}>
                                <View style={[styles.avatar, { width: 60, height: 60, borderRadius: 30 }]}>
                                    <Text style={[styles.avatarText, { fontSize: 24 }]}>
                                        {(selectedTenant?.name || selectedTenant?.user?.name || "U").charAt(0)}
                                    </Text>
                                </View>
                                <Text style={styles.detailName}>{selectedTenant?.name || selectedTenant?.user?.name}</Text>
                                <View style={[styles.badge, { 
                                    backgroundColor: selectedTenant?.status === 'active' ? '#e8f5e9' : '#ffebee',
                                    paddingHorizontal: 16, paddingVertical: 6
                                }]}>
                                    <Text style={{ 
                                        color: selectedTenant?.status === 'active' ? '#2e7d32' : '#c62828',
                                        fontWeight: 'bold', fontSize: 12
                                    }}>
                                        {selectedTenant?.status?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailBody}>
                                {renderDetailValue('Email', selectedTenant?.email || selectedTenant?.user?.email)}
                                {renderDetailValue('No. Telepon', selectedTenant?.phone)}
                                {renderDetailValue('Kamar', selectedTenant?.room?.room_number ? `Kamar ${selectedTenant.room.room_number}` : '-')}
                                {renderDetailValue('No. KTP', selectedTenant?.id_card)}
                                {renderDetailValue('Alamat', selectedTenant?.address)}
                                {renderDetailValue('Tanggal Masuk', selectedTenant?.entry_date ? new Date(selectedTenant.entry_date).toLocaleDateString('id-ID') : '-')}
                                {renderDetailValue('Kontak Darurat', selectedTenant?.emergency_contact_name)}
                                {renderDetailValue('No. HP Darurat', selectedTenant?.emergency_contact_phone)}
                            </View>
                        </ScrollView>

                        <View style={styles.detailActions}>
                            <TouchableOpacity 
                                style={[styles.detailBtn, { backgroundColor: '#e74a3b' }]} 
                                onPress={() => handleDelete(selectedTenant)}
                            >
                                <Ionicons name="trash-outline" size={18} color="white" />
                                <Text style={styles.detailBtnText}>Hapus</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.detailBtn, { backgroundColor: '#1a2a6c' }]} 
                                onPress={() => openEditModal(selectedTenant)}
                            >
                                <Ionicons name="create-outline" size={18} color="white" />
                                <Text style={styles.detailBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.detailBtn, { backgroundColor: '#95a5a6' }]} 
                                onPress={() => setDetailVisible(false)}
                            >
                                <Ionicons name="close-outline" size={18} color="white" />
                                <Text style={styles.detailBtnText}>Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Tambah / Edit Tenant */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={{flex: 1, backgroundColor: '#fff'}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editMode ? 'Edit Penghuni' : 'Tambah Penghuni'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{padding: 20}}>
                        <Text style={styles.label}>Pilih Kamar</Text>
                        <TouchableOpacity 
                            style={styles.customPickerTrigger} 
                            onPress={() => setRoomModalVisible(true)}
                        >
                            <Text style={{ color: form.room_id ? '#333' : '#999' }}>
                                {form.room_id 
                                    ? `Kamar ${roomList.find(r => r.id === form.room_id)?.room_number}` 
                                    : "Klik untuk memilih kamar..."}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        <Text style={styles.label}>Nama Lengkap</Text>
                        <TextInput style={[styles.input, { color: 'black' }]} 
                            placeholder="Contoh: Budi Santoso" 
                            placeholderTextColor="black"
                            value={form.name}
                            onChangeText={(v) => setForm({...form, name: v})} 
                        />

                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{width: '48%'}}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput style={[styles.input, { color: 'black' }]}
                                    placeholder="budi@mail.com"
                                    placeholderTextColor="black"
                                    autoCapitalize="none"
                                    value={form.email}
                                    onChangeText={(v) => setForm({...form, email: v})} 
                                />
                            </View>
                            <View style={{width: '48%'}}>
                                <Text style={styles.label}>No. Telepon</Text>
                                <TextInput style={[styles.input, { color: 'black' }]}
                                    placeholder="0812..."
                                    placeholderTextColor="black"
                                    keyboardType="phone-pad"
                                    value={form.phone}
                                    onChangeText={(v) => setForm({...form, phone: v})} 
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>No. KTP</Text>
                        <TextInput style={[styles.input, { color: 'black' }]}
                            placeholder="3201..."
                            placeholderTextColor="black"
                            keyboardType="numeric"
                            value={form.id_card}
                            onChangeText={(v) => setForm({...form, id_card: v})} 
                        />

                        <Text style={styles.label}>Alamat Asal</Text>
                        <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top', color: 'black' }]}
                            multiline
                            placeholder="Alamat lengkap sesuai KTP"
                            placeholderTextColor="black"
                            value={form.address}
                            onChangeText={(v) => setForm({...form, address: v})} 
                        />

                        <Text style={styles.label}>Tanggal Masuk</Text>
                        <TextInput style={[styles.input, { color: 'black' }]} 
                            value={form.entry_date} 
                            onChangeText={(v) => setForm({...form, entry_date: v})} 
                        />

                        {editMode && (
                            <>
                                <Text style={styles.label}>Password Baru (kosongkan jika tidak diubah)</Text>
                                <TextInput style={[styles.input, { color: 'black' }]}
                                    placeholder="Biarkan kosong jika tidak ingin ganti"
                                    placeholderTextColor="#999"
                                    secureTextEntry
                                    value={form.password}
                                    onChangeText={(v) => setForm({...form, password: v})} 
                                />
                            </>
                        )}

                        <View style={styles.divider} />
                        <Text style={styles.sectionSub}>Kontak Darurat</Text>
                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.label}>Nama Hubungan</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Contoh: Ibu Kandung / Ayah"
                                placeholderTextColor="black"
                                value={form.emergency_contact_name}
                                onChangeText={(v) => setForm({...form, emergency_contact_name: v})} 
                            />
                        </View>
                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.label}>No. HP Darurat</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="0813..."
                                placeholderTextColor="black"
                                keyboardType="phone-pad" 
                                value={form.emergency_contact_phone}
                                onChangeText={(v) => setForm({...form, emergency_contact_phone: v})} 
                            />
                        </View>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={{color:'white', fontWeight:'bold', fontSize: 16}}>
                                {editMode ? 'SIMPAN PERUBAHAN' : 'SIMPAN DATA'}
                            </Text>
                        </TouchableOpacity>
                        <View style={{height: 50}} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal Pilihan Kamar */}
            <Modal visible={roomModalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.roomListContainer}>
                        <Text style={styles.modalTitle}>
                            {editMode ? 'Pilih Kamar' : 'Pilih Kamar Tersedia'}
                        </Text>
                        <FlatList
                            data={roomList}
                            keyExtractor={(item) => (item.id || item.uuid).toString()}
                            renderItem={({item}) => (
                                <TouchableOpacity 
                                    style={styles.roomItem}
                                    onPress={() => {
                                        setForm({...form, room_id: item.id || item.uuid});
                                        setRoomModalVisible(false);
                                    }}
                                >
                                    <Ionicons name="business" size={24} color="#1a2a6c" />
                                    <View style={{marginLeft: 15}}>
                                        <Text style={{fontWeight: 'bold', fontSize: 16}}>Kamar {item.room_number}</Text>
                                        <Text style={{color: '#666', fontSize: 12}}>Rp {item.price?.toLocaleString()} • {item.status || item.room_status}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{textAlign:'center', padding: 20}}>Tidak ada kamar tersedia.</Text>}
                        />
                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setRoomModalVisible(false)}>
                            <Text style={{color: '#b21f1f', fontWeight: 'bold'}}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <GlobalAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                onConfirm={alertConfig.onConfirm}
                isConfirmation={alertConfig.type === 'confirmation'}
                confirmText={alertConfig.type === 'confirmation' ? "Ya, Hapus" : "OK"}
                cancelText="Batal"
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
    addBtn: { backgroundColor: '#2ecc71', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, alignItems: 'center', elevation: 3 },

    card: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    cardInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#1a2a6c', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    name: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
    sub: { color: '#7f8c8d', fontSize: 13, marginTop: 2 },
    badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },

    emptyText: { textAlign: 'center', marginTop: 50, color: '#95a5a6' },

    /* Detail Modal */
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    detailContainer: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
    detailHeader: { alignItems: 'center', marginBottom: 20 },
    detailName: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginTop: 12, marginBottom: 8 },
    detailBody: { marginBottom: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f3f9' },
    detailLabel: { fontSize: 14, color: '#7f8c8d', flex: 1 },
    detailValue: { fontSize: 14, color: '#2c3e50', fontWeight: '600', flex: 1.5, textAlign: 'right' },
    detailActions: { flexDirection: 'row', gap: 10 },
    detailBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    detailBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },

    /* Form Modal */
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a2a6c' },
    label: { fontSize: 13, fontWeight: 'bold', marginTop: 18, marginBottom: 8, color: '#34495e' },
    input: { backgroundColor: '#f1f3f9', borderRadius: 12, padding: 14, color: 'black', fontSize: 15, borderWidth: 1, borderColor: '#e1e8ef' },
    customPickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f3f9', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e1e8ef' },
    saveBtn: { backgroundColor: '#1a2a6c', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 3 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 25 },
    sectionSub: { fontSize: 14, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 10 },

    /* Room Picker */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    roomListContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '80%' },
    roomItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    closeModalBtn: { marginTop: 15, padding: 10, alignItems: 'center' }
});