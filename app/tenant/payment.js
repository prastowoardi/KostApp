import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
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
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../components/GlobalAlert';
import { API_URL } from '../../helpers/api';
import { formatRupiah, formatMonthYear } from '../../helpers/formatters';
import styles from '../../styles/tenantPayment.styles';

const BANK_ACCOUNTS = [
    {
        id: 'mandiri',
        bankName: 'Bank Mandiri',
        accountNumber: '1360014406059',
        displayNumber: '136-001-440-6059',
        accountHolder: 'Prastowo Ardi Widigdo',
        badgeColor: '#1e3a8a',
        badgeBg: '#eff6ff',
        logo: require('../../assets/images/banks/mandiri.png'),
    },
    {
        id: 'jago',
        bankName: 'Bank Jago',
        accountNumber: '108528656318',
        displayNumber: '108-528-656-318',
        accountHolder: 'Prastowo Ardi Widigdo',
        badgeColor: '#ea580c',
        badgeBg: '#fff7ed',
        logo: require('../../assets/images/banks/jago.png'),
    },
];

export default function PaymentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [billData, setBillData] = useState(null);
    const [copiedBankId, setCopiedBankId] = useState(null);

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

    const handleCopyAccount = async (bank) => {
        try {
            await Clipboard.setStringAsync(bank.accountNumber);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setCopiedBankId(bank.id);
            setTimeout(() => {
                setCopiedBankId(null);
            }, 2500);
        } catch {
            Alert.alert(
                `Nomor Rekening ${bank.bankName}`,
                `No. Rek: ${bank.accountNumber}\na/n ${bank.accountHolder}\n\nSilakan transfer sesuai nominal tagihan sewa.`
            );
        }
    };

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
                    <Text style={styles.bankTitle}>Pilihan Rekening Tujuan Transfer:</Text>
                    {BANK_ACCOUNTS.map((bank) => (
                        <View key={bank.id} style={styles.bankCard}>
                            <View style={styles.bankCardHeader}>
                                <View style={styles.bankLogoWrap}>
                                    <Image
                                        source={bank.logo}
                                        style={styles.bankLogo}
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={[styles.bankBadge, { backgroundColor: bank.badgeBg }]}>
                                    <Text style={[styles.bankBadgeText, { color: bank.badgeColor }]}>
                                        {bank.bankName}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.bankCardBody}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={styles.bankHolderLabel}>Nomor Rekening</Text>
                                    <Text style={[styles.bankNumber, { color: bank.badgeColor }]}>
                                        {bank.displayNumber}
                                    </Text>
                                    <Text style={styles.bankHolder}>a/n {bank.accountHolder}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.copyBtn,
                                        {
                                            backgroundColor: copiedBankId === bank.id ? '#ecfdf5' : bank.badgeBg,
                                            borderColor: copiedBankId === bank.id ? '#10b981' : bank.badgeColor + '30',
                                        },
                                    ]}
                                    onPress={() => handleCopyAccount(bank)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={copiedBankId === bank.id ? 'checkmark-circle' : 'copy-outline'}
                                        size={15}
                                        color={copiedBankId === bank.id ? '#10b981' : bank.badgeColor}
                                    />
                                    <Text
                                        style={[
                                            styles.copyText,
                                            { color: copiedBankId === bank.id ? '#10b981' : bank.badgeColor },
                                        ]}
                                    >
                                        {copiedBankId === bank.id ? 'Tersalin!' : 'Salin'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
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
                        colors={['#0f172a', '#1e3a8a']}
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
