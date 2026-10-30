import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
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

export default function TenantDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";

      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });

      setData(response.data);
    } catch (error) {
      console.log("Error Fetch Tenant Dashboard:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    setAlertConfig({
      visible: true,
      title: "Konfirmasi Keluar",
      message: "Apakah Anda yakin ingin keluar dari akun penghuni?",
      type: "confirmation",
      onConfirm: async () => {
        await AsyncStorage.multiRemove(["userToken", "userData"]);
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        router.replace("/");
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Memuat Informasi Penghuni...</Text>
      </View>
    );
  }

  const paymentStatus = (data?.payment_status || "Belum Bayar").toLowerCase();
  const isLunas = paymentStatus === "lunas" || paymentStatus === "paid";
  const isPending = paymentStatus === "pending" || paymentStatus === "waiting";

  const getStatusColor = () => {
    if (isLunas) return "#10b981";
    if (isPending) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
            tintColor="#ffffff"
          />
        }
      >
        {/* HEADER GRADIENT */}
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#1e3a8a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Selamat Datang,</Text>
              <Text style={styles.userName}>{data?.name || "Penghuni"}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* ROOM & DUE DATE CARD */}
          <View style={styles.roomCard}>
            <View style={styles.roomInfo}>
              <Ionicons name="bed" size={20} color="#4e73df" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.roomLabel}>Nomor Kamar</Text>
                <Text style={styles.roomText}>Kamar {data?.room_number || "-"}</Text>
              </View>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.roomInfo}>
              <Ionicons
                name="calendar"
                size={20}
                color={isLunas ? "#10b981" : "#ef4444"}
              />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.roomLabel}>Jatuh Tempo</Text>
                <Text style={styles.roomText}>{data?.due_date || "-"}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* TAGIHAN CARD */}
          <Text style={styles.sectionTitle}>Status Tagihan Kamar</Text>
          <View
            style={[
              styles.billCard,
              { borderLeftColor: getStatusColor() },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.billLabel}>
                Status: {data?.payment_status || "Belum Bayar"}
              </Text>
              <Text style={styles.billAmount}>
                {formatRupiah(data?.bill_amount || 0)}
              </Text>
              {data?.days_left_msg ? (
                <Text style={[styles.daysText, { color: getStatusColor() }]}>
                  {data?.days_left_msg}
                </Text>
              ) : null}
            </View>

            {isLunas ? (
              <View style={styles.statusCol}>
                <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                <Text style={[styles.statusLabelSmall, { color: "#10b981" }]}>LUNAS</Text>
              </View>
            ) : isPending ? (
              <View style={styles.statusCol}>
                <Ionicons name="time" size={32} color="#f59e0b" />
                <Text style={[styles.statusLabelSmall, { color: "#f59e0b" }]}>MENUNGGU</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => router.push("/tenant/payment")}
                activeOpacity={0.8}
              >
                <Ionicons name="card-outline" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.payButtonText}>Bayar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* LAYANAN PENGHUNI (SYMMETRICAL 6 ITEMS) */}
          <Text style={styles.sectionTitle}>Layanan Penghuni</Text>
          <View style={styles.menuGrid}>
            <ActionMenu
              icon="card-outline"
              title="Bayar Tagihan"
              color="#10b981"
              bgColor="#ecfdf5"
              onPress={() => router.push("/tenant/payment")}
            />
            <ActionMenu
              icon="wallet-outline"
              title="Riwayat Bayar"
              color="#3b82f6"
              bgColor="#eff6ff"
              onPress={() => router.push("/tenant/payment/history")}
            />
            <ActionMenu
              icon="megaphone-outline"
              title="Lapor Keluhan"
              color="#f59e0b"
              bgColor="#fffbeb"
              onPress={() => router.push("/tenant/report")}
            />
            <ActionMenu
              icon="receipt-outline"
              title="Riwayat Laporan"
              color="#8b5cf6"
              bgColor="#f5f3ff"
              onPress={() => router.push("/tenant/complaint-history")}
            />
            <ActionMenu
              icon="shield-checkmark-outline"
              title="Peraturan Kost"
              color="#06b6d4"
              bgColor="#ecfeff"
              onPress={() => setRulesModalVisible(true)}
            />
            <ActionMenu
              icon="person-circle-outline"
              title="Profil Saya"
              color="#64748b"
              bgColor="#f1f5f9"
              onPress={() => router.push("/tenant/profile")}
            />
          </View>

          {/* BANNER ANNOUNCEMENT */}
          <View style={styles.infoBanner}>
            <View style={styles.bannerIconWrap}>
              <Ionicons name="information-circle" size={24} color="#4e73df" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.bannerTitle}>Bantuan & Kenyamanan</Text>
              <Text style={styles.bannerText}>
                Laporkan kerusakan fasilitas atau gangguan kamar secara langsung melalui menu Lapor Keluhan.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL TATA TERTIB KOST */}
      <Modal visible={rulesModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="shield-checkmark" size={22} color="#1e3a8a" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Tata Tertib Serrata Kost</Text>
              </View>
              <TouchableOpacity onPress={() => setRulesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <RuleItem
                num="1"
                title="Jam Kunjungan & Tamu"
                desc="Tamu lawan jenis dilarang masuk ke dalam kamar tidur. Batas kunjungan tamu hingga pukul 22.00 WIB."
              />
              <RuleItem
                num="2"
                title="Ketenangan & Privasi"
                desc="Harap menjaga ketenangan di atas pukul 23.00 WIB. Dilarang menyetel audio dengan suara bervolume tinggi."
              />
              <RuleItem
                num="3"
                title="Pembayaran Tepat Waktu"
                desc="Pembayaran sewa kamar jatuh tempo setiap tanggal yang telah ditentukan. Keterlambatan dikenakan denda sesuai ketentuan."
              />
              <RuleItem
                num="4"
                title="Kebersihan & Fasilitas"
                desc="Wajib menjaga kebersihan kamar dan area bersama (dapur & parkiran). Buang sampah pada tempat yang disediakan."
              />
              <RuleItem
                num="5"
                title="Larangan Keras"
                desc="Dilarang keras membawa, menyimpan, atau mengonsumsi narkoba, miras, senjata berbahaya, atau melakukan tindakan asusila."
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.closeRulesBtn}
              onPress={() => setRulesModalVisible(false)}
            >
              <Text style={styles.closeRulesText}>Saya Mengerti & Patuh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={alertConfig.onConfirm}
        confirmText="Keluar"
        cancelText="Batal"
      />
    </View>
  );
}

