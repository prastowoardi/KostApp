import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";

const { width } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Hitung lebar item menu (Layar dikurangi padding, dibagi 4)
const CONTENT_PADDING = 20;
const MENU_ITEM_WIDTH = (width - (CONTENT_PADDING * 2)) / 4;

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
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#b21f1f" />
            </View>
        );
    }

    const maxReportAmount = stats?.monthly_reports?.length > 0 
    ? Math.max(...stats.monthly_reports.map(o => o.amount)) 
    : 1000000;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAdminData} colors={["#b21f1f"]} />}
            >
                {/* HEADER */}
                <LinearGradient colors={["#1a2a6c", "#b21f1f"]} style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.adminTag}>Serrata Management</Text>
                            <Text style={styles.userName}>Owner Dashboard 👋</Text>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <Ionicons name="log-out-outline" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statsRow}>
                        <StatItem label="Kamar" value={stats?.total_rooms || 0} icon="business" />
                        <StatItem label="Terisi" value={stats?.occupied_rooms || 0} icon="people" />
                        <StatItem label="Kosong" value={stats?.vacant_rooms || 0} icon="log-out" />
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* INCOME */}
                    <Text style={styles.sectionTitle}>Ringkasan Keuangan</Text>
                    <View style={styles.incomeCard}>
                        <View>
                            <Text style={styles.incomeLabel}>Pendapatan Bulan Ini</Text>
                            <Text style={styles.incomeValue}>Rp {(stats?.monthly_income || 0).toLocaleString("id-ID")}</Text>
                        </View>
                        <View style={styles.incomeIconWrap}><Ionicons name="trending-up" size={28} color="#1cc88a" /></View>
                    </View>

                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Trend 5 Bulan Terakhir</Text>
                        <View style={styles.chartRow}>
                            {stats?.monthly_reports?.length > 0 ? (
                                stats.monthly_reports.map((item, index) => (
                                    <View key={index} style={styles.chartBarWrapper}>
                                        {/* Label angka di atas bar (optional) */}
                                        <Text style={{fontSize: 7, color: '#bdc3c7', marginBottom: 2}}>
                                            {item.amount > 0 ? (item.amount / 1000000).toFixed(1) + 'M' : ''}
                                        </Text>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                {
                                                    height: Math.max((item.amount / (maxReportAmount || 1)) * 60, 5),
                                                },
                                            ]}
                                        />
                                        <Text style={styles.chartMonth}>{item.month}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>Data grafik belum tersedia</Text>
                            )}
                        </View>
                    </View>

                    {/* MENU MANAJEMEN - SEKARANG RAPI & SEJAJAR */}
                    <Text style={styles.sectionTitle}>Manajemen</Text>
                    <View style={styles.menuGrid}>
                        <ControlBtn title="Verifikasi" icon="shield-checkmark" color="#1cc88a" onPress={() => router.push("/admin/verify-payment")} />
                        <ControlBtn title="Komplain" icon="chatbubbles" color="#f6c23e" onPress={() => router.push("/admin/complaint")} />
                        <ControlBtn title="Tenant" icon="people" color="#36b9cc" onPress={() => router.push("/admin/manage-tenant")} />
                        <ControlBtn title="Kamar" icon="bed" color="#4e73df" onPress={() => {}} />
                        <ControlBtn title="Keuangan" icon="cash-outline" color="#4e73df" onPress={() => router.push("/admin/finances")} />
                    </View>

                    {/* PEMBAYARAN TERBARU */}
                    <View style={styles.flexRow}>
                        <Text style={styles.sectionTitle}>Pembayaran Terbaru</Text>
                        <TouchableOpacity onPress={() => router.push("/admin/verify-payment")}>
                            <Text style={styles.seeAll}>Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    {stats?.payment_history?.map((pay, index) => {
                        const isSuccess = pay.status.toLowerCase() === 'success' || pay.status.toLowerCase() === 'paid';
                        const statusColor = isSuccess ? '#1cc88a' : '#4e73df';
                        const bgColor = isSuccess ? '#eafaf1' : '#ebf0ff';

                        return (
                            <View key={index} style={styles.paymentItem}>
                                {/* Garis Indikator Samping */}
                                <View style={[styles.payStatusLine, { backgroundColor: statusColor }]} />
                                
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.payName}>{pay.name} ({pay.room})</Text>
                                    <Text style={styles.payDate}>{pay.date}</Text>
                                </View>

                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.payAmount}>
                                        Rp {Number(pay.amount).toLocaleString("id-ID")}
                                    </Text>
                                    
                                    <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                            {pay.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
                <View style={{ height: 50 }} />
            </ScrollView>

            <GlobalAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig(p => ({...p, visible: false}))} onConfirm={alertConfig.onConfirm} />
        </View>
    );
}

