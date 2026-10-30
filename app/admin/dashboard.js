import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
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
import { formatRupiah, getInitials } from "../../helpers/formatters";

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
                vacant_rooms_list: [],
                pending_payments: 0,
                pending_complaints: 0,
                monthly_income: 0,
                monthly_expense: 0,
                net_profit: 0,
                total_arrears: 0,
                unpaid_tenants_count: 0,
                due_tenants: [],
                active_complaints_list: [],
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

    const handleSendReminder = (tenant) => {
        if (!tenant.phone) {
            return Alert.alert("Nomor Tidak Ada", "Nomor telepon penghuni ini belum terdaftar.");
        }

        const cleanPhone = tenant.phone.toString().replace(/\D/g, "");
        const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
        const days = tenant.days_left;
        const dueText =
            days < 0
                ? `telah *MELEWATI JATUH TEMPO* selama *${Math.abs(days)} hari* (Tanggal tempo: ${tenant.due_date})`
                : days === 0
                ? `jatuh tempo *HARI INI* (${tenant.due_date})`
                : `akan jatuh tempo dalam *${days} hari lagi* (${tenant.due_date})`;

        const message =
            `Halo Kak *${tenant.name}*! 👋\n\n` +
            `Kami dari pengelola Serrata Kost menginformasikan bahwa tagihan sewa kos untuk *Kamar ${tenant.room}* ${dueText}.\n\n` +
            `• *Total Tagihan:* *${formatRupiah(tenant.price)}*\n\n` +
            `Mohon untuk segera melakukan pembayaran atau konfirmasi jika sudah melakukan transfer ya Kak.\n\n` +
            `Terima kasih banyak atas kerjasamanya! 🙏✨`;

        const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            Alert.alert("Error", "Gagal membuka aplikasi WhatsApp.");
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Memuat Dashboard...</Text>
            </View>
        );
    }

    const totalRooms = stats?.total_rooms || 0;
    const occupiedRooms = stats?.occupied_rooms || 0;
    const vacantRooms = stats?.vacant_rooms || 0;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const pendingPayments = stats?.pending_payments || 0;
    const pendingComplaints = stats?.pending_complaints || 0;
    const hasPendingAction = pendingPayments > 0 || pendingComplaints > 0;
    const dueTenants = stats?.due_tenants || [];
    const activeComplaints = stats?.active_complaints_list || [];
    const vacantRoomsList = stats?.vacant_rooms_list || [];

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
                        colors={["#2563eb"]}
                        tintColor="#ffffff"
                    />
                }
            >
                {/* MODERN HEADER */}
                <LinearGradient
                    colors={["#0f172a", "#1e293b", "#1e3a8a"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 16 }]}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <View style={styles.tagWrap}>
                                <View style={styles.tagDot} />
                                <Text style={styles.adminTag}>Serrata Kost • Pengelola</Text>
                            </View>
                            <Text style={styles.userName}>Owner Dashboard 👋</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.logoutBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#f8fafc" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* CARD 1: FINANCIAL & CASHFLOW OVERVIEW */}
                    <View style={styles.financeCard}>
                        {/* Top: Header Row with Icon & Action */}
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.cardHeaderLeft}>
                                <View style={styles.cardHeaderIconWrap}>
                                    <Ionicons name="wallet-outline" size={16} color="#059669" />
                                </View>
                                <Text style={styles.cardHeaderTitle}>Kinerja Keuangan</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push("/admin/finances")}
                                style={styles.cardHeaderAction}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cardHeaderActionText}>Buku Kas ›</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Laba Bersih Big Stat */}
                        <View style={styles.netProfitSection}>
                            <Text style={styles.netProfitLabel}>Laba Bersih Bulan Ini</Text>
                            <Text
                                style={[
                                    styles.netProfitAmount,
                                    { color: (stats?.net_profit || 0) >= 0 ? "#059669" : "#dc2626" },
                                ]}
                            >
                                {formatRupiah(stats?.net_profit || 0)}
                            </Text>
                        </View>

                        {/* Income & Expense Breakdown Chips */}
                        <View style={styles.cashflowRow}>
                            <View style={styles.cashflowChipIn}>
                                <Ionicons name="arrow-down-circle" size={16} color="#10b981" />
                                <View style={{ marginLeft: 6 }}>
                                    <Text style={styles.cashflowLabel}>Pemasukan</Text>
                                    <Text style={styles.cashflowValIn}>
                                        {formatRupiah(stats?.monthly_income || 0)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.cashflowChipOut}>
                                <Ionicons name="arrow-up-circle" size={16} color="#ef4444" />
                                <View style={{ marginLeft: 6 }}>
                                    <Text style={styles.cashflowLabel}>Pengeluaran</Text>
                                    <Text style={styles.cashflowValOut}>
                                        {formatRupiah(stats?.monthly_expense || 0)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Piutang Sewa Banner if Any */}
                        {stats?.total_arrears > 0 ? (
                            <View style={styles.arrearsAlertBox}>
                                <Ionicons name="warning-outline" size={16} color="#d97706" />
                                <Text style={styles.arrearsAlertText}>
                                    Piutang Sewa:{" "}
                                    <Text style={{ fontWeight: "bold" }}>
                                        {formatRupiah(stats.total_arrears)}
                                    </Text>{" "}
                                    ({stats.unpaid_tenants_count} penghuni belum lunas)
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* CARD 2: ROOM OCCUPANCY & CAPACITY */}
                    <View style={styles.occupancyCard}>
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.cardHeaderLeft}>
                                <View style={[styles.cardHeaderIconWrap, { backgroundColor: "#eef2ff" }]}>
                                    <Ionicons name="bed-outline" size={16} color="#4f46e5" />
                                </View>
                                <Text style={styles.cardHeaderTitle}>Status Okupansi Kamar</Text>
                            </View>
                            <View style={styles.ratePill}>
                                <Text style={styles.ratePillText}>{occupancyRate}% Terisi</Text>
                            </View>
                        </View>

                        {/* Progress bar */}
                        <View style={styles.progressBarTrack}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${Math.min(occupancyRate, 100)}%` },
                                ]}
                            />
                        </View>

                        {/* Stats 3 Columns (Clickable to respective modules) */}
                        <View style={styles.occupancyColsRow}>
                            <TouchableOpacity
                                style={styles.occCol}
                                onPress={() => router.push("/admin/room")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.occColVal}>{totalRooms}</Text>
                                <Text style={styles.occColLabel}>Total Kamar</Text>
                            </TouchableOpacity>
                            <View style={styles.occColDivider} />
                            <TouchableOpacity
                                style={styles.occCol}
                                onPress={() => router.push("/admin/tenant")}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.occColVal, { color: "#10b981" }]}>
                                    {occupiedRooms}
                                </Text>
                                <Text style={styles.occColLabel}>Kamar Terisi</Text>
                            </TouchableOpacity>
                            <View style={styles.occColDivider} />
                            <TouchableOpacity
                                style={styles.occCol}
                                onPress={() => router.push("/admin/room")}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.occColVal, { color: "#f59e0b" }]}>
                                    {vacantRooms}
                                </Text>
                                <Text style={styles.occColLabel}>Kamar Kosong</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ATTENTION BANNER IF PENDING TASKS EXIST */}
                    {hasPendingAction ? (
                        <TouchableOpacity
                            style={styles.alertBanner}
                            onPress={() => {
                                if (pendingPayments > 0) {
                                    router.push("/admin/verify");
                                } else {
                                    router.push("/admin/complaint");
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={styles.alertIconCircle}>
                                <Ionicons name="notifications" size={18} color="#ef4444" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.alertBannerTitle}>Perlu Tindakan Anda</Text>
                                <Text style={styles.alertBannerSub}>
                                    {pendingPayments > 0 ? `${pendingPayments} pembayaran menunggu verifikasi` : ""}
                                    {pendingPayments > 0 && pendingComplaints > 0 ? " • " : ""}
                                    {pendingComplaints > 0 ? `${pendingComplaints} komplain aktif` : ""}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    ) : null}

                    {/* MENU MANAJEMEN */}
                    <Text style={styles.sectionTitle}>Menu Manajemen</Text>
                    <View style={styles.menuGrid}>
                        <ControlBtn
                            title="Catat Bayar"
                            subtitle="Input manual"
                            icon="cash-outline"
                            color="#10b981"
                            bgColor="#ecfdf5"
                            onPress={() => router.push("/admin/payment/create")}
                        />
                        <ControlBtn
                            title="Verifikasi"
                            subtitle="Bukti transfer"
                            icon="shield-checkmark-outline"
                            color="#ef4444"
                            bgColor="#fef2f2"
                            badgeCount={pendingPayments}
                            onPress={() => router.push("/admin/verify")}
                        />
                        <ControlBtn
                            title="Komplain"
                            subtitle="Laporan keluhan"
                            icon="chatbubbles-outline"
                            color="#f59e0b"
                            bgColor="#fffbeb"
                            badgeCount={pendingComplaints}
                            onPress={() => router.push("/admin/complaint")}
                        />
                        <ControlBtn
                            title="Penghuni"
                            subtitle="Daftar sewa"
                            icon="people-outline"
                            color="#0284c7"
                            bgColor="#f0f9ff"
                            onPress={() => router.push("/admin/tenant")}
                        />
                        <ControlBtn
                            title="Kamar"
                            subtitle="Data kamar"
                            icon="bed-outline"
                            color="#6366f1"
                            bgColor="#eef2ff"
                            onPress={() => router.push("/admin/room")}
                        />
                        <ControlBtn
                            title="Keuangan"
                            subtitle="Buku kas kost"
                            icon="pie-chart-outline"
                            color="#8b5cf6"
                            bgColor="#f5f3ff"
                            onPress={() => router.push("/admin/finances")}
                        />
                    </View>

                    {/* SECTION 1: TAGIHAN JATUH TEMPO & NUNGGAK */}
                    <View style={styles.flexRow}>
                        <Text style={styles.sectionTitle}>Pengingat Jatuh Tempo</Text>
                        {dueTenants.length > 0 ? (
                            <View style={styles.dueBadgePill}>
                                <Text style={styles.dueBadgePillText}>
                                    {dueTenants.length} Tagihan
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {dueTenants.length > 0 ? (
                        <View style={styles.dueCardContainer}>
                            {dueTenants.map((t, idx) => {
                                const isOverdue = t.days_left < 0;
                                const isToday = t.days_left === 0;
                                const tagColor = isOverdue ? "#ef4444" : isToday ? "#f59e0b" : "#3b82f6";
                                const tagBg = isOverdue ? "#fef2f2" : isToday ? "#fffbeb" : "#eff6ff";

                                return (
                                    <View key={t.uuid || idx} style={styles.dueItemCard}>
                                        <View style={{ flex: 1, paddingRight: 8 }}>
                                            <View style={styles.dueItemTopRow}>
                                                <Text style={styles.dueItemName} numberOfLines={1}>
                                                    {t.name}
                                                </Text>
                                                <View style={[styles.dueStatusPill, { backgroundColor: tagBg }]}>
                                                    <Text style={[styles.dueStatusText, { color: tagColor }]}>
                                                        {t.status_label}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.dueItemSubRow}>
                                                <Ionicons name="bed-outline" size={12} color="#64748b" />
                                                <Text style={styles.dueItemSubText}>Kamar {t.room}</Text>
                                                <Text style={styles.dueItemDot}>•</Text>
                                                <Text style={styles.dueItemAmountText}>
                                                    {formatRupiah(t.price)}
                                                </Text>
                                                <Text style={styles.dueItemDot}>•</Text>
                                                <Text style={styles.dueItemSubText}>Tempo: {t.due_date}</Text>
                                            </View>
                                        </View>

                                        {/* Direct WhatsApp Reminder Button */}
                                        <TouchableOpacity
                                            style={styles.remindWaBtn}
                                            onPress={() => handleSendReminder(t)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                                            <Text style={styles.remindWaBtnText}>Tagih</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyDueCard}>
                            <Ionicons name="checkmark-done-circle" size={28} color="#10b981" />
                            <Text style={styles.emptyDueText}>Semua penghuni telah lunas untuk periode ini!</Text>
                        </View>
                    )}

                    {/* SECTION 2: KELUHAN FASILITAS AKTIF */}
                    <View style={styles.flexRow}>
                        <Text style={styles.sectionTitle}>Keluhan & Perbaikan Aktif</Text>
                        <TouchableOpacity onPress={() => router.push("/admin/complaint")} activeOpacity={0.7}>
                            <Text style={styles.seeAll}>Lihat Semua ›</Text>
                        </TouchableOpacity>
                    </View>

                    {activeComplaints.length > 0 ? (
                        <View style={styles.complaintContainer}>
                            {activeComplaints.map((c, idx) => (
                                <TouchableOpacity
                                    key={c.uuid || idx}
                                    style={styles.complaintCard}
                                    onPress={() => router.push(`/admin/complaint/${c.uuid || c.id}`)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.complaintIconWrap}>
                                        <Ionicons name="construct-outline" size={18} color="#f59e0b" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.complaintTitle} numberOfLines={1}>
                                            {c.title}
                                        </Text>
                                        <Text style={styles.complaintSub}>
                                            Kamar {c.room} • {c.tenant_name} • {c.created_at}
                                        </Text>
                                    </View>
                                    <View style={styles.complaintBadge}>
                                        <Text style={styles.complaintBadgeText}>
                                            {c.status === "in_progress" ? "Proses" : "Open"}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptySubCard}>
                            <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
                            <Text style={styles.emptySubText}>Tidak ada keluhan fasilitas yang aktif.</Text>
                        </View>
                    )}

                    {/* SECTION 3: KAMAR KOSONG SIAP HUNI */}
                    <View style={styles.flexRow}>
                        <Text style={styles.sectionTitle}>Kamar Kosong Siap Huni</Text>
                        <TouchableOpacity onPress={() => router.push("/admin/room")} activeOpacity={0.7}>
                            <Text style={styles.seeAll}>Kelola Kamar ›</Text>
                        </TouchableOpacity>
                    </View>

                    {vacantRoomsList.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.vacantRoomsScroll}
                        >
                            {vacantRoomsList.map((r, idx) => (
                                <TouchableOpacity
                                    key={r.uuid || idx}
                                    style={styles.vacantRoomCard}
                                    onPress={() => router.push("/admin/room")}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.vacantRoomHeader}>
                                        <Ionicons name="bed-outline" size={18} color="#6366f1" />
                                        <View style={styles.vacantBadge}>
                                            <Text style={styles.vacantBadgeText}>Kosong</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.vacantRoomNum}>Kamar {r.room_number}</Text>
                                    <Text style={styles.vacantRoomPrice}>{formatRupiah(r.price)}</Text>
                                    <Text style={styles.vacantRoomType} numberOfLines={1}>
                                        {r.type ? r.type.toUpperCase() : "STANDARD"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptySubCard}>
                            <Ionicons name="business-outline" size={24} color="#64748b" />
                            <Text style={styles.emptySubText}>Semua kamar terisi penuh!</Text>
                        </View>
                    )}

                    {/* SECTION 4: PEMBAYARAN TERBARU */}
                    <View style={styles.flexRow}>
                        <Text style={styles.sectionTitle}>Pembayaran Terbaru</Text>
                        <TouchableOpacity onPress={() => router.push("/admin/verify")} activeOpacity={0.7}>
                            <Text style={styles.seeAll}>Lihat Semua ›</Text>
                        </TouchableOpacity>
                    </View>

                    {stats?.payment_history?.length > 0 ? (
                        stats.payment_history.map((pay, index) => {
                            const statusLower = (pay.status || "").toLowerCase();
                            const isSuccess =
                                statusLower === "paid" ||
                                statusLower === "success" ||
                                statusLower === "lunas" ||
                                statusLower === "approved";
                            const isPending =
                                statusLower === "pending" || statusLower === "waiting";

                            const statusColor = isSuccess
                                ? "#10b981"
                                : isPending
                                ? "#f59e0b"
                                : "#ef4444";
                            const statusBg = isSuccess
                                ? "#ecfdf5"
                                : isPending
                                ? "#fffbeb"
                                : "#fef2f2";
                            const statusLabel = isSuccess
                                ? "Lunas"
                                : isPending
                                ? "Menunggu"
                                : "Ditolak";
                            const statusIcon = isSuccess
                                ? "checkmark-circle"
                                : isPending
                                ? "time"
                                : "close-circle";

                            const initials = getInitials(pay.name);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.paymentItem}
                                    onPress={() => router.push("/admin/verify")}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.payAvatar}>
                                        <Text style={styles.payAvatarText}>{initials}</Text>
                                    </View>
                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                        <Text style={styles.payName} numberOfLines={1}>
                                            {pay.name}
                                        </Text>
                                        <View style={styles.paySubRow}>
                                            <Ionicons name="bed-outline" size={12} color="#64748b" />
                                            <Text style={styles.paySubText}>Kamar {pay.room}</Text>
                                            <Text style={styles.paySubDot}>•</Text>
                                            <Text style={styles.paySubText}>{pay.date}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={styles.payAmount}>
                                            {formatRupiah(pay.amount)}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                            <Ionicons name={statusIcon} size={11} color={statusColor} />
                                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                                {statusLabel}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
                            <Text style={styles.emptyText}>
                                Transaksi pembayaran terbaru akan otomatis muncul di sini.
                            </Text>
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

const ControlBtn = ({ title, subtitle, icon, color, bgColor, badgeCount = 0, onPress }) => (
    <TouchableOpacity style={styles.menuItemWrap} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.menuIconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={22} color={color} />
            {badgeCount > 0 ? (
                <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
                </View>
            ) : null}
        </View>
        <Text style={styles.menuText} numberOfLines={1}>
            {title}
        </Text>
        {subtitle ? (
            <Text style={styles.menuSubText} numberOfLines={1}>
                {subtitle}
            </Text>
        ) : null}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    loadingWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    loadingText: {
        marginTop: 12,
        color: "#64748b",
        fontSize: 14,
        fontWeight: "500",
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 36,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    tagWrap: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#38bdf8",
        marginRight: 6,
    },
    adminTag: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    userName: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "bold",
    },
    logoutBtn: {
        backgroundColor: "rgba(255,255,255,0.12)",
        padding: 9,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    content: {
        paddingHorizontal: 20,
        marginTop: -20,
    },
    /* CARD 1: FINANCE */
    financeCard: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#0f172a",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        marginBottom: 12,
    },
    /* CARD 2: OCCUPANCY */
    occupancyCard: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#0f172a",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
        marginBottom: 14,
    },
    cardHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    cardHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    cardHeaderIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: "#ecfdf5",
        justifyContent: "center",
        alignItems: "center",
    },
    cardHeaderTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1e293b",
    },
    cardHeaderAction: {
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    cardHeaderActionText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2563eb",
    },
    netProfitSection: {
        marginVertical: 4,
    },
    netProfitLabel: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: "500",
    },
    netProfitAmount: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 2,
        letterSpacing: -0.5,
    },
    cashflowRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 10,
    },
    cashflowChipIn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
        borderWidth: 1,
        borderColor: "#bbf7d0",
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    cashflowChipOut: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecdd3",
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    cashflowLabel: {
        fontSize: 10,
        color: "#64748b",
        fontWeight: "600",
    },
    cashflowValIn: {
        fontSize: 11,
        fontWeight: "700",
        color: "#15803d",
        marginTop: 1,
    },
    cashflowValOut: {
        fontSize: 11,
        fontWeight: "700",
        color: "#b91c1c",
        marginTop: 1,
    },
    ratePill: {
        backgroundColor: "#ecfdf5",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    ratePillText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#059669",
    },
    progressBarTrack: {
        height: 7,
        backgroundColor: "#f1f5f9",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 12,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#10b981",
        borderRadius: 4,
    },
    occupancyColsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f8fafc",
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    occCol: {
        alignItems: "center",
        flex: 1,
    },
    occColDivider: {
        width: 1,
        height: 24,
        backgroundColor: "#e2e8f0",
    },
    occColVal: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0f172a",
    },
    occColLabel: {
        fontSize: 10,
        color: "#64748b",
        marginTop: 2,
        fontWeight: "500",
    },
    arrearsAlertBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fffbeb",
        borderWidth: 1,
        borderColor: "#fde68a",
        borderRadius: 10,
        paddingVertical: 7,
        paddingHorizontal: 10,
        marginTop: 10,
        gap: 6,
    },
    arrearsAlertText: {
        fontSize: 11,
        color: "#92400e",
        flex: 1,
    },
    alertBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff1f2",
        borderWidth: 1,
        borderColor: "#fecdd3",
        borderRadius: 16,
        padding: 12,
        marginBottom: 14,
    },
    alertIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#ffe4e6",
        justifyContent: "center",
        alignItems: "center",
    },
    alertBannerTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#9f1239",
    },
    alertBannerSub: {
        fontSize: 11,
        color: "#be123c",
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
        marginTop: 8,
    },
    flexRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    seeAll: {
        fontSize: 12,
        color: "#2563eb",
        fontWeight: "600",
    },
    dueBadgePill: {
        backgroundColor: "#fee2e2",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    dueBadgePillText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#dc2626",
    },
    dueCardContainer: {
        gap: 8,
        marginBottom: 8,
    },
    dueItemCard: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    dueItemTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dueItemName: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
        flex: 1,
    },
    dueStatusPill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    dueStatusText: {
        fontSize: 10,
        fontWeight: "700",
    },
    dueItemSubRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    dueItemSubText: {
        fontSize: 11,
        color: "#64748b",
        marginLeft: 3,
    },
    dueItemDot: {
        fontSize: 11,
        color: "#cbd5e1",
        marginHorizontal: 4,
    },
    dueItemAmountText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#0f172a",
    },
    remindWaBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#25D366",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 4,
        elevation: 1,
    },
    remindWaBtnText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "bold",
    },
    emptyDueCard: {
        backgroundColor: "#f0fdf4",
        borderWidth: 1,
        borderColor: "#bbf7d0",
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },
    emptyDueText: {
        fontSize: 12,
        color: "#15803d",
        fontWeight: "600",
        flex: 1,
    },
    complaintContainer: {
        gap: 8,
        marginBottom: 8,
    },
    complaintCard: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    complaintIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#fffbeb",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#fde68a",
    },
    complaintTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
    },
    complaintSub: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    complaintBadge: {
        backgroundColor: "#fef3c7",
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    complaintBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#b45309",
    },
    emptySubCard: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    vacantRoomsScroll: {
        gap: 10,
        paddingBottom: 4,
    },
    vacantRoomCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 14,
        width: 140,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#0f172a",
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    vacantRoomHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    vacantBadge: {
        backgroundColor: "#e0e7ff",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    vacantBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        color: "#4338ca",
    },
    vacantRoomNum: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0f172a",
    },
    vacantRoomPrice: {
        fontSize: 12,
        fontWeight: "700",
        color: "#10b981",
        marginTop: 2,
    },
    vacantRoomType: {
        fontSize: 10,
        color: "#94a3b8",
        marginTop: 4,
        fontWeight: "600",
    },
    menuGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    menuItemWrap: {
        width: "31%",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 6,
        alignItems: "center",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#0f172a",
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
        position: "relative",
    },
    badgePill: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#ef4444",
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: "#ffffff",
    },
    badgePillText: {
        color: "#ffffff",
        fontSize: 9,
        fontWeight: "bold",
    },
    menuText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1e293b",
        textAlign: "center",
    },
    menuSubText: {
        fontSize: 9,
        color: "#94a3b8",
        marginTop: 2,
        textAlign: "center",
    },
    paymentItem: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    payAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    payAvatarText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#334155",
    },
    payName: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
    },
    paySubRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    paySubText: {
        fontSize: 11,
        color: "#64748b",
        marginLeft: 3,
    },
    paySubDot: {
        fontSize: 11,
        color: "#cbd5e1",
        marginHorizontal: 4,
    },
    payAmount: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f172a",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 3,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: "700",
    },
    emptyCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
        marginTop: 8,
    },
    emptyText: {
        color: "#94a3b8",
        fontSize: 12,
        marginTop: 4,
        textAlign: "center",
    },
});
