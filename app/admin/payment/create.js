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
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../../components/GlobalAlert';
import { API_URL } from '../../../helpers/api';
import { formatRupiah } from '../../../helpers/formatters';
import styles from '../../../styles/adminPaymentCreate.styles';

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
                colors={['#0f172a', '#1e293b', '#1e3a8a']}
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
                            colors={['#0f172a', '#1e3a8a']}
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
                            <Ionicons name="home-outline" size={18} color="#1e3a8a" />
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
                                colors={['#0f172a', '#1e3a8a']}
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
