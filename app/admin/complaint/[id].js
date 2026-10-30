import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../../helpers/api';
import { formatDate, getStorageUrl } from '../../../helpers/formatters';

const { width, height } = Dimensions.get('window');

const STATUS_OPTIONS = [
    { key: 'open', label: 'Baru (Open)', color: '#3b82f6', bg: '#eff6ff' },
    { key: 'in_progress', label: 'Diproses', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'resolved', label: 'Selesai', color: '#10b981', bg: '#ecfdf5' },
    { key: 'closed', label: 'Ditutup', color: '#64748b', bg: '#f1f5f9' },
];

export default function AdminComplaintDetail() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [adminResponse, setAdminResponse] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null);

    const fetchDetail = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            // Correct plural route
            const res = await axios.get(`${API_URL}/admin/complaints/${id}`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json',
                },
            });
            if (res.data?.data) {
                setComplaint(res.data.data);
                setAdminResponse(res.data.data.response || '');
            }
        } catch (e) {
            console.log('Error fetch complaint detail:', e.response?.data || e.message);
            Alert.alert('Error', 'Gagal memuat detail laporan.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';

            // Using respondent endpoint to send notification to tenant
            await axios.post(
                `${API_URL}/admin/complaints/${id}/respond`,
                {
                    status: newStatus,
                    response: adminResponse,
                },
                {
                    headers: {
                        Authorization: `Bearer ${cleanToken}`,
                        Accept: 'application/json',
                    },
                }
            );

            Alert.alert('Berhasil', 'Status laporan telah diperbarui.');
            fetchDetail();
        } catch (e) {
            console.log('Update Complaint Error:', e.response?.data || e.message);
            Alert.alert('Gagal', e.response?.data?.message || 'Gagal memperbarui laporan.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Memuat detail laporan...</Text>
            </View>
        );
    }

    if (!complaint) {
        return (
            <View style={styles.center}>
                <Ionicons name="document-text-outline" size={50} color="#94a3b8" />
                <Text style={styles.notFoundText}>Data laporan tidak ditemukan.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentStatusConfig =
        STATUS_OPTIONS.find((s) => s.key === complaint.status) || STATUS_OPTIONS[0];

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
                    <Text style={styles.headerTitle}>Detail Komplain</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Tenant Card */}
                <View style={styles.tenantCard}>
                    <View style={styles.tenantAvatar}>
                        <Ionicons name="person" size={24} color="#4e73df" />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.tenantName}>
                            {complaint.tenant?.user?.name || complaint.tenant?.name || 'Penghuni'}
                        </Text>
                        <Text style={styles.roomSub}>
                            Kamar {complaint.room?.room_number || '-'} • Dilaporkan {formatDate(complaint.created_at, true)}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: currentStatusConfig.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: currentStatusConfig.color }]}>
                            {currentStatusConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Complaint Details */}
                <View style={styles.mainCard}>
                    <View style={styles.tagRow}>
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryText}>
                                {complaint.category ? complaint.category.toUpperCase() : 'UMUM'}
                            </Text>
                        </View>
                        {complaint.priority ? (
                            <View
                                style={[
                                    styles.priorityPill,
                                    {
                                        backgroundColor:
                                            complaint.priority === 'high'
                                                ? '#fef2f2'
                                                : complaint.priority === 'medium'
                                                ? '#fffbeb'
                                                : '#ecfdf5',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.priorityText,
                                        {
                                            color:
                                                complaint.priority === 'high'
                                                    ? '#ef4444'
                                                    : complaint.priority === 'medium'
                                                    ? '#d97706'
                                                    : '#10b981',
                                        },
                                    ]}
                                >
                                    Prioritas: {complaint.priority.toUpperCase()}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <Text style={styles.complaintTitle}>{complaint.title}</Text>
                    <Text style={styles.complaintDesc}>{complaint.description}</Text>

                    {/* Image Attachments */}
                    <Text style={styles.sectionHeading}>Foto Lampiran</Text>
                    <View style={styles.imageGrid}>
                        {complaint.images && complaint.images.length > 0 ? (
                            complaint.images.map((img, index) => {
                                const uri = getStorageUrl(img.image_path || img.path);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.imageThumb}
                                        onPress={() => {
                                            setSelectedImg(uri);
                                            setModalVisible(true);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={{ uri }} style={styles.img} resizeMode="cover" />
                                        <View style={styles.zoomIconWrap}>
                                            <Ionicons name="expand" size={14} color="#ffffff" />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={styles.noImageBox}>
                                <Ionicons name="images-outline" size={24} color="#94a3b8" />
                                <Text style={styles.noImageText}>Tidak ada foto lampiran</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Respond & Status Section */}
                <View style={styles.respondCard}>
                    <Text style={styles.respondTitle}>Tanggapan & Solusi Pengelola</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Tuliskan respon atau solusi yang diambil..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        value={adminResponse}
                        onChangeText={setAdminResponse}
                        textAlignVertical="top"
                    />

                    <Text style={styles.changeStatusLabel}>Ubah Status Laporan:</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={[styles.statusBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                            onPress={() => handleUpdate('in_progress')}
                            disabled={updating}
                        >
                            <Ionicons name="time-outline" size={16} color="#2563eb" />
                            <Text style={[styles.statusBtnText, { color: '#2563eb' }]}>Sedang Diproses</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.statusBtn, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                            onPress={() => handleUpdate('resolved')}
                            disabled={updating}
                        >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                            <Text style={[styles.statusBtnText, { color: '#059669' }]}>Selesaikan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.statusBtn, { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
                            onPress={() => handleUpdate('closed')}
                            disabled={updating}
                        >
                            <Ionicons name="close-circle-outline" size={16} color="#475569" />
                            <Text style={[styles.statusBtnText, { color: '#475569' }]}>Tutup</Text>
                        </TouchableOpacity>
                    </View>

                    {updating ? (
                        <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 12 }} />
                    ) : null}
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
    notFoundText: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 12,
        fontWeight: '500',
    },
    backButton: {
        marginTop: 16,
        backgroundColor: '#4e73df',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
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
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
    },
    tenantCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 14,
    },
    tenantAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tenantName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    roomSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    mainCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 14,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    categoryPill: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    priorityPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
    },
    complaintTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    complaintDesc: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        marginTop: 18,
        marginBottom: 10,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    imageThumb: {
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
    zoomIconWrap: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 6,
        padding: 3,
    },
    noImageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '100%',
        gap: 8,
    },
    noImageText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    respondCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    respondTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
    },
    textInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
        minHeight: 90,
    },
    changeStatusLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 14,
        marginBottom: 8,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        gap: 4,
    },
    statusBtnText: {
        fontSize: 11,
        fontWeight: '700',
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
