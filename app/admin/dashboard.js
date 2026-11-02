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
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../components/GlobalAlert";
import LoadingScreen from "../../components/LoadingScreen";
import api, { API_URL } from "../../helpers/api";
import { formatRupiah, getInitials } from "../../helpers/formatters";
import styles from "../../styles/adminDashboard.styles";

export default function AdminDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [stats, setStats] = useState(null);
    const [adminName, setAdminName] = useState("Admin Kost");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sendingReminderId, setSendingReminderId] = useState(null);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "info",
        confirmText: "OK",
        cancelText: "Batal",
        onConfirm: () => {},
    });

    const fetchAdminData = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const cleanToken = token ? token.replace(/"/g, "").trim() : "";
            if (!cleanToken) {
                await AsyncStorage.multiRemove(["userToken", "userData"]);
                router.replace("/");
                return;
            }
            const response = await axios.get(`${API_URL}/admin/stats`, {
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: "application/json",
                },
                timeout: 10000,
            });
            setStats(response.data);
        } catch (error) {
            console.log("Error Fetch Admin Stats:", error.response?.status, error.message);
            if (error.response?.status === 401) {
                await AsyncStorage.multiRemove(["userToken", "userData"]);
                router.replace("/");
                return;
            }
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
    }, [router]);

    useEffect(() => {
        AsyncStorage.getItem("userData").then((userStr) => {
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    if (u?.name) setAdminName(u.name);
                } catch {}
            }
        });
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

    const buildManualWaUrl = (tenant) => {
        const cleanPhone = tenant.phone ? tenant.phone.toString().replace(/\D/g, "") : "";
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

        return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    };

    const executeSendReminder = async (tenant) => {
        setAlertConfig((p) => ({ ...p, visible: false }));
        setSendingReminderId(tenant.id);

        try {
            const res = await api.post("/admin/send-reminder", {
                tenant_id: tenant.id,
                due_date: tenant.due_date,
                days_left: tenant.days_left,
            });

            if (res.data?.status === "success") {
                setAlertConfig({
                    visible: true,
                    title: "Berhasil Terkirim! 🎉",
                    message: res.data.message || `Pesan penagihan otomatis berhasil dikirim ke WhatsApp *${tenant.name}*.`,
                    type: "success",
                    confirmText: "OK",
                    onConfirm: () => setAlertConfig((p) => ({ ...p, visible: false })),
                });
            } else {
                throw new Error(res.data?.message || "Gagal mengirim pengingat tagihan.");
            }
        } catch (error) {
            console.log("Send reminder error:", error);
            const errMsg = error.response?.data?.message || error.message || "Gagal terhubung ke WhatsApp Gateway.";
            const waUrl = error.response?.data?.wa_url || buildManualWaUrl(tenant);

            setAlertConfig({
                visible: true,
                title: "Gateway Tidak Terhubung",
                message: `${errMsg}\n\nIngin membuka aplikasi WhatsApp secara manual di HP Anda?`,
                type: "warning",
                confirmText: "Buka WA Manual",
                cancelText: "Batal",
                onConfirm: () => {
                    setAlertConfig((p) => ({ ...p, visible: false }));
                    Linking.openURL(waUrl).catch(() => {
                        Alert.alert("Error", "Gagal membuka aplikasi WhatsApp.");
                    });
                },
            });
        } finally {
            setSendingReminderId(null);
        }
    };

    const handleSendReminder = (tenant) => {
        if (!tenant.phone) {
            return setAlertConfig({
                visible: true,
                title: "Nomor Tidak Ada",
                message: `Nomor telepon penghuni *${tenant.name}* belum terdaftar di sistem.`,
                type: "error",
                confirmText: "OK",
                onConfirm: () => setAlertConfig((p) => ({ ...p, visible: false })),
            });
        }

        const days = tenant.days_left;
        const dueDesc =
            days < 0
                ? `telah telat *${Math.abs(days)} hari*`
                : days === 0
                ? `jatuh tempo *HARI INI*`
                : `akan jatuh tempo dalam *${days} hari lagi*`;

        setAlertConfig({
            visible: true,
            title: "Kirim Tagihan Otomatis?",
            message: `Kirim pesan WhatsApp pengingat tagihan otomatis ke *${tenant.name}* (Kamar ${tenant.room})?\n\nStatus: ${dueDesc}\nTotal: *${formatRupiah(tenant.price)}*`,
            type: "confirmation",
            confirmText: "Ya",
            cancelText: "Batal",
            onConfirm: () => executeSendReminder(tenant),
        });
    };

    if (loading) {
        return (
            <LoadingScreen
                title="Dashboard"
                message="Memuat data..."
                icon="home-outline"
            />
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
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <View style={styles.tagWrap}>
                                <View style={styles.tagDot} />
                                <Text style={styles.adminTag}>Serrata Kost • Pengelola</Text>
                            </View>
                            <Text style={styles.greetingText}>Selamat Datang,</Text>
                            <Text style={styles.userName} numberOfLines={1}>
                                {stats?.admin_name || adminName || "Admin Kost"} 👋
                            </Text>
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
                                                <Ionicons name="bed-outline" size={14} color="#64748b" />
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
                                            style={[styles.remindWaBtn, sendingReminderId === t.id && { opacity: 0.7 }]}
                                            onPress={() => handleSendReminder(t)}
                                            activeOpacity={0.8}
                                            disabled={sendingReminderId === t.id}
                                        >
                                            {sendingReminderId === t.id ? (
                                                <ActivityIndicator size="small" color="#ffffff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="logo-whatsapp" size={15} color="#ffffff" />
                                                    <Text style={styles.remindWaBtnText}>Tagih</Text>
                                                </>
                                            )}
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
                                            <Ionicons name="bed-outline" size={14} color="#64748b" />
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
                                            <Ionicons name={statusIcon} size={13} color={statusColor} />
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
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </View>
    );
}

const ControlBtn = ({ title, subtitle, icon, color, bgColor, badgeCount = 0, onPress }) => (
    <TouchableOpacity style={styles.menuItemWrap} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.menuIconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={24} color={color} />
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
