import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../../components/GlobalAlert';
import LoadingScreen from '../../../components/LoadingScreen';
import api from '../../../helpers/api';
import { formatRupiah, formatDate, getStorageUrl } from '../../../helpers/formatters';
import styles from '../../../styles/adminFinanceDetail.styles';

export default function FinanceDetail() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);
    const [isImageModalVisible, setImageModalVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [modalImageLoading, setModalImageLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        isConfirmation: false,
        confirmText: 'OK',
        cancelText: 'Batal',
        onConfirm: () => {},
    });

    const fetchDetail = useCallback(async () => {
        if (!id || id === 'undefined') return;
        try {
            setLoading(true);
            setImageError(false);
            setImageLoading(false);
            const response = await api.get(`/admin/finances/${id}`);
            setItem(response.data?.data || response.data);
        } catch (error) {
            console.log('Error fetch finance detail:', error.response?.data || error.message);
            Alert.alert('Error', 'Data transaksi tidak ditemukan.');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        setImageError(false);
        setImageLoading(false);
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchDetail();
        }, [fetchDetail])
    );

    const handleDelete = () => {
        setAlertConfig({
            visible: true,
            title: 'Hapus Transaksi',
            message: 'Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan.',
            type: 'warning',
            isConfirmation: true,
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            onConfirm: async () => {
                setAlertConfig((prev) => ({ ...prev, visible: false }));
                try {
                    await api.delete(`/admin/finances/${id}`);
                    router.replace('/admin/finances');
                } catch {
                    Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus data transaksi.');
                }
            },
        });
    };

    if (loading) {
        return (
            <LoadingScreen
                title="Detail Transaksi"
                message="Memuat rincian transaksi..."
                icon="receipt-outline"
            />
        );
    }

    if (!item) return null;

    const isIncome = item.type === 'income';
    const rawReceipt =
        item.receipt_url ||
        item.receipt_file ||
        item.receipt_path ||
        item.payment?.receipt_file ||
        item.payment?.proof_of_payment ||
        item.payment?.receipt_path ||
        item.payment?.receipt_url;
    const receiptUri = getStorageUrl(rawReceipt);
    const isPdf = typeof receiptUri === 'string' && receiptUri.toLowerCase().includes('.pdf');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
                {/* Header Gradient */}
                <LinearGradient
                    colors={isIncome ? ['#10b981', '#059669'] : ['#ef4444', '#b91c1c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 16 }]}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Detail Transaksi</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                            size={44}
                            color={isIncome ? '#10b981' : '#ef4444'}
                        />
                    </View>

                    <Text style={styles.headerAmount}>
                        {isIncome ? '+' : '-'} {formatRupiah(item.amount)}
                    </Text>
                    <Text style={styles.headerType}>
                        {isIncome ? 'Pemasukan Kas' : 'Pengeluaran Kas'}
                    </Text>
                </LinearGradient>

                {/* Detail Card */}
                <View style={styles.detailCard}>
                    <DetailRow label="Deskripsi" value={item.description || item.title || 'Tanpa keterangan'} />
                    <DetailRow label="Kategori" value={item.category || 'Umum'} />
                    <DetailRow label="Tanggal Transaksi" value={formatDate(item.transaction_date)} />

                    <View style={styles.divider} />

                    {/* Receipt Evidence */}
                    <Text style={styles.label}>Bukti Struk / Lampiran</Text>
                    {receiptUri ? (
                        isPdf ? (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => Linking.openURL(receiptUri)}
                                style={styles.pdfWrapper}
                            >
                                <View style={styles.pdfIconContainer}>
                                    <Ionicons name="document-text" size={28} color="#ef4444" />
                                </View>
                                <View style={styles.pdfInfo}>
                                    <Text style={styles.pdfTitle} numberOfLines={1}>Dokumen Bukti Transaksi (PDF)</Text>
                                    <Text style={styles.pdfSub}>Ketuk untuk membuka atau mengunduh</Text>
                                </View>
                                <Ionicons name="open-outline" size={20} color="#64748b" />
                            </TouchableOpacity>
                        ) : imageError ? (
                            <View style={styles.imageErrorContainer}>
                                <Ionicons name="alert-circle-outline" size={32} color="#f59e0b" />
                                <Text style={styles.imageErrorText}>Foto bukti tidak dapat dimuat</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                                    <TouchableOpacity
                                        style={styles.openExternalBtn}
                                        onPress={() => {
                                            setImageError(false);
                                            setImageLoading(true);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="refresh-outline" size={15} color="#2563eb" />
                                        <Text style={styles.openExternalText}>Coba Lagi</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.openExternalBtn}
                                        onPress={() => router.push(`/admin/finances/edit/${id}`)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="create-outline" size={15} color="#2563eb" />
                                        <Text style={styles.openExternalText}>Unggah Foto Baru</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.openExternalBtn}
                                        onPress={() => Linking.openURL(receiptUri)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="open-outline" size={15} color="#2563eb" />
                                        <Text style={styles.openExternalText}>Buka Tautan</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => setImageModalVisible(true)}
                                    style={styles.imageWrapper}
                                >
                                    <Image
                                        source={{ uri: receiptUri }}
                                        style={styles.evidenceImage}
                                        resizeMode="contain"
                                        onLoadStart={() => setImageLoading(true)}
                                        onLoadEnd={() => setImageLoading(false)}
                                        onError={() => {
                                            setImageLoading(false);
                                            setImageError(true);
                                        }}
                                    />
                                    {imageLoading && (
                                        <View style={styles.imageLoadingOverlay}>
                                            <ActivityIndicator size="small" color="#2563eb" />
                                        </View>
                                    )}
                                    <View style={styles.zoomOverlay}>
                                        <Ionicons name="expand" size={16} color="white" />
                                        <Text style={styles.zoomText}>Ketuk untuk perbesar</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )
                    ) : (
                        <View style={styles.noImage}>
                            <Ionicons name="image-outline" size={28} color="#cbd5e1" />
                            <Text style={styles.noImageText}>Tidak ada bukti transaksi yang diunggah.</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.label}>Informasi Tambahan</Text>
                    <Text style={styles.noteText}>ID Transaksi: #{item.uuid || item.id_finance || item.id}</Text>
                    <Text style={styles.noteText}>Waktu Input: {formatDate(item.created_at, true)}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => router.push(`/admin/finances/edit/${id}`)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#0f172a', '#1e3a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.editGradient}
                        >
                            <Ionicons name="create-outline" size={18} color="#ffffff" />
                            <Text style={styles.editText}>Edit Transaksi</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        <Text style={styles.deleteText}>Hapus Catatan Ini</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal Image Zoom */}
            <Modal
                visible={isImageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setImageModalVisible(false)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <View style={styles.modalBadge}>
                                    <Text style={styles.modalBadgeText}>Serrata Kost</Text>
                                </View>
                                <View style={styles.modalTitleRow}>
                                    <Text style={styles.modalTitle}>Detail Kwitansi</Text>
                                    <View style={styles.modalInvoiceBadge}>
                                        <Text style={styles.modalInvoiceText}>
                                            {item.payment?.invoice_number || `INV-${item.id || ''}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setImageModalVisible(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalDashedWrap}>
                            <View style={styles.modalImageInner}>
                                {receiptUri ? (
                                    <>
                                        <Image
                                            source={{ uri: receiptUri }}
                                            style={styles.fullImage}
                                            resizeMode="contain"
                                            onLoadStart={() => setModalImageLoading(true)}
                                            onLoadEnd={() => setModalImageLoading(false)}
                                        />
                                        {modalImageLoading && (
                                            <View style={styles.imageLoadingOverlay}>
                                                <ActivityIndicator size="large" color="#2563eb" />
                                            </View>
                                        )}
                                    </>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.modalFooterActions}>
                            <TouchableOpacity
                                style={styles.btnDownload}
                                onPress={() => Linking.openURL(receiptUri)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="download-outline" size={16} color="#ffffff" />
                                <Text style={styles.btnDownloadText}>Download Kwitansi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.btnClose}
                                onPress={() => setImageModalVisible(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnCloseText}>Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                isConfirmation={alertConfig.isConfirmation}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </View>
    );
}

const DetailRow = ({ label, value }) => (
    <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
    </View>
);
