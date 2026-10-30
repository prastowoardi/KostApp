import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../components/GlobalAlert';
import { API_URL } from '../../helpers/api';
import { formatRupiah, formatDate, getStorageUrl } from '../../helpers/formatters';

const { width, height } = Dimensions.get('window');

export default function VerifyPayment() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

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
                setAlertConfig(prev => ({ ...prev, visible: false }));
                if (onConfirm) onConfirm();
            },
        });
    };

    const fetchPendingPayments = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const response = await axios.get(`${API_URL}/admin/payments/pending`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });
            setPayments(response.data || []);
        } catch (error) {
            console.log('Error Fetch Pending Payments:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingPayments();
    }, [fetchPendingPayments]);

    const handleAction = async (item, actionType) => {
        // Backend accepts 'approved' or 'rejected'
        const apiStatus = actionType === 'approve' ? 'approved' : 'rejected';
        const targetId = item.uuid || item.id;
        const tenantName = item.tenant?.user?.name || item.tenant?.name || 'Penghuni';

        const actionText = actionType === 'approve' ? 'menyetujui' : 'menolak';

        setAlertConfig({
            visible: true,
            title: actionType === 'approve' ? 'Verifikasi Pembayaran' : 'Tolak Pembayaran',
            message: `Apakah Anda yakin ingin *${actionText}* pembayaran dari *${tenantName}* sebesar *${formatRupiah(item.amount || item.total)}*?`,
            type: 'confirmation',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                setProcessingId(targetId);

                try {
                    const token = await AsyncStorage.getItem('userToken');
                    const cleanToken = token ? token.replace(/"/g, '').trim() : '';
                    const url = `${API_URL}/admin/payments/${targetId}/verify`;

                    await axios.post(
                        url,
                        { status: apiStatus },
                        {
                            headers: {
                                Authorization: `Bearer ${cleanToken}`,
                                Accept: 'application/json',
                            },
                        }
                    );

                    showAlert(
                        'Berhasil',
                        `Pembayaran berhasil ${actionType === 'approve' ? 'diverifikasi' : 'ditolak'}.`,
                        'success',
                        fetchPendingPayments
                    );
                } catch (e) {
                    console.log('Verify Error:', e.response?.data || e.message);
                    const errorMsg = e.response?.data?.message || 'Gagal memproses verifikasi.';
                    showAlert('Gagal', errorMsg, 'error');
                } finally {
                    setProcessingId(null);
                }
            },
        });
    };

    const renderItem = ({ item }) => {
        const targetId = item.uuid || item.id;
        const isProcessing = processingId === targetId;
        const receiptUri = getStorageUrl(item.receipt_file || item.proof_of_payment);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarPill}>
                            <Ionicons name="person" size={16} color="#4e73df" />
                        </View>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={styles.tenantName} numberOfLines={1}>
                                {item.tenant?.user?.name || item.tenant?.name || 'Penghuni'}
                            </Text>
                            <Text style={styles.roomBadge}>
                                Kamar {item.room?.room_number || '-'} • {item.invoice_number ? `#${item.invoice_number}` : ''}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>Menunggu</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Jumlah Tagihan</Text>
                    <Text style={styles.amountText}>{formatRupiah(item.amount || item.total)}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tanggal Bayar</Text>
                    <Text style={styles.infoValue}>{formatDate(item.payment_date || item.created_at)}</Text>
                </View>

                {item.notes ? (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Catatan</Text>
                        <Text style={styles.infoValue}>{item.notes}</Text>
                    </View>
                ) : null}

                {/* BUKTI BAYAR THUMBNAIL */}
                {receiptUri ? (
                    <TouchableOpacity
                        style={styles.receiptPreview}
                        onPress={() => setSelectedImg(receiptUri)}
                        activeOpacity={0.8}
                    >
                        <Image source={{ uri: receiptUri }} style={styles.receiptImage} resizeMode="cover" />
                        <View style={styles.zoomBadge}>
                            <Ionicons name="expand-outline" size={16} color="#ffffff" />
                            <Text style={styles.zoomText}>Lihat Bukti</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.noReceiptBox}>
                        <Ionicons name="image-outline" size={24} color="#94a3b8" />
                        <Text style={styles.noReceiptText}>Tidak ada lampiran bukti bayar</Text>
                    </View>
                )}

                {/* ACTION BUTTONS */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnReject]}
                        onPress={() => handleAction(item, 'reject')}
                        disabled={isProcessing}
                    >
                        <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                        <Text style={styles.btnTextReject}>Tolak</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnApprove]}
                        onPress={() => handleAction(item, 'approve')}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                                <Text style={styles.btnTextApprove}>Terima / Lunas</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* HEADER */}
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
                    <Text style={styles.headerTitle}>Verifikasi Pembayaran</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#b21f1f" />
                    <Text style={styles.loadingText}>Memuat tagihan pending...</Text>
                </View>
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => (item.uuid || item.id || Math.random()).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 24 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchPendingPayments();
                            }}
                            colors={['#b21f1f']}
                            tintColor="#b21f1f"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="checkmark-done" size={48} color="#10b981" />
                            </View>
                            <Text style={styles.emptyTitle}>Semua Beres!</Text>
                            <Text style={styles.emptySubtitle}>Tidak ada pembayaran yang menunggu verifikasi saat ini.</Text>
                        </View>
                    }
                />
            )}

            {/* MODAL ZOOM GAMBAR */}
            <Modal visible={!!selectedImg} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity
                        style={[styles.closeBtn, { top: insets.top + 16 }]}
                        onPress={() => setSelectedImg(null)}
                    >
                        <Ionicons name="close-circle" size={40} color="#ffffff" />
                    </TouchableOpacity>
                    {selectedImg ? (
                        <Image source={{ uri: selectedImg }} style={styles.fullImg} resizeMode="contain" />
                    ) : null}
                </View>
            </Modal>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(p => ({ ...p, visible: false }))}
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
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarPill: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tenantName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    roomBadge: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusPill: {
        backgroundColor: '#fffbeb',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusPillText: {
        color: '#d97706',
        fontSize: 11,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    infoValue: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '600',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10b981',
    },
    receiptPreview: {
        height: 140,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
        position: 'relative',
    },
    receiptImage: {
        width: '100%',
        height: '100%',
    },
    zoomBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    zoomText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    noReceiptBox: {
        height: 80,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 12,
        backgroundColor: '#f8fafc',
    },
    noReceiptText: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 6,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    btnReject: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    btnTextReject: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 13,
    },
    btnApprove: {
        backgroundColor: '#10b981',
    },
    btnTextApprove: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 13,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 30,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 6,
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImg: {
        width: width * 0.95,
        height: height * 0.8,
    },
    closeBtn: {
        position: 'absolute',
        right: 20,
        zIndex: 20,
    },
});
