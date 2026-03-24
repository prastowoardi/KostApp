import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
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

export default function ManageTenant() {
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });
    const [tenants, setTenants] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [roomModalVisible, setRoomModalVisible] = useState(false);
    
    const [form, setForm] = useState({
        name: '', email: '', password: 'password123',
        room_id: '', phone: '', id_card: '', address: '',
        entry_date: new Date().toISOString().split('T')[0],
        emergency_contact_name: '', emergency_contact_phone: ''
    });

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ visible: true, title, message, type });
    };
    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const headers = { 
                Authorization: `Bearer ${token}`,
                "ngrok-skip-browser-warning": "69420"
            };
            const [resTenants, resRooms] = await Promise.all([
                axios.get(`${API_URL}/admin/tenants`, { headers }),
                axios.get(`${API_URL}/admin/rooms/available`, { headers })
            ]);
            setTenants(resTenants.data);
            setRooms(resRooms.data);
        } catch (error) {
            console.log("Error fetch:", error);
            Alert.alert("Error", "Gagal mengambil data dari server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async () => {
        const requiredFields = {
            room_id: "Kamar belum dipilih",
            name: "Nama lengkap wajib diisi",
            email: "Email wajib diisi",
            phone: "Nomor telepon wajib diisi",
            id_card: "Nomor KTP wajib diisi"
        };

        for (const [key, msg] of Object.entries(requiredFields)) {
            if (!form[key]) {
                return showAlert("Data Belum Lengkap", msg, "warning");
            }
        }

        if (!form.email.includes('@')) {
            return showAlert("Email Salah", "Format email tidak valid", "warning");
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            
            await axios.post(`${API_URL}/admin/tenants/store`, form, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "69420"
                }
            });

            showAlert("Berhasil!", "Data penyewa sudah tersimpan.", "success");
            setModalVisible(false);
            fetchData();
            
            setForm({
                name: '', email: '', password: 'password123',
                room_id: '', phone: '', id_card: '', address: '',
                entry_date: new Date().toISOString().split('T')[0],
                emergency_contact_name: '', emergency_contact_phone: ''
            });

        } catch (e) {
            console.log("Error detail:", e.response?.data);
            const serverMessage = e.response?.data?.message;
            showAlert("Gagal Simpan", serverMessage || "Server lagi pusing, coba lagi nanti.", "error");
        } finally {
            setLoading(false);
        }
    };

    const renderTenantItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.name || item.user?.name || "U").charAt(0)}</Text>
                </View>
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.name}>{item.name || item.user?.name}</Text>
                    <Text style={styles.sub}>
                        Kamar {item.room?.room_number || '??'} • {item.phone}
                    </Text>
                </View>
            </View>
            <View style={[styles.badge, { backgroundColor: item.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
                <Text style={{ color: item.status === 'active' ? '#2e7d32' : '#c62828', fontSize: 10, fontWeight: 'bold' }}>
                    {item.status?.toUpperCase()}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1a2a6c', '#b21f1f']} style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Manajemen Tenant</Text>
                        <Text style={{color: '#eee', fontSize: 12}}>Total: {tenants.length} Penghuni</Text>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                        <Ionicons name="person-add" size={20} color="white" />
                        <Text style={{color:'white', fontWeight:'bold', marginLeft:5}}>Tambah</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#b21f1f" />
                </View>
            ) : (
                <FlatList
                    data={tenants}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderTenantItem}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Belum ada data tenant.</Text>}
                    onRefresh={fetchData}
                    refreshing={loading}
                />
            )}

            {/* Modal Tambah Tenant */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={{flex: 1, backgroundColor: '#fff'}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Tambah Penghuni</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{padding: 20}}>
                        <Text style={styles.label}>Pilih Kamar</Text>
                        <TouchableOpacity 
                            style={styles.customPickerTrigger} 
                            onPress={() => setRoomModalVisible(true)}
                        >
                            <Text style={{ color: form.room_id ? '#333' : '#999' }}>
                                {form.room_id 
                                    ? `Kamar ${rooms.find(r => r.id === form.room_id)?.room_number}` 
                                    : "Klik untuk memilih kamar..."}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        <Text style={styles.label}>Nama Lengkap</Text>
                        <TextInput style={styles.input} placeholder="Contoh: Budi Santoso" onChangeText={(v) => setForm({...form, name: v})} />

                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{width: '48%'}}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} placeholder="budi@mail.com" autoCapitalize="none" onChangeText={(v) => setForm({...form, email: v})} />
                            </View>
                            <View style={{width: '48%'}}>
                                <Text style={styles.label}>No. Telepon</Text>
                                <TextInput style={styles.input} placeholder="0812..." keyboardType="phone-pad" onChangeText={(v) => setForm({...form, phone: v})} />
                            </View>
                        </View>

                        <Text style={styles.label}>No. KTP</Text>
                        <TextInput style={styles.input} placeholder="3201..." keyboardType="numeric" onChangeText={(v) => setForm({...form, id_card: v})} />

                        <Text style={styles.label}>Alamat Asal</Text>
                        <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline placeholder="Alamat lengkap sesuai KTP" onChangeText={(v) => setForm({...form, address: v})} />

                        <Text style={styles.label}>Tanggal Masuk</Text>
                        <TextInput style={styles.input} value={form.entry_date} onChangeText={(v) => setForm({...form, entry_date: v})} />

                        <View style={styles.divider} />
                        <Text style={styles.sectionSub}>Kontak Darurat</Text>
                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.label}>Nama Hubungan</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Contoh: Ibu Kandung / Ayah" 
                                onChangeText={(v) => setForm({...form, emergency_contact_name: v})} 
                            />
                        </View>
                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.label}>No. HP Darurat</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="0813..." 
                                keyboardType="phone-pad" 
                                onChangeText={(v) => setForm({...form, emergency_contact_phone: v})} 
                            />
                        </View>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={{color:'white', fontWeight:'bold', fontSize: 16}}>SIMPAN DATA</Text>
                        </TouchableOpacity>
                        <View style={{height: 50}} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal Pilihan Kamar (Custom Picker) */}
            <Modal visible={roomModalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.roomListContainer}>
                        <Text style={styles.modalTitle}>Pilih Kamar Tersedia</Text>
                        <FlatList
                            data={rooms}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({item}) => (
                                <TouchableOpacity 
                                    style={styles.roomItem}
                                    onPress={() => {
                                        setForm({...form, room_id: item.id});
                                        setRoomModalVisible(false);
                                    }}
                                >
                                    <Ionicons name="business" size={24} color="#1a2a6c" />
                                    <View style={{marginLeft: 15}}>
                                        <Text style={{fontWeight: 'bold', fontSize: 16}}>Kamar {item.room_number}</Text>
                                        <Text style={{color: '#666', fontSize: 12}}>Rp {item.price?.toLocaleString()} • {item.status}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{textAlign:'center', padding: 20}}>Tidak ada kamar kosong.</Text>}
                        />
                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setRoomModalVisible(false)}>
                            <Text style={{color: '#b21f1f', fontWeight: 'bold'}}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <GlobalAlert 
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    addBtn: { backgroundColor: '#2ecc71', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, alignItems: 'center', elevation: 3 },
    
    card: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    cardInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#1a2a6c', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    name: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
    sub: { color: '#7f8c8d', fontSize: 13, marginTop: 2 },
    badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    
    emptyText: { textAlign: 'center', marginTop: 50, color: '#95a5a6' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a2a6c' },
    label: { fontSize: 13, fontWeight: 'bold', marginTop: 18, marginBottom: 8, color: '#34495e' },
    input: { backgroundColor: '#f1f3f9', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#e1e8ef' },
    
    customPickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f3f9', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e1e8ef' },
    
    saveBtn: { backgroundColor: '#1a2a6c', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 3 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 25 },
    sectionSub: { fontSize: 14, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 10 },
    
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    roomListContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '80%' },
    roomItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    closeModalBtn: { marginTop: 15, padding: 10, alignItems: 'center' }
});