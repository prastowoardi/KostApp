import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import GlobalAlert from '../../../components/GlobalAlert';
import ScreenHeader from '../../../components/ScreenHeader';
import { API_URL } from '../../../helpers/api';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Skeleton } from '../../../components/ui/skeleton';

const PAYMENT_METHODS = [
    { key: 'cash', label: 'Tunai', icon: 'cash-outline' },
    { key: 'transfer', label: 'Transfer', icon: 'phone-portrait-outline' },
    { key: 'e-wallet', label: 'E-Wallet', icon: 'wallet-outline' },
];

export default function CreatePayment() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tenantPickerVisible, setTenantPickerVisible] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [receipt, setReceipt] = useState(null);
    const [datePicker, setDatePicker] = useState(null);

    const [form, setForm] = useState({
        tenant_id: '',
        period_month: new Date().toISOString().slice(0, 7),
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        late_fee: '0',
        payment_method: 'transfer',
        notes: '',
    });

    const [alertConfig, setAlertConfig] = useState({
        visible: false, title: '', message: '', type: 'success'
    });

    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.get(`${API_URL}/admin/tenants/active`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenants(res.data?.data || res.data || []);
        } catch (e) {
            console.log("Error fetch tenants:", e);
            Alert.alert("Error", "Gagal mengambil data penghuni");
        } finally {
            setLoading(false);
        }
    };

    const selectTenant = (tenant) => {
        setSelectedTenant(tenant);
        setForm({
            ...form,
            tenant_id: tenant.id || tenant.uuid,
            amount: tenant.room?.price?.toString() || form.amount,
        });
        setTenantPickerVisible(false);
    };

    const handleSubmit = async () => {
        if (!form.tenant_id) {
            return showAlert("Data Belum Lengkap", "Pilih penghuni terlebih dahulu.", "warning");
        }
        if (!form.amount || parseInt(form.amount) <= 0) {
            return showAlert("Data Belum Lengkap", "Jumlah pembayaran wajib diisi.", "warning");
        }
        if (!form.payment_method) {
            return showAlert("Data Belum Lengkap", "Pilih metode pembayaran.", "warning");
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const payload = {
                tenant_id: selectedTenant.id || selectedTenant.uuid,
                period_month: form.period_month + '-01',
                payment_date: form.payment_date,
                amount: parseInt(form.amount),
                late_fee: parseInt(form.late_fee || 0),
                payment_method: form.payment_method,
                notes: form.notes,
            };

            const res = await axios.post(`${API_URL}/admin/payments/store`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReceipt(res.data?.data || res.data);
        } catch (e) {
            const msg = e.response?.data?.message || "Gagal mencatat pembayaran.";
            showAlert("Gagal", msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedTenant(null);
        setForm({
            tenant_id: '',
            period_month: new Date().toISOString().slice(0, 7),
            payment_date: new Date().toISOString().slice(0, 10),
            amount: '',
            late_fee: '0',
            payment_method: 'transfer',
            notes: '',
        });
    };

    const formatRupiah = (num) => {
        return parseInt(num || 0).toLocaleString('id-ID');
    };

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            <ScreenHeader title="Catat Pembayaran" />

            {receipt ? (
                /* Receipt View */
                <View className="flex-1 justify-center p-5">
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <Card className="items-center p-8 shadow-md">
                            <View className="mb-4">
                                <Ionicons name="checkmark-circle" size={64} color="hsl(var(--success))" />
                            </View>
                            <Text className="mb-1 text-[22px] font-bold text-foreground">Pembayaran Berhasil!</Text>
                            <Text className="mb-5 text-base font-semibold text-primary">#{receipt.invoice || '-'}</Text>
                            <Separator className="mb-5 w-full" />

                            <View className="mb-4 w-full flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Penghuni</Text>
                                <Text className="text-sm font-semibold text-foreground">{receipt.tenant_name || selectedTenant?.name || '-'}</Text>
                            </View>
                            <View className="mb-4 w-full flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Kamar</Text>
                                <Text className="text-sm font-semibold text-foreground">{receipt.room_number || selectedTenant?.room?.room_number || '-'}</Text>
                            </View>
                            <View className="mb-4 w-full flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Periode</Text>
                                <Text className="text-sm font-semibold text-foreground">{receipt.period || form.period_month || '-'}</Text>
                            </View>
                            <View className="mb-4 w-full flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Tanggal</Text>
                                <Text className="text-sm font-semibold text-foreground">{receipt.payment_date || form.payment_date || '-'}</Text>
                            </View>
                            <View className="mb-4 w-full flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Total</Text>
                                <Text className="text-sm font-semibold text-foreground">Rp {formatRupiah(receipt.total || 0)}</Text>
                            </View>

                            <Separator className="mb-2.5 w-full" />
                            <Text className="mt-2.5 text-xs italic text-muted-foreground">Kwitansi tersedia di riwayat pembayaran</Text>

                            <View className="mt-6 w-full flex-row gap-2.5">
                                <Button variant="default" className="flex-1 rounded-xl py-3.5" onPress={() => router.push('/admin/payment/history')}>
                                    <Ionicons name="receipt-outline" size={18} color="white" />
                                    <Text className="text-sm font-bold text-white">Riwayat</Text>
                                </Button>
                                <Button variant="destructive" className="flex-1 rounded-xl py-3.5" onPress={() => {
                                        setReceipt(null);
                                        resetForm();
                                    }}>
                                    <Ionicons name="home-outline" size={18} color="white" />
                                    <Text className="text-sm font-bold text-white">Selesai</Text>
                                </Button>
                            </View>
                        </Card>
                    </ScrollView>
                </View>
            ) : loading ? (
                <View className="p-5">
                    <Skeleton className="h-8 w-44 rounded-lg" />
                    <Skeleton className="mt-5 h-14 w-full rounded-xl" />
                    <Skeleton className="mt-5 h-14 w-full rounded-xl" />
                    <Skeleton className="mt-5 h-14 w-full rounded-xl" />
                    <Skeleton className="mt-5 h-14 w-full rounded-xl" />
                </View>
            ) : (
                <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                    <Text className="mb-5 text-lg font-bold text-foreground">Data Pembayaran</Text>

                    <Text className="mb-2 mt-4 text-[13px] font-bold text-secondary-foreground">Penghuni</Text>
                    <TouchableOpacity className="flex-row items-center rounded-xl border border-border bg-card p-3.5" onPress={() => setTenantPickerVisible(true)}>
                        <Ionicons name="person-outline" size={20} color="#4e73df" />
                        <Text className={`ml-2.5 flex-1 ${selectedTenant ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {selectedTenant ? `${selectedTenant.name || selectedTenant.user?.name} (Kamar ${selectedTenant.room?.room_number || '?'})` : 'Pilih penghuni...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="hsl(var(--muted-foreground))" />
                    </TouchableOpacity>

                    <Text className="mb-2 mt-4 text-[13px] font-bold text-secondary-foreground">Periode Bulan</Text>
                    <TouchableOpacity className="flex-row items-center rounded-xl border border-border bg-card p-3.5" onPress={() => setDatePicker('period_month')}>
                        <Ionicons name="calendar-outline" size={20} color="#4e73df" />
                        <Text className="ml-2.5 flex-1 text-foreground">
                            {form.period_month ? new Date(form.period_month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Pilih periode...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="hsl(var(--muted-foreground))" />
                    </TouchableOpacity>

                    <Text className="mb-2 mt-4 text-[13px] font-bold text-secondary-foreground">Tanggal Pembayaran</Text>
                    <TouchableOpacity className="flex-row items-center rounded-xl border border-border bg-card p-3.5" onPress={() => setDatePicker('payment_date')}>
                        <Ionicons name="calendar-outline" size={20} color="#4e73df" />
                        <Text className="ml-2.5 flex-1 text-foreground">
                            {form.payment_date ? new Date(form.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih tanggal...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="hsl(var(--muted-foreground))" />
                    </TouchableOpacity>

                    <View className="flex-row gap-3.5">
                        <View className="flex-1">
                            <Label className="mb-2 mt-4 text-[13px] font-bold text-secondary-foreground">Jumlah Bayar (Rp)</Label>
                            <Input className="rounded-xl border-border bg-card p-3.5 text-[15px]"
                                keyboardType="numeric"
                                value={form.amount}
                                onChangeText={(v) => setForm({ ...form, amount: v })}
                                placeholder="500000"
                            />
                        </View>
                        <View className="flex-1">
                            <Label className="mb-2 mt-4 text-[13px] font-bold text-secondary-foreground">Denda (Rp)</Label>
                            <Input className="rounded-xl border-border bg-card p-3.5 text-[15px]"
                                keyboardType="numeric"
                                value={form.late_fee}
                                onChangeText={(v) => setForm({ ...form, late_fee: v })}
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <Text className="mb-2 mt-4 text-[13px] font-bold text-secondary-foreground">Metode Pembayaran</Text>
                    <View className="flex-row gap-2.5">
                        {PAYMENT_METHODS.map((m) => (
                            <TouchableOpacity
                                key={m.key}
                                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-3 ${form.payment_method === m.key ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                                onPress={() => setForm({ ...form, payment_method: m.key })}
                            >
                                <Ionicons name={m.icon} size={20} color={form.payment_method === m.key ? 'white' : 'hsl(var(--muted-foreground))'} />
                                <Text className={`text-xs font-semibold ${form.payment_method === m.key ? 'text-white' : 'text-muted-foreground'}`}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Label className="mb-2 mt-4 text-[13px] font-bold text-secondary-foreground">Catatan (opsional)</Label>
                    <Input className="h-20 items-start rounded-xl border-border bg-card p-3.5 text-[15px] text-align-top"
                        multiline
                        value={form.notes}
                        onChangeText={(v) => setForm({ ...form, notes: v })}
                        placeholder="Catatan tambahan..."
                    />

                    <Text className="mt-5 text-right text-lg font-bold text-success">
                        Total: Rp {formatRupiah(parseInt(form.amount || 0) + parseInt(form.late_fee || 0))}
                    </Text>

                    <Button
                        className="mt-3.5 h-[54px] rounded-[15px]"
                        onPress={handleSubmit}
                        loading={submitting}
                        disabled={submitting}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                        <Text className="ml-2 text-base font-bold text-white">CATAT PEMBAYARAN</Text>
                    </Button>
                    <View style={{ height: insets.bottom + 40 }} />
                </ScrollView>
            )}

            {/* Tenant Picker */}
            <Modal visible={tenantPickerVisible} transparent animationType="fade">
                <View className="flex-1 justify-center bg-black/60 p-5">
                    <View className="max-h-[80%] rounded-[20px] bg-card p-5">
                        <Text className="mb-4 text-center text-lg font-bold text-primary">Pilih Penghuni</Text>
                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {tenants.map((t) => (
                                <TouchableOpacity
                                    key={t.uuid || t.id}
                                    className="flex-row items-center border-b border-muted py-3"
                                    onPress={() => selectTenant(t)}
                                >
                                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                                        <Text className="text-base font-bold text-white">
                                            {(t.name || t.user?.name || '?').charAt(0)}
                                        </Text>
                                    </View>
                                    <View className="ml-3">
                                        <Text className="text-[15px] font-bold text-foreground">{t.name || t.user?.name}</Text>
                                        <Text className="mt-0.5 text-xs text-muted-foreground">Kamar {t.room?.room_number || '?'} • Rp {formatRupiah(t.room?.price)}/bln</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity className="mt-3.5 items-center p-2.5" onPress={() => setTenantPickerVisible(false)}>
                            <Text className="font-bold text-destructive">Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date Picker Modal */}
            <DateTimePickerModal
                isVisible={datePicker !== null}
                mode="date"
                onConfirm={(date) => {
                    if (datePicker === 'period_month') {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        setForm({ ...form, period_month: `${y}-${m}` });
                    } else {
                        setForm({ ...form, payment_date: date.toISOString().slice(0, 10) });
                    }
                    setDatePicker(null);
                }}
                onCancel={() => setDatePicker(null)}
                locale="id_ID"
            />

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
