import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../../../components/GlobalAlert';
import LoadingScreen from '../../../../components/LoadingScreen';
import api from '../../../../helpers/api';
import {
    formatDate,
    getLocalDateString,
    getStorageUrl,
} from '../../../../helpers/formatters';
import styles from '../../../../styles/adminFinanceCreate.styles';

export default function EditTransaction() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [categories, setCategories] = useState({ income: [], expense: [] });

    // Existing receipt from database
    const [existingReceipt, setExistingReceipt] = useState(null);
    // Newly picked image from gallery
    const [newImage, setNewImage] = useState(null);
    // Flag if existing receipt should be deleted
    const [removeReceipt, setRemoveReceipt] = useState(false);
    // Full screen image preview modal
    const [previewModalVisible, setPreviewModalVisible] = useState(false);

    const [form, setForm] = useState({
        type: 'expense',
        category: '',
        amount: '',
        transaction_date: getLocalDateString(),
        description: '',
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
                setAlertConfig((prev) => ({ ...prev, visible: false }));
                if (onConfirm) onConfirm();
            },
        });
    };

    useEffect(() => {
        const loadInitialData = async () => {
            if (!id || id === 'undefined') return;
            try {
                setFetching(true);
                const [financeRes, catRes] = await Promise.all([
                    api.get(`/admin/finances/${id}`),
                    api.get('/admin/categories'),
                ]);

                const data = financeRes.data?.data || financeRes.data;
                if (data) {
                    const rawAmount = data.amount ? String(Math.round(Number(data.amount))) : '';
                    let rawDate = data.transaction_date;
                    if (rawDate && rawDate.includes('T')) {
                        rawDate = rawDate.split('T')[0];
                    }

                    setForm({
                        type: data.type || 'expense',
                        category: data.category || '',
                        amount: rawAmount,
                        transaction_date: rawDate || getLocalDateString(),
                        description: data.description || '',
                        notes: data.notes || '',
                    });

                    const existingPath =
                        data.receipt_url ||
                        data.receipt_file ||
                        data.receipt_path ||
                        data.payment?.receipt_file ||
                        data.payment?.proof_of_payment ||
                        data.payment?.receipt_path ||
                        data.payment?.receipt_url;
                    if (existingPath) {
                        setExistingReceipt(getStorageUrl(existingPath));
                    }
                }

                setCategories({
                    income: catRes.data?.incomeCategories || [],
                    expense: catRes.data?.expenseCategories || [],
                });
            } catch (error) {
                console.log('Error load finance for edit:', error.response?.data || error.message);
                showAlert('Error', 'Gagal memuat data transaksi.', 'error', () => {
                    router.back();
                });
            } finally {
                setFetching(false);
            }
        };

        loadInitialData();
    }, [id, router]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setNewImage(result.assets[0].uri);
            setRemoveReceipt(false);
        }
    };

    const handleDateConfirm = (date) => {
        const dateStr = getLocalDateString(date);
        setForm((prev) => ({ ...prev, transaction_date: dateStr }));
        setShowDatePicker(false);
    };

    const handleUpdate = async () => {
        const cleanAmount = parseInt(form.amount.toString().replace(/\D/g, '') || 0);

        if (!cleanAmount || cleanAmount <= 0) {
            return showAlert('Peringatan', 'Nominal transaksi harus lebih dari 0.', 'warning');
        }
        if (!form.category) {
            return showAlert('Peringatan', 'Silakan pilih kategori transaksi.', 'warning');
        }
        if (!form.description.trim()) {
            return showAlert('Peringatan', 'Deskripsi transaksi wajib diisi.', 'warning');
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('type', form.type);
            formData.append('category', form.category);
            formData.append('amount', cleanAmount.toString());
            formData.append('transaction_date', form.transaction_date);
            formData.append('description', form.description.trim());
            formData.append('notes', form.notes || '');

            if (removeReceipt) {
                formData.append('remove_receipt', '1');
            }

            if (newImage) {
                const filename = `receipt_${Date.now()}.jpg`;
                if (Platform.OS === 'web') {
                    const response = await fetch(newImage);
                    const blob = await response.blob();
                    formData.append('receipt_file', blob, filename);
                } else {
                    formData.append('receipt_file', {
                        uri: newImage,
                        name: filename,
                        type: 'image/jpeg',
                    });
                }
            }

            await api.post(`/admin/finances/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showAlert('Berhasil', 'Catatan keuangan berhasil diperbarui!', 'success', () => {
                router.back();
            });
        } catch (error) {
            console.log('Error update finance:', error.response?.data || error.message);
            const msg = error.response?.data?.message || 'Gagal memperbarui transaksi.';
            showAlert('Gagal', msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const currentCategoryList = form.type === 'income' ? categories.income : categories.expense;
    const activePreviewUri = newImage || (!removeReceipt ? existingReceipt : null);

    if (fetching) {
        return (
            <LoadingScreen
                title="Edit Transaksi"
                message="Menyiapkan data transaksi..."
                icon="create-outline"
            />
        );
    }

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
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Transaksi Keuangan</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    {/* Type Toggle */}
                    <Text style={styles.fieldLabel}>Jenis Transaksi *</Text>
                    <View style={styles.typeRow}>
                        <TouchableOpacity
                            style={[
                                styles.typeBtn,
                                form.type === 'expense' && styles.typeBtnActiveExpense,
                            ]}
                            onPress={() => setForm((prev) => ({ ...prev, type: 'expense', category: '' }))}
                        >
                            <Ionicons
                                name="arrow-up-circle"
                                size={18}
                                color={form.type === 'expense' ? '#ffffff' : '#ef4444'}
                            />
                            <Text
                                style={[
                                    styles.typeText,
                                    form.type === 'expense' && styles.typeTextActive,
                                ]}
                            >
                                Pengeluaran
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeBtn,
                                form.type === 'income' && styles.typeBtnActiveIncome,
                            ]}
                            onPress={() => setForm((prev) => ({ ...prev, type: 'income', category: '' }))}
                        >
                            <Ionicons
                                name="arrow-down-circle"
                                size={18}
                                color={form.type === 'income' ? '#ffffff' : '#10b981'}
                            />
                            <Text
                                style={[
                                    styles.typeText,
                                    form.type === 'income' && styles.typeTextActive,
                                ]}
                            >
                                Pemasukan
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Category Selector */}
                    <Text style={styles.fieldLabel}>Kategori *</Text>
                    <TouchableOpacity
                        style={styles.pickerBox}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Ionicons name="grid-outline" size={18} color="#4e73df" />
                        <Text style={[styles.pickerText, !form.category && { color: '#94a3b8' }]}>
                            {form.category || 'Pilih kategori transaksi...'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                    </TouchableOpacity>

                    {/* Amount */}
                    <Text style={styles.fieldLabel}>Nominal (Rp) *</Text>
                    <View style={styles.amountInputWrap}>
                        <Text style={styles.currencyPrefix}>Rp</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={form.amount ? parseInt(form.amount, 10).toLocaleString('id-ID') : ''}
                            onChangeText={(val) => {
                                const clean = val.replace(/\D/g, '');
                                setForm((prev) => ({ ...prev, amount: clean }));
                            }}
                        />
                    </View>

                    {/* Date */}
                    <Text style={styles.fieldLabel}>Tanggal Transaksi *</Text>
                    <TouchableOpacity
                        style={styles.dateBox}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={18} color="#4e73df" />
                        <Text style={styles.dateBoxText}>
                            {formatDate(form.transaction_date)}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
                            ({form.transaction_date})
                        </Text>
                    </TouchableOpacity>

                    {/* Description */}
                    <Text style={styles.fieldLabel}>Deskripsi / Judul *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: Pembelian token listrik gedung utama"
                        placeholderTextColor="#94a3b8"
                        value={form.description}
                        onChangeText={(desc) => setForm((prev) => ({ ...prev, description: desc }))}
                    />

                    {/* Notes */}
                    <Text style={styles.fieldLabel}>Catatan Tambahan (Opsional)</Text>
                    <TextInput
                        style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                        multiline
                        placeholder="Catatan pelengkap bila ada..."
                        placeholderTextColor="#94a3b8"
                        value={form.notes}
                        onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
                    />

                    {/* Receipt Image */}
                    <Text style={styles.fieldLabel}>Lampiran Bukti / Struk</Text>
                    {newImage ? (
                        <View>
                            <View style={styles.imagePreviewWrap}>
                                <Image source={{ uri: newImage }} style={styles.imagePreview} />
                                <View style={[styles.receiptBadge, { backgroundColor: '#2563eb' }]}>
                                    <Text style={styles.receiptBadgeText}>Foto Bukti Baru</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setNewImage(null)}
                                >
                                    <Ionicons name="close-circle" size={26} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.existingReceiptActions}>
                                <TouchableOpacity style={styles.receiptActionBtn} onPress={pickImage}>
                                    <Ionicons name="camera-reverse-outline" size={16} color="#2563eb" />
                                    <Text style={styles.receiptActionText}>Ganti Foto Lain</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : existingReceipt && !removeReceipt ? (
                        <View>
                            <View style={styles.imagePreviewWrap}>
                                {existingReceipt.toLowerCase().includes('.pdf') ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            height: 160,
                                            backgroundColor: '#fef2f2',
                                            borderRadius: 12,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: '#fecaca',
                                            gap: 6,
                                        }}
                                    >
                                        <Ionicons name="document-text" size={42} color="#dc2626" />
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#991b1b' }}>
                                            Dokumen Bukti (PDF)
                                        </Text>
                                    </View>
                                ) : (
                                    <Image source={{ uri: existingReceipt }} style={styles.imagePreview} />
                                )}
                                <View style={styles.receiptBadge}>
                                    <Text style={styles.receiptBadgeText}>File Saat Ini</Text>
                                </View>
                            </View>
                            <View style={styles.existingReceiptActions}>
                                <TouchableOpacity
                                    style={styles.receiptActionBtn}
                                    onPress={() => {
                                        if (existingReceipt.toLowerCase().includes('.pdf')) {
                                            Linking.openURL(existingReceipt);
                                        } else {
                                            setPreviewModalVisible(true);
                                        }
                                    }}
                                >
                                    <Ionicons name="eye-outline" size={16} color="#2563eb" />
                                    <Text style={styles.receiptActionText}>Lihat Penuh</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.receiptActionBtn}
                                    onPress={pickImage}
                                >
                                    <Ionicons name="cloud-upload-outline" size={16} color="#2563eb" />
                                    <Text style={styles.receiptActionText}>Ganti File</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.removeReceiptBtn}
                                    onPress={() => setRemoveReceipt(true)}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                    <Text style={styles.removeReceiptText}>Hapus</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                <Ionicons name="camera-outline" size={24} color="#4e73df" />
                                <Text style={styles.uploadText}>
                                    {removeReceipt ? 'Upload Foto Bukti Pengganti' : 'Pilih Foto Struk / Bukti'}
                                </Text>
                            </TouchableOpacity>
                            {removeReceipt && existingReceipt ? (
                                <TouchableOpacity
                                    style={{ marginTop: 8, alignSelf: 'center' }}
                                    onPress={() => setRemoveReceipt(false)}
                                >
                                    <Text style={{ color: '#64748b', fontSize: 12, textDecorationLine: 'underline' }}>
                                        Batalkan penghapusan bukti lama
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && { opacity: 0.8 }]}
                        onPress={handleUpdate}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#0f172a', '#1e3a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientBtn}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="save-outline" size={18} color="#ffffff" />
                                    <Text style={styles.submitText}>SIMPAN PERUBAHAN</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => router.back()}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Date Picker Modal */}
            <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={new Date(form.transaction_date || new Date())}
                onConfirm={handleDateConfirm}
                onCancel={() => setShowDatePicker(false)}
            />

            {/* Category Selector Modal */}
            <Modal visible={showCategoryModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.categorySheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Pilih Kategori ({form.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                            </Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={currentCategoryList}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setForm((prev) => ({ ...prev, category: item }));
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text style={styles.categoryItemText}>{item}</Text>
                                    {form.category === item ? (
                                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    ) : null}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#94a3b8' }}>Tidak ada kategori default.</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Fullscreen Image Preview Modal */}
            <Modal
                visible={previewModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewModalVisible(false)}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}
                    onPress={() => setPreviewModalVisible(false)}
                >
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: '#ffffff',
                            borderRadius: 16,
                            padding: 16,
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                width: '100%',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                                Bukti Transaksi
                            </Text>
                            <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#334155" />
                            </TouchableOpacity>
                        </View>
                        {activePreviewUri ? (
                            <Image
                                source={{ uri: activePreviewUri }}
                                style={{ width: '100%', height: 350 }}
                                resizeMode="contain"
                            />
                        ) : null}
                        {activePreviewUri ? (
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    marginTop: 14,
                                    paddingVertical: 10,
                                    paddingHorizontal: 16,
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: 10,
                                    width: '100%',
                                }}
                                onPress={() => Linking.openURL(activePreviewUri)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="open-outline" size={16} color="#334155" />
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>
                                    Buka Ukuran Penuh di Browser
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </Pressable>
            </Modal>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </View>
    );
}
