import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../../helpers/api';
import { formatRupiah, formatDate, formatMonthYear } from '../../../helpers/formatters';
import styles from '../../../styles/tenantPaymentDetail.styles';

const OWNER_WHATSAPP = 'https://wa.me/6285111203521';

export default function PaymentDetail() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetail = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const response = await axios.get(`${API_URL}/tenant/payments/${id}`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });
            setPayment(response.data?.data || response.data);
        } catch (error) {
            console.log('Error fetch payment detail:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Memuat detail pembayaran...</Text>
            </View>
        );
    }

    if (!payment) {
        return (
            <View style={styles.center}>
                <Ionicons name="receipt-outline" size={56} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Data Pembayaran Tidak Ditemukan</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusLower = (payment.status || '').toLowerCase();
    const isPaid = statusLower === 'paid' || statusLower === 'lunas' || statusLower === 'verified';
    const isPending = statusLower === 'pending';

    const statusColor = isPaid ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';
    const statusBg = isPaid ? '#ecfdf5' : isPending ? '#fffbeb' : '#fef2f2';
    const statusLabel = isPaid ? 'Pembayaran Lunas' : isPending ? 'Menunggu Verifikasi' : 'Pembayaran Tertunda / Ditolak';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient
                colors={isPaid ? ['#10b981', '#059669'] : ['#0f172a', '#1e293b', '#1e3a8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detail Bukti Bayar</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.statusHeaderWrap}>
                    <View style={[styles.statusIconCircle, { backgroundColor: isPaid ? '#ecfdf5' : '#fffbeb' }]}>
                        <Ionicons
                            name={isPaid ? 'checkmark-circle' : isPending ? 'time' : 'alert-circle'}
                            size={40}
                            color={statusColor}
                        />
                    </View>
                    <Text style={styles.statusHeaderTitle}>{statusLabel}</Text>
                    <Text style={styles.statusHeaderSub}>
                        {isPaid
                            ? 'Transaksi Anda telah diverifikasi oleh pengelola.'
                            : isPending
                            ? 'Bukti bayar Anda sedang ditinjau oleh pengelola.'
                            : 'Mohon konfirmasi kembali kepada pengelola kost.'}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Receipt Card */}
                <View style={styles.receiptCard}>
                    <View style={styles.receiptTopRow}>
                        <Text style={styles.invoiceNumber}>
                            #{payment.invoice_number || 'INV-000'}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                {isPaid ? 'LUNAS' : isPending ? 'PENDING' : 'DITOLAK'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <ReceiptRow label="Penghuni" value={payment.tenant?.user?.name || payment.tenant?.name || '-'} />
                    <ReceiptRow label="Unit Kamar" value={`Kamar ${payment.room?.room_number || '-'}`} />
                    <ReceiptRow label="Periode Sewa" value={formatMonthYear(payment.period_month)} />
                    <ReceiptRow label="Tanggal Bayar" value={formatDate(payment.payment_date || payment.created_at)} />
                    <ReceiptRow label="Metode Bayar" value={(payment.payment_method || 'transfer').toUpperCase()} />

                    {payment.verified_at ? (
                        <ReceiptRow label="Diverifikasi Pada" value={formatDate(payment.verified_at, true)} />
                    ) : null}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Pembayaran</Text>
                        <Text style={[styles.totalValue, { color: statusColor }]}>
                            {formatRupiah(payment.total || payment.amount || 0)}
                        </Text>
                    </View>
                </View>

                {/* WhatsApp Help Button */}
                <TouchableOpacity
                    style={styles.waButton}
                    onPress={() => Linking.openURL(OWNER_WHATSAPP)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="logo-whatsapp" size={20} color="white" />
                    <Text style={styles.waButtonText}>Hubungi Pengelola Kost</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const ReceiptRow = ({ label, value }) => (
    <View style={styles.receiptRow}>
        <Text style={styles.receiptLabel}>{label}</Text>
        <Text style={styles.receiptValue}>{value}</Text>
    </View>
);
