import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../components/GlobalAlert';
import ScreenHeader from '../../components/ScreenHeader';
import { API_URL } from '../../helpers/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

const STATUS_COLORS = {
    available: { bg: '#e8f5e9', text: '#2e7d32', label: 'TERSEDIA' },
    occupied: { bg: '#fff3e0', text: '#e65100', label: 'TERISI' },
    maintenance: { bg: '#ffebee', text: '#c62828', label: 'MAINTENANCE' },
};

const TYPE_LABELS = {
    singlenoac: 'Single No AC',
    singleac: 'Single AC',
    shared: 'Campur',
};

export default function RoomManagement() {
    const insets = useSafeAreaInsets();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const [form, setForm] = useState({
        room_number: '', type: 'singleac', price: '', capacity: '1',
        status: 'available', size: '', description: ''
    });

    const [alertConfig, setAlertConfig] = useState({
        visible: false, title: '', message: '', type: 'success'
    });

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const getHeaders = async () => {
        const token = await AsyncStorage.getItem('userToken');
        return {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420"
        };
    };

    const fetchRooms = useCallback(async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/admin/rooms`, { headers });
            setRooms(res.data?.data || res.data || []);
        } catch (error) {
            console.log("Error fetch rooms:", error);
            Alert.alert("Error", "Gagal mengambil data kamar");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    const openDetail = async (room) => {
        setSelectedRoom(room);
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/admin/rooms/${room.uuid || room.id}`, { headers });
            setSelectedRoom(res.data?.data || res.data);
        } catch (e) {
            console.log("Error fetch room detail:", e);
        }
        setDetailVisible(true);
    };

    const openEdit = (room) => {
        setSelectedRoom(room);
        setForm({
            room_number: room.room_number || '',
            type: room.type || 'singleac',
            price: room.price?.toString() || '',
            capacity: room.capacity?.toString() || '1',
            status: room.status || 'available',
            size: room.size?.toString() || '',
            description: room.description || '',
        });
        setEditVisible(true);
    };

    const handleSave = async () => {
        if (!form.room_number || !form.price) {
            return showAlert("Data Belum Lengkap", "Nomor kamar dan harga wajib diisi.", "warning");
        }

        try {
            const headers = await getHeaders();
            const roomId = selectedRoom?.uuid || selectedRoom?.id;

            await axios.post(`${API_URL}/admin/rooms/${roomId}`, {
                ...form,
                price: parseInt(form.price),
                capacity: parseInt(form.capacity),
                size: form.size ? parseFloat(form.size) : null,
            }, { headers });

            showAlert("Berhasil", "Data kamar berhasil diperbarui.", "success");
            setEditVisible(false);
            fetchRooms();
            if (detailVisible) {
                setDetailVisible(false);
            }
        } catch (e) {
            const msg = e.response?.data?.message || "Gagal menyimpan data.";
            showAlert("Gagal", msg, "error");
        }
    };

    const renderItem = ({ item }) => {
        const st = STATUS_COLORS[item.status] || STATUS_COLORS.available;
        return (
            <Card className="mb-3 p-0 shadow-sm">
                <TouchableOpacity onPress={() => openDetail(item)} className="flex-row items-center justify-between p-4">
                    <View className="flex-row items-center flex-1">
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
                            <Ionicons name="business" size={24} color="hsl(var(--primary))" />
                        </View>
                        <View className="ml-3">
                            <Text className="text-base font-bold text-foreground">Kamar {item.room_number}</Text>
                            <Text className="mt-0.5 text-xs text-muted-foreground">
                                {TYPE_LABELS[item.type] || item.type} • Rp {parseInt(item.price).toLocaleString('id-ID')}
                            </Text>
                            <Text className="mt-0.5 text-[11px] font-medium text-primary">
                                {item.active_tenant ? `Diisi: ${item.active_tenant.name}` : 'Kosong'}
                            </Text>
                        </View>
                    </View>
                    <View style={{ backgroundColor: st.bg }} className="rounded-md px-2.5 py-1">
                        <Text style={{ color: st.text }} className="text-[10px] font-bold">{st.label}</Text>
                    </View>
                </TouchableOpacity>
            </Card>
        );
    };

    const renderDetailValue = (label, value) => (
        <View className="flex-row justify-between border-b border-border py-3">
            <Text className="flex-1 text-sm text-muted-foreground">{label}</Text>
            <Text className="flex-[1.5] text-right text-sm font-semibold text-foreground">{value || '-'}</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            <ScreenHeader
                title="Manajemen Kamar"
                right={<Text className="text-xs text-white/70">Total: {rooms.length} Kamar</Text>}
            />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="hsl(var(--primary))" />
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    keyExtractor={(item) => (item.uuid || item.id).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#b21f1f']} />
                    }
                    ListEmptyComponent={
                        <Text className="mt-12 text-center text-muted-foreground">Belum ada data kamar.</Text>
                    }
                />
            )}

            {/* Detail Modal */}
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/60">
                    <View className="max-h-[85%] rounded-t-[30px] bg-card p-6">
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="mb-5 items-center">
                                <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-accent">
                                    <Ionicons name="business" size={30} color="hsl(var(--primary))" />
                                </View>
                                <Text className="mt-3 text-[22px] font-bold text-foreground">Kamar {selectedRoom?.room_number}</Text>
                                {selectedRoom?.status && (
                                    <View style={{
                                        backgroundColor: STATUS_COLORS[selectedRoom.status]?.bg || '#e8f5e9',
                                    }} className="mt-2 rounded-md px-4 py-1.5">
                                        <Text style={{ color: STATUS_COLORS[selectedRoom.status]?.text || '#2e7d32' }} className="text-xs font-bold">
                                            {STATUS_COLORS[selectedRoom.status]?.label || selectedRoom.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View className="mb-5">
                                {renderDetailValue('Tipe', TYPE_LABELS[selectedRoom?.type] || selectedRoom?.type)}
                                {renderDetailValue('Harga', selectedRoom?.price ? `Rp ${parseInt(selectedRoom.price).toLocaleString('id-ID')}` : '-')}
                                {renderDetailValue('Kapasitas', selectedRoom?.capacity ? `${selectedRoom.capacity} Orang` : '-')}
                                {renderDetailValue('Ukuran', selectedRoom?.size ? `${selectedRoom.size} m²` : '-')}
                                {renderDetailValue('Deskripsi', selectedRoom?.description)}
                                {renderDetailValue('Penghuni', selectedRoom?.active_tenant?.name || selectedRoom?.active_tenant?.user?.name || 'Kosong')}
                            </View>
                        </ScrollView>

                        <View style={{ paddingBottom: insets.bottom }} className="flex-row gap-2.5">
                            <Button variant="secondary" className="flex-1" onPress={() => setDetailVisible(false)}>
                                <Text className="font-bold text-secondary-foreground">Tutup</Text>
                            </Button>
                            <Button className="flex-1" onPress={() => { setDetailVisible(false); openEdit(selectedRoom); }}>
                                <Ionicons name="create-outline" size={16} color="white" />
                                <Text className="ml-1.5 font-bold text-primary-foreground">Edit</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={editVisible} animationType="slide">
                <View className="flex-1 bg-background">
                    <View className="flex-row items-center justify-between border-b border-border p-6">
                        <Text className="text-xl font-bold text-foreground">Edit Kamar</Text>
                        <TouchableOpacity onPress={() => setEditVisible(false)}>
                            <Ionicons name="close" size={28} color="hsl(var(--muted-foreground))" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-5">
                        <Label className="mb-2 mt-4 text-foreground">Nomor Kamar</Label>
                        <Input
                            placeholder="Contoh: A-01"
                            value={form.room_number}
                            onChangeText={(v) => setForm({ ...form, room_number: v })}
                        />

                        <Label className="mb-2 mt-4 text-foreground">Tipe Kamar</Label>
                        <View className="flex-row flex-wrap gap-2">
                            {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                <TouchableOpacity
                                    key={key}
                                    className={form.type === key
                                        ? 'rounded-xl bg-primary px-3.5 py-2'
                                        : 'rounded-xl border border-border bg-muted/50 px-3.5 py-2'}
                                    onPress={() => setForm({ ...form, type: key })}
                                >
                                    <Text className={form.type === key ? 'text-xs font-semibold text-primary-foreground' : 'text-xs font-semibold text-muted-foreground'}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Label className="mb-2 mt-4 text-foreground">Status</Label>
                        <View className="flex-row flex-wrap gap-2">
                            {Object.entries(STATUS_COLORS).map(([key, val]) => (
                                <TouchableOpacity
                                    key={key}
                                    className={form.status === key
                                        ? 'rounded-xl bg-primary px-3.5 py-2'
                                        : 'rounded-xl border border-border bg-muted/50 px-3.5 py-2'}
                                    onPress={() => setForm({ ...form, status: key })}
                                >
                                    <Text className={form.status === key ? 'text-xs font-semibold text-primary-foreground' : 'text-xs font-semibold text-muted-foreground'}>
                                        {val.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row gap-3.5">
                            <View className="flex-1">
                                <Label className="mb-2 mt-4 text-foreground">Harga (Rp)</Label>
                                <Input
                                    placeholder="500000"
                                    keyboardType="numeric"
                                    value={form.price}
                                    onChangeText={(v) => setForm({ ...form, price: v })}
                                />
                            </View>
                            <View className="flex-1">
                                <Label className="mb-2 mt-4 text-foreground">Kapasitas</Label>
                                <Input
                                    placeholder="1"
                                    keyboardType="numeric"
                                    value={form.capacity}
                                    onChangeText={(v) => setForm({ ...form, capacity: v })}
                                />
                            </View>
                        </View>

                        <Label className="mb-2 mt-4 text-foreground">Ukuran (m²)</Label>
                        <Input
                            placeholder="3x4"
                            keyboardType="decimal-pad"
                            value={form.size}
                            onChangeText={(v) => setForm({ ...form, size: v })}
                        />

                        <Label className="mb-2 mt-4 text-foreground">Deskripsi</Label>
                        <Input
                            className="h-20 items-start text-align-top"
                            multiline
                            placeholder="Fasilitas kamar, dll."
                            value={form.description}
                            onChangeText={(v) => setForm({ ...form, description: v })}
                        />

                        <Button className="mt-8" onPress={handleSave}>
                            <Text className="text-base font-bold text-primary-foreground">SIMPAN PERUBAHAN</Text>
                        </Button>
                        <View style={{ height: insets.bottom + 50 }} />
                    </ScrollView>
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
