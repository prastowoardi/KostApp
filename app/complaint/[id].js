import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../helpers/api';
import { formatDate, getStorageUrl } from '../../helpers/formatters';

const { width, height } = Dimensions.get('window');

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
                <ActivityIndicator size="large" color="#1a2a6c" />
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
                colors={['#1a2a6c', '#b21f1f']}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 10,
        color: '#64748b',
        fontSize: 14,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 12,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    scrollContent: {
        padding: 16,
    },
    mainCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryPill: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryBadge: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateText: {
        fontSize: 12,
        color: '#94a3b8',
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
    responseBox: {
        backgroundColor: '#ecfdf5',
        borderRadius: 14,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    responseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    responseTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065f46',
    },
    responseText: {
        fontSize: 13,
        color: '#047857',
        lineHeight: 20,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 4,
    },
    imageWrapper: {
        width: (width - 76) / 3,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
        position: 'relative',
    },
    img: {
        width: '100%',
        height: '100%',
    },
    zoomBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 6,
        padding: 3,
    },
    noImage: {
        width: '100%',
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    noImageText: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 4,
    },
    retryBtn: {
        marginTop: 16,
        backgroundColor: '#1a2a6c',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImg: {
        width: width * 0.95,
        height: height * 0.8,
    },
    closeBtn: {
        position: 'absolute',
        right: 20,
        zIndex: 20,
    },
});
