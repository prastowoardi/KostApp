import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';
import ScreenHeader from '../../components/ScreenHeader';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

import { API_URL } from '../../helpers/api';

export default function PaymentScreen() {
    const insets = useSafeAreaInsets();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [billData, setBillData] = useState(null);
    const router = useRouter();

    const fetchBillDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const response = await axios.get(`${API_URL}/me`, {
                headers: { 
                    'Authorization': `Bearer ${cleanToken}`,
                    'Accept': 'application/json'
                }
            });
            setBillData(response.data);
        } catch (error) {
            console.log("Error Fetch Bill:", error.message);
        }
    };

    useEffect(() => {
        fetchBillDetail();
    }, []);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {}
    });

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({ 
            visible: true, title, message, type, 
            onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false })))
        });
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return showAlert("Izin Ditolak", "Aplikasi butuh akses galeri untuk mengupload bukti bayar.", "error");
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const submitPayment = async () => {
        if (!image) return showAlert("Opps!", "Pilih foto bukti transfer dulu ya.", "warning");
        
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';

            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(image);
                const blob = await response.blob();
                formData.append('proof_image', blob, 'payment_proof.jpg');
            } else {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('proof_image', {
                    uri: image,
                    name: filename,
                    type: type,
                });
            }

            await axios.post(`${API_URL}/payments/upload`, formData, {
                headers: { 
                    'Authorization': `Bearer ${cleanToken}`,
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
            });

            showAlert("Berhasil", "Bukti bayar terkirim!", "success", () => {
                router.back();
            });

        } catch (e) {
            console.log("Error Detail:", e.response?.data || e.message);
            const errorMsg = e.response?.data?.errors?.proof_image?.[0] || "Gagal upload gambar.";
            showAlert("Gagal", errorMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            
            <ScreenHeader title="Konfirmasi Bayar" />

            <ScrollView contentContainerStyle={{ padding: 25 }} showsVerticalScrollIndicator={false}>
                <Card className="mb-6 p-5 shadow-md">
                    <Text className="mb-4 text-base font-bold text-foreground">Detail Tagihan</Text>
                    
                    <View className="mb-2.5 flex-row justify-between">
                        <Text className="text-muted-foreground">Bulan</Text>
                        <Text className="font-medium text-foreground">
                            {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                        </Text>
                    </View>

                    <View className="mb-2.5 flex-row justify-between">
                        <Text className="text-muted-foreground">Total Bayar</Text>
                        <Text className="font-bold text-success">
                            Rp {(billData?.bill_amount || 0).toLocaleString('id-ID')}
                        </Text>
                    </View>

                    <View className="my-3.5 h-px bg-border" />
                    <Text className="mb-1.5 text-sm font-bold text-primary">Transfer Ke:</Text>
                    <Text className="text-[15px] text-foreground">Bank Mandiri</Text>
                    <Text className="text-[15px] text-foreground">No. Rek: 136-001-440-6059</Text>
                    <Text className="text-[15px] text-foreground">A/N Prastowo Ardi Widigdo</Text>
                </Card>

                <Text className="mb-4 text-base font-bold text-foreground">Upload Bukti Transfer</Text>
                
                <TouchableOpacity className="h-[250px] items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed border-primary bg-card shadow-sm" onPress={pickImage} disabled={loading}>
                    {image ? (
                        <Image source={{ uri: image }} className="h-full w-full" />
                    ) : (
                        <View className="items-center">
                            <Ionicons name="cloud-upload-outline" size={50} color="#4e73df" />
                            <Text className="mt-2.5 font-semibold text-primary">Klik untuk pilih foto dari galeri</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Button 
                    className="mt-8 h-[58px] rounded-[15px] bg-success"
                    onPress={submitPayment}
                    disabled={loading}
                    loading={loading}
                >
                    {!loading && <Text className="text-base font-bold text-white">KONFIRMASI SEKARANG</Text>}
                </Button>
                <View style={{ height: insets.bottom + 40 }} />
            </ScrollView>

            {/* 4. Komponen Alert Global */}
            <GlobalAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={alertConfig.onConfirm}
            />
        </View>
    );
}
