import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function PaymentHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchPaymentHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/payments/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(response.data);
        } catch (error) {
            console.log("Error Fetch History:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPaymentHistory(); }, []);

    const getStatusInfo = (status) => {
        switch(status.toLowerCase()) {
            case 'success': case 'approved': 
                return { label: 'Lunas', color: '#1cc88a', icon: 'checkmark-circle' };
            case 'pending': 
                return { label: 'Menunggu', color: '#f6c23e', icon: 'time' };
            case 'rejected': 
                return { label: 'Ditolak', color: '#e74a3b', icon: 'close-circle' };
            default: 
                return { label: status, color: '#858796', icon: 'help-circle' };
        }
    };

    const renderItem = ({ item }) => {
        const status = getStatusInfo(item.status);
        return (
            <View style={styles.card}>
                <View style={styles.cardLeft}>
                    <View style={[styles.iconBg, { backgroundColor: status.color + '15' }]}>
                        <Ionicons name="receipt-outline" size={24} color={status.color} />
                    </View>
                    <View style={{ marginLeft: 15 }}>
                        <Text style={styles.invoiceText}>{item.invoice_number}</Text>
                        <Text style={styles.periodText}>
                            Periode: {new Date(item.period_month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </Text>
                        <Text style={styles.amountText}>Rp {parseInt(item.total).toLocaleString('id-ID')}</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Ionicons name={status.icon} size={20} color={status.color} />
                    <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Riwayat Bayar</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color="#4e73df" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="wallet-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>Belum ada riwayat pembayaran.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    listContainer: { padding: 20 },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 18, 
        padding: 18, 
        marginBottom: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBg: { padding: 12, borderRadius: 12 },
    invoiceText: { fontSize: 13, fontWeight: 'bold', color: '#4e73df', marginBottom: 2 },
    periodText: { fontSize: 12, color: '#858796', marginBottom: 4 },
    amountText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    statusLabel: { fontSize: 11, fontWeight: 'bold', marginTop: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#858796', fontSize: 16 }
});