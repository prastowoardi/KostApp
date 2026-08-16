import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';
import ScreenHeader from '../../components/ScreenHeader';
import { API_URL } from '../../helpers/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

export default function ManageTenant() {
    const insets = useSafeAreaInsets();
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

    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(false);

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
            room_id: tenant.room?.uuid || tenant.room_id || '',
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

    const fetchPayments = async (tenant) => {
        if (!tenant) return;
        setDetailVisible(false);
        setPaymentLoading(true);
        setPaymentModalVisible(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const tenantId = tenant.id || tenant.uuid;
            const res = await axios.get(`${API_URL}/admin/tenants/${tenantId}/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPaymentHistory(res.data?.data || []);
        } catch (e) {
            console.log("Error fetch payments:", e);
            setPaymentHistory([]);
        } finally {
            setPaymentLoading(false);
        }
    };

    const roomList = editMode ? (allRooms.length ? allRooms : rooms) : rooms;

    const renderTenantItem = ({ item }) => (
        <Card className="mb-3 flex-row items-center justify-between p-4 shadow-sm" asChild>
            <TouchableOpacity
                onPress={() => {
                    setSelectedTenant(item);
                    setDetailVisible(true);
                }}
            >
                <View className="flex-row items-center">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                        <Text className="text-lg font-bold text-white">{(item.name || item.user?.name || "U").charAt(0)}</Text>
                    </View>
                    <View className="ml-4">
                        <Text className="text-base font-bold text-foreground">{item.name || item.user?.name}</Text>
                        <Text className="mt-0.5 text-[13px] text-muted-foreground">
                            Kamar {item.room?.room_number || '??'} • {item.phone}
                        </Text>
                    </View>
                </View>
                <Badge variant={item.status === 'active' ? 'success' : 'destructive'}>
                    <Text className="text-[10px] font-bold text-white">{item.status?.toUpperCase()}</Text>
                </Badge>
            </TouchableOpacity>
        </Card>
    );

    const renderDetailValue = (label, value) => (
        <View className="flex-row justify-between border-b border-border py-3">
            <Text className="flex-1 text-sm text-muted-foreground">{label}</Text>
            <Text className="flex-[1.5] text-right text-sm font-semibold text-foreground">{value || '-'}</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            <ScreenHeader
                title="Manajemen Tenant"
                subtitle={`Total: ${tenants.length} Penghuni`}
                right={
                    <TouchableOpacity onPress={openAddModal} className="flex-row items-center rounded-xl bg-success px-3.5 py-2.5 shadow-lg shadow-black/10">
                        <Ionicons name="person-add" size={16} color="white" />
                        <Text className="ml-1.5 font-bold text-white">Tambah</Text>
                    </TouchableOpacity>
                }
            />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="hsl(var(--primary))" />
                </View>
            ) : (
                <FlatList
                    data={tenants}
                    keyExtractor={(item) => (item.id || item.uuid).toString()}
                    renderItem={renderTenantItem}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text className="mt-12 text-center text-muted-foreground">Belum ada data tenant.</Text>}
                    onRefresh={fetchData}
                    refreshing={loading}
                />
            )}

            {/* Detail Modal */}
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/60">
                    <View className="max-h-[90%] rounded-t-[30px] bg-card p-6">
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="mb-5 items-center">
                                <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-primary">
                                    <Text className="text-2xl font-bold text-white">
                                        {(selectedTenant?.name || selectedTenant?.user?.name || "U").charAt(0)}
                                    </Text>
                                </View>
                                <Text className="mt-3 text-[22px] font-bold text-foreground">{selectedTenant?.name || selectedTenant?.user?.name}</Text>
                                <Badge variant={selectedTenant?.status === 'active' ? 'success' : 'destructive'} className="mt-2 px-4 py-1.5">
                                    <Text className="text-xs font-bold text-white">{selectedTenant?.status?.toUpperCase()}</Text>
                                </Badge>
                            </View>

                            <View className="mb-5">
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

                        <View className="flex-row gap-2.5">
                            <Button variant="destructive" className="flex-1" onPress={() => handleDelete(selectedTenant)}>
                                <Ionicons name="trash-outline" size={18} color="white" />
                                <Text className="ml-1.5 font-bold text-white">Hapus</Text>
                            </Button>
                            <Button className="flex-1" onPress={() => openEditModal(selectedTenant)}>
                                <Ionicons name="create-outline" size={18} color="white" />
                                <Text className="ml-1.5 font-bold text-white">Edit</Text>
                            </Button>
                            <Button variant="warning" className="flex-1" onPress={() => fetchPayments(selectedTenant)}>
                                <Ionicons name="receipt-outline" size={18} color="hsl(var(--warning-foreground))" />
                                <Text className="ml-1.5 font-bold text-warning-foreground">History</Text>
                            </Button>
                            <Button variant="secondary" className="flex-1" onPress={() => setDetailVisible(false)}>
                                <Ionicons name="close-outline" size={18} color="hsl(var(--secondary-foreground))" />
                                <Text className="ml-1.5 font-bold text-secondary-foreground">Tutup</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Payment History Modal */}
            <Modal visible={paymentModalVisible} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/60">
                    <View className="min-h-[50%] rounded-t-[30px] bg-card p-6">
                        <View className="mb-5 items-center">
                            <Ionicons name="receipt-outline" size={36} color="hsl(var(--primary))" />
                            <Text className="mt-2 text-[22px] font-bold text-foreground">Riwayat Pembayaran</Text>
                            <Text className="-mt-1 text-[13px] text-muted-foreground">
                                {selectedTenant?.name || selectedTenant?.user?.name}
                            </Text>
                        </View>

                        <View className="flex-1">
                            {paymentLoading ? (
                                <ActivityIndicator size="large" color="hsl(var(--primary))" style={{ marginVertical: 40 }} />
                            ) : paymentHistory.length === 0 ? (
                                <View className="my-10 items-center">
                                    <Ionicons name="document-text-outline" size={50} color="hsl(var(--border))" />
                                    <Text className="mt-2.5 text-muted-foreground">Belum ada riwayat pembayaran</Text>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {paymentHistory.map((p, i) => (
                                        <View key={p.uuid || i} className="mb-2.5 flex-row items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                                            <View className="flex-1">
                                                <Text className="text-sm font-bold text-foreground">#{p.invoice_number || 'INV-000'}</Text>
                                                <Text className="mt-0.5 text-xs text-muted-foreground">
                                                    {p.period_month ? new Date(p.period_month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
                                                </Text>
                                                <Text className="mt-1 text-[13px] font-semibold text-foreground">
                                                    Rp {(p.total || p.amount || 0).toLocaleString('id-ID')}
                                                </Text>
                                            </View>
                                            <Badge variant={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'destructive'} className="px-2.5 py-1.5">
                                                <Text className="text-[10px] font-bold text-white">
                                                    {p.status === 'paid' ? 'LUNAS' : p.status === 'pending' ? 'PENDING' : p.status === 'rejected' ? 'DITOLAK' : p.status?.toUpperCase()}
                                                </Text>
                                            </Badge>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        <View style={{ paddingBottom: insets.bottom }} className="flex-row justify-center">
                            <Button
                                className="px-10"
                                onPress={() => setPaymentModalVisible(false)}
                            >
                                <Text className="font-bold text-white">Tutup</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Tambah / Edit Tenant */}
            <Modal visible={modalVisible} animationType="slide">
                <View className="flex-1 bg-background">
                    <View className="flex-row items-center justify-between border-b border-border p-6">
                        <Text className="text-xl font-bold text-foreground">{editMode ? 'Edit Penghuni' : 'Tambah Penghuni'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color="hsl(var(--muted-foreground))" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-5">
                        <Label className="mb-2 mt-4 text-foreground">Pilih Kamar</Label>
                        <TouchableOpacity
                            className="flex-row items-center justify-between rounded-xl border border-border bg-background p-3.5"
                            onPress={() => setRoomModalVisible(true)}
                        >
                            <Text className={form.room_id ? 'text-foreground' : 'text-muted-foreground'}>
                                {form.room_id
                                    ? `Kamar ${roomList.find(r => (r.id || r.uuid) === form.room_id)?.room_number}`
                                    : "Klik untuk memilih kamar..."}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="hsl(var(--muted-foreground))" />
                        </TouchableOpacity>

                        <Label className="mb-2 mt-4 text-foreground">Nama Lengkap</Label>
                        <Input
                            placeholder="Contoh: Budi Santoso"
                            value={form.name}
                            onChangeText={(v) => setForm({ ...form, name: v })}
                        />

                        <View className="flex-row justify-between">
                            <View className="w-[48%]">
                                <Label className="mb-2 mt-4 text-foreground">Email</Label>
                                <Input
                                    placeholder="budi@mail.com"
                                    autoCapitalize="none"
                                    value={form.email}
                                    onChangeText={(v) => setForm({ ...form, email: v })}
                                />
                            </View>
                            <View className="w-[48%]">
                                <Label className="mb-2 mt-4 text-foreground">No. Telepon</Label>
                                <Input
                                    placeholder="0812..."
                                    keyboardType="phone-pad"
                                    value={form.phone}
                                    onChangeText={(v) => setForm({ ...form, phone: v })}
                                />
                            </View>
                        </View>

                        <Label className="mb-2 mt-4 text-foreground">No. KTP</Label>
                        <Input
                            placeholder="3201..."
                            keyboardType="numeric"
                            value={form.id_card}
                            onChangeText={(v) => setForm({ ...form, id_card: v })}
                        />

                        <Label className="mb-2 mt-4 text-foreground">Alamat Asal</Label>
                        <Input
                            className="h-20 items-start text-align-top"
                            multiline
                            placeholder="Alamat lengkap sesuai KTP"
                            value={form.address}
                            onChangeText={(v) => setForm({ ...form, address: v })}
                        />

                        <Label className="mb-2 mt-4 text-foreground">Tanggal Masuk</Label>
                        <Input
                            value={form.entry_date}
                            onChangeText={(v) => setForm({ ...form, entry_date: v })}
                        />

                        {editMode && (
                            <>
                                <Label className="mb-2 mt-4 text-foreground">Password Baru (kosongkan jika tidak diubah)</Label>
                                <Input
                                    placeholder="Biarkan kosong jika tidak ingin ganti"
                                    secureTextEntry
                                    value={form.password}
                                    onChangeText={(v) => setForm({ ...form, password: v })}
                                />
                            </>
                        )}

                        <View className="my-6 h-px bg-border" />
                        <Text className="text-sm font-bold text-muted-foreground">Kontak Darurat</Text>
                        <View className="mb-4">
                            <Label className="mb-2 mt-4 text-foreground">Nama Hubungan</Label>
                            <Input
                                placeholder="Contoh: Ibu Kandung / Ayah"
                                value={form.emergency_contact_name}
                                onChangeText={(v) => setForm({ ...form, emergency_contact_name: v })}
                            />
                        </View>
                        <View className="mb-4">
                            <Label className="mb-2 mt-4 text-foreground">No. HP Darurat</Label>
                            <Input
                                placeholder="0813..."
                                keyboardType="phone-pad"
                                value={form.emergency_contact_phone}
                                onChangeText={(v) => setForm({ ...form, emergency_contact_phone: v })}
                            />
                        </View>
                        <Button className="mt-8" onPress={handleSave}>
                            <Text className="text-base font-bold text-white">
                                {editMode ? 'SIMPAN PERUBAHAN' : 'SIMPAN DATA'}
                            </Text>
                        </Button>
                        <View style={{ height: insets.bottom + 50 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal Pilihan Kamar */}
            <Modal visible={roomModalVisible} transparent animationType="fade">
                <View className="flex-1 justify-center bg-black/60 p-5">
                    <View className="max-h-[80%] rounded-2xl bg-card p-5">
                        <Text className="mb-4 text-center text-xl font-bold text-foreground">
                            {editMode ? 'Pilih Kamar' : 'Pilih Kamar Tersedia'}
                        </Text>
                        <FlatList
                            data={roomList}
                            keyExtractor={(item) => (item.id || item.uuid).toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="flex-row items-center border-b border-border p-3.5"
                                    onPress={() => {
                                        setForm({ ...form, room_id: item.id || item.uuid });
                                        setRoomModalVisible(false);
                                    }}
                                >
                                    <Ionicons name="business" size={24} color="hsl(var(--primary))" />
                                    <View className="ml-4">
                                        <Text className="text-base font-bold text-foreground">Kamar {item.room_number}</Text>
                                        <Text className="text-xs text-muted-foreground">Rp {item.price?.toLocaleString()} • {item.status || item.room_status}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text className="p-5 text-center text-muted-foreground">Tidak ada kamar tersedia.</Text>}
                        />
                        <TouchableOpacity className="mt-4 p-2.5 items-center" onPress={() => setRoomModalVisible(false)}>
                            <Text className="font-bold text-destructive">Tutup</Text>
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