const ActionMenu = ({ icon, title, color, bgColor, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.menuLabel} numberOfLines={1}>{title}</Text>
  </TouchableOpacity>
);

const RuleItem = ({ num, title, desc }) => (
  <View style={styles.ruleRow}>
    <View style={styles.ruleBadge}>
      <Text style={styles.ruleNum}>{num}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.ruleHeading}>{title}</Text>
      <Text style={styles.ruleDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FC" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: "relative",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  userName: { color: "white", fontSize: 22, fontWeight: "bold", marginTop: 2 },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  roomCard: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    position: "absolute",
    bottom: -30,
    left: 20,
    right: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roomInfo: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
  roomLabel: { fontSize: 10, color: "#64748b", fontWeight: "600", textTransform: "uppercase" },
  roomText: { fontWeight: "700", color: "#1e293b", fontSize: 14, marginTop: 1 },
  dividerVertical: { width: 1, height: "80%", backgroundColor: "#e2e8f0" },
  content: { paddingHorizontal: 20, marginTop: 48 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    marginTop: 6,
  },
  billCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  billLabel: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  billAmount: { fontSize: 22, fontWeight: "bold", color: "#1e293b", marginTop: 4 },
  daysText: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  statusCol: { alignItems: "center" },
  statusLabelSmall: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 3,
  },
  payButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  payButtonText: { color: "white", fontWeight: "bold", fontSize: 13 },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  menuItem: {
    width: "48%",
    backgroundColor: "white",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuLabel: {
    fontWeight: "600",
    color: "#334155",
    fontSize: 13,
    textAlign: "center",
  },
  infoBanner: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 6,
  },
  bannerIconWrap: {
    backgroundColor: "#eef2ff",
    padding: 8,
    borderRadius: 12,
  },
  bannerTitle: { fontWeight: "bold", color: "#1e293b", fontSize: 13 },
  bannerText: { fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 18 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
  },
  ruleRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  ruleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  ruleNum: {
    color: "#1e3a8a",
    fontWeight: "bold",
    fontSize: 12,
  },
  ruleHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
  closeRulesBtn: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
  },
  closeRulesText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
