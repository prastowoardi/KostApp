import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    StatusBar,
    Modal,
    FlatList,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalAlert from '../../../components/GlobalAlert';
import ScreenHeader from '../../../components/ScreenHeader';
import api, { API_URL } from '../../../helpers/api';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';

export default function CreateTransaction() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categories, setCategories] = useState({ income: [], expense: [] });
    
    const [form, setForm] = useState({
        type: 'expense',
        category: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
    });

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {}
    });

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await api.get(`${API_URL}/admin/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories({
                income: response.data.incomeCategories || [],
                expense: response.data.expenseCategories || []
            });
        } catch (error) { console.error(error); }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const formatCurrency = (value) => {
        if (!value) return '';
        const number = value.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleSave = async () => {
        const cleanAmount = form.amount.replace(/\./g, '');
        
        if (!cleanAmount || !form.category) {
            setAlertConfig({ 
                visible: true, 
                title: "Peringatan", 
                message: "Isi semua data!", 
                type: "warning",
                isConfirmation: false,
                confirmText: "Siap",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('type', form.type);
            formData.append('category', form.category);
            formData.append('amount', cleanAmount);
            formData.append('transaction_date', form.transaction_date);
            formData.append('description', form.description || '');

            if (image) {
                const filename = 'receipt_' + Date.now() + '.jpg';
                if (Platform.OS === 'web') {
                    const response = await fetch(image);
                    const blob = await response.blob();
                    formData.append('receipt_file', blob, filename);
                } else {
                    formData.append('receipt_file', {
                        uri: image,
                        name: filename,
                        type: 'image/jpeg',
                    });
                }
            }

            await api.post(`${API_URL}/admin/finances`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setAlertConfig({ 
                visible: true,
                title: "Berhasil",
                message: "Catatan Pembayaran berhasil disimpan!",
                type: "success",
                isConfirmation: false,
                confirmText: "Oke",
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    router.push('/admin/finances');
                }
            });
        } catch (error) {
            console.log("Error Full:", error.response?.data);
            setAlertConfig({ 
                visible: true, 
                title: "Gagal", 
                message: error.response?.data?.message || "Terjadi kesalahan pada server", 
                type: "error",
                isConfirmation: false,
                confirmText: "Coba Lagi",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally { 
            setLoading(false); 
        }
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            className="flex-row items-center justify-between border-b border-muted py-3.5"
            onPress={() => {
                setForm({ ...form, category: item });
                setShowCategoryModal(false);
            }}
        >
            <Text className="text-base text-foreground/80">{item}</Text>
            {form.category === item && <Ionicons name="checkmark-circle" size={20} color="#1a2a6c" />}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            
            <ScreenHeader title="Catat Keuangan" subtitle="Input data secara akurat" />

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                <View className="mb-6 flex-row justify-between rounded-[15px] bg-muted p-1">
                    <TouchableOpacity 
                        className={`flex-1 items-center rounded-xl p-3 ${form.type === 'income' ? 'bg-success' : ''}`}
                        onPress={() => setForm({ ...form, type: 'income', category: '' })}
                    >
                        <Text className={`font-bold ${form.type === 'income' ? 'text-white' : 'text-muted-foreground'}`}>Pemasukan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className={`flex-1 items-center rounded-xl p-3 ${form.type === 'expense' ? 'bg-destructive' : ''}`}
                        onPress={() => setForm({ ...form, type: 'expense', category: '' })}
                    >
                        <Text className={`font-bold ${form.type === 'expense' ? 'text-white' : 'text-muted-foreground'}`}>Pengeluaran</Text>
                    </TouchableOpacity>
                </View>

                {/* Dropdown Custom Style */}
                <View className="mb-5">
                    <Label className="mb-2 mt-4 text-foreground">Kategori</Label>
                    <TouchableOpacity 
                        className="flex-row items-center justify-between rounded-xl border border-border bg-card p-3.5" 
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text className={`text-base ${form.category ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {form.category || "Pilih kategori transaksi..."}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="hsl(var(--muted-foreground))" />
                    </TouchableOpacity>
                </View>

                <View className="mb-5">
                    <Label className="mb-2 mt-4 text-foreground">Nominal (Rp)</Label>
                    <View className="flex-row items-center rounded-xl border border-border bg-card px-4">
                        <Text className="mr-1.5 text-base font-bold text-secondary-foreground">Rp</Text>
                        <TextInput 
                            className="h-[50px] flex-1 text-base text-foreground"
                            placeholder="0"
                            keyboardType="numeric"
                            placeholderTextColor="hsl(var(--muted-foreground))"
                            value={form.amount} 
                            onChangeText={(txt) => {
                                const formatted = formatCurrency(txt);
                                setForm({ ...form, amount: formatted });
                            }}
                        />
                    </View>
                </View>

                <View className="mb-5">
                    <Label className="mb-2 mt-4 text-foreground">Bukti Foto</Label>
                    <TouchableOpacity className="h-[150px] overflow-hidden rounded-[15px] border-2 border-dashed border-border bg-card" onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} className="h-full w-full" style={{ resizeMode: 'cover' }} />
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <Ionicons name="images-outline" size={40} color="#ccc" />
                                <Text className="mt-1.5 text-muted-foreground">Klik untuk upload</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="mb-5">
                    <Label className="mb-2 mt-4 text-foreground">Keterangan</Label>
                    <Input 
                        className="h-24 items-start rounded-xl border-border bg-card p-3.5 text-align-top"
                        placeholder="Detail transaksi..."
                        multiline
                        value={form.description}
                        onChangeText={(txt) => setForm({ ...form, description: txt })}
                    />
                </View>

                <Button className="mt-2.5 h-[58px] rounded-[15px]" onPress={handleSave} loading={loading} disabled={loading}>
                    <Text className="text-[17px] font-bold text-white">Simpan Sekarang</Text>
                </Button>
                <View style={{ height: insets.bottom }} />
            </ScrollView>

            {/* Modal untuk Dropdown yang Lebih Cantik */}
            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="max-h-[70%] rounded-t-[25px] bg-card p-5">
                        <View className="mb-5 flex-row items-center justify-between border-b border-border pb-3.5">
                            <Text className="text-lg font-bold text-foreground">Pilih Kategori</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={form.type === 'income' ? categories.income : categories.expense}
                            keyExtractor={(item) => item}
                            renderItem={renderCategoryItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    </View>
                </View>
            </Modal>

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
        </View>
    );
}
