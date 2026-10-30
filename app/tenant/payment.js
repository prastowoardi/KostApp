import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../components/GlobalAlert';
import { API_URL } from '../../helpers/api';
import { formatRupiah, formatMonthYear } from '../../helpers/formatters';

const BANK_INFO = {
    bankName: 'Bank Mandiri',
    accountNumber: '1360014406059',
    displayNumber: '136-001-440-6059',
    accountHolder: 'Prastowo Ardi Widigdo',
};

export default function PaymentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [billData, setBillData] = useState(null);

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

    const fetchBillDetail = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const response = await axios.get(`${API_URL}/me`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });
            setBillData(response.data);
        } catch (error) {
            console.log('Error Fetch Bill Detail:', error.message);
        }
    }, []);

    useEffect(() => {
        fetchBillDetail();
    }, [fetchBillDetail]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return showAlert('Izin Ditolak', 'Aplikasi butuh akses galeri untuk mengunggah bukti pembayaran.', 'error');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.6,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setImage(result.assets[0].uri);
        }
    };

    const submitPayment = async () => {
        if (!image) {
            return showAlert('Perhatian', 'Silakan pilih foto bukti transfer terlebih dahulu.', 'warning');
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';

            const formData = new FormData();
            const filename = `proof_${Date.now()}.jpg`;

            if (Platform.OS === 'web') {
                const response = await fetch(image);
                const blob = await response.blob();
                formData.append('proof_image', blob, filename);
            } else {
                formData.append('proof_image', {
                    uri: image,
                    name: filename,
                    type: 'image/jpeg',
                });
            }

            await axios.post(`${API_URL}/payments/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    'Content-Type': 'multipart/form-data',
                    Accept: 'application/json',
                },
            });

            showAlert('Berhasil', 'Bukti transfer berhasil diunggah! Pengelola akan segera memverifikasinya.', 'success', () => {
                router.back();
            });
        } catch (e) {
            console.log('Error Upload Payment:', e.response?.data || e.message);
            const errorMsg =
                e.response?.data?.errors?.proof_image?.[0] ||
                e.response?.data?.message ||
                'Gagal mengunggah gambar bukti transfer.';
            showAlert('Gagal', errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyAccount = () => {
        Alert.alert('Info Rekening', `Nomor Rekening ${BANK_INFO.bankName}:\n${BANK_INFO.accountNumber}\na/n ${BANK_INFO.accountHolder}`);
    };

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
                    <Text style={styles.headerTitle}>Konfirmasi Bayar</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Bill Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Detail Tagihan Sewa</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Periode Bulan</Text>
                        <Text style={styles.value}>{formatMonthYear(new Date())}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Total Tagihan</Text>
                        <Text style={[styles.value, { color: '#10b981', fontWeight: 'bold', fontSize: 16 }]}>
                            {formatRupiah(billData?.bill_amount || 0)}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Bank Transfer Destination */}
                    <Text style={styles.bankTitle}>Tujuan Transfer:</Text>
                    <View style={styles.bankCard}>
                        <View style={styles.bankIconWrap}>
                            <Ionicons name="card" size={22} color="#1a2a6c" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.bankName}>{BANK_INFO.bankName}</Text>
                            <Text style={styles.bankNumber}>{BANK_INFO.displayNumber}</Text>
                            <Text style={styles.bankHolder}>a/n {BANK_INFO.accountHolder}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyAccount}>
                            <Ionicons name="copy-outline" size={16} color="#4e73df" />
                            <Text style={styles.copyText}>Salin</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Upload Section */}
                <Text style={styles.sectionTitle}>Unggah Bukti Transfer</Text>

                {image ? (
                    <View style={styles.previewCard}>
                        <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
                        <View style={styles.previewActions}>
                            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                                <Ionicons name="camera-outline" size={16} color="#4e73df" />
                                <Text style={styles.changeBtnText}>Ganti Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
                                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                <Text style={styles.removeBtnText}>Hapus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={pickImage}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <View style={styles.uploadIconCircle}>
                            <Ionicons name="cloud-upload-outline" size={32} color="#4e73df" />
                        </View>
                        <Text style={styles.uploadTitle}>Pilih Bukti Pembayaran</Text>
                        <Text style={styles.uploadSub}>Format JPG, JPEG, PNG (Maks 5MB)</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.8 }]}
                    onPress={submitPayment}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#1a2a6c', '#b21f1f']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBtn}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View style={styles.btnContent}>
                                <Ionicons name="checkmark-circle" size={20} color="white" />
                                <Text style={styles.btnText}>KIRIM BUKTI PEMBAYARAN</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>

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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    scrollContent: {
        padding: 16,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 13,
        color: '#64748b',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 14,
    },
    bankTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 10,
    },
    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    bankIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bankName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    bankNumber: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4e73df',
        marginTop: 2,
    },
    bankHolder: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef2ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    copyText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4e73df',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
    },
    uploadBox: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        padding: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    uploadIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    uploadTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    uploadSub: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    previewCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    previewImage: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
    },
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 12,
    },
    changeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef2ff',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    changeBtnText: {
        color: '#4e73df',
        fontSize: 12,
        fontWeight: '700',
    },
    removeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    removeBtnText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    submitBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#b21f1f',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    gradientBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.5,
    },
});
