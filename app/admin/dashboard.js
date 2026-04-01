import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchAdminData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      // Pastikan endpoint /admin/stats sudah dibuat di Laravel
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.log("Error Fetch Data:", error.message);
      // Fallback data jika API belum siap (untuk testing UI)
      setStats({
        total_rooms: 24,
        occupied_rooms: 20,
        vacant_rooms: 4,
        monthly_income: 28500000,
        latest_complaints: [
          {
            id: 1,
            room: "B-04",
            user: "Budi",
            issue: "AC Tidak Dingin",
            status: "Urgent",
          },
          {
            id: 2,
            room: "A-10",
            user: "Siti",
            issue: "Air Kamar Mandi Bocor",
            status: "Pending",
          },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  const handleLogout = () => {
    setAlertConfig({
      visible: true,
      title: "Konfirmasi Keluar",
      message: "Apakah Anda yakin ingin keluar dari aplikasi?",
      type: "confirmation",
      onConfirm: async () => {
        await AsyncStorage.multiRemove(["userToken", "userData"]);
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        router.replace("/");
      },
      onCancel: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#4e73df" />
        <Text style={{ marginTop: 10, color: "#858796" }}>
          Memuat Data Admin...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#b21f1f"]}
            tintColor="#b21f1f"
          />
        }
      >
        {/* HEADER DENGAN GRADASI */}
        <LinearGradient
          colors={["#1a2a6c", "#b21f1f", "#fdbb2d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.adminTag}>Administrator Panel</Text>
              <Text style={styles.userName}>Owner Kost 👋</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* RINGKASAN STATISTIK */}
          <View style={styles.statsRow}>
            <StatItem
              label="Kamar"
              value={stats?.total_rooms}
              icon="business"
            />
            <StatItem
              label="Terisi"
              value={stats?.occupied_rooms}
              icon="people"
            />
            <StatItem
              label="Kosong"
              value={stats?.vacant_rooms}
              icon="log-out"
            />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* CARD KEUANGAN */}
          <Text style={styles.sectionTitle}>Status Keuangan</Text>
          <TouchableOpacity
            style={styles.incomeCard}
            onPress={() =>
              Alert.alert("Laporan", "Menuju detail laporan keuangan...")
            }
          >
            <View>
              <Text style={styles.incomeLabel}>Pendapatan Bulan Ini</Text>
              <Text style={styles.incomeValue}>
                Rp {(stats?.monthly_income || 0).toLocaleString("id-ID")}
              </Text>
            </View>
            <View style={styles.incomeIconWrap}>
              <Ionicons name="trending-up" size={28} color="#1cc88a" />
            </View>
          </TouchableOpacity>

          {/* MENU UTAMA (CONTROL PANEL) */}
          <Text style={styles.sectionTitle}>Manajemen Properti</Text>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalMenu}
          >
            <ControlBtn
              title="Verifikasi"
              icon="shield-checkmark"
              color="#1cc88a"
              onPress={() => router.push("/admin/verify-payment")}
            />
            <ControlBtn
              title="Komplain"
              icon="chatbubbles-outline"
              color="#f6c23e"
              onPress={() => router.push("/admin/complaint")}
            />
            <ControlBtn
              title="Kamar"
              icon="bed"
              color="#4e73df"
              onPress={() => Alert.alert("Info", "Fitur Kelola Kamar")}
            />
            <ControlBtn
              title="Tenant"
              icon="people"
              color="#36b9cc"
              onPress={() => router.push("/admin/manage-tenant")}
            />
            <ControlBtn
              title="Tagihan"
              icon="receipt"
              color="#f6c23e"
              onPress={() => Alert.alert("Info", "Fitur Kirim Tagihan")}
            />
          </ScrollView>

          {/* DAFTAR KELUHAN TERBARU */}
          <View style={styles.complaintHeader}>
            <Text style={styles.sectionTitle}>Komplain Penghuni</Text>
            <TouchableOpacity onPress={() => router.push("/admin/complaint")}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {stats?.latest_complaints?.length > 0 ? (
            stats.latest_complaints.map((item, index) => (
              <ComplaintCard
                key={index}
                room={item.room}
                user={item.user}
                issue={item.issue}
                status={item.status}
              />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Tidak ada keluhan aktif.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={alertConfig.onConfirm}
        confirmText="Ya, Lanjutkan"
        cancelText="Batal"
      />
    </View>
  );
}

// --- KOMPONEN PENDUKUNG ---

const StatItem = ({ label, value, icon }) => (
  <View style={styles.statItem}>
    <View style={styles.statIconCircle}>
      <Ionicons name={icon} size={20} color="white" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ControlBtn = ({ title, icon, color, onPress }) => (
  <TouchableOpacity style={styles.controlBtn} onPress={onPress}>
    <View style={[styles.iconWrap, { backgroundColor: color }]}>
      <Ionicons name={icon} size={26} color="white" />
    </View>
    <Text style={styles.controlText}>{title}</Text>
  </TouchableOpacity>
);

const ComplaintCard = ({ room, user, issue, status }) => (
  <TouchableOpacity style={styles.cCard}>
    <View style={styles.cIconInfo}>
      <Ionicons
        name="warning"
        size={24}
        color={status === "Urgent" ? "#e74a3b" : "#f6c23e"}
      />
    </View>
    <View style={{ flex: 1, marginLeft: 10 }}>
      <Text style={styles.cRoom}>
        Kamar {room} • {user}
      </Text>
      <Text style={styles.cIssue} numberOfLines={1}>
        {issue}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#ccc" />
  </TouchableOpacity>
);

// --- STYLING ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 35,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  adminTag: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userName: { color: "white", fontSize: 26, fontWeight: "bold" },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statItem: { alignItems: "center" },
  statIconCircle: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 50,
    marginBottom: 5,
  },
  statValue: { color: "white", fontSize: 22, fontWeight: "bold" },
  statLabel: { color: "white", fontSize: 11, opacity: 0.9, fontWeight: "500" },
  content: { paddingHorizontal: 25, marginTop: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
    marginTop: 10,
  },
  incomeCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  incomeLabel: { color: "#858796", fontSize: 14, fontWeight: "500" },
  incomeValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1cc88a",
    marginTop: 5,
  },
  incomeIconWrap: { backgroundColor: "#f0fff4", padding: 12, borderRadius: 15 },
  gridMenu: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 5,
  },
  horizontalMenu: {
    paddingLeft: 0,
    paddingRight: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  controlBtn: {
    width: 80,
    alignItems: "center",
    marginRight: 15,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  controlText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4e73df",
    marginTop: 8,
  },
  complaintHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  seeAll: { color: "#4e73df", fontSize: 13, fontWeight: "bold" },
  cCard: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#4e73df",
    elevation: 2,
  },
  cIconInfo: { padding: 5 },
  cRoom: { fontWeight: "bold", color: "#2c3e50", fontSize: 15 },
  cIssue: { color: "#858796", fontSize: 13, marginTop: 3 },
  emptyBox: { alignItems: "center", padding: 30 },
  emptyText: { color: "#ccc", fontStyle: "italic" },
});
