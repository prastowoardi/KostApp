import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PaymentDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await axios.get(`${API_URL}/tenant/payments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPayment(response.data);
            } catch (error) {
                console.error("Error Detail:", error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const formatRp = (num) => num ? Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
    
    const formatPeriod = (date) => {
        if(!date) return "";
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>
    );

    if (!payment) return null;

    const isPaid = payment.status === 'paid';

    if (!isPaid) {
        return (
            <SafeAreaView style={styles.containerRejected}>
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
                        <Ionicons name="arrow-back" size={24} color="#7f1d1d" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Status Pembayaran</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollRejected}>
                    <View style={styles.alertBox}>
                        <MaterialIcons name="error-outline" size={60} color="#e11d48" />
                        <Text style={styles.alertTitle}>Pembayaran Tertunda</Text>
                        <Text style={styles.alertSub}>Perlu Konfirmasi Manual</Text>
                        <View style={styles.alertDivider} />
                        <Text style={styles.alertDesc}>
                            Maaf, pembayaran Anda belum dapat kami verifikasi secara otomatis. 
                            Mohon lakukan konfirmasi manual kepada pengelola kost untuk pengecekan lebih lanjut.
                        </Text>
                    </View>

                    <View style={styles.detailBox}>
                        <Text style={styles.sectionTitle}>Detail Pembayaran:</Text>
                        
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>No. Invoice</Text>
                            <Text style={styles.dataValue}>#{payment.invoice_number}</Text>
                        </View>
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Unit Kamar</Text>
                            <Text style={styles.dataValue}>No. {payment.room?.room_number}</Text>
                        </View>
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Periode</Text>
                            <Text style={styles.dataValue}>{formatPeriod(payment.period_month)}</Text>
                        </View>
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Nominal</Text>
                            <Text style={[styles.dataValue, { color: '#b91c1c' }]}>Rp {formatRp(payment.total)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.waButton}
                        onPress={() => Linking.openURL('https://wa.me/6285111203521')}
                    >
                        <FontAwesome5 name="whatsapp" size={20} color="white" />
                        <Text style={styles.waButtonText}>Hubungi Pengelola</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.containerSuccess}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#134e4a" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scrollSuccess} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.circleAccent} />
                    <View style={styles.header}>
                        <Text style={styles.brandName}>Serrata Kost</Text>
                        <Text style={styles.title}>E-Kwitansi</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>● Lunas</Text>
                        </View>
                    </View>
                    <View style={styles.content}>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}><Text style={styles.label}>Penyewa</Text><Text style={styles.value}>{payment.tenant?.user?.name}</Text></View>
                            <View style={styles.infoItem}><Text style={styles.label}>Unit Kamar</Text><Text style={[styles.value, { color: '#0d9488' }]}>No. {payment.room?.room_number}</Text></View>
                            <View style={styles.infoItem}><Text style={styles.label}>Periode</Text><Text style={styles.value}>{formatPeriod(payment.period_month)}</Text></View>
                            <View style={styles.infoItem}><Text style={styles.label}>No. Invoice</Text><View style={styles.invoiceNoBox}><Text style={styles.invoiceNoText}>#{payment.invoice_number}</Text></View></View>
                        </View>
                        <View style={styles.amountCard}>
                            <Text style={styles.totalLabel}>Total Diterima</Text>
                            <View style={styles.amountWrapper}><Text style={styles.currencyPrefix}>Rp</Text><Text style={styles.totalAmount}>{formatRp(payment.total)}</Text></View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.footer}><Text style={styles.footerText}>Generated by System</Text></View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // REJECTED STYLES
    containerRejected: { flex: 1, backgroundColor: '#fff1f2' },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backCircle: { backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 2 },
    navTitle: { fontSize: 16, fontWeight: '700', color: '#7f1d1d' },
    scrollRejected: { padding: 20, alignItems: 'center' },
    alertBox: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center', width: '100%', marginBottom: 20, elevation: 3 },
    alertTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginTop: 15 },
    alertSub: { fontSize: 14, fontWeight: '600', color: '#e11d48', marginTop: 5 },
    alertDivider: { height: 1, width: '40%', backgroundColor: '#fecdd3', marginVertical: 20 },
    alertDesc: { textAlign: 'center', color: '#6b7280', lineHeight: 22, fontSize: 14 },
    detailBox: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, width: '100%', borderLeftWidth: 5, borderLeftColor: '#e11d48' },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9ca3af', marginBottom: 15, textTransform: 'uppercase' },
    dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    dataLabel: { color: '#6b7280', fontSize: 14 },
    dataValue: { fontWeight: '700', color: '#111827', fontSize: 14 },
    waButton: { backgroundColor: '#16a34a', flexDirection: 'row', padding: 16, borderRadius: 100, width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 25 },
    waButtonText: { color: 'white', fontWeight: '700', marginLeft: 10, fontSize: 15 },

    // SUCCESS STYLES (Identik dengan Web kamu)
    containerSuccess: { flex: 1, backgroundColor: '#f0f9f9' },
    scrollSuccess: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 40 },
    backButton: { padding: 10, position: 'absolute', top: 10, left: 10, zIndex: 10 },
    card: { backgroundColor: '#ffffff', borderRadius: 32, width: '100%', maxWidth: 480, alignSelf: 'center', elevation: 10, overflow: 'hidden', position: 'relative' },
    circleAccent: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, backgroundColor: 'rgba(20, 184, 166, 0.08)', borderRadius: 75 },
    header: { padding: 40, paddingBottom: 20 },
    brandName: { fontSize: 12, fontWeight: '800', color: '#0d9488', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
    title: { fontSize: 28, color: '#134e4a', fontWeight: '800', letterSpacing: -0.5 },
    statusBadge: { backgroundColor: '#f0fdf4', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 100, alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderColor: '#dcfce7' },
    statusText: { color: '#16a34a', fontSize: 12, fontWeight: '700' },
    content: { paddingHorizontal: 40, paddingBottom: 40 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 30 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    infoItem: { width: '48%', marginBottom: 25 },
    label: { fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    value: { fontSize: 15, fontWeight: '700', color: '#334155' },
    invoiceNoBox: { backgroundColor: '#f8fafc', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
    invoiceNoText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
    amountCard: { backgroundColor: '#f0fdfa', padding: 24, borderRadius: 24, marginTop: 10, borderWidth: 1, borderColor: '#ccfbf1', alignItems: 'center' },
    totalLabel: { fontSize: 11, color: '#115e59', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
    amountWrapper: { flexDirection: 'row', alignItems: 'baseline' },
    currencyPrefix: { fontSize: 14, color: '#115e59', fontWeight: '700', marginRight: 6 },
    totalAmount: { fontSize: 32, fontWeight: '800', color: '#115e59' },
    footer: { alignItems: 'center' },
    footerText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
});