import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ScreenHeader';
import api, { API_URL } from '../../../helpers/api';
import { Card } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

export default function FinanceIndex() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({ transactions: [], totalIncome: 0, totalExpense: 0 });

    const fetchData = useCallback(async () => {
        try {

            const response = await api.get(`${API_URL}/admin/finances`, {
                params: {
                    limit: 100,
                    sort: 'asc'
                }
            });
            
            setData({
                transactions: response.data.data.reverse(),
                totalIncome: response.data.income,
                totalExpense: response.data.expense
            });
        } catch (error) {
            console.error("Gagal mengambil data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderItem = ({ item }) => {
        return (
            <Card className="mb-3 flex-row items-center rounded-[15px] p-4 shadow-sm" asChild>
            <TouchableOpacity 
                onPress={() => {
                    const id = item.id || item.id_finance || item.uuid;
                    if (id) {
                        router.push(`/admin/finances/${id}`);
                    } else {
                        console.error("Data dari API tidak punya ID:", item);
                        alert("Gagal: ID Transaksi tidak ditemukan di database.");
                    }
                }}
            >
                <View style={{ backgroundColor: item.type === 'income' ? '#1cc88a' : '#e74a3b' }} className="mr-3 h-8 w-1 rounded" />
                <View className="flex-1 flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{item.description || item.title}</Text>
                        <Text className="mt-0.5 text-[11px] text-muted-foreground">
                            {item.category || 'Umum'} • {item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('id-ID') : '-'}
                        </Text>
                    </View>
                    <Text style={{ color: item.type === 'income' ? '#1cc88a' : '#e74a3b' }} className="text-sm font-bold">
                        {item.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID').format(item.amount)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d3e2" />
            </TouchableOpacity>
        </Card>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center bg-background px-5">
                <Skeleton className="h-40 w-full rounded-[30px]" />
                <Skeleton className="mt-4 h-16 w-full rounded-[15px]" />
                <Skeleton className="mt-4 h-16 w-full rounded-[15px]" />
                <Skeleton className="mt-4 h-16 w-full rounded-[15px]" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <ScreenHeader title="Laporan Keuangan">
                <View className="mt-5 flex-row items-center justify-around rounded-[20px] bg-white/15 p-4">
                    <View className="items-center">
                        <Text className="mb-1 text-[11px] text-white/80">Pemasukan</Text>
                        <Text className="text-base font-bold text-white">Rp {new Intl.NumberFormat('id-ID').format(data.totalIncome)}</Text>
                    </View>
                    <View className="h-8 w-px bg-white/30" />
                    <View className="items-center">
                        <Text className="mb-1 text-[11px] text-white/80">Pengeluaran</Text>
                        <Text className="text-base font-bold text-white">Rp {new Intl.NumberFormat('id-ID').format(data.totalExpense)}</Text>
                    </View>
                </View>
            </ScreenHeader>

            <View className="flex-1 px-5 pt-5">
                <View className="mb-3.5 flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase text-primary">Transaksi Terbaru</Text>
                    <TouchableOpacity onPress={() => fetchData()}>
                        <Ionicons name="refresh" size={18} color="#4e73df" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={data.transactions}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => (item.id || item.id_finance || item.uuid || index).toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#b21f1f']} />
                    }
                />
            </View>

            <TouchableOpacity 
                className="absolute right-6 h-15 w-15 items-center justify-center rounded-full bg-primary shadow-lg"
                style={{ bottom: insets.bottom + 30, height: 60, width: 60 }}
                onPress={() => router.push("/admin/finances/create")}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
}
