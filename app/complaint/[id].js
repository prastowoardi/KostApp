import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { API_URL } from '../../helpers/api';
import { Skeleton } from '../../components/ui/skeleton';

const { width, height } = Dimensions.get('window');
export default function ComplaintDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null);

    const STORAGE_URL = process.env.EXPO_PUBLIC_API_URL;

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const res = await axios.get(`${API_URL}/complaints/${id}`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "ngrok-skip-browser-warning": "69420"
                    }
                });
                setComplaint(res.data.data);
            } catch (e) {
                console.error("Gagal ambil detail:", e.response?.data);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'open': return { color: '#4e73df', bg: '#eef2ff' };
            case 'in_progress': return { color: '#f6c23e', bg: '#fffbe6' };
            case 'resolved': return { color: '#1cc88a', bg: '#e6fffa' };
            case 'closed': return { color: '#858796', bg: '#f8f9fc' };
            default: return { color: '#4e73df', bg: '#f1f3f9' };
        }
    };

    if (loading) return (
        <View className="flex-1 items-center justify-center bg-background">
            <Skeleton className="h-64 w-72 rounded-[25px]" />
        </View>
    );

    if (!complaint) return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-foreground">Data tidak ditemukan.</Text>
            <TouchableOpacity onPress={() => router.back()} className="mt-5 rounded-lg bg-primary p-2.5">
                <Text className="text-white">Kembali</Text>
            </TouchableOpacity>
        </View>
    );

    const statusStyle = getStatusStyle(complaint.status);

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />

            {/* --- MODAL PREVIEW MULAI --- */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View className="flex-1 items-center justify-center bg-black/95">
                    <TouchableOpacity className="absolute right-5 top-12 z-[11]" onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={45} color="white" />
                    </TouchableOpacity>
                    <Image 
                        source={{ uri: selectedImg }} 
                        style={{ width: width, height: height * 0.8 }} 
                        resizeMode="contain" 
                    />
                </View>
            </Modal>
            {/* --- MODAL PREVIEW SELESAI --- */}
            
            <LinearGradient colors={['#4e73df', '#224abe']} className="rounded-b-[35px] px-5 pb-14 pt-14">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="rounded-lg bg-white/20 p-1.5">
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">Detail Laporan</Text>
                    <View className="w-10" />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, marginTop: 25 }} showsVerticalScrollIndicator={false}>
                <View className="rounded-[25px] bg-card p-5 shadow-md">
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-xs font-bold tracking-wider text-primary">{complaint.category.toUpperCase()}</Text>
                        <View className="rounded-xl px-3 py-1.5" style={{ backgroundColor: statusStyle.bg }}>
                            <Text className="text-[11px] font-bold capitalize" style={{ color: statusStyle.color }}>
                                {complaint.status.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>

                    <Text className="mb-2 text-[22px] font-bold text-foreground">{complaint.title}</Text>
                    
                    <View className="mb-1.5 flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#95a5a6" />
                        <Text className="ml-1.5 text-[13px] text-muted-foreground">
                            {new Date(complaint.created_at).toLocaleString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </Text>
                    </View>

                    <View className="my-5 h-px bg-border" />
                    <Text className="mb-2.5 text-sm font-bold text-primary">Deskripsi Keluhan</Text>
                    <Text className="text-[15px] leading-6 text-foreground/80">{complaint.description}</Text>
                    <View className="my-5 h-px bg-border" />

                    <Text className="mb-2.5 text-sm font-bold text-primary">Foto Lampiran</Text>
                    <View className="mt-1.5 flex-row flex-wrap gap-3">
                        {complaint.images && complaint.images.length > 0 ? (
                            complaint.images.map((img, index) => {
                                const finalUrl = `${STORAGE_URL}/storage/${img.image_path}`;
                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        className="h-[120px] overflow-hidden rounded-[15px] bg-muted/50"
                                        style={{ width: (width - 100) / 2 }}
                                        onPress={() => {
                                            setSelectedImg(finalUrl);
                                            setModalVisible(true);
                                        }}
                                    >
                                        <Image source={{ uri: finalUrl }} className="h-full w-full" />
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View className="h-24 w-full items-center justify-center rounded-[15px] border border-dashed border-border bg-muted/40">
                                <Ionicons name="image-outline" size={40} color="#d1d8e0" />
                                <Text className="mt-1.5 text-muted-foreground">Tidak ada foto</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
