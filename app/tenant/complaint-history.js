import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function ComplaintHistory() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComplaints(response.data);
        } catch (error) {
            console.log("Error Fetch:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const getStatusStyle = (status) => {
        switch(status.toLowerCase()) {
            case 'resolved': return { bg: '#1cc88a20', text: '#1cc88a', label: 'Selesai' };
            case 'process': return { bg: '#4e73df20', text: '#4e73df', label: 'Proses' };
            default: return { bg: '#f6c23e20', text: '#f6c23e', label: 'Pending' };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                    </View>
                </View>

                <Text style={styles.titleText}>{item.title}</Text>
                <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>

                {item.response && (
                    <View style={styles.adminResponse}>
                        <Text style={styles.responseText}><Text style={{fontWeight: 'bold'}}>Balasan Admin:</Text> {item.response}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#4e73df', '#224abe']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Riwayat Komplain</Text>
                    <TouchableOpacity onPress={fetchHistory} style={styles.backBtn}>
                        <Ionicons name="refresh" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color="#4e73df" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={complaints}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbox-ellipses-outline" size={80} color="#ccc" />
                            <Text style={styles.emptyText}>Belum ada riwayat komplain.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    listContainer: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    dateText: { color: '#858796', fontSize: 12 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    titleText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
    descText: { fontSize: 14, color: '#4e5e6a', lineHeight: 20 },
    adminResponse: { marginTop: 15, padding: 12, backgroundColor: '#f1f3f9', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#4e73df' },
    responseText: { fontSize: 13, color: '#2c3e50', italic: 'italic' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#858796', fontSize: 16 }
});