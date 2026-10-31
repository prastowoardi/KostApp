import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../components/GlobalAlert';
import { API_URL } from '../../helpers/api';
import { formatRupiah, formatDate } from '../../helpers/formatters';
import styles from '../../styles/adminTenant.styles';

export default function ManageTenant() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {},
    });

    const [tenants, setTenants] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [roomModalVisible, setRoomModalVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successTenantData, setSuccessTenantData] = useState(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: 'password123',
        room_id: '',
        phone: '',
        id_card: '',
        address: '',
        entry_date: new Date().toISOString().split('T')[0],
        emergency_contact_name: '',
        emergency_contact_phone: '',
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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const headers = {
                Authorization: `Bearer ${cleanToken}`,
                Accept: 'application/json',
            };

            const [resTenants, resRooms, resAllRooms] = await Promise.all([
                axios.get(`${API_URL}/admin/tenants`, { headers }),
                axios.get(`${API_URL}/admin/rooms/available`, { headers }),
                axios.get(`${API_URL}/admin/rooms`, { headers }).catch(() => null),
            ]);

            setTenants(resTenants.data?.data || resTenants.data || []);
            setRooms(resRooms.data?.data || resRooms.data || []);
            if (resAllRooms) setAllRooms(resAllRooms.data?.data || resAllRooms.data || []);
        } catch (error) {
            console.log('Error fetch tenants:', error);
            Alert.alert('Error', 'Gagal mengambil data dari server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = () => {
        setForm({
            name: '',
            email: '',
            password: 'password123',
            room_id: '',
            phone: '',
            id_card: '',
            address: '',
            entry_date: new Date().toISOString().split('T')[0],
            emergency_contact_name: '',
            emergency_contact_phone: '',
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
            room_id: tenant.room?.uuid || tenant.room_id || '',
            phone: tenant.phone || '',
            id_card: tenant.id_card || '',
            address: tenant.address || '',
            entry_date: tenant.entry_date ? tenant.entry_date.split('T')[0] : new Date().toISOString().split('T')[0],
            emergency_contact_name: tenant.emergency_contact_name || '',
            emergency_contact_phone: tenant.emergency_contact_phone || '',
        });
        setDetailVisible(false);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.room_id) return showAlert('Data Belum Lengkap', 'Silakan pilih kamar terlebih dahulu.', 'warning');
        if (!form.name.trim()) return showAlert('Data Belum Lengkap', 'Nama lengkap wajib diisi.', 'warning');
        if (!form.email.trim() || !form.email.includes('@')) {
            return showAlert('Email Tidak Valid', 'Masukkan format email yang benar.', 'warning');
        }
        if (!form.phone.trim()) return showAlert('Data Belum Lengkap', 'Nomor telepon wajib diisi.', 'warning');
        if (!form.id_card.trim()) return showAlert('Data Belum Lengkap', 'Nomor KTP wajib diisi.', 'warning');

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const headers = {
                Authorization: `Bearer ${cleanToken}`,
                Accept: 'application/json',
            };

            if (editMode) {
                // Must use UUID for update/{uuid}
                const tenantId = selectedTenant?.uuid || selectedTenant?.id;
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await axios.post(`${API_URL}/admin/tenants/update/${tenantId}`, payload, { headers });
                showAlert('Berhasil', 'Data penghuni berhasil diperbarui.', 'success');
                setModalVisible(false);
                resetForm();
                fetchData();
            } else {
                const res = await axios.post(`${API_URL}/admin/tenants/store`, form, { headers });
                const created = res.data?.data;
                const roomObj = rooms.find((r) => (r.uuid || r.id) === form.room_id) || allRooms.find((r) => (r.uuid || r.id) === form.room_id);
                const roomNumber = created?.room?.room_number || roomObj?.room_number || '-';

                setSuccessTenantData({
                    name: created?.name || form.name,
                    roomNumber,
                    phone: created?.phone || form.phone,
                    email: created?.email || form.email,
                    waUrl: res.data?.wa_url,
                    messageText: res.data?.message_text,
                });

                setModalVisible(false);
                resetForm();
                fetchData();
                setShowSuccessModal(true);
            }
        } catch (e) {
            console.log('Error save tenant:', e.response?.data || e.message);
            const serverMessage = e.response?.data?.message || 'Gagal menyimpan data tenant.';
            showAlert('Gagal Simpan', serverMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (tenant) => {
        const tenantName = tenant.name || tenant.user?.name || 'Penghuni';
        setAlertConfig({
            visible: true,
            title: 'Hapus Penghuni',
            message: `Apakah Anda yakin ingin menghapus data penghuni *${tenantName}*? Akun dan data terkait akan dinonaktifkan.`,
            type: 'confirmation',
            onConfirm: async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    const cleanToken = token ? token.replace(/"/g, '').trim() : '';
                    const tenantId = tenant.uuid || tenant.id;
                    await axios.post(
                        `${API_URL}/admin/tenants/delete/${tenantId}`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${cleanToken}`,
                                Accept: 'application/json',
                            },
                        }
                    );
                    setDetailVisible(false);
                    setSelectedTenant(null);
                    showAlert('Berhasil', 'Data penghuni berhasil dihapus.', 'success', fetchData);
                } catch (e) {
                    showAlert('Gagal', e.response?.data?.message || 'Gagal menghapus data.', 'error');
                }
            },
        });
    };

    const fetchPayments = async (tenant) => {
        if (!tenant) return;
        setDetailVisible(false);
        setPaymentLoading(true);
        setPaymentModalVisible(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const tenantId = tenant.uuid || tenant.id;
            const res = await axios.get(`${API_URL}/admin/tenants/${tenantId}/payments`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });
            setPaymentHistory(res.data?.data || []);
        } catch (e) {
            console.log('Error fetch payments:', e);
            setPaymentHistory([]);
        } finally {
            setPaymentLoading(false);
        }
    };

    const roomList = editMode ? (allRooms.length ? allRooms : rooms) : rooms;

    const filteredTenants = tenants.filter((item) => {
        const name = (item.name || item.user?.name || '').toLowerCase();
        const room = (item.room?.room_number || '').toLowerCase();
        const phone = (item.phone || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || room.includes(q) || phone.includes(q);
    });

    const renderTenantItem = ({ item }) => {
        const name = item.name || item.user?.name || 'Tanpa Nama';
        const isActive = item.status === 'active';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    setSelectedTenant(item);
                    setDetailVisible(true);
                }}
                activeOpacity={0.8}
            >
                <View style={styles.cardInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ marginLeft: 14, flex: 1 }}>
                        <Text style={styles.name} numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={styles.sub}>
                            Kamar {item.room?.room_number || '-'} • {item.phone || '-'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: isActive ? '#ecfdf5' : '#fef2f2' }]}>
                    <Text style={{ color: isActive ? '#10b981' : '#ef4444', fontSize: 11, fontWeight: '700' }}>
                        {isActive ? 'AKTIF' : 'NONAKTIF'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailRow = (label, value, isPhone = false) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            {isPhone && value ? (
                <TouchableOpacity
                    onPress={() => {
                        const cleanPhone = value.replace(/\D/g, '');
                        const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                        Linking.openURL(`https://wa.me/${waPhone}`);
                    }}
                    style={styles.phoneLink}
                >
                    <Ionicons name="logo-whatsapp" size={16} color="#10b981" />
                    <Text style={[styles.detailValue, { color: '#10b981' }]}>{value}</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.detailValue}>{value || '-'}</Text>
            )}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.headerTitle}>Kelola Penghuni</Text>
                            <Text style={styles.headerSub}>Total: {tenants.length} Orang</Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={openAddModal} style={styles.addBtn} activeOpacity={0.8}>
                        <Ionicons name="person-add" size={16} color="white" />
                        <Text style={styles.addBtnText}>Tambah</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={18} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari penghuni atau nomor kamar..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1e3a8a" />
                    <Text style={styles.loadingText}>Memuat data penghuni...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTenants}
                    keyExtractor={(item) => (item.uuid || item.id || Math.random()).toString()}
                    renderItem={renderTenantItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchData}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={56} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>Penghuni Tidak Ditemukan</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery ? 'Coba cari dengan kata kunci lain.' : 'Belum ada penghuni terdaftar.'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* DETAIL MODAL */}
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View style={styles.detailOverlay}>
                    <View style={[styles.detailContainer, { paddingBottom: insets.bottom + 16 }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.detailHeader}>
                                <View style={styles.avatarBig}>
                                    <Text style={styles.avatarBigText}>
                                        {(selectedTenant?.name || selectedTenant?.user?.name || 'U')
                                            .charAt(0)
                                            .toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.detailName}>
                                    {selectedTenant?.name || selectedTenant?.user?.name}
                                </Text>
                                <View
                                    style={[
                                        styles.badge,
                                        {
                                            backgroundColor:
                                                selectedTenant?.status === 'active' ? '#ecfdf5' : '#fef2f2',
                                            paddingHorizontal: 12,
                                            paddingVertical: 4,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color: selectedTenant?.status === 'active' ? '#10b981' : '#ef4444',
                                            fontWeight: '700',
                                            fontSize: 12,
                                        }}
                                    >
                                        {selectedTenant?.status === 'active' ? 'AKTIF' : 'NONAKTIF'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailBody}>
                                {renderDetailRow('Kamar', selectedTenant?.room?.room_number ? `Kamar ${selectedTenant.room.room_number}` : '-')}
                                {renderDetailRow('Email', selectedTenant?.email || selectedTenant?.user?.email)}
                                {renderDetailRow('No. Telepon / WA', selectedTenant?.phone, true)}
                                {renderDetailRow('No. KTP', selectedTenant?.id_card)}
                                {renderDetailRow('Alamat Asal', selectedTenant?.address)}
                                {renderDetailRow('Tanggal Masuk', formatDate(selectedTenant?.entry_date))}
                                {renderDetailRow('Kontak Darurat', selectedTenant?.emergency_contact_name)}
                                {renderDetailRow('No. HP Darurat', selectedTenant?.emergency_contact_phone, true)}
                            </View>
                        </ScrollView>

                        <View style={styles.detailActions}>
                            <TouchableOpacity
                                style={[styles.detailBtn, { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 }]}
                                onPress={() => handleDelete(selectedTenant)}
                            >
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                <Text style={[styles.detailBtnText, { color: '#ef4444' }]}>Hapus</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.detailBtn, { backgroundColor: '#1e3a8a' }]}
                                onPress={() => openEditModal(selectedTenant)}
                            >
                                <Ionicons name="create-outline" size={18} color="white" />
                                <Text style={styles.detailBtnText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.detailBtn, { backgroundColor: '#f59e0b' }]}
                                onPress={() => fetchPayments(selectedTenant)}
                            >
                                <Ionicons name="receipt-outline" size={18} color="white" />
                                <Text style={styles.detailBtnText}>Histori</Text>
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

            {/* PAYMENT HISTORY MODAL */}
            <Modal visible={paymentModalVisible} animationType="slide" transparent>
                <View style={styles.detailOverlay}>
                    <View style={[styles.detailContainer, { minHeight: '55%', paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.detailHeader}>
                            <Ionicons name="receipt-outline" size={32} color="#1e3a8a" />
                            <Text style={styles.detailName}>Riwayat Pembayaran</Text>
                            <Text style={styles.detailSub}>
                                {selectedTenant?.name || selectedTenant?.user?.name}
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            {paymentLoading ? (
                                <ActivityIndicator size="large" color="#1e3a8a" style={{ marginVertical: 40 }} />
                            ) : paymentHistory.length === 0 ? (
                                <View style={{ alignItems: 'center', marginVertical: 40 }}>
                                    <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                                    <Text style={{ color: '#94a3b8', marginTop: 10 }}>Belum ada catatan pembayaran</Text>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {paymentHistory.map((p, i) => {
                                        const isPaid = p.status === 'paid' || p.status === 'success' || p.status === 'lunas';
                                        return (
                                            <View key={p.uuid || i} style={styles.paymentCard}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.invoiceText}>#{p.invoice_number || 'INV'}</Text>
                                                    <Text style={styles.periodText}>
                                                        Periode: {p.period_month ? formatDate(p.period_month) : '-'}
                                                    </Text>
                                                    <Text style={styles.paymentAmount}>
                                                        {formatRupiah(p.total || p.amount)}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.badge,
                                                        { backgroundColor: isPaid ? '#ecfdf5' : '#fffbeb' },
                                                    ]}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 'bold',
                                                            color: isPaid ? '#10b981' : '#f59e0b',
                                                        }}
                                                    >
                                                        {isPaid ? 'LUNAS' : 'PENDING'}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: '#1e3a8a', marginTop: 12 }]}
                            onPress={() => setPaymentModalVisible(false)}
                        >
                            <Text style={styles.saveBtnText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ADD / EDIT MODAL */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={[styles.modalFull, { paddingTop: insets.top }]}>
                    <View style={styles.modalFullHeader}>
                        <Text style={styles.modalFullTitle}>
                            {editMode ? 'Edit Data Penghuni' : 'Tambah Penghuni Baru'}
                        </Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={26} color="#334155" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ paddingHorizontal: 20 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.formLabel}>Pilih Kamar *</Text>
                        <TouchableOpacity
                            style={styles.pickerTrigger}
                            onPress={() => setRoomModalVisible(true)}
                        >
                            <Ionicons name="bed-outline" size={20} color="#4e73df" />
                            <Text style={{ flex: 1, marginLeft: 10, color: form.room_id ? '#1e293b' : '#94a3b8' }}>
                                {form.room_id
                                    ? `Kamar ${roomList.find((r) => (r.uuid || r.id) === form.room_id)?.room_number || '-'}`
                                    : 'Klik untuk memilih kamar kost...'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                        </TouchableOpacity>

                        <Text style={styles.formLabel}>Nama Lengkap *</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="Contoh: Budi Santoso"
                            placeholderTextColor="#94a3b8"
                            value={form.name}
                            onChangeText={(v) => setForm({ ...form, name: v })}
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>Email *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="budi@gmail.com"
                                    placeholderTextColor="#94a3b8"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={form.email}
                                    onChangeText={(v) => setForm({ ...form, email: v })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>No. HP / WA *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="0812..."
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    value={form.phone}
                                    onChangeText={(v) => setForm({ ...form, phone: v })}
                                />
                            </View>
                        </View>

                        <Text style={styles.formLabel}>Nomor KTP *</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="3201..."
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={form.id_card}
                            onChangeText={(v) => setForm({ ...form, id_card: v })}
                        />

                        <Text style={styles.formLabel}>Alamat Asal</Text>
                        <TextInput
                            style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Alamat asal sesuai KTP"
                            placeholderTextColor="#94a3b8"
                            value={form.address}
                            onChangeText={(v) => setForm({ ...form, address: v })}
                        />

                        <Text style={styles.formLabel}>Tanggal Masuk</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#94a3b8"
                            value={form.entry_date}
                            onChangeText={(v) => setForm({ ...form, entry_date: v })}
                        />

                        {editMode ? (
                            <>
                                <Text style={styles.formLabel}>Password Baru (kosongkan jika tidak ganti)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Password baru..."
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                    value={form.password}
                                    onChangeText={(v) => setForm({ ...form, password: v })}
                                />
                            </>
                        ) : null}

                        <View style={styles.divider} />
                        <Text style={styles.sectionSubtitle}>Kontak Darurat</Text>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>Hubungan</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Orang Tua / Saudara"
                                    placeholderTextColor="#94a3b8"
                                    value={form.emergency_contact_name}
                                    onChangeText={(v) => setForm({ ...form, emergency_contact_name: v })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formLabel}>No. HP Darurat</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="0813..."
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    value={form.emergency_contact_phone}
                                    onChangeText={(v) => setForm({ ...form, emergency_contact_phone: v })}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>
                                {editMode ? 'SIMPAN PERUBAHAN' : 'DAFTARKAN PENGHUNI'}
                            </Text>
                        </TouchableOpacity>

                        <View style={{ height: insets.bottom + 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* ROOM SELECTOR MODAL */}
            <Modal visible={roomModalVisible} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.roomModalBox}>
                        <Text style={styles.roomModalTitle}>
                            {editMode ? 'Pilih Kamar' : 'Pilih Kamar Tersedia'}
                        </Text>
                        <FlatList
                            data={roomList}
                            keyExtractor={(item) => (item.uuid || item.id || Math.random()).toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.roomSelectItem}
                                    onPress={() => {
                                        // Save UUID
                                        setForm({ ...form, room_id: item.uuid || item.id });
                                        setRoomModalVisible(false);
                                    }}
                                >
                                    <View style={styles.roomItemIcon}>
                                        <Ionicons name="business" size={20} color="#1e3a8a" />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.roomNumber}>Kamar {item.room_number}</Text>
                                        <Text style={styles.roomPrice}>
                                            {formatRupiah(item.price)} • {item.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                                    Tidak ada kamar tersedia.
                                </Text>
                            }
                        />
                        <TouchableOpacity
                            style={styles.closeRoomModalBtn}
                            onPress={() => setRoomModalVisible(false)}
                        >
                            <Text style={styles.closeRoomModalText}>Batal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL SUKSES PENDAFTARAN & WHATSAPP */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.successModalBg}>
                    <View style={styles.successModalCard}>
                        <View style={styles.successIconBadge}>
                            <Ionicons name="checkmark-circle" size={50} color="#10b981" />
                        </View>
                        <Text style={styles.successModalTitle}>Penghuni Berhasil Didaftarkan!</Text>
                        <Text style={styles.successModalSubtitle}>
                            Data penghuni telah tersimpan dan bot telah menjadwalkan pesan sambutan.
                        </Text>

                        <View style={styles.strukContainer}>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Nama Penghuni</Text>
                                <Text style={styles.strukValBold}>{successTenantData?.name || '-'}</Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Nomor Kamar</Text>
                                <Text style={styles.strukVal}>Kamar {successTenantData?.roomNumber || '-'}</Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>No. WhatsApp</Text>
                                <Text style={styles.strukVal}>{successTenantData?.phone || '-'}</Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Email Login</Text>
                                <Text style={styles.strukVal}>{successTenantData?.email || '-'}</Text>
                            </View>
                        </View>

                        {/* Tombol Kirim WhatsApp */}
                        <TouchableOpacity
                            style={styles.waButton}
                            onPress={() => {
                                if (successTenantData?.waUrl) {
                                    Linking.openURL(successTenantData.waUrl).catch(() => {
                                        Alert.alert('Error', 'Gagal membuka aplikasi WhatsApp.');
                                    });
                                } else if (successTenantData?.messageText && successTenantData?.phone) {
                                    const cleanPhone = successTenantData.phone.replace(/\D/g, '');
                                    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                                    const fallbackUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(successTenantData.messageText)}`;
                                    Linking.openURL(fallbackUrl).catch(() => {
                                        Alert.alert('Error', 'Gagal membuka aplikasi WhatsApp.');
                                    });
                                } else {
                                    Alert.alert('Info', 'Tautan WhatsApp tidak tersedia.');
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-whatsapp" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.waButtonText}>Kirim Sambutan via WhatsApp</Text>
                        </TouchableOpacity>

                        {/* Tombol Selesai */}
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => {
                                setShowSuccessModal(false);
                                setSuccessTenantData(null);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.doneBtnText}>Selesai & Tutup</Text>
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
            />
        </View>
    );
}
