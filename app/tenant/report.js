import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';
import ScreenHeader from '../../components/ScreenHeader';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

import { API_URL } from '../../helpers/api';

export default function ReportScreen() {
    const insets = useSafeAreaInsets();
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
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            <GlobalAlert {...alertConfig} />

            <ScreenHeader title="Buat Komplain" />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View className="rounded-[25px] bg-card p-5 shadow-md">
                        <Label className="mb-2 mt-4 text-foreground">Judul Keluhan</Label>
                        <Input className="rounded-[15px] border-border bg-muted/50 text-sm" placeholder="Contoh: Lampu Kamar Mati" value={title} onChangeText={setTitle} />

                        <Text className="mb-2 mt-4 text-[13px] font-bold text-primary">Kategori</Text>
                        <View className="mb-1 flex-row flex-wrap gap-2">
                            {categories.map((cat) => (
                                <TouchableOpacity key={cat.id} className={`rounded-full border px-3.5 py-2.5 ${category === cat.id ? 'border-primary bg-primary' : 'border-border bg-muted/50'}`} onPress={() => setCategory(cat.id)}>
                                    <Text className={`text-xs ${category === cat.id ? 'font-bold text-white' : 'text-muted-foreground'}`}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="mb-2 mt-4 text-[13px] font-bold text-primary">Prioritas</Text>
                        <View className="mb-1 flex-row flex-wrap gap-2">
                            {priorities.map((prio) => (
                                <TouchableOpacity key={prio.id} className={`rounded-full border px-3.5 py-2.5 ${priority === prio.id ? '' : 'border-border bg-muted/50'}`} style={priority === prio.id ? { backgroundColor: prio.color, borderColor: prio.color } : {}} onPress={() => setPriority(prio.id)}>
                                    <Text className={`text-xs ${priority === prio.id ? 'font-bold text-white' : 'text-muted-foreground'}`}>{prio.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

<Label className="mb-2 mt-4 text-foreground">Deskripsi Kendala</Label>
                        <Input
                            className="rounded-[15px] border-border bg-muted/50 pt-3.5 text-sm"
                            style={{ height: Math.max(100, inputHeight) }}
                            multiline
                            placeholder="Jelaskan detail masalahnya..."
                            value={description}
                            onChangeText={setDescription}
                            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                        />

                        <Text className="mb-2 mt-4 text-[13px] font-bold text-primary">Lampiran Foto ({images.length}/5)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 mt-2.5 flex-row">
                            <TouchableOpacity className="mr-3 h-20 w-20 items-center justify-center rounded-[15px] border border-dashed border-primary bg-muted/50" onPress={handlePickImage}>
                                <Ionicons name="camera-outline" size={30} color="#4e73df" />
                            </TouchableOpacity>
                            {images.map((uri, index) => (
                                <View key={index} className="relative mr-3">
                                    <Image source={{ uri }} className="h-20 w-20 rounded-[15px]" />
                                    <TouchableOpacity className="absolute -right-2 -top-2 rounded-full bg-card" onPress={() => setImages(images.filter((_, i) => i !== index))}>
                                        <Ionicons name="close-circle" size={22} color="hsl(var(--destructive))" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        <Button
                            className="mt-3.5 h-[58px] rounded-[15px]"
                            style={{ marginBottom: insets.bottom }}
                            onPress={submitComplaint}
                            disabled={loading}
                            loading={loading}
                        >
                            {!loading && <Text className="text-base font-bold text-white">KIRIM LAPORAN SEKARANG</Text>}
                        </Button>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
}
