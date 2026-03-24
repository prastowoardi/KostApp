import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DUMMY_PAYMENTS = [
    { id: '1', name: 'Budi (Kamar A-01)', amount: '1.500.000', date: '24 Mar 2024', status: 'pending' },
    { id: '2', name: 'Siti (Kamar B-05)', amount: '1.500.000', date: '23 Mar 2024', status: 'pending' },
];

export default function AdminPayments() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Konfirmasi Bayar 💰</Text>
            <FlatList 
                data={DUMMY_PAYMENTS}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                    <View style={styles.card}>
                        <View style={{flex: 1}}>
                            <Text style={styles.tenantName}>{item.name}</Text>
                            <Text style={styles.amount}>Rp {item.amount}</Text>
                            <Text style={styles.date}>{item.date}</Text>
                        </View>
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.checkBtn}>
                                <Ionicons name="eye" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.approveBtn}>
                                <Ionicons name="checkmark" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f9', padding: 20, paddingTop: 60 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 3 },
    tenantName: { fontWeight: 'bold', fontSize: 16 },
    amount: { color: '#1cc88a', fontWeight: 'bold' },
    date: { color: '#858796', fontSize: 12 },
    actionRow: { flexDirection: 'row' },
    checkBtn: { backgroundColor: '#4e73df', padding: 10, borderRadius: 10, marginRight: 5 },
    approveBtn: { backgroundColor: '#1cc88a', padding: 10, borderRadius: 10 }
});