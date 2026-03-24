import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_URL = "URL_NGROK_KAMU/api";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchAdminData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            // Ganti ke endpoint admin kamu nanti
            const response = await axios.get(`${API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.log("Error Admin:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert("Keluar", "Akhiri sesi admin?", [
            { text: "Batal", style: "cancel" },
            { text: "Keluar", onPress: async () => {
                await AsyncStorage.multiRemove(['userToken', 'userData', 'userRole']);
                router.replace('/');
            }}
        ]);
    };

    useEffect(() => { fetchAdminData(); }, []);

    if (loading) return <ActivityIndicator size="large" color="#4e73df" style={{flex:1}} />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* HEADER ADMIN */}
                <LinearGradient colors={['#1a2a6c', '#b21f1f', '#fdbb2d']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.adminTag}>Administrator</Text>
                            <Text style={styles.userName}>Super Admin 👋</Text>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <Ionicons name="power" size={22} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* STATS OVERVIEW */}
                    <View style={styles.statsRow}>
                        <StatItem label="Total Kamar" value="24" icon="business" />
                        <StatItem label="Terisi" value="20" icon="people" />
                        <StatItem label="Kosong" value="4" icon="log-out" />
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* RINGKASAN KEUANGAN */}
                    <Text style={styles.sectionTitle}>Keuangan Bulan Ini</Text>
                    <View style={styles.incomeCard}>
                        <View>
                            <Text style={styles.incomeLabel}>Pendapatan Masuk</Text>
                            <Text style={styles.incomeValue}>Rp 28.500.000</Text>
                        </View>
                        <Ionicons name="trending-up" size={30} color="#1cc88a" />
                    </View>

                    {/* PANEL KONTROL */}
                    <Text style={styles.sectionTitle}>Manajemen Properti</Text>
                    <View style={styles.gridMenu}>
                        <ControlBtn title="Kamar" icon="bed-outline" color="#4e73df" />
                        <ControlBtn title="Tenant" icon="people-outline" color="#1cc88a" />
                        <ControlBtn title="Tagihan" icon="card-outline" color="#f6c23e" />
                        <ControlBtn title="Laporan" icon="bar-chart-outline" color="#e74a3b" />
                    </View>

                    {/* DAFTAR KELUHAN (URGENT) */}
                    <View style={styles.complaintHeader}>
                        <Text style={styles.sectionTitle}>Keluhan Tenant</Text>
                        <Text style={styles.seeAll}>Lihat Semua</Text>
                    </View>

                    <ComplaintCard 
                        room="Kamar B-04" 
                        user="Budi" 
                        issue="AC Tidak Dingin" 
                        status="Urgent" 
                    />
                    <ComplaintCard 
                        room="Kamar A-10" 
                        user="Siti" 
                        issue="Air Kamar Mandi Bocor" 
                        status="Pending" 
                    />
                </View>
                <View style={{height: 30}} />
            </ScrollView>
        </View>
    );
}

// Komponen Pendukung
const StatItem = ({ label, value, icon }) => (
    <View style={styles.statItem}>
        <Ionicons name={icon} size={18} color="white" style={{opacity: 0.8}} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const ControlBtn = ({ title, icon, color }) => (
    <TouchableOpacity style={styles.controlBtn}>
        <View style={[styles.iconWrap, {backgroundColor: color}]}>
            <Ionicons name={icon} size={24} color="white" />
        </View>
        <Text style={styles.controlText}>{title}</Text>
    </TouchableOpacity>
);

const ComplaintCard = ({ room, user, issue, status }) => (
    <View style={styles.cCard}>
        <View style={{flex: 1}}>
            <Text style={styles.cRoom}>{room} - {user}</Text>
            <Text style={styles.cIssue}>{issue}</Text>
        </View>
        <View style={[styles.badge, {backgroundColor: status === 'Urgent' ? '#e74a3b' : '#f6c23e'}]}>
            <Text style={styles.badgeText}>{status}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f9' },
    header: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    adminTag: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    userName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', width: '30%' },
    statValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
    statLabel: { color: 'white', fontSize: 10, opacity: 0.8 },
    content: { paddingHorizontal: 25, marginTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginVertical: 15 },
    incomeCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
    incomeLabel: { color: '#858796', fontSize: 13 },
    incomeValue: { fontSize: 22, fontWeight: 'bold', color: '#1cc88a' },
    gridMenu: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    controlBtn: { width: '23%', alignItems: 'center', marginBottom: 15 },
    iconWrap: { padding: 15, borderRadius: 15, marginBottom: 8, elevation: 3 },
    controlText: { fontSize: 11, fontWeight: '600', color: '#4e73df' },
    complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seeAll: { color: '#4e73df', fontSize: 12, fontWeight: 'bold' },
    cCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#4e73df' },
    cRoom: { fontWeight: 'bold', color: '#2c3e50', fontSize: 14 },
    cIssue: { color: '#858796', fontSize: 12, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' }
});