import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../components/GlobalAlert";
import { API_URL } from "../../helpers/api";
import { formatRupiah } from "../../helpers/formatters";

export default function AdminDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: () => {},
    });

    const fetchAdminData = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const cleanToken = token ? token.replace(/"/g, "").trim() : "";
            const response = await axios.get(`${API_URL}/admin/stats`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: "application/json",
                },
                timeout: 10000,
            });
            setStats(response.data);
        } catch (error) {
            console.log("Error Fetch Admin Stats:", error.message);
            setStats({
                total_rooms: 0,
                occupied_rooms: 0,
                vacant_rooms: 0,
                monthly_income: 0,
                monthly_reports: [],
                payment_history: [],
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const handleLogout = () => {
        setAlertConfig({
            visible: true,
            title: "Konfirmasi Keluar",
            message: "Apakah Anda yakin ingin keluar dari akun administrator?",
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
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#b21f1f" />
                <Text style={styles.loadingText}>Memuat Dashboard...</Text>
            </View>
        );
    }

    const maxReportAmount = stats?.monthly_reports?.length > 0
        ? Math.max(...stats.monthly_reports.map((o) => o.amount), 1)
        : 1000000;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchAdminData();
                        }}
                        colors={["#b21f1f"]}
                        tintColor="#ffffff"
                    />
                }
            >
                {/* HEADER */}
                <LinearGradient
                    colors={["#1a2a6c", "#2a5298", "#b21f1f"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 20 }]}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.adminTag}>Serrata Kost • Pengelola</Text>
                            <Text style={styles.userName}>Owner Dashboard 👋</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.logoutBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="log-out-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* STATS ROW */}
                    <View style={styles.statsCardWrapper}>
                        <View style={styles.statsRow}>
                            <StatItem
                                label="Total Kamar"
                                value={stats?.total_rooms || 0}
                                icon="business"
                                color="#4e73df"
                            />
                            <View style={styles.statDivider} />
                            <StatItem
                                label="Terisi"
                                value={stats?.occupied_rooms || 0}
                                icon="people"
                                color="#1cc88a"
                            />
                            <View style={styles.statDivider} />
                            <StatItem
                                label="Kosong"
                                value={stats?.vacant_rooms || 0}
                                icon="log-out"
                                color="#f6c23e"
                            />
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* INCOME SUMMARY */}
                    <Text style={styles.sectionTitle}>Ringkasan Keuangan</Text>
                    <View style={styles.incomeCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.incomeLabel}>Pendapatan Bulan Ini</Text>
                            <Text style={styles.incomeValue}>
                                {formatRupiah(stats?.monthly_income || 0)}
                            </Text>
                        </View>
                        <View style={styles.incomeIconWrap}>
                            <Ionicons name="trending-up" size={26} color="#10b981" />
                        </View>
                    </View>

                    {/* CHART */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Ionicons name="bar-chart-outline" size={18} color="#4e73df" />
                            <Text style={styles.chartTitle}>Tren Pendapatan (5 Bulan)</Text>
                        </View>
                        <View style={styles.chartRow}>
                            {stats?.monthly_reports?.length > 0 ? (
                                stats.monthly_reports.map((item, index) => {
                                    const heightRatio = Math.max((item.amount / maxReportAmount) * 70, 6);
                                    const formattedMil = item.amount > 0 ? (item.amount / 1000000).toFixed(1) + "M" : "0";
                                    return (
                                        <View key={index} style={styles.chartBarWrapper}>
                                            <Text style={styles.chartBarValue}>{formattedMil}</Text>
                                            <View style={[styles.chartBar, { height: heightRatio }]} />
                                            <Text style={styles.chartMonth}>{item.month}</Text>
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={styles.emptyText}>Data grafik belum tersedia</Text>
                            )}
                        </View>
                    </View>

                    {/* MANAJEMEN MENU */}
                    <Text style={styles.sectionTitle}>Menu Manajemen</Text>
                    <View style={styles.menuGrid}>
                        <ControlBtn
                            title="Catat Bayar"
                            icon="cash-outline"
                            color="#10b981"
                            bgColor="#ecfdf5"
                            onPress={() => router.push("/admin/payment/create")}
                        />
                        <ControlBtn
                            title="Verifikasi"
                            icon="shield-checkmark-outline"
                            color="#ef4444"
                            bgColor="#fef2f2"
                            onPress={() => router.push("/admin/verify")}
                        />
                        <ControlBtn
                            title="Komplain"
                            icon="chatbubbles-outline"
                            color="#f59e0b"
                            bgColor="#fffbeb"
                            onPress={() => router.push("/admin/complaint")}
                        />
                        <ControlBtn
                            title="Penghuni"
                            icon="people-outline"
                            color="#06b6d4"
                            bgColor="#ecfeff"
                            onPress={() => router.push("/admin/tenant")}
                        />
                        <ControlBtn
                            title="Kamar"
                            icon="bed-outline"
                            color="#6366f1"
                            bgColor="#eef2ff"
                            onPress={() => router.push("/admin/room")}
                        />
                        <ControlBtn
                            title="Keuangan"
                            icon="pie-chart-outline"
                            color="#8b5cf6"
                            bgColor="#f5f3ff"
                            onPress={() => router.push("/admin/finances")}
                        />
                    </View>

                    {/* PEMBAYARAN TERBARU */}
                    <View style={styles.flexRow}>
                        <Text style={styles.sectionTitle}>Pembayaran Terbaru</Text>
                        <TouchableOpacity onPress={() => router.push("/admin/verify")}>
                            <Text style={styles.seeAll}>Lihat Semua ›</Text>
                        </TouchableOpacity>
                    </View>

                    {stats?.payment_history?.length > 0 ? (
                        stats.payment_history.map((pay, index) => {
                            const statusLower = (pay.status || "").toLowerCase();
                            const isSuccess = statusLower === "paid" || statusLower === "success" || statusLower === "lunas";
                            const isPending = statusLower === "pending";

                            const statusColor = isSuccess ? "#10b981" : isPending ? "#f59e0b" : "#ef4444";
                            const statusBg = isSuccess ? "#ecfdf5" : isPending ? "#fffbeb" : "#fef2f2";
                            const statusLabel = isSuccess ? "Lunas" : isPending ? "Pending" : "Ditolak";

                            return (
                                <View key={index} style={styles.paymentItem}>
                                    <View style={[styles.payStatusLine, { backgroundColor: statusColor }]} />
                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text style={styles.payName} numberOfLines={1}>
                                            {pay.name}
                                        </Text>
                                        <Text style={styles.paySub}>
                                            Kamar {pay.room} • {pay.date}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={styles.payAmount}>
                                            {formatRupiah(pay.amount)}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                                {statusLabel}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="receipt-outline" size={36} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Belum ada riwayat transaksi terbaru</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <GlobalAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </View>
    );
}

const StatItem = ({ label, value, icon, color }) => (
    <View style={styles.statItem}>
        <View style={[styles.statIconCircle, { backgroundColor: color + "15" }]}>
            <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const ControlBtn = ({ title, icon, color, bgColor, onPress }) => (
    <TouchableOpacity style={styles.menuItemWrap} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.menuIconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.menuText} numberOfLines={1}>
            {title}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fc",
    },
    loadingWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fc",
    },
    loadingText: {
        marginTop: 12,
        color: "#64748b",
        fontSize: 14,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },
    adminTag: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    userName: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 2,
    },
    logoutBtn: {
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 8,
        borderRadius: 12,
    },
    statsCardWrapper: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: "#e2e8f0",
    },
    statIconCircle: {
        padding: 8,
        borderRadius: 20,
        marginBottom: 4,
    },
    statValue: {
        color: "#1e293b",
        fontSize: 18,
        fontWeight: "bold",
    },
    statLabel: {
        color: "#64748b",
        fontSize: 11,
        marginTop: 2,
        fontWeight: "500",
    },
    content: {
        paddingHorizontal: 20,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        marginVertical: 12,
    },
    flexRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    seeAll: {
        fontSize: 13,
        color: "#4e73df",
        fontWeight: "600",
    },
    incomeCard: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    incomeLabel: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "500",
    },
    incomeValue: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#10b981",
        marginTop: 4,
    },
    incomeIconWrap: {
        backgroundColor: "#ecfdf5",
        padding: 12,
        borderRadius: 14,
    },
    chartCard: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 18,
        marginTop: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    chartHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
        marginLeft: 8,
    },
    chartRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 110,
        paddingTop: 10,
    },
    chartBarWrapper: {
        alignItems: "center",
        flex: 1,
    },
    chartBarValue: {
        fontSize: 10,
        color: "#94a3b8",
        fontWeight: "600",
        marginBottom: 6,
    },
    chartBar: {
        width: 22,
        backgroundColor: "#4e73df",
        borderRadius: 6,
    },
    chartMonth: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 8,
        fontWeight: "500",
    },
    menuGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    menuItemWrap: {
        width: "31%",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    menuIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    menuText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
        textAlign: "center",
    },
    paymentItem: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        position: "relative",
        overflow: "hidden",
    },
    payStatusLine: {
        width: 4,
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
    },
    payName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1e293b",
        marginLeft: 8,
    },
    paySub: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 3,
        marginLeft: 8,
    },
    payAmount: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1e293b",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 4,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    emptyCard: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
    },
    emptyText: {
        color: "#94a3b8",
        fontSize: 13,
        marginTop: 8,
    },
});
