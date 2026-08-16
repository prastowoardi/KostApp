import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL } from '../../../helpers/api';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';

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
        <View className="flex-1 items-center justify-center bg-background">
            <Skeleton className="h-64 w-72 rounded-[24px]" />
        </View>
    );

    if (!payment) return null;

    const isPaid = payment.status === 'paid';

    if (!isPaid) {
        return (
            <SafeAreaView className="flex-1 bg-[#fff1f2]">
                <View className="flex-row items-center justify-between p-5">
                    <TouchableOpacity onPress={() => router.back()} className="rounded-full bg-card p-2 shadow-sm">
                        <Ionicons name="arrow-back" size={24} color="#7f1d1d" />
                    </TouchableOpacity>
                    <Text className="text-base font-bold text-[#7f1d1d]">Status Pembayaran</Text>
                    <View className="w-10" />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
                    <View className="mb-5 w-full items-center rounded-[24px] bg-card p-8 shadow-sm">
                        <MaterialIcons name="error-outline" size={60} color="#e11d48" />
                        <Text className="mt-3.5 text-xl font-extrabold text-foreground">Pembayaran Tertunda</Text>
                        <Text className="mt-1.5 text-sm font-semibold text-destructive">Perlu Konfirmasi Manual</Text>
                        <View className="my-5 h-px w-2/5 bg-[#fecdd3]" />
                        <Text className="text-center text-sm leading-6 text-muted-foreground">
                            Maaf, pembayaran Anda belum dapat kami verifikasi secara otomatis. 
                            Mohon lakukan konfirmasi manual kepada pengelola kost untuk pengecekan lebih lanjut.
                        </Text>
                    </View>

                    <View className="w-full rounded-[20px] border-l-4 border-destructive bg-card p-5">
                        <Text className="mb-4 text-[13px] font-bold uppercase text-muted-foreground">Detail Pembayaran:</Text>
                        
                        <View className="mb-3 flex-row justify-between">
                            <Text className="text-sm text-muted-foreground">No. Invoice</Text>
                            <Text className="text-sm font-bold text-foreground">#{payment.invoice_number}</Text>
                        </View>
                        <View className="mb-3 flex-row justify-between">
                            <Text className="text-sm text-muted-foreground">Unit Kamar</Text>
                            <Text className="text-sm font-bold text-foreground">No. {payment.room?.room_number}</Text>
                        </View>
                        <View className="mb-3 flex-row justify-between">
                            <Text className="text-sm text-muted-foreground">Periode</Text>
                            <Text className="text-sm font-bold text-foreground">{formatPeriod(payment.period_month)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-sm text-muted-foreground">Nominal</Text>
                            <Text className="text-sm font-bold text-destructive">Rp {formatRp(payment.total)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        className="mt-6 w-full flex-row items-center justify-center rounded-full bg-success p-4"
                        onPress={() => Linking.openURL('https://wa.me/6285111203521')}
                    >
                        <FontAwesome5 name="whatsapp" size={20} color="white" />
                        <Text className="ml-2.5 text-[15px] font-bold text-white">Hubungi Pengelola</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#f0f9f9]">
            <TouchableOpacity onPress={() => router.back()} className="absolute left-2.5 top-2.5 z-10 p-2.5">
                <Ionicons name="chevron-back" size={28} color="#134e4a" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View className="relative w-full max-w-[480px] self-center overflow-hidden rounded-[32px] bg-card shadow-lg">
                    <View className="absolute -right-12 -top-12 h-[150px] w-[150px] rounded-full" style={{ backgroundColor: 'rgba(20, 184, 166, 0.08)' }} />
                    <View className="p-10 pb-5">
                        <Text className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#0d9488]">Serrata Kost</Text>
                        <Text className="-tracking-[0.5px] text-[28px] font-extrabold text-[#134e4a]">E-Kwitansi</Text>
                        <Badge variant="success" className="mt-3 self-start border border-[#dcfce7] px-4 py-1.5">
                            <Text className="text-xs font-bold text-white">● Lunas</Text>
                        </Badge>
                    </View>
                    <View className="px-10 pb-10">
                        <View className="flex-row flex-wrap justify-between">
                            <View className="mb-6 w-[48%]"><Text className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">Penyewa</Text><Text className="text-[15px] font-bold text-foreground">{payment.tenant?.user?.name}</Text></View>
                            <View className="mb-6 w-[48%]"><Text className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">Unit Kamar</Text><Text className="text-[15px] font-bold text-[#0d9488]">No. {payment.room?.room_number}</Text></View>
                            <View className="mb-6 w-[48%]"><Text className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">Periode</Text><Text className="text-[15px] font-bold text-foreground">{formatPeriod(payment.period_month)}</Text></View>
                            <View className="mb-6 w-[48%]"><Text className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">No. Invoice</Text><View className="self-start rounded-md bg-muted px-2 py-0.5"><Text className="text-[11px] font-bold text-muted-foreground">#{payment.invoice_number}</Text></View></View>
                        </View>
                        <View className="mt-2.5 items-center rounded-[24px] border border-[#ccfbf1] bg-[#f0fdfa] p-6">
                            <Text className="mb-1.5 text-[11px] font-bold uppercase text-[#115e59]">Total Diterima</Text>
                            <View className="flex-row items-baseline"><Text className="mr-1.5 text-sm font-bold text-[#115e59]">Rp</Text><Text className="text-[32px] font-extrabold text-[#115e59]">{formatRp(payment.total)}</Text></View>
                        </View>
                        <View className="my-7 h-px bg-border" />
                        <View className="items-center"><Text className="text-[10px] font-medium text-[#94a3b8]">Generated by System</Text></View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
