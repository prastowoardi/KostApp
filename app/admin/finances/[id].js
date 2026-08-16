import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_URL } from '../../../helpers/api';
import GlobalAlert from '../../../components/GlobalAlert';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';

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
        onConfirm: () => {}
    });

    const STORAGE_URL = process.env.EXPO_PUBLIC_API_URL + '/storage';

    const getDetailUrl = useCallback(() => `${API_URL}/admin/finances/${id}`, [id]);

    useEffect(() => {
        if (!id || id === 'undefined') return;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const response = await api.get(getDetailUrl());
                setItem(response.data.data || response.data);
            } catch (error) {
                console.error("Gagal ambil detail:", error);
                Alert.alert("Error", "Data transaksi tidak ditemukan.");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, getDetailUrl, router]);

    const handleDelete = () => {
        setAlertConfig({
            visible: true,
            title: "Hapus Transaksi",
            message: "Apakah Anda yakin ingin menghapus data ini? Tindakan ini *tidak bisa dibatalkan*.",
            type: "warning",
            isConfirmation: true,
            confirmText: "Ya, Hapus",
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                
                try {
                    await api.delete(`/admin/finances/${id}`);
                    
                    setTimeout(() => {
                        setAlertConfig({
                            visible: true,
                            title: "Berhasil",
                            message: "Data keuangan telah dihapus dari sistem.",
                            type: "success",
                            isConfirmation: false,
                            onConfirm: () => {
                                setAlertConfig(prev => ({ ...prev, visible: false }));
                                router.replace('/admin/finances');
                            }
                        });
                    }, 500);

                } catch {
                    setAlertConfig({
                        visible: true,
                        title: "Gagal",
                        message: "Terjadi kesalahan saat menghapus data.",
                        type: "error",
                        isConfirmation: false,
                    });
                }
            }
        });
    };

    if (loading) return <View className="flex-1 items-center justify-center bg-background"><ActivityIndicator size="large" color="#4e73df" /></View>;
    if (!item) return null;

    const isIncome = item.type === 'income';

    return (
        <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
            {/* Header Header dengan Gradient */}
            <LinearGradient 
                colors={isIncome ? ["#1cc88a", "#13855c"] : ["#e74a3b", "#be2617"]} 
                className="items-center rounded-b-[30px] p-10 pt-16"
            >
                <TouchableOpacity onPress={() => router.back()} className="absolute left-5 top-12 p-2">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                    <Ionicons 
                        name={isIncome ? "trending-up" : "trending-down"} 
                        size={40} 
                        color={isIncome ? "#1cc88a" : "#e74a3b"} 
                    />
                </View>
                
                <Text className="text-[30px] font-bold text-white">
                    Rp {new Intl.NumberFormat('id-ID').format(item.amount)}
                </Text>
                <Text className="mt-1.5 text-base font-semibold text-white/80">{isIncome ? 'Pemasukan' : 'Pengeluaran'}</Text>
            </LinearGradient>

            {/* Informasi Detail */}
            <View className="mx-5 -mt-7 rounded-[20px] bg-card p-6 shadow-md">
                <DetailRow label="Deskripsi" value={item.description || item.title} />
                <DetailRow label="Kategori" value={item.category || 'Umum'} />
                <DetailRow 
                    label="Tanggal" 
                    value={item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'} 
                />
                
                <Separator className="my-5" />
                
                {/* Bagian Gambar Bukti */}
                <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bukti Transaksi</Text>
                {item.receipt_file ? (
                    <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => setImageModalVisible(true)} // Buka Modal
                        className="mt-2.5 h-[220px] overflow-hidden rounded-[15px] bg-muted/60"
                    >
                        <Image 
                            source={{ uri: `${STORAGE_URL}/${item.receipt_file}` }} 
                            className="h-full w-full"
                            style={{ resizeMode: 'cover' }}
                        />
                        {/* Tambahkan Overlay Icon agar user tahu bisa diklik */}
                        <View className="absolute inset-0 items-center justify-center bg-black/25">
                            <Ionicons name="expand-outline" size={24} color="white" />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View className="mt-2.5 h-24 items-center justify-center rounded-[15px] border border-dashed border-border bg-muted/40">
                        <Ionicons name="image-outline" size={24} color="#d1d3e2" />
                        <Text className="mt-1.5 text-xs text-muted-foreground">Tidak ada lampiran gambar</Text>
                    </View>
                )}

                <Separator className="my-5" />
                
                <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Metadata</Text>
                <Text className="mb-1 text-[13px] text-muted-foreground">ID Transaksi: #{item.id || item.uuid}</Text>
                <Text className="text-[13px] text-muted-foreground">Dibuat pada: {new Date(item.created_at).toLocaleString('id-ID')}</Text>
            </View>

            {/* Tombol Aksi */}
            <View style={{ paddingBottom: insets.bottom + 40 }}>
<Button 
                variant="outline"
                className="mx-5 mt-5 rounded-[15px] border-destructive/20 bg-card p-4" 
                onPress={handleDelete}
            >
                <Ionicons name="trash-outline" size={20} color="hsl(var(--destructive))" />
                <Text className="ml-2.5 font-bold text-destructive">Hapus Transaksi</Text>
            </Button>
            </View>
            
            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                isConfirmation={alertConfig.isConfirmation}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />

            <Modal
                visible={isImageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <Pressable 
                    className="flex-1 items-center justify-center bg-black/70 p-5" 
                    onPress={() => setImageModalVisible(false)}
                >
                    <View className="w-full overflow-hidden rounded-[25px] bg-card shadow-lg">
                        {/* Header Modal dengan Judul & Tombol Close */}
                        <View className="flex-row items-center justify-between border-b border-border px-5 py-3.5">
                            <Text className="text-base font-bold text-foreground">Bukti Transaksi</Text>
                            <TouchableOpacity 
                                onPress={() => setImageModalVisible(false)}
                                className="p-1"
                            >
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Area Gambar */}
                        <View className="h-[400px] w-full justify-center bg-muted/50">
                            <Image 
                                source={{ uri: `${STORAGE_URL}/${item.receipt_file}` }} 
                                className="h-full w-full"
                                style={{ resizeMode: 'contain' }}
                            />
                        </View>

                        {/* Footer Modal (Opsional: Info Tambahan) */}
                        <View className="flex-row items-center justify-between bg-card px-3.5 py-3.5">
                            <Text className="text-xs font-medium text-muted-foreground">ID: #{item.id || item.uuid}</Text>
                            <Text className="text-xs text-muted-foreground">
                                {new Date(item.transaction_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                            </Text>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </ScrollView>
    );
}

// Komponen Kecil untuk Baris Detail
const DetailRow = ({ label, value }) => (
    <View className="mb-[18px]">
        <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Text>
        <Text className="text-[17px] font-semibold text-foreground">{value}</Text>
    </View>
);
