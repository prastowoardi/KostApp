import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_URL } from '../../../helpers/api';
import { formatRupiah, formatDate } from '../../../helpers/formatters';
import styles from '../../../styles/adminFinances.styles';

export default function FinanceIndex() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Active filters
    const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [datePreset, setDatePreset] = useState('all'); // 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state & draft filters
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [draftType, setDraftType] = useState('all');
    const [draftCategory, setDraftCategory] = useState('all');
    const [draftDatePreset, setDraftDatePreset] = useState('all');
    const [draftStartDate, setDraftStartDate] = useState('');
    const [draftEndDate, setDraftEndDate] = useState('');
    const [draftSearch, setDraftSearch] = useState('');

    const [categories, setCategories] = useState([]);
    const [data, setData] = useState({ transactions: [], totalIncome: 0, totalExpense: 0 });

    const FINANCES_URL = `${API_URL}/admin/finances`;

    const computePresetDates = (preset) => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const pad = (n) => String(n).padStart(2, '0');

        if (preset === 'this_month') {
            const start = `${y}-${pad(m + 1)}-01`;
            const lastDay = new Date(y, m + 1, 0).getDate();
            const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
            return { start, end };
        }
        if (preset === 'last_month') {
            const prevYear = m === 0 ? y - 1 : y;
            const prevMonth = m === 0 ? 11 : m - 1;
            const start = `${prevYear}-${pad(prevMonth + 1)}-01`;
            const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
            const end = `${prevYear}-${pad(prevMonth + 1)}-${pad(lastDay)}`;
            return { start, end };
        }
        if (preset === 'this_year') {
            const start = `${y}-01-01`;
            const end = `${y}-12-31`;
            return { start, end };
        }
        return { start: '', end: '' };
    };

    const fetchData = useCallback(async () => {
        try {
            const params = {
                limit: 200,
                sort: 'desc',
            };
            if (filterType !== 'all') params.type = filterType;
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const response = await api.get(FINANCES_URL, { params });

            const transList = Array.isArray(response.data?.data) ? response.data.data : [];

            // Extract unique categories
            const catSet = new Set();
            if (Array.isArray(response.data?.categories)) {
                response.data.categories.forEach((c) => catSet.add(c));
            }
            transList.forEach((t) => {
                if (t.category) catSet.add(t.category);
            });
            if (catSet.size > 0) {
                setCategories(Array.from(catSet));
            }

            setData({
                transactions: transList,
                totalIncome: response.data.income || 0,
                totalExpense: response.data.expense || 0,
            });
        } catch (error) {
            console.log('Error fetch finances:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [FINANCES_URL, filterType, selectedCategory, startDate, endDate, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const openFilterModal = () => {
        setDraftType(filterType);
        setDraftCategory(selectedCategory);
        setDraftDatePreset(datePreset);
        setDraftStartDate(startDate);
        setDraftEndDate(endDate);
        setDraftSearch(searchQuery);
        setFilterModalVisible(true);
    };

    const handleSelectPreset = (preset) => {
        setDraftDatePreset(preset);
        if (preset !== 'custom') {
            const { start, end } = computePresetDates(preset);
            setDraftStartDate(start);
            setDraftEndDate(end);
        }
    };

    const applyFilter = () => {
        setFilterType(draftType);
        setSelectedCategory(draftCategory);
        setDatePreset(draftDatePreset);
        setStartDate(draftStartDate);
        setEndDate(draftEndDate);
        setSearchQuery(draftSearch);
        setFilterModalVisible(false);
    };

    const resetDraftFilter = () => {
        setDraftType('all');
        setDraftCategory('all');
        setDraftDatePreset('all');
        setDraftStartDate('');
        setDraftEndDate('');
        setDraftSearch('');
    };

    const resetAllFilters = () => {
        setFilterType('all');
        setSelectedCategory('all');
        setDatePreset('all');
        setStartDate('');
        setEndDate('');
        setSearchQuery('');
    };

    // Filtered list client-side
    const filteredTransactions = data.transactions.filter((item) => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (startDate) {
            const itemDate = (item.transaction_date || '').split('T')[0];
            if (itemDate && itemDate < startDate) return false;
        }
        if (endDate) {
            const itemDate = (item.transaction_date || '').split('T')[0];
            if (itemDate && itemDate > endDate) return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const desc = (item.description || item.title || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            if (!desc.includes(q) && !cat.includes(q)) return false;
        }
        return true;
    });

    const hasActiveFilter =
        selectedCategory !== 'all' ||
        datePreset !== 'all' ||
        !!startDate ||
        !!endDate ||
        !!searchQuery.trim();

    // Summary calculation matching current filters
    const displayIncome = hasActiveFilter || filterType !== 'all'
        ? filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0)
        : data.totalIncome;

    const displayExpense = hasActiveFilter || filterType !== 'all'
        ? filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0)
        : data.totalExpense;

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
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={openFilterModal}
                            style={styles.filterBtn}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="options-outline" size={20} color="white" />
                            {hasActiveFilter && <View style={styles.filterBadge} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/admin/finances/create')}
                            style={styles.addBtn}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Balance Summary Row */}
                <View style={styles.balanceRow}>
                    <View style={styles.balanceCard}>
                        <View style={[styles.balanceIconCircle, { backgroundColor: '#ecfdf5' }]}>
                            <Ionicons name="arrow-down" size={16} color="#10b981" />
                        </View>
                        <Text style={styles.balanceLabel}>Pemasukan</Text>
                        <Text style={[styles.balanceVal, { color: '#10b981' }]}>
                            {formatRupiah(displayIncome)}
                        </Text>
                    </View>

                    <View style={styles.balanceCard}>
                        <View style={[styles.balanceIconCircle, { backgroundColor: '#fef2f2' }]}>
                            <Ionicons name="arrow-up" size={16} color="#ef4444" />
                        </View>
                        <Text style={styles.balanceLabel}>Pengeluaran</Text>
                        <Text style={[styles.balanceVal, { color: '#ef4444' }]}>
                            {formatRupiah(displayExpense)}
                        </Text>
                    </View>
                </View>

                {/* Filter Tabs (Semua / Pemasukan / Pengeluaran) */}
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

            {/* Active Filter Chips Bar (Only shown when filter is applied) */}
            {hasActiveFilter && (
                <View style={styles.activeFilterBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
                        {selectedCategory !== 'all' && (
                            <View style={styles.activeFilterChip}>
                                <Ionicons name="pricetag-outline" size={12} color="#1e3a8a" />
                                <Text style={styles.activeFilterChipText}>{selectedCategory}</Text>
                                <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                                    <Ionicons name="close-circle" size={14} color="#1e3a8a" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {datePreset !== 'all' && (
                            <View style={styles.activeFilterChip}>
                                <Ionicons name="calendar-outline" size={12} color="#1e3a8a" />
                                <Text style={styles.activeFilterChipText}>
                                    {datePreset === 'this_month'
                                        ? 'Bulan Ini'
                                        : datePreset === 'last_month'
                                        ? 'Bulan Lalu'
                                        : datePreset === 'this_year'
                                        ? 'Tahun Ini'
                                        : `${startDate || 'Awal'} s/d ${endDate || 'Kini'}`}
                                </Text>
                                <TouchableOpacity onPress={() => { setDatePreset('all'); setStartDate(''); setEndDate(''); }}>
                                    <Ionicons name="close-circle" size={14} color="#1e3a8a" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {searchQuery.trim() !== '' && (
                            <View style={styles.activeFilterChip}>
                                <Ionicons name="search-outline" size={12} color="#1e3a8a" />
                                <Text style={styles.activeFilterChipText}>{`"${searchQuery}"`}</Text>
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={14} color="#1e3a8a" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity onPress={resetAllFilters} style={styles.clearAllChip}>
                            <Text style={styles.clearAllText}>Reset Filter</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            )}

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
                            {hasActiveFilter
                                ? 'Tidak ditemukan transaksi yang cocok dengan filter Anda.'
                                : 'Belum ada catatan transaksi keuangan pada kategori ini.'}
                        </Text>
                        {hasActiveFilter && (
                            <TouchableOpacity
                                onPress={resetAllFilters}
                                style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#e2e8f0', borderRadius: 10 }}
                            >
                                <Text style={{ fontSize: 13, color: '#334155', fontWeight: 'bold' }}>Hapus Filter</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* FILTER BOTTOM SHEET MODAL */}
            <Modal
                visible={filterModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Laporan Keuangan</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Filter Tipe Transaksi */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Tipe Transaksi</Text>
                                <View style={styles.chipsWrap}>
                                    {[
                                        { key: 'all', label: 'Semua Tipe' },
                                        { key: 'income', label: 'Pemasukan' },
                                        { key: 'expense', label: 'Pengeluaran' },
                                    ].map((t) => (
                                        <TouchableOpacity
                                            key={t.key}
                                            style={[
                                                styles.filterChip,
                                                draftType === t.key && styles.filterChipActive,
                                            ]}
                                            onPress={() => setDraftType(t.key)}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    draftType === t.key && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {t.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Filter Rentang Tanggal / Presets */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Periode Waktu</Text>
                                <View style={styles.chipsWrap}>
                                    {[
                                        { key: 'all', label: 'Semua Waktu' },
                                        { key: 'this_month', label: 'Bulan Ini' },
                                        { key: 'last_month', label: 'Bulan Lalu' },
                                        { key: 'this_year', label: 'Tahun Ini' },
                                        { key: 'custom', label: 'Kustom Tanggal' },
                                    ].map((p) => (
                                        <TouchableOpacity
                                            key={p.key}
                                            style={[
                                                styles.filterChip,
                                                draftDatePreset === p.key && styles.filterChipActive,
                                            ]}
                                            onPress={() => handleSelectPreset(p.key)}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    draftDatePreset === p.key && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {p.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {(draftDatePreset === 'custom' || draftStartDate || draftEndDate) && (
                                    <View style={styles.dateRangeRow}>
                                        <View style={styles.dateInputBox}>
                                            <Text style={styles.dateInputLabel}>Mulai (YYYY-MM-DD)</Text>
                                            <TextInput
                                                style={styles.dateInput}
                                                placeholder="2026-01-01"
                                                placeholderTextColor="#94a3b8"
                                                value={draftStartDate}
                                                onChangeText={(v) => {
                                                    setDraftStartDate(v);
                                                    setDraftDatePreset('custom');
                                                }}
                                            />
                                        </View>
                                        <View style={styles.dateInputBox}>
                                            <Text style={styles.dateInputLabel}>Selesai (YYYY-MM-DD)</Text>
                                            <TextInput
                                                style={styles.dateInput}
                                                placeholder="2026-12-31"
                                                placeholderTextColor="#94a3b8"
                                                value={draftEndDate}
                                                onChangeText={(v) => {
                                                    setDraftEndDate(v);
                                                    setDraftDatePreset('custom');
                                                }}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Filter Kategori */}
                            {categories.length > 0 && (
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterSectionTitle}>Kategori</Text>
                                    <View style={styles.chipsWrap}>
                                        <TouchableOpacity
                                            style={[
                                                styles.filterChip,
                                                draftCategory === 'all' && styles.filterChipActive,
                                            ]}
                                            onPress={() => setDraftCategory('all')}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    draftCategory === 'all' && styles.filterChipTextActive,
                                                ]}
                                            >
                                                Semua Kategori
                                            </Text>
                                        </TouchableOpacity>
                                        {categories.map((cat) => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.filterChip,
                                                    draftCategory === cat && styles.filterChipActive,
                                                ]}
                                                onPress={() => setDraftCategory(cat)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        draftCategory === cat && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Filter Cari Keterangan */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Cari Keterangan / Deskripsi</Text>
                                <View style={styles.searchInputWrap}>
                                    <Ionicons name="search-outline" size={18} color="#94a3b8" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Cari transaksi..."
                                        placeholderTextColor="#94a3b8"
                                        value={draftSearch}
                                        onChangeText={setDraftSearch}
                                    />
                                    {draftSearch ? (
                                        <TouchableOpacity onPress={() => setDraftSearch('')}>
                                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                        </ScrollView>

                        {/* Modal Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.resetFilterBtn}
                                onPress={resetDraftFilter}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.resetFilterText}>Reset</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyFilterBtn}
                                onPress={applyFilter}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.applyFilterText}>Terapkan Filter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
