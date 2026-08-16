import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';
import ScreenHeader from '../../components/ScreenHeader';
import { Skeleton } from '../../components/ui/skeleton';
import { API_URL } from '../../helpers/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const { width } = Dimensions.get('window');
const STORAGE_URL = process.env.EXPO_PUBLIC_API_URL + '/storage/';

export default function VerifyPayment() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingPayments = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/admin/payments/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(response.data);
        } catch (error) {
            console.log("Error Fetch:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPendingPayments(); }, []);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {}
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPendingPayments();
        setRefreshing(false);
    };

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({ 
            visible: true, title, message, type, 
            onConfirm: onConfirm
        });
    };

    const handleAction = async (id, status) => {
        const apiStatus = status === 'success' ? 'paid' : 'rejected';
        
        console.log("Payment ID:", id, "Asking for Status:", apiStatus);

        showAlert("Konfirmasi", `Yakin ingin proses ini?`, 'confirmation', async () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            setProcessing(true);

            try {
                const token = await AsyncStorage.getItem('userToken');
                const url = `${API_URL}/admin/payments/${id}/verify`;

                const response = await axios.post(url, 
                    { status: apiStatus }, 
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                console.log("Server Response:", response.data);
                
                showAlert("Berhasil", "Status telah diperbarui.", "success");
                fetchPendingPayments();
            } catch (e) {
                console.log("FOUND ERROR:");
                console.log("- Message:", e.message);
                console.log("- Data:", e.response?.data);
                
                showAlert("Gagal", `Error: ${e.response?.data?.message || e.message}`,
                    "error"
                );
            } finally {
                setProcessing(false);
            }
        });
    };

    const renderItem = ({ item }) => (
        <Card className="mb-4 rounded-[20px] p-[18px] shadow-sm">
            <View className="flex-row items-center">
                <View className="h-[50px] w-[50px] items-center justify-center rounded-full bg-accent">
                    <Text className="text-xl font-bold text-primary">{item.tenant?.user?.name?.charAt(0) || '?'}</Text>
                </View>
                <View className="ml-4 flex-1">
                    <Text className="text-base font-bold text-foreground">{item.tenant?.user?.name || 'Tenant'}</Text>
                    <Text className="text-[11px] font-semibold text-primary">{item.invoice_number}</Text>
                    <Text className="text-xs text-muted-foreground">Kamar: {item.room?.room_number || '-'}</Text>
                </View>
                <Text className="text-base font-bold text-success">Rp {parseInt(item.total).toLocaleString('id-ID')}</Text>
            </View>

            {/* Tombol Preview Bukti */}
            <TouchableOpacity 
                className={`mt-4 flex-row items-center justify-center rounded-xl bg-accent p-3 ${(!item.receipt_file && !item.proof_of_payment) ? 'opacity-50' : ''}`}
                onPress={() => {
                    const file = item.receipt_file || item.proof_of_payment;
                    if (file) {
                        setSelectedImg(STORAGE_URL + file);
                    } else {
                        showAlert(
                            "Data Kosong", 
                            "Pembayaran ini (INV: " + item.invoice_number + ") tidak memiliki lampiran bukti foto.",
                            "error"
                        );
                    }
                }}
            >
                <Ionicons 
                    name={ (item.receipt_file || item.proof_of_payment) ? "image-outline" : "alert-circle-outline" } 
                    size={20} 
                    color="#4e73df" 
                />
                <Text className="ml-2 text-[13px] font-bold text-primary">
                    { (item.receipt_file || item.proof_of_payment) ? "Lihat Bukti Transfer" : "Tidak Ada Bukti" }
                </Text>
            </TouchableOpacity>

            <View className="mt-4 flex-row justify-between">
                <TouchableOpacity 
                    className="flex-[0.48] flex-row items-center justify-center rounded-xl border-[1.5px] border-destructive py-3.5" 
                    onPress={() => handleAction(item.id || item.uuid, 'rejected')}
                >
                    <Ionicons name="close-outline" size={20} color="hsl(var(--destructive))" />
                    <Text className="ml-1.5 font-bold text-destructive">Tolak</Text>
                </TouchableOpacity>

                <Button variant="success" className="flex-[0.48] rounded-xl py-3.5" onPress={() => handleAction(item.id || item.uuid, 'success')}>
                    <Ionicons name="checkmark-outline" size={20} color="white" />
                    <Text className="ml-1.5 font-bold text-success-foreground">Terima</Text>
                </Button>
            </View>
        </Card>
    );

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            <ScreenHeader title="Verifikasi Bayar" />

            {loading ? (
                <View className="px-5 pt-6">
                    <Skeleton className="h-40 w-full rounded-[20px]" />
                    <Skeleton className="mt-4 h-40 w-full rounded-[20px]" />
                    <Skeleton className="mt-4 h-40 w-full rounded-[20px]" />
                </View>
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => (item.id || item.uuid).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            colors={['#b21f1f']}
                            tintColor="#b21f1f"
                        />
                    }
                    ListEmptyComponent={
                        <View className="mt-24 items-center">
                            <Ionicons name="checkmark-done-circle-outline" size={80} color="#ccc" />
                            <Text className="mt-4 text-sm text-muted-foreground">Semua tagihan sudah terverifikasi!</Text>
                        </View>
                    }
                />
            )}

            {/* MODAL ZOOM GAMBAR */}
            <Modal visible={!!selectedImg} transparent={true} animationType="fade">
                <View className="flex-1 items-center justify-center bg-black/95">
                    <TouchableOpacity className="absolute right-6 top-12 z-10" onPress={() => setSelectedImg(null)}>
                        <Ionicons name="close-circle" size={45} color="white" />
                    </TouchableOpacity>
                    <Image 
                        source={{ 
                            uri: selectedImg,
                            headers: {
                                'ngrok-skip-browser-warning': '69420'
                            }
                        }} 
                        style={{ width: width, height: width * 1.5 }} 
                        resizeMode="contain" 
                        onLoadStart={() => console.log("Get image:", selectedImg)}
                        onError={(e) => console.log("Failed load image. Error:", e.nativeEvent.error)}
                    />
                </View>
            </Modal>

            {processing && (
                <View className="absolute inset-0 z-20 items-center justify-center bg-black/50">
                    <ActivityIndicator size="large" color="white" />
                </View>
            )}

            <GlobalAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm} 
                confirmText="Ya, Lanjutkan"
                cancelText="Batal"
            />
        </View>
    );
}
