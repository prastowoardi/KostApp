import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../helpers/api';
import { formatDate, getStorageUrl } from '../../helpers/formatters';
import styles from '../../styles/complaintDetail.styles';

export default function ComplaintDetailScreen() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null);

    const fetchDetail = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const res = await axios.get(`${API_URL}/complaints/${id}`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });
            setComplaint(res.data?.data || res.data);
        } catch (e) {
            console.log('Error fetch tenant complaint detail:', e.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'open':
                return { label: 'Terkirim (Menunggu)', color: '#2563eb', bg: '#eff6ff' };
            case 'in_progress':
                return { label: 'Sedang Ditangani', color: '#d97706', bg: '#fffbeb' };
            case 'resolved':
                return { label: 'Selesai', color: '#059669', bg: '#ecfdf5' };
            case 'closed':
                return { label: 'Ditutup', color: '#64748b', bg: '#f1f5f9' };
            default:
                return { label: status || 'Diproses', color: '#2563eb', bg: '#eff6ff' };
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Memuat detail laporan...</Text>
            </View>
        );
    }

    if (!complaint) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={56} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Laporan Tidak Ditemukan</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusStyle = getStatusStyle(complaint.status);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Modal Image Zoom */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity
                        style={[styles.closeBtn, { top: insets.top + 16 }]}
                        onPress={() => setModalVisible(false)}
                    >
                        <Ionicons name="close-circle" size={40} color="white" />
                    </TouchableOpacity>
                    {selectedImg ? (
                        <Image source={{ uri: selectedImg }} style={styles.fullImg} resizeMode="contain" />
                    ) : null}
                </View>
            </Modal>

            {/* Header */}
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#1e3a8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detail Laporan Keluhan</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mainCard}>
                    {/* Status & Category */}
                    <View style={styles.statusRow}>
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryBadge}>
                                {complaint.category ? complaint.category.toUpperCase() : 'UMUM'}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                {statusStyle.label}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{complaint.title}</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={15} color="#94a3b8" />
                        <Text style={styles.dateText}>{formatDate(complaint.created_at, true)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.label}>Rincian Keluhan</Text>
                    <Text style={styles.description}>{complaint.description}</Text>

                    {/* Admin Response Box */}
                    {complaint.response ? (
                        <View style={styles.responseBox}>
                            <View style={styles.responseHeader}>
                                <Ionicons name="chatbubble-ellipses" size={18} color="#10b981" />
                                <Text style={styles.responseTitle}>Tanggapan Pengelola Kost:</Text>
                            </View>
                            <Text style={styles.responseText}>{complaint.response}</Text>
                        </View>
                    ) : null}

                    <View style={styles.divider} />

                    {/* Lampiran Foto */}
                    <Text style={styles.label}>Foto Bukti Lampiran</Text>
                    <View style={styles.imageGrid}>
                        {complaint.images && complaint.images.length > 0 ? (
                            complaint.images.map((img, index) => {
                                const uri = getStorageUrl(img.image_path || img.path);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.imageWrapper}
                                        onPress={() => {
                                            setSelectedImg(uri);
                                            setModalVisible(true);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={{ uri }} style={styles.img} resizeMode="cover" />
                                        <View style={styles.zoomBadge}>
                                            <Ionicons name="expand" size={14} color="#ffffff" />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={styles.noImage}>
                                <Ionicons name="image-outline" size={28} color="#cbd5e1" />
                                <Text style={styles.noImageText}>Tidak ada foto lampiran</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
