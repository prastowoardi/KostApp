import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";
import { API_URL } from "../../helpers/api";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: () => {},
    });

    const fetchAdminData = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const cleanToken = token ? token.replace(/"/g, "").trim() : "";
            const response = await axios.get(`${API_URL}/admin/stats`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: 'application/json'
                },
            });
            setStats(response.data);
        } catch (error) {
            console.log("Error Fetch:", error.message);
            setStats({
                total_rooms: 0, occupied_rooms: 0, vacant_rooms: 0,
                monthly_income: 0, monthly_reports: [],
                payment_history: [], latest_complaints: [],
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAdminData(); }, []);

    const handleLogout = () => {
        setAlertConfig({
            visible: true,
            title: "Logout",
            message: "Yakin ingin keluar?",
            type: "confirmation",
            onConfirm: async () => {
                await AsyncStorage.multiRemove(["userToken", "userData"]);
                setAlertConfig((p) => ({ ...p, visible: false }));
                router.replace("/");
            },
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center bg-background px-6">
                <Skeleton className="h-40 w-full rounded-3xl" />
                <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
                <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
                <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
            </View>
        );
    }

    const maxReportAmount = stats?.monthly_reports?.length > 0
    ? Math.max(...stats.monthly_reports.map(o => o.amount))
    : 1000000;

    return (
        <View className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAdminData} colors={["#b21f1f"]} />}
            >
                {/* HEADER */}
                <LinearGradient colors={["#1a2a6c", "#b21f1f"]} className="rounded-b-[30px] px-6 pb-8 pt-12">
                    <View className="mb-5 flex-row items-center justify-between">
                        <View>
                            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">Serrata Management</Text>
                            <Text className="mt-1 text-[22px] font-bold text-white">Owner Dashboard 👋</Text>
                        </View>
                        <TouchableOpacity onPress={handleLogout} className="rounded-xl bg-white/20 p-2.5">
                            <Ionicons name="log-out-outline" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-around">
                        <StatItem label="Kamar" value={stats?.total_rooms || 0} icon="business" />
                        <StatItem label="Terisi" value={stats?.occupied_rooms || 0} icon="people" />
                        <StatItem label="Kosong" value={stats?.vacant_rooms || 0} icon="log-out" />
                    </View>
                </LinearGradient>

                <View className="mt-5 px-5">
                    {/* INCOME */}
                    <Text className="my-2.5 text-base font-bold text-foreground">Ringkasan Keuangan</Text>
                    <Card className="flex-row items-center justify-between p-5 shadow-sm">
                        <View>
                            <Text className="text-xs text-muted-foreground">Pendapatan Bulan Ini</Text>
                            <Text className="mt-1.5 text-[22px] font-bold text-success">Rp {(stats?.monthly_income || 0).toLocaleString("id-ID")}</Text>
                        </View>
                        <View className="rounded-xl bg-success/10 p-2.5">
                            <Ionicons name="trending-up" size={28} color="hsl(var(--success))" />
                        </View>
                    </Card>

                    <Card className="mt-4 p-5 shadow-sm">
                        <Text className="mb-4 text-xs font-semibold text-muted-foreground">Trend 5 Bulan Terakhir</Text>
                        <View className="h-20 flex-row items-end justify-around">
                            {stats?.monthly_reports?.length > 0 ? (
                                stats.monthly_reports.map((item, index) => (
                                    <View key={index} className="items-center">
                                        <Text className="mb-0.5 text-[7px] text-muted-foreground">
                                            {item.amount > 0 ? (item.amount / 1000000).toFixed(1) + 'M' : ''}
                                        </Text>
                                        <View
                                            className="w-[15px] rounded"
                                            style={{ height: Math.max((item.amount / (maxReportAmount || 1)) * 60, 5), backgroundColor: 'hsl(var(--primary))' }}
                                        />
                                        <Text className="mt-1 text-[9px] text-muted-foreground">{item.month}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text className="my-2.5 text-center text-xs text-muted-foreground">Data grafik belum tersedia</Text>
                            )}
                        </View>
                    </Card>

                    {/* MENU MANAJEMEN */}
                    <Text className="my-2.5 text-base font-bold text-foreground">Manajemen</Text>
                    <View className="flex-row flex-wrap justify-between py-2.5">
                        <ControlBtn title="Bayar" icon="cash-outline" color="#1cc88a" onPress={() => router.push("/admin/payment/create")} />
                        <ControlBtn title="Verifikasi" icon="shield-checkmark" color="#b21f1f" onPress={() => router.push("/admin/verify")} />
                        <ControlBtn title="Komplain" icon="chatbubbles" color="#f6c23e" onPress={() => router.push("/admin/complaint")} />
                        <ControlBtn title="Tenant" icon="people" color="#36b9cc" onPress={() => router.push("/admin/tenant")} />
                        <ControlBtn title="Kamar" icon="bed" color="#4e73df" onPress={() => router.push("/admin/room")} />
                        <ControlBtn title="Keuangan" icon="bar-chart-outline" color="#4e73df" onPress={() => router.push("/admin/finances")} />
                    </View>

                    {/* PEMBAYARAN TERBARU */}
                    <View className="flex-row items-center justify-between">
                        <Text className="my-2.5 text-base font-bold text-foreground">Pembayaran Terbaru</Text>
                        <TouchableOpacity onPress={() => router.push("/admin/verify")}>
                            <Text className="text-xs font-bold text-primary">Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    {stats?.payment_history?.map((pay, index) => {
                        const isSuccess = pay.status.toLowerCase() === 'success' || pay.status.toLowerCase() === 'paid';
                        const statusColor = isSuccess ? '#1cc88a' : '#4e73df';

                        return (
                            <View key={index} className="mb-2.5 flex-row items-center rounded-2xl bg-card p-4 shadow-sm">
                                <View style={{ backgroundColor: statusColor }} className="mr-4 w-1 self-stretch rounded" />
                                <View className="flex-1">
                                    <Text className="text-[13px] font-bold text-foreground">{pay.name} ({pay.room})</Text>
                                    <Text className="text-[11px] text-muted-foreground">{pay.date}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[13px] font-bold text-foreground">
                                        Rp {Number(pay.amount).toLocaleString("id-ID")}
                                    </Text>
                                    <Badge variant={isSuccess ? 'success' : 'default'} className="mt-1">
                                        <Text style={{ color: statusColor }} className="text-[10px] font-bold">{pay.status}</Text>
                                    </Badge>
                                </View>
                            </View>
                        );
                    })}
                </View>
                <View className="h-12" />
            </ScrollView>

            <GlobalAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig(p => ({...p, visible: false}))} onConfirm={alertConfig.onConfirm} />
        </View>
    );
}

const StatItem = ({ label, value, icon }) => (
    <View className="items-center">
        <View className="mb-1.5 rounded-full bg-white/15 p-2">
            <Ionicons name={icon} size={18} color="white" />
        </View>
        <Text className="text-xl font-bold text-white">{value}</Text>
        <Text className="text-[10px] text-white/80">{label}</Text>
    </View>
);

const ControlBtn = ({ title, icon, color, onPress }) => (
    <TouchableOpacity className="mb-5 w-[30%] items-center justify-center" onPress={onPress}>
        <View style={{ backgroundColor: color }} className="h-[60px] w-[60px] items-center justify-center rounded-[20px] shadow-lg shadow-black/10">
            <Ionicons name={icon} size={26} color="white" />
        </View>
        <Text className="mt-2 w-full px-1 text-center text-xs font-bold text-primary" numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
);
