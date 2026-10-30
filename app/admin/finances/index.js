import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_URL } from '../../../helpers/api';
import { formatRupiah, formatDate } from '../../../helpers/formatters';

export default function FinanceIndex() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
    const [data, setData] = useState({ transactions: [], totalIncome: 0, totalExpense: 0 });

    const FINANCES_URL = `${API_URL}/admin/finances`;

    const fetchData = useCallback(async () => {
        try {
            const response = await api.get(FINANCES_URL, {
                params: {
                    limit: 100,
                    sort: 'asc',
                },
            });

            const transList = Array.isArray(response.data?.data) ? response.data.data : [];

            setData({
                transactions: [...transList].reverse(),
                totalIncome: response.data.income || 0,
                totalExpense: response.data.expense || 0,
            });
        } catch (error) {
            console.log('Error fetch finances:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [FINANCES_URL]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredTransactions = data.transactions.filter((item) => {
        if (filterType === 'all') return true;
        return item.type === filterType;
    });

    const renderItem = ({ item }) => {
        const isIncome = item.type === 'income';
        const targetId = item.uuid || item.id_finance || item.id;

        return (
            <TouchableOpacity
                style={styles.transactionCard}
                onPress={() => {
                    if (targetId) {
                        router.push(`/admin/finances/${targetId}`);
                    }
                }}
                activeOpacity={0.8}
            >
                <View
                    style={[
                        styles.typeIndicator,
                        { backgroundColor: isIncome ? '#10b981' : '#ef4444' },
                    ]}
                />
                <View style={styles.cardContent}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.transTitle} numberOfLines={1}>
                            {item.description || item.title || 'Transaksi Keuangan'}
                        </Text>
                        <Text style={styles.transSub}>
                            {item.category || 'Umum'} • {formatDate(item.transaction_date)}
                        </Text>
                    </View>
                    <Text
                        style={[
                            styles.transAmount,
                            { color: isIncome ? '#10b981' : '#ef4444' },
                        ]}
                    >
                        {isIncome ? '+' : '-'} {formatRupiah(item.amount)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Memuat pembukuan keuangan...</Text>
            </View>
        );
    }

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
                    <Text style={styles.headerTitle}>Laporan Keuangan</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/admin/finances/create')}
                        style={styles.addBtn}
                    >
                        <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Balance Summary Row */}
                <View style={styles.balanceRow}>
                    <View style={styles.balanceCard}>
                        <View style={[styles.balanceIconCircle, { backgroundColor: '#ecfdf5' }]}>
                            <Ionicons name="arrow-down" size={16} color="#10b981" />
                        </View>
                        <Text style={styles.balanceLabel}>Pemasukan</Text>
                        <Text style={[styles.balanceVal, { color: '#10b981' }]}>
                            {formatRupiah(data.totalIncome)}
                        </Text>
                    </View>

                    <View style={styles.balanceCard}>
                        <View style={[styles.balanceIconCircle, { backgroundColor: '#fef2f2' }]}>
                            <Ionicons name="arrow-up" size={16} color="#ef4444" />
                        </View>
                        <Text style={styles.balanceLabel}>Pengeluaran</Text>
                        <Text style={[styles.balanceVal, { color: '#ef4444' }]}>
                            {formatRupiah(data.totalExpense)}
                        </Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterRow}>
                    {[
                        { key: 'all', label: 'Semua' },
                        { key: 'income', label: 'Pemasukan' },
                        { key: 'expense', label: 'Pengeluaran' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.filterTab,
                                filterType === tab.key && styles.filterTabActive,
                            ]}
                            onPress={() => setFilterType(tab.key)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    filterType === tab.key && styles.filterTabTextActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => (item.uuid || item.id_finance || item.id || Math.random()).toString()}
                renderItem={renderItem}
                contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2563eb']}
                        tintColor="#2563eb"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="file-tray-outline" size={56} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
                        <Text style={styles.emptySubtitle}>
                            Belum ada catatan transaksi keuangan pada kategori ini.
                        </Text>
                    </View>
                }
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
        paddingBottom: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
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
    addBtn: {
        backgroundColor: '#10b981',
        padding: 8,
        borderRadius: 12,
    },
    balanceRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    balanceIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    balanceLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
    },
    balanceVal: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 2,
    },
    filterRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 12,
        padding: 4,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 9,
    },
    filterTabActive: {
        backgroundColor: '#ffffff',
    },
    filterTabText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: '#1e3a8a',
        fontWeight: '700',
    },
    listContainer: {
        padding: 16,
    },
    transactionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
    },
    typeIndicator: {
        width: 4,
        height: 38,
        borderRadius: 2,
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    transSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    transAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 4,
    },
});
