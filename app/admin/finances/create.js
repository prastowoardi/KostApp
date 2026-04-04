import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ActivityIndicator,
    StatusBar,
    Modal,
    FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalAlert from '../../../components/GlobalAlert';
import api from '../../../helpers/api';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function CreateTransaction() {
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
            style={styles.categoryItem}
            onPress={() => {
                setForm({ ...form, category: item });
                setShowCategoryModal(false);
            }}
        >
            <Text style={styles.categoryItemText}>{item}</Text>
            {form.category === item && <Ionicons name="checkmark-circle" size={20} color="#1a2a6c" />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#1a2a6c', '#b21f1f']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.headerTitle}>Catat Keuangan</Text>
                        <Text style={styles.headerSub}>Input data secara akurat</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.typeContainer}>
                    <TouchableOpacity 
                        style={[styles.typeBtn, form.type === 'income' && styles.activeIncome]}
                        onPress={() => setForm({ ...form, type: 'income', category: '' })}
                    >
                        <Text style={[styles.typeText, form.type === 'income' && styles.textWhite]}>Pemasukan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.typeBtn, form.type === 'expense' && styles.activeExpense]}
                        onPress={() => setForm({ ...form, type: 'expense', category: '' })}
                    >
                        <Text style={[styles.typeText, form.type === 'expense' && styles.textWhite]}>Pengeluaran</Text>
                    </TouchableOpacity>
                </View>

                {/* Dropdown Custom Style */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Kategori</Text>
                    <TouchableOpacity 
                        style={styles.customDropdown} 
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text style={[styles.dropdownValue, !form.category && { color: '#aaa' }]}>
                            {form.category || "Pilih kategori transaksi..."}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nominal (Rp)</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currencyPrefix}>Rp</Text>
                        <TextInput 
                            style={styles.flexInput}
                            placeholder="0"
                            keyboardType="numeric"
                            value={form.amount} 
                            onChangeText={(txt) => {
                                const formatted = formatCurrency(txt);
                                setForm({ ...form, amount: formatted });
                            }}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bukti Foto</Text>
                    <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImg} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="images-outline" size={40} color="#ccc" />
                                <Text style={{ color: '#aaa', marginTop: 5 }}>Klik untuk upload</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Keterangan</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]}
                        placeholder="Detail transaksi..."
                        multiline
                        value={form.description}
                        onChangeText={(txt) => setForm({ ...form, description: txt })}
                    />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Simpan Sekarang</Text>}
                </TouchableOpacity>
            </ScrollView>

            {/* Modal untuk Dropdown yang Lebih Cantik */}
            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Kategori</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f9' },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    
    scrollContent: { padding: 20 },
    typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, backgroundColor: '#eee', padding: 5, borderRadius: 15 },
    typeBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
    activeIncome: { backgroundColor: '#1cc88a' },
    activeExpense: { backgroundColor: '#e74a3b' },
    typeText: { fontWeight: 'bold', color: '#888' },
    textWhite: { color: 'white' },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginLeft: 5 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 15 },
    currencyPrefix: { fontSize: 16, fontWeight: 'bold', color: '#555', marginRight: 5 },
    flexInput: { flex: 1, height: 50, fontSize: 16, color: '#333' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', padding: 15, borderRadius: 12, fontSize: 16 },
    customDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', padding: 15, borderRadius: 12 },
    dropdownValue: { fontSize: 16, color: '#333' },
    textArea: { height: 100, textAlignVertical: 'top' },
    
    imageBox: { height: 150, backgroundColor: '#fff', borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', overflow: 'hidden' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    
    saveBtn: { backgroundColor: '#1a2a6c', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 4, shadowColor: '#1a2a6c', shadowOpacity: 0.3, shadowRadius: 10 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 17 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: '70%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    categoryItemText: { fontSize: 16, color: '#444' }
});