const StatItem = ({ label, value, icon }) => (
    <View style={styles.statItem}>
        <View style={styles.statIconCircle}><Ionicons name={icon} size={18} color="white" /></View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const ControlBtn = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.menuItemWrap} onPress={onPress}>
        <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
            <Ionicons name={icon} size={26} color="white" />
        </View>
        <Text style={styles.menuText} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#f8f9fc" 
    },
    loadingWrap: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center" 
    },
    header: {
        paddingHorizontal: 25,
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    adminTag: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase"
    },
    userName: {
        color: "white",
        fontSize: 22,
        fontWeight: "bold"
    },
    logoutBtn: {
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 10,
        borderRadius: 12
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around"
    },
    statItem: {
        alignItems: "center"
    },
    statIconCircle: {
        backgroundColor: "rgba(255,255,255,0.15)",
        padding: 8,
        borderRadius: 50,
        marginBottom: 5
    },
    statValue: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold"
    },
    statLabel: {
        color: "white",
        fontSize: 10,
        opacity: 0.8
    },
    content: {
        paddingHorizontal: 20,
        marginTop: 20
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2c3e50",
        marginVertical: 10
    },
    incomeCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 3
    },
    incomeLabel: {
        color: "#858796",
        fontSize: 12
    },
    incomeValue: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1cc88a",
        marginTop: 5
    },
    incomeIconWrap: {
        backgroundColor: "#f0fff4",
        padding: 10,
        borderRadius: 12
    },
    chartCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        marginTop: 15,
        elevation: 2
    },
    chartTitle: {
        fontSize: 12,
        color: "#858796",
        marginBottom: 15,
        fontWeight: "600"
    },
    chartRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-around",
        height: 80
    },
    chartBarWrapper: {
        alignItems: "center"
    },
    chartBar: {
        width: 15,
        backgroundColor: "#4e73df",
        borderRadius: 4
    },
    chartMonth: {
        fontSize: 9,
        color: "#858796",
        marginTop: 5
    },
    horizontalMenu: {
        paddingVertical: 10
    },
    controlBtn: {
        alignItems: "center",
        marginRight: 20
    },
    iconWrap: {
        width: 55,
        height: 55,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3
    },
    controlText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#4e73df",
        marginTop: 5
    },
    flexRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    seeAll: {
        color: "#4e73df",
        fontSize: 12,
        fontWeight: "bold"
    },
    paymentItem: {
        backgroundColor: "white",
        padding: 15,
        borderRadius: 15,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        elevation: 1
    },
    payStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10
    },
    payName: {
        fontWeight: "bold",
        color: "#2c3e50",
        fontSize: 13
    },
    payDate: {
        color: "#858796",
        fontSize: 11
    },
    payAmount: {
        fontWeight: "bold",
        fontSize: 13,
        color: "#2c3e50"
    },
    emptyText: {
        textAlign: 'center',
        color: '#858796',
        fontSize: 12,
        marginVertical: 10
    },
    menuGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        width: '100%',
        gap: 15,
        paddingVertical: 10,
    },
    menuItemWrap: {
        // width: MENU_ITEM_WIDTH,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
    },
    menuIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3,
    },
    menuText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#4e73df",
        marginTop: 8,
        textAlign: "center",
        width: '100%',
        paddingHorizontal: 5,
    },
});