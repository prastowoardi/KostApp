import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../../components/GlobalAlert';
import { API_URL } from '../../../helpers/api';
import { formatRupiah } from '../../../helpers/formatters';

const PAYMENT_METHODS = [
    { key: 'cash', label: 'Tunai (Cash)', icon: 'cash-outline' },
    { key: 'transfer', label: 'Transfer Bank', icon: 'card-outline' },
    { key: 'e-wallet', label: 'E-Wallet', icon: 'wallet-outline' },
];

export default function CreatePayment() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [tenants, setTenants] = useState([]);
    const [fetchingTenants, setFetchingTenants] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tenantPickerVisible, setTenantPickerVisible] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [searchTenant, setSearchTenant] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [datePickerType, setDatePickerType] = useState(null); // 'payment' | 'period'

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

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const res = await axios.get(`${API_URL}/admin/tenants/active`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });
            setTenants(res.data?.data || res.data || []);
        } catch (e) {
            console.log('Error fetch tenants:', e.response?.data || e.message);
            Alert.alert('Error', 'Gagal mengambil data penghuni kost.');
        } finally {
            setFetchingTenants(false);
        }
    };

    const selectTenant = (tenant) => {
        setSelectedTenant(tenant);
        const uuid = tenant.uuid || tenant.id;
        const roomPrice = tenant.room?.price ? tenant.room.price.toString() : '';

        setForm((prev) => ({
            ...prev,
            tenant_id: uuid,
            amount: roomPrice || prev.amount,
        }));
        setTenantPickerVisible(false);
    };

    const handleDateConfirm = (date) => {
        if (datePickerType === 'payment') {
            setForm((prev) => ({ ...prev, payment_date: date.toISOString().slice(0, 10) }));
        } else if (datePickerType === 'period') {
            setForm((prev) => ({ ...prev, period_month: date.toISOString().slice(0, 7) }));
        }
        setDatePickerType(null);
    };

    const handleSubmit = async () => {
        if (!selectedTenant) {
            return showAlert('Data Belum Lengkap', 'Silakan pilih penghuni kost terlebih dahulu.', 'warning');
        }

        const cleanAmount = parseInt(form.amount.toString().replace(/\D/g, '') || 0);
        if (cleanAmount <= 0) {
            return showAlert('Data Belum Lengkap', 'Nominal pembayaran harus lebih dari 0.', 'warning');
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';

            // MUST USE UUID for backend where('uuid', ...)
            const payload = {
                tenant_id: selectedTenant.uuid || selectedTenant.id,
                period_month: form.period_month + '-01',
                payment_date: form.payment_date,
                amount: cleanAmount,
                late_fee: parseInt(form.late_fee.toString().replace(/\D/g, '') || 0),
                payment_method: form.payment_method,
                notes: form.notes || 'Pembayaran via Admin Mobile',
            };

            const res = await axios.post(`${API_URL}/admin/payments/store`, payload, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });

            const savedData = res.data?.data || res.data;
            setReceipt(savedData);
            setShowSuccessModal(true);
        } catch (e) {
            console.log('Error Store Payment:', e.response?.data || e.message);
            const msg = e.response?.data?.message || 'Gagal mencatat pembayaran.';
            showAlert('Gagal', msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendWhatsApp = () => {
        const phone = receipt?.tenant_phone || selectedTenant?.phone;
        if (!phone) {
            return Alert.alert('Nomor Tidak Ditemukan', 'Penghuni ini belum memiliki nomor WhatsApp yang terdaftar.');
        }

        const cleanPhone = phone.toString().replace(/\D/g, '');
        const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
        const tenantName = receipt?.tenant_name || selectedTenant?.name || selectedTenant?.user?.name || 'Kak';
        const roomNum = receipt?.room_number || selectedTenant?.room?.room_number || '-';
        const invoiceNo = receipt?.invoice || receipt?.payment?.invoice_number || receipt?.id || '-';
        const periodStr = receipt?.period || form.period_month;
        const totalStr = formatRupiah(receipt?.total || form.amount);
        const dateStr = receipt?.payment_date || form.payment_date;
        const methodMap = {
            cash: 'Tunai (Cash)',
            transfer: 'Transfer Bank',
            'e-wallet': 'E-Wallet',
        };
        const methodStr = methodMap[form.payment_method] || form.payment_method;

        const message =
            `Halo Kak *${tenantName}*! 👋\n\n` +
            `Terima kasih, pembayaran sewa kos Anda telah kami terima dan tercatat di sistem:\n\n` +
            `🧾 *BUKTI KWITANSI PEMBAYARAN*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `• *No. Invoice:* #${invoiceNo}\n` +
            `• *Penghuni:* ${tenantName}\n` +
            `• *Kamar:* No. ${roomNum}\n` +
            `• *Periode:* ${periodStr}\n` +
            `• *Tanggal Bayar:* ${dateStr}\n` +
            `• *Metode:* ${methodStr}\n` +
            `• *Total Bayar:* *${totalStr}*\n` +
            `• *Status:* *LUNAS* ✅\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Kwitansi ini adalah bukti pembayaran yang sah. Terima kasih atas kerjasamanya! 🙏✨`;

        Linking.openURL(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`).catch(() => {
            Alert.alert('Error', 'Gagal membuka aplikasi WhatsApp.');
        });
    };

    const handleBackToHome = () => {
        setShowSuccessModal(false);
        resetForm();
        router.replace('/admin/dashboard');
    };

    const handleRecordAnother = () => {
        setShowSuccessModal(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedTenant(null);
        setReceipt(null);
        setShowSuccessModal(false);
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

    const filteredTenants = tenants.filter((t) => {
        const name = (t.name || t.user?.name || '').toLowerCase();
        const room = (t.room?.room_number || '').toLowerCase();
        const q = searchTenant.toLowerCase();
        return name.includes(q) || room.includes(q);
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient
                colors={['#1a2a6c', '#b21f1f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Catat Pembayaran</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Form Card */}
                <View style={styles.card}>
                    {/* Tenant Selector */}
                    <Text style={styles.fieldLabel}>Pilih Penghuni Kost *</Text>
                    <TouchableOpacity
                        style={styles.pickerBox}
                        onPress={() => setTenantPickerVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle-outline" size={22} color="#4e73df" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            {selectedTenant ? (
                                <>
                                    <Text style={styles.pickerTextSelected}>
                                        {selectedTenant.name || selectedTenant.user?.name}
                                    </Text>
                                    <Text style={styles.pickerSubSelected}>
                                        Kamar {selectedTenant.room?.room_number || '-'} • {selectedTenant.phone || '-'}
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.pickerPlaceholder}>
                                    {fetchingTenants ? 'Memuat daftar penghuni...' : 'Pilih nama penghuni / nomor kamar'}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                    </TouchableOpacity>

                    {/* Period & Payment Date Row */}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.fieldLabel}>Periode Bulan *</Text>
                            <TouchableOpacity
                                style={styles.dateBox}
                                onPress={() => setDatePickerType('period')}
                            >
                                <Ionicons name="calendar-outline" size={18} color="#4e73df" />
                                <Text style={styles.dateBoxText}>{form.period_month}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.fieldLabel}>Tanggal Bayar *</Text>
                            <TouchableOpacity
                                style={styles.dateBox}
                                onPress={() => setDatePickerType('payment')}
                            >
                                <Ionicons name="today-outline" size={18} color="#4e73df" />
                                <Text style={styles.dateBoxText}>{form.payment_date}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Amount */}
                    <Text style={styles.fieldLabel}>Nominal Pembayaran (Rp) *</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.currencyPrefix}>Rp</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={form.amount ? parseInt(form.amount).toLocaleString('id-ID') : ''}
                            onChangeText={(val) => {
                                const raw = val.replace(/\D/g, '');
                                setForm((prev) => ({ ...prev, amount: raw }));
                            }}
                        />
                    </View>

                    {/* Late Fee */}
                    <Text style={styles.fieldLabel}>Denda / Biaya Tambahan (Opsional)</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.currencyPrefix}>Rp</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={form.late_fee ? parseInt(form.late_fee).toLocaleString('id-ID') : ''}
                            onChangeText={(val) => {
                                const raw = val.replace(/\D/g, '');
                                setForm((prev) => ({ ...prev, late_fee: raw }));
                            }}
                        />
                    </View>

                    {/* Payment Method */}
                    <Text style={styles.fieldLabel}>Metode Pembayaran *</Text>
                    <View style={styles.methodRow}>
                        {PAYMENT_METHODS.map((method) => {
                            const isSelected = form.payment_method === method.key;
                            return (
                                <TouchableOpacity
                                    key={method.key}
                                    style={[
                                        styles.methodChip,
                                        isSelected && styles.methodChipSelected,
                                    ]}
                                    onPress={() => setForm((prev) => ({ ...prev, payment_method: method.key }))}
                                >
                                    <Ionicons
                                        name={method.icon}
                                        size={18}
                                        color={isSelected ? '#ffffff' : '#64748b'}
                                    />
                                    <Text
                                        style={[
                                            styles.methodChipText,
                                            isSelected && styles.methodChipTextSelected,
                                        ]}
                                    >
                                        {method.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Notes */}
                    <Text style={styles.fieldLabel}>Catatan</Text>
                    <TextInput
                        style={[styles.textInputFull, { minHeight: 70 }]}
                        placeholder="Contoh: Lunas via transfer Mandiri"
                        placeholderTextColor="#94a3b8"
                        multiline
                        value={form.notes}
                        onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
                        textAlignVertical="top"
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && { opacity: 0.8 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#1a2a6c', '#b21f1f']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <View style={styles.submitRow}>
                                    <Ionicons name="checkmark-done" size={20} color="#ffffff" />
                                    <Text style={styles.submitText}>SIMPAN PEMBAYARAN</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Receipt Card if Success */}
                {receipt ? (
                    <View style={styles.receiptCard}>
                        <View style={styles.receiptHeader}>
                            <Ionicons name="receipt" size={24} color="#10b981" />
                            <Text style={styles.receiptTitle}>Struk Transaksi Tersimpan</Text>
                        </View>
                        <Text style={styles.receiptInvoice}>
                            No. Invoice: #{receipt.invoice_number || receipt.invoice || receipt.id}
                        </Text>
                        <View style={styles.divider} />
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Penghuni:</Text>
                            <Text style={styles.receiptValue}>{selectedTenant?.name || receipt.tenant_name || '-'}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Total Bayar:</Text>
                            <Text style={[styles.receiptValue, { color: '#10b981', fontWeight: 'bold' }]}>
                                {formatRupiah(receipt.total || receipt.amount || form.amount)}
                            </Text>
                        </View>

                        {/* WhatsApp Action Button */}
                        <TouchableOpacity style={styles.cardWaBtn} onPress={handleSendWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
                            <Text style={styles.cardWaBtnText}>Kirim Kwitansi via WhatsApp</Text>
                        </TouchableOpacity>

                        {/* Back to Home Button */}
                        <TouchableOpacity style={styles.cardHomeBtn} onPress={handleBackToHome}>
                            <Ionicons name="home-outline" size={18} color="#1a2a6c" />
                            <Text style={styles.cardHomeBtnText}>Kembali ke Dashboard</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.resetBtn} onPress={resetForm}>
                            <Ionicons name="add-circle-outline" size={18} color="#4e73df" />
                            <Text style={styles.resetBtnText}>Catat Transaksi Baru</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </ScrollView>

            {/* Modal Sukses & Kwitansi */}
            <Modal visible={showSuccessModal} transparent={true} animationType="fade">
                <View style={styles.successModalBg}>
                    <View style={styles.successModalCard}>
                        {/* Icon & Title */}
                        <View style={styles.successIconBadge}>
                            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                        </View>
                        <Text style={styles.successModalTitle}>Pembayaran Berhasil Dicatat!</Text>
                        <Text style={styles.successModalSubtitle}>
                            Transaksi telah berhasil disimpan ke sistem kos.
                        </Text>

                        {/* Struk Rincian */}
                        <View style={styles.strukContainer}>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>No. Invoice</Text>
                                <Text style={styles.strukValBold}>
                                    #{receipt?.invoice || receipt?.payment?.invoice_number || receipt?.id || '-'}
                                </Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Penghuni</Text>
                                <Text style={styles.strukVal}>
                                    {receipt?.tenant_name || selectedTenant?.name || selectedTenant?.user?.name || '-'}
                                </Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Kamar</Text>
                                <Text style={styles.strukVal}>
                                    Kamar {receipt?.room_number || selectedTenant?.room?.room_number || '-'}
                                </Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Periode</Text>
                                <Text style={styles.strukVal}>{receipt?.period || form.period_month}</Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Tanggal Bayar</Text>
                                <Text style={styles.strukVal}>{receipt?.payment_date || form.payment_date}</Text>
                            </View>
                            <View style={styles.strukDivider} />
                            <View style={styles.strukRow}>
                                <Text style={[styles.strukLabel, { fontWeight: 'bold' }]}>Total Bayar</Text>
                                <Text style={styles.strukTotalVal}>
                                    {formatRupiah(receipt?.total || form.amount)}
                                </Text>
                            </View>
                            <View style={styles.strukRow}>
                                <Text style={styles.strukLabel}>Status</Text>
                                <View style={styles.lunasBadge}>
                                    <Text style={styles.lunasBadgeText}>LUNAS</Text>
                                </View>
                            </View>
                        </View>

                        {/* Tombol Kirim Kwitansi via WhatsApp */}
                        {/* <TouchableOpacity
                            style={styles.waButton}
                            onPress={handleSendWhatsApp}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
                            <Text style={styles.waButtonText}>Kirim Kwitansi via WhatsApp</Text>
                        </TouchableOpacity> */}

                        {/* Tombol Selesai & Kembali ke Home */}
                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={handleBackToHome}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#1a2a6c', '#b21f1f']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.doneGradient}
                            >
                                <Ionicons name="home-outline" size={18} color="#ffffff" />
                                <Text style={styles.doneButtonText}>Selesai & Kembali ke Dashboard</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Tombol Catat Transaksi Lain */}
                        <TouchableOpacity
                            style={styles.recordAnotherBtn}
                            onPress={handleRecordAnother}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add-circle-outline" size={16} color="#64748b" />
                            <Text style={styles.recordAnotherText}>Catat Transaksi Lain</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date Picker Modal */}
            <DateTimePickerModal
                isVisible={!!datePickerType}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerType(null)}
            />

            {/* Tenant Picker Modal */}
            <Modal visible={tenantPickerVisible} transparent={true} animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Penghuni Kost</Text>
                            <TouchableOpacity onPress={() => setTenantPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={18} color="#94a3b8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari nama atau nomor kamar..."
                                placeholderTextColor="#94a3b8"
                                value={searchTenant}
                                onChangeText={setSearchTenant}
                            />
                        </View>

                        <ScrollView style={{ maxHeight: 350 }}>
                            {filteredTenants.length > 0 ? (
                                filteredTenants.map((item, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.tenantListItem}
                                        onPress={() => selectTenant(item)}
                                    >
                                        <View style={styles.tenantIconCircle}>
                                            <Ionicons name="bed" size={18} color="#4e73df" />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.tenantListName}>
                                                {item.name || item.user?.name}
                                            </Text>
                                            <Text style={styles.tenantListSub}>
                                                Kamar {item.room?.room_number || '-'} • Tarik:{' '}
                                                {formatRupiah(item.room?.price || 0)}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={{ padding: 30, alignItems: 'center' }}>
                                    <Text style={{ color: '#94a3b8' }}>Penghuni tidak ditemukan.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
        marginTop: 10,
    },
    pickerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        padding: 14,
        marginBottom: 6,
    },
    pickerPlaceholder: {
        color: '#94a3b8',
        fontSize: 14,
    },
    pickerTextSelected: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    pickerSubSelected: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    dateBoxText: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    currencyPrefix: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4e73df',
        marginRight: 6,
    },
    textInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    textInputFull: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
    },
    methodRow: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 4,
    },
    methodChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingVertical: 10,
        gap: 6,
    },
    methodChipSelected: {
        backgroundColor: '#1a2a6c',
        borderColor: '#1a2a6c',
    },
    methodChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
    },
    methodChipTextSelected: {
        color: '#ffffff',
    },
    submitButton: {
        marginTop: 20,
        borderRadius: 14,
        overflow: 'hidden',
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.8,
    },
    receiptCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 18,
        marginTop: 18,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    receiptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    receiptTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#065f46',
    },
    receiptInvoice: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    receiptLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    receiptValue: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '600',
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        marginTop: 10,
        gap: 6,
    },
    resetBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4e73df',
    },
    cardWaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 14,
        gap: 8,
    },
    cardWaBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cardHomeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        paddingVertical: 11,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    cardHomeBtnText: {
        color: '#1a2a6c',
        fontWeight: 'bold',
        fontSize: 13,
    },
    successModalBg: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModalCard: {
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: 380,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    successIconBadge: {
        marginBottom: 8,
    },
    successModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 4,
    },
    successModalSubtitle: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 16,
    },
    strukContainer: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    strukRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    strukLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    strukVal: {
        fontSize: 12,
        color: '#1e293b',
        fontWeight: '500',
    },
    strukValBold: {
        fontSize: 12,
        color: '#1e293b',
        fontWeight: 'bold',
    },
    strukDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 6,
    },
    strukTotalVal: {
        fontSize: 15,
        color: '#10b981',
        fontWeight: 'bold',
    },
    lunasBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    lunasBadgeText: {
        color: '#059669',
        fontSize: 10,
        fontWeight: 'bold',
    },
    waButton: {
        width: '100%',
        backgroundColor: '#25D366',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        marginBottom: 10,
        elevation: 2,
    },
    waButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    doneButton: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 10,
    },
    doneGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        gap: 8,
    },
    doneButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    recordAnotherBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 4,
    },
    recordAnotherText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        marginLeft: 8,
        color: '#1e293b',
    },
    tenantListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tenantIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tenantListName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    tenantListSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
});
