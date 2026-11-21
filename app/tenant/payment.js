import { Ionicons } from '@expo/vector-icons';
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
import api, { clearAuthSession } from '../../helpers/api';
import { formatRupiah, formatMonthYear } from '../../helpers/formatters';
import styles from '../../styles/tenantPayment.styles';

const BANK_ACCOUNTS = [
    // {
    //     id: 'mandiri',
    //     bankName: 'Bank Mandiri',
    //     accountNumber: '1360014406059',
    //     displayNumber: '136-001-440-6059',
    //     accountHolder: 'Prastowo Ardi Widigdo',
    //     badgeColor: '#1e3a8a',
    //     badgeBg: '#eff6ff',
    //     logo: require('../../assets/images/banks/mandiri.png'),
    // },
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
            const response = await api.get('/me');
            setBillData(response.data);
        } catch (error) {
            console.log('Error Fetch Bill Detail:', error.message);
            if (error.response?.status === 401) {
                await clearAuthSession();
                router.replace('/');
            }
        }
    }, [router]);

    useEffect(() => {
        fetchBillDetail();
    }, [fetchBillDetail]);

    const pickImageFromGallery = async () => {
        try {
            if (Platform.OS !== 'web') {
                try {
                    await ImagePicker.requestMediaLibraryPermissionsAsync();
                } catch (permErr) {
                    console.log('Permission request note:', permErr);
                }
            }

            // Call without options map so Android R8 RecordTypeConverter doesn't fail on stripped fields
            const result = await ImagePicker.launchImageLibraryAsync();

            if (!result.canceled && result.assets?.[0]?.uri) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Error pick gallery:', error);
            showAlert('Gagal Memilih Foto', 'Terjadi kesalahan saat membuka galeri foto: ' + (error?.message || 'Silakan coba lagi.'), 'error');
        }
    };

    const takePhotoFromCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                return showAlert('Izin Kamera Diperlukan', 'Aplikasi memerlukan izin kamera untuk memotret bukti transfer pembayaran.', 'warning');
            }

            // Call without options map to use native defaults safely
            const result = await ImagePicker.launchCameraAsync();

            if (!result.canceled && result.assets?.[0]?.uri) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Error take camera:', error);
            showAlert('Gagal Memotret', 'Terjadi kesalahan saat membuka kamera: ' + (error?.message || 'Silakan coba lagi.'), 'error');
        }
    };

    const submitPayment = async () => {
        if (!image) {
            return showAlert('Perhatian', 'Silakan pilih foto bukti transfer terlebih dahulu.', 'warning');
        }

        setLoading(true);
        try {
            const formData = new FormData();
            const cleanUri = image.toLowerCase();
            let fileType = 'image/jpeg';
            let fileExt = 'jpg';

            if (cleanUri.endsWith('.png')) {
                fileType = 'image/png';
                fileExt = 'png';
            } else if (cleanUri.endsWith('.webp')) {
                fileType = 'image/webp';
                fileExt = 'webp';
            } else if (cleanUri.endsWith('.heic')) {
                fileType = 'image/heic';
                fileExt = 'heic';
            }

            const filename = `proof_${Date.now()}.${fileExt}`;

            if (Platform.OS === 'web') {
                const response = await fetch(image);
                const blob = await response.blob();
                formData.append('proof_image', blob, filename);
            } else {
                formData.append('proof_image', {
                    uri: image,
                    name: filename,
                    type: fileType,
                });
            }

            await api.post('/payments/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
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
            <StatusBar barStyle="light-content" translucent backgroundColor="#0f172a" />

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
                        <View style={styles.previewImageWrap}>
                            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
                            <View style={styles.proofBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                                <Text style={styles.proofBadgeText}>Bukti Siap Dikirim</Text>
                            </View>
                        </View>
                        <View style={styles.previewActions}>
                            <TouchableOpacity
                                style={styles.cameraBtn}
                                onPress={takePhotoFromCamera}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="camera-outline" size={16} color="#059669" />
                                <Text style={styles.cameraBtnText}>Foto Ulang</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.changeBtn}
                                onPress={pickImageFromGallery}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="images-outline" size={16} color="#2563eb" />
                                <Text style={styles.changeBtnText}>Ganti Galeri</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() => setImage(null)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                <Text style={styles.removeBtnText}>Hapus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.directOptionsWrap}>
                        {/* Opsi 1: Buka Kamera */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={takePhotoFromCamera}
                            disabled={loading}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.optionIconCircle, { backgroundColor: '#ecfdf5' }]}>
                                <Ionicons name="camera" size={26} color="#059669" />
                            </View>
                            <View style={styles.optionInfo}>
                                <View style={styles.optionTitleRow}>
                                    <Text style={styles.optionTitle}>Buka Kamera</Text>
                                    <View style={styles.optionBadgeGreen}>
                                        <Text style={styles.optionBadgeTextGreen}>Foto Langsung</Text>
                                    </View>
                                </View>
                                <Text style={styles.optionDesc}>
                                    Potret fisik struk ATM, teller bank, atau nota pembayaran
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Opsi 2: Pilih dari Galeri */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={pickImageFromGallery}
                            disabled={loading}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.optionIconCircle, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="images" size={26} color="#2563eb" />
                            </View>
                            <View style={styles.optionInfo}>
                                <View style={styles.optionTitleRow}>
                                    <Text style={styles.optionTitle}>Pilih dari Galeri</Text>
                                    <View style={styles.optionBadgeBlue}>
                                        <Text style={styles.optionBadgeTextBlue}>Screenshot / File</Text>
                                    </View>
                                </View>
                                <Text style={styles.optionDesc}>
                                    Unggah screenshot bukti transfer m-banking atau e-wallet
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Tips Box */}
                        <View style={styles.modalTipsBox}>
                            <Ionicons name="information-circle" size={18} color="#2563eb" />
                            <Text style={styles.modalTipsText}>
                                Format didukung: JPG, PNG, WEBP (maks. 5MB). Pastikan tanggal & nominal transfer terlihat jelas.
                            </Text>
                        </View>
                    </View>
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
