import { StyleSheet, Text, View } from 'react-native';

export default function AdminDashboard() {
    const stats = [
        { id: '1', label: 'Total Kamar', value: '20', color: '#3498db' },
        { id: '2', label: 'Terisi', value: '18', color: '#2ecc71' },
        { id: '3', label: 'Kosong', value: '2', color: '#e74c3c' },
    ];

    return (
        <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.adminTitle}>Admin Panel 🛠️</Text>
        </View>

        {/* Ringkasan Statistik */}
        <View style={styles.statsRow}>
            {stats.map(item => (
                <View key={item.id} style={[styles.statBox, {borderTopColor: item.color, borderTopWidth: 4}]}>
                    <Text style={styles.statLabel}>{item.label}</Text>
                    <Text style={styles.statValue}>{item.value}</Text>
                </View>
            ))}
        </View>

        {/* List Keluhan Terbaru */}
        <Text style={styles.sectionTitle}>Keluhan Masuk (Pending)</Text>
            <View style={styles.complaintItem}>
                <Text style={{fontWeight: 'bold'}}>Kamar B-05</Text>
                <Text style={{color: '#7f8c8d'}}>Air kamar mandi mampet...</Text>
                <View style={styles.badgePending}><Text style={{color: 'white', fontSize: 10}}>PENDING</Text></View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    header: { padding: 30, paddingTop: 60, backgroundColor: '#2c3e50' },
    adminTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -20, paddingHorizontal: 10 },
    statBox: { backgroundColor: 'white', padding: 15, borderRadius: 10, width: '30%', alignItems: 'center', elevation: 5 },
    statLabel: { fontSize: 10, color: '#95a5a6', textTransform: 'uppercase' },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    sectionTitle: { padding: 20, fontSize: 18, fontWeight: 'bold' },
    complaintItem: { backgroundColor: 'white', marginHorizontal: 20, padding: 15, borderRadius: 10, borderLeftWidth: 5, borderLeftColor: '#e67e22' },
    badgePending: { backgroundColor: '#e67e22', alignSelf: 'flex-start', padding: 4, borderRadius: 5, marginTop: 5 }
});