import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalAlert from '../../components/GlobalAlert';
import { API_URL } from '../../helpers/api';
import styles from '../../styles/tenantReport.styles';

const CATEGORIES = [
    { id: 'facility', label: 'Fasilitas' },
    { id: 'cleanliness', label: 'Kebersihan' },
    { id: 'security', label: 'Keamanan' },
    { id: 'other', label: 'Lainnya' },
];

const PRIORITIES = [
    { id: 'low', label: 'Rendah', color: '#10b981' },
    { id: 'medium', label: 'Sedang', color: '#f59e0b' },
    { id: 'high', label: 'Mendesak / Tinggi', color: '#ef4444' },
];

export default function ReportScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('facility');
    const [priority, setPriority] = useState('medium');
    const [images, setImages] = useState([]);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: () => {},
    });

    const showAlert = (title, message, type = 'success', onClose = null) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onClose: () => {
                setAlertConfig((prev) => ({ ...prev, visible: false }));
                if (onClose) onClose();
            },
        });
    };

    const handlePickImage = () => {
        if (images.length >= 5) {
            return showAlert('Maksimal', 'Anda hanya dapat melampirkan maksimal 5 foto.', 'warning');
        }

        Alert.alert('Pilih Foto Bukti', 'Ambil foto dari mana?', [
            { text: 'Kamera', onPress: openCamera },
            { text: 'Galeri', onPress: openLibrary },
            { text: 'Batal', style: 'cancel' },
        ]);
    };

    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return showAlert('Izin Ditolak', 'Aplikasi butuh akses kamera.', 'error');

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setImages((prev) => [...prev, result.assets[0].uri]);
        }
    };

    const openLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return showAlert('Izin Ditolak', 'Aplikasi butuh akses galeri.', 'error');

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5 - images.length,
            quality: 0.5,
        });

        if (!result.canceled && result.assets) {
            const newUris = result.assets.map((asset) => asset.uri);
            setImages((prev) => [...prev, ...newUris].slice(0, 5));
        }
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const submitComplaint = async () => {
        if (!title.trim()) {
            return showAlert('Data Belum Lengkap', 'Silakan tuliskan judul keluhan.', 'warning');
        }
        if (!description.trim()) {
            return showAlert('Data Belum Lengkap', 'Silakan berikan deskripsi detail keluhan.', 'warning');
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';
            const formData = new FormData();

            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('category', category);
            formData.append('priority', priority);

            // Upload Gambar
            if (images.length > 0) {
                images.forEach((uri, index) => {
                    const fileName = uri.split('/').pop() || `img_${index}.jpg`;
                    const match = /\.(\w+)$/.exec(fileName);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;

                    formData.append('images[]', {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: fileName,
                        type,
                    });
                });
            }

            await axios.post(`${API_URL}/complaints`, formData, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    'Content-Type': 'multipart/form-data',
                    Accept: 'application/json',
                },
            });

            showAlert('Berhasil Terkirim', 'Laporan keluhan Anda berhasil dikirim ke pengelola kost.', 'success', () => {
                router.replace('/tenant/complaint-history');
            });
        } catch (e) {
            console.log('Detail Error Complaint:', e.response?.data || e.message);
            const msg = e.response?.data?.message || 'Gagal mengirim laporan keluhan.';
            showAlert('Gagal Mengirim', msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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
                    <Text style={styles.headerTitle}>Buat Laporan Keluhan</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.formCard}>
                        {/* Title */}
                        <Text style={styles.label}>Judul Keluhan *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Contoh: AC kamar bocor / lampu mati"
                            placeholderTextColor="#94a3b8"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Category */}
                        <Text style={styles.label}>Kategori</Text>
                        <View style={styles.chipGroup}>
                            {CATEGORIES.map((cat) => {
                                const isSelected = category === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.chip, isSelected && styles.chipActive]}
                                        onPress={() => setCategory(cat.id)}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Priority */}
                        <Text style={styles.label}>Tingkat Prioritas</Text>
                        <View style={styles.chipGroup}>
                            {PRIORITIES.map((prio) => {
                                const isSelected = priority === prio.id;
                                return (
                                    <TouchableOpacity
                                        key={prio.id}
                                        style={[
                                            styles.chip,
                                            isSelected && { backgroundColor: prio.color, borderColor: prio.color },
                                        ]}
                                        onPress={() => setPriority(prio.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                isSelected && { color: 'white', fontWeight: 'bold' },
                                            ]}
                                        >
                                            {prio.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Description */}
                        <Text style={styles.label}>Deskripsi Detail Keluhan *</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                            placeholder="Jelaskan kendala yang dialami secara rinci agar pengelola dapat segera menanganinya..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            value={description}
                            onChangeText={setDescription}
                        />

                        {/* Photos */}
                        <Text style={styles.label}>Lampiran Foto (Maksimal 5)</Text>
                        <View style={styles.imageGrid}>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.imgPreview} />
                                    <TouchableOpacity
                                        style={styles.deleteBadge}
                                        onPress={() => removeImage(index)}
                                    >
                                        <Ionicons name="close" size={14} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {images.length < 5 ? (
                                <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage}>
                                    <Ionicons name="camera-outline" size={24} color="#4e73df" />
                                    <Text style={styles.addPhotoText}>Tambah</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, loading && { opacity: 0.8 }]}
                            onPress={submitComplaint}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#0f172a', '#1e3a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitBtnText}>KIRIM LAPORAN SEKARANG</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={alertConfig.onClose}
            />
        </View>
    );
}
