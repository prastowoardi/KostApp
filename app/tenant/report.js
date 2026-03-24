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

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function ReportScreen() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputHeight, setInputHeight] = useState(100);
    const router = useRouter();

    const handlePickImage = () => {
        Alert.alert(
            "Pilih Foto",
            "Ambil foto dari mana?",
            [
                { text: "Kamera", onPress: () => openCamera() },
                { text: "Galeri", onPress: () => openLibrary() },
                { text: "Batal", style: "cancel" }
            ]
        );
    };

    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Izin Ditolak");

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) setImages([...images, result.assets[0].uri]);
    };

    const openLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Izin Ditolak");

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.5,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImages([...images, ...newUris]);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const submitComplaint = async () => {
        if (!title || !description) return Alert.alert("Oops!", "Lengkapi data dulu.");
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            images.forEach((uri, i) => {
                formData.append('images[]', {
                    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                    name: `img_${i}.jpg`,
                    type: 'image/jpeg',
                });
            });
            await axios.post(`${API_URL}/complaints`, formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            Alert.alert("Berhasil", "Laporan terkirim.");
            router.back();
        } catch (e) {
            Alert.alert("Gagal", "Koneksi bermasalah.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Buat Komplain</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.centerWrapper}
            >
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Detail Kendala</Text>
                    
                    <TextInput 
                        style={styles.input} 
                        placeholder="Judul Kerusakan" 
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor="#95a5a6"
                    />

                    <TextInput 
                        style={[styles.input, { height: Math.max(80, inputHeight), textAlignVertical: 'top' }]} 
                        multiline 
                        placeholder="Deskripsi..." 
                        value={description}
                        onChangeText={setDescription}
                        onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                        scrollEnabled={false}
                        placeholderTextColor="#95a5a6"
                    />

                    <Text style={styles.labelPhoto}>Lampiran Foto ({images.length}/5)</Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                        <TouchableOpacity style={styles.addBtn} onPress={handlePickImage}>
                            <Ionicons name="camera-outline" size={30} color="#4e73df" />
                        </TouchableOpacity>

                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.thumbnail} />
                                <TouchableOpacity style={styles.deleteBadge} onPress={() => removeImage(index)}>
                                    <Ionicons name="close-circle" size={22} color="#e74a3b" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity 
                        style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
                        onPress={submitComplaint}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>KIRIM LAPORAN</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    header: { 
        paddingTop: 60, 
        paddingBottom: 40, 
        paddingHorizontal: 20, 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30 
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 10 },
    centerWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25, marginTop: -30 },
    formCard: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 25,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    formTitle: { fontSize: 18, fontWeight: 'bold', color: '#4e73df', marginBottom: 20, textAlign: 'center' },
    labelPhoto: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 10 },
    input: { backgroundColor: '#f1f3f9', borderRadius: 15, padding: 15, marginBottom: 15, fontSize: 14, color: '#2c3e50' },
    imageList: { flexDirection: 'row', marginBottom: 20 },
    addBtn: { width: 80, height: 80, backgroundColor: '#f1f3f9', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#4e73df', marginRight: 10 },
    imageWrapper: { position: 'relative', marginRight: 10 },
    thumbnail: { width: 80, height: 80, borderRadius: 15 },
    deleteBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'white', borderRadius: 12 },
    submitBtn: { backgroundColor: '#4e73df', padding: 18, borderRadius: 15, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});