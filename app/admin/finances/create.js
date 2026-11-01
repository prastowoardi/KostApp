import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../../components/GlobalAlert';
import api from '../../../helpers/api';
import { formatDate, getLocalDateString } from '../../../helpers/formatters';
import styles from '../../../styles/adminFinanceCreate.styles';

export default function CreateTransaction() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [categories, setCategories] = useState({ income: [], expense: [] });

    const [form, setForm] = useState({
        type: 'expense',
        category: '',
        amount: '',
        transaction_date: getLocalDateString(),
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
                setAlertConfig((prev) => ({ ...prev, visible: false }));
                if (onConfirm) onConfirm();
            },
        });
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/admin/categories');
                setCategories({
                    income: response.data?.incomeCategories || [],
                    expense: response.data?.expenseCategories || [],
                });
            } catch (error) {
                console.log('Error fetch categories:', error.response?.data || error.message);
            }
        };
        fetchCategories();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        const cleanAmount = parseInt(form.amount.toString().replace(/\D/g, '') || 0);

        if (!cleanAmount) {
            return showAlert('Peringatan', 'Nominal transaksi harus lebih dari 0.', 'warning');
        }
        if (!form.category) {
            return showAlert('Peringatan', 'Silakan pilih kategori transaksi.', 'warning');
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('type', form.type);
            formData.append('category', form.category);
            formData.append('amount', cleanAmount.toString());
            formData.append('transaction_date', form.transaction_date);
            formData.append('description', form.description || '');

            if (image) {
                const filename = `receipt_${Date.now()}.jpg`;
                if (Platform.OS === 'web') {
                    const response = await fetch(image);
                    const blob = await response.blob();
                    formData.append('receipt_file', blob, filename);
                } else {
                    formData.append('receipt_file', {
                        uri: image,
                        name: filename,
                        type: 'image/jpeg',
                    });
                }
            }

            await api.post('/admin/finances', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showAlert('Berhasil', 'Catatan keuangan berhasil disimpan!', 'success', () => {
                router.back();
            });
        } catch (error) {
            console.log('Error save transaction:', error.response?.data || error.message);
            const msg = error.response?.data?.message || 'Gagal menyimpan transaksi.';
            showAlert('Gagal', msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const currentCategoryList = form.type === 'income' ? categories.income : categories.expense;

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
                    <Text style={styles.headerTitle}>Catat Transaksi</Text>
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
                            onPress={() => setForm({ ...form, type: 'expense', category: '' })}
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
                            onPress={() => setForm({ ...form, type: 'income', category: '' })}
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
                            value={form.amount ? parseInt(form.amount).toLocaleString('id-ID') : ''}
                            onChangeText={(val) => {
                                const clean = val.replace(/\D/g, '');
                                setForm({ ...form, amount: clean });
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
                    <Text style={styles.fieldLabel}>Keterangan / Catatan</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        multiline
                        placeholder="Contoh: Pembayaran token listrik gedung A..."
                        placeholderTextColor="#94a3b8"
                        value={form.description}
                        onChangeText={(desc) => setForm({ ...form, description: desc })}
                    />

                    {/* Receipt Image Upload */}
                    <Text style={styles.fieldLabel}>Lampiran Bukti / Struk (Opsional)</Text>
                    {image ? (
                        <View style={styles.imagePreviewWrap}>
                            <Image source={{ uri: image }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => setImage(null)}
                            >
                                <Ionicons name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={24} color="#4e73df" />
                            <Text style={styles.uploadText}>Pilih Foto Struk / Bukti</Text>
                        </TouchableOpacity>
                    )}

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && { opacity: 0.8 }]}
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#0f172a', '#1e3a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientBtn}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="save-outline" size={18} color="#ffffff" />
                                    <Text style={styles.submitText}>SIMPAN TRANSAKSI</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => router.back()}
                        disabled={loading}
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
                onConfirm={(date) => {
                    setForm((prev) => ({ ...prev, transaction_date: getLocalDateString(date) }));
                    setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
            />

            {/* Category Selector Modal */}
            <Modal visible={showCategoryModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.categorySheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Kategori</Text>
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
                                        setForm({ ...form, category: item });
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
