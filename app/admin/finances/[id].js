import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../../components/GlobalAlert';
import api from '../../../helpers/api';
import { formatRupiah, formatDate, getStorageUrl } from '../../../helpers/formatters';

const { width, height } = Dimensions.get('window');

export default function FinanceDetail() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);
    const [isImageModalVisible, setImageModalVisible] = useState(false);

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
        fetchDetail();
    }, [fetchDetail]);

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
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4e73df" />
                <Text style={styles.loadingText}>Memuat detail transaksi...</Text>
            </View>
        );
    }

    if (!item) return null;

    const isIncome = item.type === 'income';
    const receiptUri = getStorageUrl(item.receipt_file);

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
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setImageModalVisible(true)}
                            style={styles.imageWrapper}
                        >
                            <Image source={{ uri: receiptUri }} style={styles.evidenceImage} resizeMode="cover" />
                            <View style={styles.zoomOverlay}>
                                <Ionicons name="expand" size={16} color="white" />
                                <Text style={styles.zoomText}>Ketuk untuk perbesar</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.noImage}>
                            <Ionicons name="image-outline" size={28} color="#cbd5e1" />
                            <Text style={styles.noImageText}>Tidak ada foto bukti transaksi</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.label}>Informasi Tambahan</Text>
                    <Text style={styles.noteText}>ID Transaksi: #{item.uuid || item.id_finance || item.id}</Text>
                    <Text style={styles.noteText}>Waktu Input: {formatDate(item.created_at, true)}</Text>
                </View>

                {/* Action Button */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bukti Transaksi</Text>
                            <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#334155" />
                            </TouchableOpacity>
                        </View>
                        {receiptUri ? (
                            <Image source={{ uri: receiptUri }} style={styles.fullImage} resizeMode="contain" />
                        ) : null}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#64748b',
        fontSize: 14,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 36,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerAmount: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff',
    },
    headerType: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        fontWeight: '600',
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginTop: -18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    rowLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    rowValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        maxWidth: '65%',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    imageWrapper: {
        height: 180,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f1f5f9',
    },
    evidenceImage: {
        width: '100%',
        height: '100%',
    },
    zoomOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    zoomText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    noImage: {
        height: 90,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    noImageText: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 6,
    },
    noteText: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    actionContainer: {
        paddingHorizontal: 16,
        marginTop: 18,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#fef2f2',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fecaca',
        gap: 6,
    },
    deleteText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
    },
    modalHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    fullImage: {
        width: width * 0.85,
        height: height * 0.55,
    },
});
