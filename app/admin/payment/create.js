import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../../components/GlobalAlert';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const PAYMENT_METHODS = [
    { key: 'cash', label: 'Tunai', icon: 'cash-outline' },
    { key: 'transfer', label: 'Transfer', icon: 'phone-portrait-outline' },
    { key: 'e-wallet', label: 'E-Wallet', icon: 'wallet-outline' },
];

export default function CreatePayment() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tenantPickerVisible, setTenantPickerVisible] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [receipt, setReceipt] = useState(null);
    const [datePicker, setDatePicker] = useState(null);

    const [form, setForm] = useState({
        tenant_id: '',
        period_month: new Date().toISOString().slice(0, 7),
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        late_fee: '0',
        payment_method: 'transfer',
        notes: '',
    });

    const [alertConfig, setAlertConfig] = useState({
        visible: false, title: '', message: '', type: 'success'
    });

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.get(`${API_URL}/admin/tenants/active`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenants(res.data?.data || res.data || []);
        } catch (e) {
            console.log("Error fetch tenants:", e);
            Alert.alert("Error", "Gagal mengambil data penghuni");
        } finally {
            setLoading(false);
        }
    };

    const selectTenant = (tenant) => {
        setSelectedTenant(tenant);
        setForm({
            ...form,
            tenant_id: tenant.id || tenant.uuid,
            amount: tenant.room?.price?.toString() || form.amount,
        });
        setTenantPickerVisible(false);
    };

    const handleSubmit = async () => {
        if (!form.tenant_id) {
            return showAlert("Data Belum Lengkap", "Pilih penghuni terlebih dahulu.", "warning");
        }
        if (!form.amount || parseInt(form.amount) <= 0) {
            return showAlert("Data Belum Lengkap", "Jumlah pembayaran wajib diisi.", "warning");
        }
        if (!form.payment_method) {
            return showAlert("Data Belum Lengkap", "Pilih metode pembayaran.", "warning");
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const payload = {
                tenant_id: selectedTenant.id || selectedTenant.uuid,
                period_month: form.period_month + '-01',
                payment_date: form.payment_date,
                amount: parseInt(form.amount),
                late_fee: parseInt(form.late_fee || 0),
                payment_method: form.payment_method,
                notes: form.notes,
            };

            const res = await axios.post(`${API_URL}/admin/payments/store`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReceipt(res.data?.data || res.data);
        } catch (e) {
            const msg = e.response?.data?.message || "Gagal mencatat pembayaran.";
            showAlert("Gagal", msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedTenant(null);
        setForm({
            tenant_id: '',
            period_month: new Date().toISOString().slice(0, 7),
            payment_date: new Date().toISOString().slice(0, 10),
            amount: '',
            late_fee: '0',
            payment_method: 'transfer',
            notes: '',
        });
    };

    const formatRupiah = (num) => {
        return parseInt(num || 0).toLocaleString('id-ID');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1a2a6c', '#b21f1f']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Catat Pembayaran</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {receipt ? (
                /* Receipt View */
                <View style={styles.receiptContainer}>
                    <ScrollView contentContainerStyle={styles.receiptScroll}>
                        <View style={styles.receiptCard}>
                            <View style={styles.receiptIcon}>
                                <Ionicons name="checkmark-circle" size={64} color="#1cc88a" />
                            </View>
                            <Text style={styles.receiptTitle}>Pembayaran Berhasil!</Text>
                            <Text style={styles.receiptInv}>#{receipt.invoice || '-'}</Text>
                            <View style={styles.receiptDivider} />

                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Penghuni</Text>
                                <Text style={styles.receiptValue}>{receipt.tenant_name || selectedTenant?.name || '-'}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Kamar</Text>
                                <Text style={styles.receiptValue}>{receipt.room_number || selectedTenant?.room?.room_number || '-'}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Periode</Text>
                                <Text style={styles.receiptValue}>{receipt.period || form.period_month || '-'}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Tanggal</Text>
                                <Text style={styles.receiptValue}>{receipt.payment_date || form.payment_date || '-'}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Total</Text>
                                <Text style={styles.receiptValue}>Rp {formatRupiah(receipt.total || 0)}</Text>
                            </View>

                            <View style={styles.receiptDivider} />
                            <Text style={styles.receiptFooter}>Kwitansi tersedia di riwayat pembayaran</Text>

                            <View style={styles.receiptActions}>
                                <TouchableOpacity
                                    style={[styles.receiptBtn, { backgroundColor: '#1a2a6c' }]}
                                    onPress={() => router.push('/admin/payment/history')}
                                >
                                    <Ionicons name="receipt-outline" size={18} color="white" />
                                    <Text style={styles.receiptBtnText}>Riwayat</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.receiptBtn, { backgroundColor: '#b21f1f' }]}
                                    onPress={() => {
                                        setReceipt(null);
                                        resetForm();
                                    }}
                                >
                                    <Ionicons name="home-outline" size={18} color="white" />
                                    <Text style={styles.receiptBtnText}>Selesai</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                <ScrollView style={styles.formBody}>
                    <Text style={styles.sectionTitle}>Data Pembayaran</Text>

                    <Text style={styles.label}>Penghuni</Text>
                    <TouchableOpacity style={styles.pickerTrigger} onPress={() => setTenantPickerVisible(true)}>
                        <Ionicons name="person-outline" size={20} color="#4e73df" />
                        <Text style={{ flex: 1, marginLeft: 10, color: selectedTenant ? '#2c3e50' : '#999' }}>
                            {selectedTenant ? `${selectedTenant.name || selectedTenant.user?.name} (Kamar ${selectedTenant.room?.room_number || '?'})` : 'Pilih penghuni...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.label}>Periode Bulan</Text>
                    <TouchableOpacity style={styles.pickerTrigger} onPress={() => setDatePicker('period_month')}>
                        <Ionicons name="calendar-outline" size={20} color="#4e73df" />
                        <Text style={{ flex: 1, marginLeft: 10, color: '#2c3e50' }}>
                            {form.period_month ? new Date(form.period_month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Pilih periode...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.label}>Tanggal Pembayaran</Text>
                    <TouchableOpacity style={styles.pickerTrigger} onPress={() => setDatePicker('payment_date')}>
                        <Ionicons name="calendar-outline" size={20} color="#4e73df" />
                        <Text style={{ flex: 1, marginLeft: 10, color: '#2c3e50' }}>
                            {form.payment_date ? new Date(form.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih tanggal...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Jumlah Bayar (Rp)</Text>
                            <TextInput style={styles.input}
                                keyboardType="numeric"
                                value={form.amount}
                                onChangeText={(v) => setForm({ ...form, amount: v })}
                                placeholder="500000"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Denda (Rp)</Text>
                            <TextInput style={styles.input}
                                keyboardType="numeric"
                                value={form.late_fee}
                                onChangeText={(v) => setForm({ ...form, late_fee: v })}
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Metode Pembayaran</Text>
                    <View style={styles.methodRow}>
                        {PAYMENT_METHODS.map((m) => (
                            <TouchableOpacity
                                key={m.key}
                                style={[styles.methodOption, form.payment_method === m.key && styles.methodActive]}
                                onPress={() => setForm({ ...form, payment_method: m.key })}
                            >
                                <Ionicons name={m.icon} size={20} color={form.payment_method === m.key ? 'white' : '#7f8c8d'} />
                                <Text style={[styles.methodText, form.payment_method === m.key && styles.methodTextActive]}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Catatan (opsional)</Text>
                    <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        multiline
                        value={form.notes}
                        onChangeText={(v) => setForm({ ...form, notes: v })}
                        placeholder="Catatan tambahan..."
                    />

                    <Text style={styles.totalText}>
                        Total: Rp {formatRupiah(parseInt(form.amount || 0) + parseInt(form.late_fee || 0))}
                    </Text>

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                <Text style={styles.submitText}>CATAT PEMBAYARAN</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <View style={{ height: insets.bottom + 40 }} />
                </ScrollView>
            )}

            {/* Tenant Picker */}
            <Modal visible={tenantPickerVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>Pilih Penghuni</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {tenants.map((t) => (
                                <TouchableOpacity
                                    key={t.uuid || t.id}
                                    style={styles.pickerItem}
                                    onPress={() => selectTenant(t)}
                                >
                                    <View style={styles.pickerAvatar}>
                                        <Text style={styles.pickerAvatarText}>
                                            {(t.name || t.user?.name || '?').charAt(0)}
                                        </Text>
                                    </View>
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.pickerItemName}>{t.name || t.user?.name}</Text>
                                        <Text style={styles.pickerItemSub}>Kamar {t.room?.room_number || '?'} • Rp {formatRupiah(t.room?.price)}/bln</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.pickerClose} onPress={() => setTenantPickerVisible(false)}>
                            <Text style={{ color: '#b21f1f', fontWeight: 'bold' }}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date Picker Modal */}
            <DateTimePickerModal
                isVisible={datePicker !== null}
                mode={datePicker === 'period_month' ? 'date' : 'date'}
                onConfirm={(date) => {
                    if (datePicker === 'period_month') {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        setForm({ ...form, period_month: `${y}-${m}` });
                    } else {
                        setForm({ ...form, payment_date: date.toISOString().slice(0, 10) });
                    }
                    setDatePicker(null);
                }}
                onCancel={() => setDatePicker(null)}
                locale="id_ID"
            />

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
    formBody: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: 'bold', marginTop: 18, marginBottom: 8, color: '#34495e' },
    input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#e1e8ef', color: '#2c3e50' },
    pickerTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e1e8ef' },
    methodRow: { flexDirection: 'row', gap: 10 },
    methodOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e1e8ef', backgroundColor: 'white', gap: 6 },
    methodActive: { backgroundColor: '#1a2a6c', borderColor: '#1a2a6c' },
    methodText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
    methodTextActive: { color: 'white' },
    totalText: { fontSize: 18, fontWeight: 'bold', color: '#1cc88a', textAlign: 'right', marginTop: 20 },
    submitBtn: { backgroundColor: '#1a2a6c', flexDirection: 'row', paddingVertical: 16, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 8, elevation: 3 },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    /* Receipt View */
    receiptContainer: { flex: 1, padding: 20, justifyContent: 'center' },
    receiptScroll: { flexGrow: 1, justifyContent: 'center' },
    receiptCard: { backgroundColor: 'white', borderRadius: 25, padding: 30, elevation: 5, alignItems: 'center' },
    receiptIcon: { marginBottom: 15 },
    receiptTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
    receiptInv: { fontSize: 16, fontWeight: '600', color: '#4e73df', marginBottom: 20 },
    receiptDivider: { height: 1, backgroundColor: '#eee', width: '100%', marginBottom: 20 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8 },
    receiptLabel: { fontSize: 14, color: '#7f8c8d' },
    receiptValue: { fontSize: 14, color: '#2c3e50', fontWeight: '600' },
    receiptFooter: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 10 },
    receiptActions: { flexDirection: 'row', gap: 10, marginTop: 25, width: '100%' },
    receiptBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
    receiptBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

    /* Tenant Picker */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    pickerModal: { backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '80%' },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a2a6c', marginBottom: 15, textAlign: 'center' },
    pickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f3f9' },
    pickerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a2a6c', justifyContent: 'center', alignItems: 'center' },
    pickerAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    pickerItemName: { fontWeight: 'bold', fontSize: 15, color: '#2c3e50' },
    pickerItemSub: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
    pickerClose: { marginTop: 15, padding: 10, alignItems: 'center' },
});
