import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function ProfileScreen() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onConfirm: () => {}
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    };

    const showAlert = (title, message, type = 'success', onConfirm = null) => {
        setAlertConfig({ 
            visible: true, title, message, type, 
            onConfirm: onConfirm
        });
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            
            const response = await axios.get(`${API_URL}/me`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "69420"
                }
            });
            console.log("User Data:", JSON.stringify(response.data, null, 2));

            const userData = response.data.user || response.data;
            setUser(userData);
            
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.log("Fetch Profile Error:", error);
            const localData = await AsyncStorage.getItem('userData');
            if (localData) setUser(JSON.parse(localData));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setAlertConfig({
            visible: true,
            title: "Konfirmasi Keluar",
            message: "Apakah Anda yakin ingin keluar dari aplikasi?",
            type: "confirm", // Gunakan type khusus untuk memicu dua tombol
            onConfirm: async () => {
                console.log("User memilih: YES");
                await AsyncStorage.multiRemove(['userToken', 'userData']);
                setAlertConfig(prev => ({ ...prev, visible: false }));
                router.replace('/');
            },
            onCancel: () => {
                console.log("User memilih: NO");
                setAlertConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    useEffect(() => { fetchProfile(); }, []);

    if (loading) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#4e73df" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil Saya</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarInitial}>
                                {(user?.name || "U").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <Ionicons name="camera" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userRole}>
                        {user?.role === 'admin' ? 'Administrator' : `Penghuni Kamar ${user?.room_number || '-'}`}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={
                <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={onRefresh} 
                    colors={['#b21f1f']}
                    tintColor="#b21f1f"
                />
            }>
                <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>Informasi Pribadi</Text>
                    
                    <InfoItem 
                        icon="mail-outline" 
                        label="Email" 
                        value={user?.email || '-'} 
                    />
                    <InfoItem 
                        icon="call-outline" 
                        label="Nomor HP" 
                        value={user?.phone || '-'} 
                    />
                    <InfoItem 
                        icon="card-outline" 
                        label="No. KTP" 
                        value={user?.id_card || '-'} 
                    />
                    <InfoItem 
                        icon="location-outline" 
                        label="Alamat Asal" 
                        value={user?.address || '-'} 
                    />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>Pengaturan</Text>
                    
                    <MenuButton 
                        icon="lock-closed-outline" 
                        label="Ganti Password" 
                        onPress={() => showAlert("Fitur", "Halaman Ganti Password akan segera hadir.", "warning")} 
                    />
                    <MenuButton 
                        icon="help-circle-outline" 
                        label="Pusat Bantuan" 
                        onPress={() => showAlert("Bantuan", "Hubungi pengelola di *085111203521*", "info")} 
                    />
                </View>

                <TouchableOpacity 
                    style={styles.logoutBtn}
                    onPress={handleLogout} 
                >
                    <Ionicons name="log-out-outline" size={20} color="#e74a3b" style={{marginRight: 10}} />
                    <Text style={styles.logoutText}>Keluar Akun</Text>
                </TouchableOpacity>
                <View style={{height: 50}} />
            </ScrollView>

            <GlobalAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm} 
                confirmText="Ya, Lanjutkan"
                cancelText="Batal"
            />
        </View>
    );
}

const InfoItem = ({ icon, label, value }) => (
    <View style={styles.infoItem}>
        <View style={styles.iconBg}>
            <Ionicons name={icon} size={20} color="#4e73df" />
        </View>
        <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.itemLabel}>{label}</Text>
            <Text style={styles.itemValue}>{value}</Text>
        </View>
    </View>
);

const MenuButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={icon} size={22} color="#858796" />
            <Text style={styles.menuLabel}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    header: { 
        paddingTop: 60, 
        paddingBottom: 40, 
        paddingHorizontal: 20, 
        borderBottomLeftRadius: 40, 
        borderBottomRightRadius: 40,
        alignItems: 'center'
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    profileInfo: { alignItems: 'center' },
    avatarContainer: { position: 'relative', marginBottom: 15 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
    avatarInitial: { fontSize: 40, fontWeight: 'bold', color: 'white' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1cc88a', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWeight: 2, borderColor: 'white' },
    userName: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    userRole: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    content: { padding: 20 },
    infoSection: { backgroundColor: 'white', borderRadius: 25, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#4e73df', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
    infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center' },
    itemLabel: { fontSize: 11, color: '#858796', marginBottom: 2 },
    itemValue: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
    menuButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8f9fc' },
    menuLabel: { marginLeft: 15, fontSize: 15, color: '#2c3e50' },
    logoutBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#ffeaea', flexDirection: 'row', marginTop: 10 },
    logoutText: { color: '#e74a3b', fontWeight: 'bold', fontSize: 16 }
});