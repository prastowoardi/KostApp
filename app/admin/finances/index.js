import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../helpers/api';
import axios from 'axios';

export default function FinanceIndex() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({ transactions: [], totalIncome: 0, totalExpense: 0 });

    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/admin/finances`;

    const fetchData = async () => {
        try {

            const response = await api.get(API_URL, {
                params: {
                    limit: 100,
                    sort: 'asc'
                }
            });
            
            setData({
                transactions: response.data.data,
                totalIncome: response.data.income,
                totalExpense: response.data.expense
            });
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity 
                style={styles.transactionCard}
                onPress={() => {
                    const id = item.id || item.id_finance;
                    if (id) {
                        router.push(`/admin/finances/${id}`);
                    } else {
                        console.error("Data dari API tidak punya ID:", item);
                        alert("Gagal: ID Transaksi tidak ditemukan di database.");
                    }
                }}
            >
                <View style={[styles.typeIndicator, { backgroundColor: item.type === 'income' ? '#1cc88a' : '#e74a3b' }]} />
                <View style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.transTitle} numberOfLines={1}>{item.description || item.title}</Text>
                        <Text style={styles.transSub}>
                            {item.category || 'Umum'} • {item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('id-ID') : '-'}
                        </Text>
                    </View>
                    <Text style={[styles.transAmount, { color: item.type === 'income' ? '#1cc88a' : '#e74a3b' }]}>
                        {item.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID').format(item.amount)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d3e2" />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4e73df" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#4e73df", "#224abe"]} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Laporan Keuangan</Text>
                </View>

                <View style={styles.balanceRow}>
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Pemasukan</Text>
                        <Text style={styles.balanceValue}>Rp {new Intl.NumberFormat('id-ID').format(data.totalIncome)}</Text>
                    </View>
                    <View style={styles.balanceDivider} />
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Pengeluaran</Text>
                        <Text style={styles.balanceValue}>Rp {new Intl.NumberFormat('id-ID').format(data.totalExpense)}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
                    <TouchableOpacity onPress={() => fetchData()}>
                        <Ionicons name="refresh" size={18} color="#4e73df" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={data.transactions}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => (item.id || item.id_finance || index).toString()}
                />
            </View>

            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => router.push("/admin/finances/create")}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { marginRight: 15 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 15 },
    balanceItem: { alignItems: 'center' },
    balanceLabel: { color: '#e0e0e0', fontSize: 11, marginBottom: 4 },
    balanceValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    balanceDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
    content: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#4e73df', textTransform: 'uppercase' },
    transactionCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 },
    typeIndicator: { width: 4, height: 35, borderRadius: 2, marginRight: 12 },
    cardContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: 5 },
    transTitle: { fontSize: 14, fontWeight: 'bold', color: '#5a5c69' },
    transSub: { fontSize: 11, color: '#b7b9cc' },
    transAmount: { fontSize: 14, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#b7b9cc', marginTop: 50 },
    fab: { position: 'absolute', bottom: 30, right: 25, backgroundColor: '#4e73df', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});