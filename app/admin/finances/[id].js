import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Dimensions, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../helpers/api';
import GlobalAlert from '../../../components/GlobalAlert';

const { width } = Dimensions.get('window');

export default function FinanceDetail() {
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

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const STORAGE_URL = API_URL.replace('/api', '/storage');

    const getDetailUrl = () => `${API_URL}/admin/finances/${id}`;

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
    }, [id]);

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

                } catch (error) {
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

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#4e73df" /></View>;
    if (!item) return null;

    const isIncome = item.type === 'income';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Header dengan Gradient */}
            <LinearGradient 
                colors={isIncome ? ["#1cc88a", "#13855c"] : ["#e74a3b", "#be2617"]} 
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.iconCircle}>
                    <Ionicons 
                        name={isIncome ? "trending-up" : "trending-down"} 
                        size={40} 
                        color={isIncome ? "#1cc88a" : "#e74a3b"} 
                    />
                </View>
                
                <Text style={styles.headerAmount}>
                    Rp {new Intl.NumberFormat('id-ID').format(item.amount)}
                </Text>
                <Text style={styles.headerType}>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</Text>
            </LinearGradient>

            {/* Informasi Detail */}
            <View style={styles.detailCard}>
                <DetailRow label="Deskripsi" value={item.description || item.title} />
                <DetailRow label="Kategori" value={item.category || 'Umum'} />
                <DetailRow 
                    label="Tanggal" 
                    value={item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'} 
                />
                
                <View style={styles.divider} />
                
                {/* Bagian Gambar Bukti */}
                <Text style={styles.label}>Bukti Transaksi</Text>
                {item.receipt_file ? (
                    <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => setImageModalVisible(true)} // Buka Modal
                        style={styles.imageWrapper}
                    >
                        <Image 
                            source={{ uri: `${STORAGE_URL}/${item.receipt_file}` }} 
                            style={styles.evidenceImage}
                            resizeMode="cover"
                        />
                        {/* Tambahkan Overlay Icon agar user tahu bisa diklik */}
                        <View style={styles.zoomOverlay}>
                            <Ionicons name="expand-outline" size={24} color="white" />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.noImage}>
                        <Ionicons name="image-outline" size={24} color="#d1d3e2" />
                        <Text style={styles.noImageText}>Tidak ada lampiran gambar</Text>
                    </View>
                )}

                <View style={styles.divider} />
                
                <Text style={styles.label}>Metadata</Text>
                <Text style={styles.noteText}>ID Transaksi: #{item.id}</Text>
                <Text style={styles.noteText}>Dibuat pada: {new Date(item.created_at).toLocaleString('id-ID')}</Text>
            </View>

            {/* Tombol Aksi */}
            <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#e74a3b" />
                    <Text style={styles.deleteText}>Hapus Transaksi</Text>
                </TouchableOpacity>
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
                    style={styles.modalOverlay} 
                    onPress={() => setImageModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        {/* Header Modal dengan Judul & Tombol Close */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bukti Transaksi</Text>
                            <TouchableOpacity 
                                onPress={() => setImageModalVisible(false)}
                                style={styles.closeIcon}
                            >
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Area Gambar */}
                        <View style={styles.imageContainer}>
                            <Image 
                                source={{ uri: `${STORAGE_URL}/${item.receipt_file}` }} 
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Footer Modal (Opsional: Info Tambahan) */}
                        <View style={styles.modalFooter}>
                            <Text style={styles.footerText}>ID: #{item.id}</Text>
                            <Text style={styles.footerDate}>
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
    <View style={styles.infoGroup}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        padding: 40, 
        paddingTop: 60, 
        alignItems: 'center', 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30,
        elevation: 5
    },
    backBtn: { position: 'absolute', left: 20, top: 50, padding: 8 },
    iconCircle: { 
        width: 80, 
        height: 80, 
        backgroundColor: 'white', 
        borderRadius: 40, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
    },
    headerAmount: { color: 'white', fontSize: 30, fontWeight: 'bold' },
    headerType: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 5, fontWeight: '600' },
    detailCard: { 
        backgroundColor: 'white', 
        marginHorizontal: 20, 
        marginTop: -30, 
        borderRadius: 20, 
        padding: 25, 
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoGroup: { marginBottom: 18 },
    label: { color: '#b7b9cc', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 },
    value: { color: '#5a5c69', fontSize: 17, fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#eaecf4', marginVertical: 20 },
    imageWrapper: {
        width: '100%',
        height: 220,
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 10,
        backgroundColor: '#f1f3f9'
    },
    evidenceImage: { width: '100%', height: '100%' },
    noImage: {
        height: 100,
        backgroundColor: '#f8f9fc',
        borderRadius: 15,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#d1d3e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10
    },
    noImageText: { color: '#b7b9cc', fontSize: 12, marginTop: 5 },
    noteText: { color: '#858796', fontSize: 13, marginBottom: 4 },
    actionContainer: { paddingBottom: 40 },
    deleteBtn: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        margin: 20, 
        padding: 16, 
        borderRadius: 15, 
        borderWidth: 1, 
        borderColor: '#fadbd8',
        backgroundColor: '#fff'
    },
    deleteText: { color: '#e74a3b', fontWeight: 'bold', marginLeft: 10 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Gelap transparan untuk fokus
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 10, // Shadow untuk Android
        shadowColor: '#000', // Shadow untuk iOS
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    closeIcon: {
        padding: 4,
    },
    imageContainer: {
        width: '100%',
        height: 400, // Tinggi area gambar
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    modalFooter: {
        padding: 15,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '500'
    },
    footerDate: {
        color: '#888',
        fontSize: 12,
    }
});