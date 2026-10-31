import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../../helpers/api';
import { formatDate, getStorageUrl } from '../../../helpers/formatters';
import styles from '../../../styles/adminComplaintDetail.styles';

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
