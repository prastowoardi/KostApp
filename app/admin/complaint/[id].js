import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions, Image, Modal, ScrollView,
    StatusBar, Text,
    TouchableOpacity, View
} from 'react-native';
import ScreenHeader from '../../../components/ScreenHeader';
import { API_URL } from '../../../helpers/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Skeleton } from '../../../components/ui/skeleton';

const { width, height } = Dimensions.get('window');

export default function AdminComplaintDetail() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    const [adminResponse, setAdminResponse] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null);

    const STORAGE_URL = process.env.EXPO_PUBLIC_API_URL;

    useEffect(() => { fetchDetail(); }, [id, fetchDetail]);

    const fetchDetail = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.get(`${API_URL}/admin/complaint/${id}`, {
                headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "69420" }
            });
            setComplaint(res.data.data);
            setAdminResponse(res.data.data.response || '');
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    }, [id]);

    const handleUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.patch(`${API_URL}/admin/complaint/${id}/status`, 
                { status: newStatus, response: adminResponse },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            Alert.alert("Berhasil", "Laporan telah diperbarui");
            fetchDetail();
        } catch {
            Alert.alert("Gagal", "Gagal memperbarui laporan");
        } finally { setUpdating(false); }
    };

    if (loading) return <View className="flex-1 items-center justify-center bg-background"><Skeleton className="h-40 w-full rounded-[20px]" /></View>;

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />

            {/* Modal Preview */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View className="flex-1 justify-center bg-black/95">
                    <TouchableOpacity className="absolute right-5 top-12 z-10" onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={45} color="white" />
                    </TouchableOpacity>
                    <Image source={{ uri: selectedImg }} style={{ width: width, height: height * 0.8 }} resizeMode="contain" />
                </View>
            </Modal>
            
            <ScreenHeader title="Detail Keluhan (Admin)" />

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View className="rounded-[20px] bg-card p-5 shadow-sm">
                    {/* Info Tenant */}
                    <View className="mb-5 flex-row items-center rounded-[15px] bg-accent p-3.5">
                        <Ionicons name="person-circle" size={45} color="hsl(var(--destructive))" />
                        <View className="ml-2.5">
                            <Text className="text-[17px] font-bold text-foreground">{complaint.tenant?.name}</Text>
                            <Text className="text-sm font-semibold text-destructive">Kamar: {complaint.room?.room_number}</Text>
                        </View>
                    </View>

                    <Text className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground">JUDUL & DESKRIPSI</Text>
                    <Text className="mb-2 text-xl font-bold text-foreground">{complaint.title}</Text>
                    <Text className="mb-2.5 text-[15px] leading-6 text-foreground/80">{complaint.description}</Text>

                    <Separator className="my-5" />

                    <Text className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground">FOTO LAMPIRAN (KLIK UNTUK PREVIEW)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1.5">
                        {complaint.images?.map((img, index) => (
                            <TouchableOpacity key={index} className="mr-3" onPress={() => { setSelectedImg(`${STORAGE_URL}/storage/${img.image_path}`); setModalVisible(true); }}>
                                <Image source={{ uri: `${STORAGE_URL}/storage/${img.image_path}` }} className="h-[110px] w-[110px] rounded-xl" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Separator className="my-5" />

                    {/* Form Tanggapan Admin */}
                    <Text className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground">TANGGAPAN ADMIN</Text>
                    <Input
                        className="mb-5 h-24 items-start rounded-xl border-border bg-muted/50 p-3.5 text-align-top"
                        placeholder="Tulis balasan atau instruksi..."
                        multiline
                        value={adminResponse}
                        onChangeText={setAdminResponse}
                    />

                    <Text className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground">GANTI STATUS</Text>
                    <View className="flex-row gap-2.5" style={{ marginBottom: insets.bottom }}>
                        <Button variant="warning" className="flex-1 rounded-xl p-3.5" onPress={() => handleUpdate('in_progress')} disabled={updating}>
                            <Text className="text-[13px] font-bold text-warning-foreground">Proses</Text>
                        </Button>
                        <Button variant="success" className="flex-1 rounded-xl p-3.5" onPress={() => handleUpdate('resolved')} disabled={updating}>
                            <Text className="text-[13px] font-bold text-success-foreground">Selesai</Text>
                        </Button>
                        <Button variant="secondary" className="flex-1 rounded-xl p-3.5" onPress={() => handleUpdate('closed')} disabled={updating}>
                            <Text className="text-[13px] font-bold text-secondary-foreground">Tutup</Text>
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
