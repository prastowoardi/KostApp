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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ReportScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('facility');
    const [priority, setPriority] = useState('medium');
    const [images, setImages] = useState([]);
    const [inputHeight, setInputHeight] = useState(100);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false }))
    });

    const categories = [
        { id: 'facility', label: 'Fasilitas' },
        { id: 'cleanliness', label: 'Kebersihan' },
        { id: 'security', label: 'Keamanan' },
        { id: 'other', label: 'Lainnya' }
    ];

    const priorities = [
        { id: 'low', label: 'Rendah', color: '#1cc88a' },
        { id: 'medium', label: 'Sedang', color: '#f6c23e' },
        { id: 'high', label: 'Tinggi', color: '#e74a3b' }
    ];

    const showAlert = (title, message, type = 'success', customOnClose = null) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onClose: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                if (customOnClose) customOnClose();
            }
        });
    };

    const handlePickImage = () => {
        if (images.length >= 5) return showAlert("Maksimal", "Hanya boleh 5 foto.", "warning");
        
        Alert.alert("Pilih Foto", "Ambil foto dari mana?", [
            { text: "Kamera", onPress: openCamera },
            { text: "Galeri", onPress: openLibrary },
            { text: "Batal", style: "cancel" }
        ]);
    };

    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return showAlert("Izin Ditolak", "Butuh akses kamera.", "error");

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) setImages([...images, result.assets[0].uri]);
    };

    const openLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return showAlert("Izin Ditolak", "Butuh akses galeri.", "error");

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5 - images.length,
            quality: 0.5,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImages([...images, ...newUris].slice(0, 5));
        }
    };

    const submitComplaint = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();
            
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('priority', priority);

            // Upload Gambar
            if (images.length > 0) {
                images.forEach((uri, index) => {
                    const fileName = uri.split('/').pop();
                    const fileType = fileName.split('.').pop();

                    formData.append('images[]', {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: `image_${index}.${fileType}`,
                        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
                    });
                });
            }

            const response = await axios.post(`${API_URL}/complaints`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data', // WAJIB
                    'Accept': 'application/json',
                },
                // Penting untuk upload file besar
                transformRequest: (data, headers) => {
                    return data; 
                },
            });

            if(response.data.success) {
                router.replace('/complaint-history'); // Pindah ke history
            }

        } catch (e) {
            console.log("Detail Error:", e.response?.data);
            Alert.alert("Gagal", e.response?.data?.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <GlobalAlert {...alertConfig} />

            <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Buat Komplain</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View style={styles.formCard}>
                        <Text style={styles.label}>Judul Keluhan</Text>
                        <TextInput style={styles.input} placeholder="Contoh: Lampu Kamar Mati" value={title} onChangeText={setTitle} placeholderTextColor="#95a5a6" />

                        <Text style={styles.label}>Kategori</Text>
                        <View style={styles.chipGroup}>
                            {categories.map((cat) => (
                                <TouchableOpacity key={cat.id} style={[styles.chip, category === cat.id && styles.chipActive]} onPress={() => setCategory(cat.id)}>
                                    <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Prioritas</Text>
                        <View style={styles.chipGroup}>
                            {priorities.map((prio) => (
                                <TouchableOpacity key={prio.id} style={[styles.chip, priority === prio.id && { backgroundColor: prio.color, borderColor: prio.color }]} onPress={() => setPriority(prio.id)}>
                                    <Text style={[styles.chipText, priority === prio.id && { color: 'white', fontWeight: 'bold' }]}>{prio.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Deskripsi Kendala</Text>
                        <TextInput 
                            style={[styles.input, { height: Math.max(100, inputHeight), textAlignVertical: 'top' }]} 
                            multiline 
                            placeholder="Jelaskan detail masalahnya..." 
                            value={description} 
                            onChangeText={setDescription} 
                            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)} 
                            placeholderTextColor="#95a5a6" 
                        />

                        <Text style={styles.label}>Lampiran Foto ({images.length}/5)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                            <TouchableOpacity style={styles.addBtn} onPress={handlePickImage}>
                                <Ionicons name="camera-outline" size={30} color="#4e73df" />
                            </TouchableOpacity>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.thumbnail} />
                                    <TouchableOpacity style={styles.deleteBadge} onPress={() => setImages(images.filter((_, i) => i !== index))}>
                                        <Ionicons name="close-circle" size={22} color="#e74a3b" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={submitComplaint} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>KIRIM LAPORAN SEKARANG</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    header: { paddingTop: 60, paddingBottom: 60, paddingHorizontal: 20, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 10 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, marginTop: -40, paddingTop: 10 },
    formCard: { backgroundColor: 'white', borderRadius: 25, padding: 22, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#4e73df', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#f8f9fc', borderRadius: 15, padding: 15, fontSize: 14, color: '#2c3e50', borderWidth: 1, borderColor: '#eaecf4' },
    chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 5 },
    chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f3f9', borderWidth: 1, borderColor: '#d1d8e0' },
    chipActive: { backgroundColor: '#4e73df', borderColor: '#4e73df' },
    chipText: { fontSize: 12, color: '#7f8c8d' },
    chipTextActive: { color: 'white', fontWeight: 'bold' },
    imageList: { flexDirection: 'row', marginTop: 10, marginBottom: 20 },
    addBtn: { width: 80, height: 80, backgroundColor: '#f8f9fc', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#4e73df', marginRight: 12 },
    imageWrapper: { position: 'relative', marginRight: 12 },
    thumbnail: { width: 80, height: 80, borderRadius: 15 },
    deleteBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: 'white', borderRadius: 12 },
    submitBtn: { backgroundColor: '#4e73df', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 15, elevation: 5 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});