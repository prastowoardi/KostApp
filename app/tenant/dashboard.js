import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function TenantDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const cleanToken = token ? token.replace(/"/g, '').trim() : '';

            const response = await axios.get(`${API_URL}/me`, {
                headers: { 
                    'Authorization': `Bearer ${cleanToken}`,
                    'Accept': 'application/json' 
                }
            });
            
            console.log("Dashboard Data:", response.data);
            setData(response.data);
        } catch (error) {
            console.log("Error Fetch Dashboard:", error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLogout = async () => {
        Alert.alert("Konfirmasi", "Apakah kamu yakin ingin keluar?", [
            { text: "Batal", style: "cancel" },
            { text: "Ya, Keluar", onPress: async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    await axios.post(`${API_URL}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
                } finally {
                    await AsyncStorage.multiRemove(['userToken', 'userData', 'userRole']);
                    router.replace('/');
                }
            }}
        ]);
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <ActivityIndicator size="large" color="#4e73df" />
        </View>
    );

    const getStatusColor = () => {
        switch(data?.payment_status) {
            case 'Lunas': return '#1cc88a';
            case 'Pending': return '#f6c23e';
            default: return '#e74a3b';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                
                {/* HEADER BERGRADASI */}
                <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>Selamat Datang,</Text>
                            <Text style={styles.userName}>{data?.name || 'User'}</Text>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <Ionicons name="log-out-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* CARD INFO KAMAR */}
                    <View style={styles.roomCard}>
                        <View style={styles.roomInfo}>
                            <Ionicons name="business" size={20} color="#4e73df" />
                            <Text style={styles.roomText}>Kamar {data?.room_number || '-'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.roomInfo}>
                            <Ionicons name="calendar" size={20} color="#e74a3b" />
                            <Text style={styles.roomText}>Tempo: {data?.due_date || '-'}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* SECTION TAGIHAN DINAMIS */}
                    <Text style={styles.sectionTitle}>Status Tagihan</Text>
                    <View style={[styles.billCard, { borderLeftWidth: 5, borderLeftColor: getStatusColor() }]}>
                        <View>
                            <Text style={styles.billLabel}>Tagihan: {data?.payment_status || 'Belum Bayar'}</Text>
                            <Text style={styles.billAmount}>Rp {(data?.bill_amount || 0).toLocaleString('id-ID')}</Text>
                        </View>
                        
                        {data?.payment_status === 'Belum Bayar' ? (
                            <TouchableOpacity 
                                style={styles.payButton} 
                                onPress={() => router.push('/tenant/payment')}
                            >
                                <Text style={styles.payButtonText}>Bayar</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{alignItems: 'center'}}>
                                <Ionicons 
                                    name={data?.payment_status === 'Lunas' ? "checkmark-circle" : "time"} 
                                    size={30} 
                                    color={getStatusColor()} 
                                />
                                <Text style={{fontSize: 10, color: '#858796'}}>{data?.payment_status}</Text>
                            </View>
                        )}
                    </View>

                    {/* QUICK ACTIONS */}
                    <Text style={styles.sectionTitle}>Layanan Penghuni</Text>
                    <View style={styles.menuGrid}>
                        <ActionMenu 
                            icon="shield-checkmark-outline" 
                            title="Peraturan" 
                            color="#1cc88a" 
                            // onPress={() => { router.push('/tenant/rules') }}
                        />
                        <ActionMenu 
                            icon="wallet-outline" 
                            title="Riwayat Bayar" 
                            color="#1cc88a" 
                            onPress={() => {
                                console.log("Klik Tombol Riwayat...");
                                router.push('/tenant/payment/payment-history');
                            }} 
                        />
                        <ActionMenu 
                            icon="chatbubble-ellipses-outline" 
                            title="Komplain" 
                            color="#f6c23e" 
                            onPress={() => { router.push('/tenant/report') }} 
                        />
                        <ActionMenu 
                            icon="receipt-outline" 
                            title="Riwayat Komplain" 
                            color="#4e73df" 
                            onPress={() => { router.push('/tenant/complaint-history') }}
                        />
                        <ActionMenu 
                            icon="settings-outline" 
                            title="Profil" 
                            color="#858796" 
                            onPress={() => { router.push('/tenant/profile') }}
                        />
                    </View>

                    {/* BANNER INFO */}
                    <View style={styles.infoBanner}>
                        <Ionicons name="megaphone" size={24} color="#4e73df" />
                        <View style={{marginLeft: 15, flex: 1}}>
                            <Text style={{fontWeight: 'bold', color: '#2c3e50'}}>Pengumuman</Text>
                            <Text style={{fontSize: 12, color: '#7f8c8d'}}>Gunakan aplikasi untuk mempermudah pelaporan kendala kamar.</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const ActionMenu = ({ icon, title, color, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={26} color={color} />
        </View>
        <Text style={styles.menuLabel}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FC' },
    header: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 100, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
    userName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
    roomCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-around', position: 'absolute', bottom: -40, left: 25, right: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    roomInfo: { flexDirection: 'row', alignItems: 'center' },
    roomText: { marginLeft: 10, fontWeight: '600', color: '#4e73df' },
    divider: { width: 1, height: '100%', backgroundColor: '#eee' },
    content: { paddingHorizontal: 25, marginTop: 60 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, marginTop: 10 },
    billCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, elevation: 3 },
    billLabel: { color: '#858796', fontSize: 12 },
    billAmount: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
    payButton: { backgroundColor: '#1cc88a', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    payButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuItem: { width: '47%', backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 15, elevation: 2 },
    iconCircle: { padding: 15, borderRadius: 50, marginBottom: 10 },
    menuLabel: { fontWeight: '600', color: '#4e73df', fontSize: 13 },
    infoBanner: { backgroundColor: '#eef2ff', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 30 }
});