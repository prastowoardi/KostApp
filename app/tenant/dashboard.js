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

const OWNER_WHATSAPP = "https://wa.me/6285111203521";

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
      console.log("Error Fetch Tenant Dashboard:", error?.message);
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

  const handleContactOwner = () => {
    const defaultMsg = `Halo Pengelola Serrata Kost, saya ${data?.name || "penghuni"} (Kamar ${data?.room_number || "-"}), ingin menanyakan terkait kos.`;
    const url = `${OWNER_WHATSAPP}?text=${encodeURIComponent(defaultMsg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Gagal membuka aplikasi WhatsApp.");
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
        {/* HEADER GRADIENT WITH NATURAL INTEGRATED HERO */}
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#1e3a8a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          {/* Top Row: Brand & Logout */}
          <View style={styles.headerTop}>
            <View>
              <View style={styles.brandTag}>
                <View style={styles.brandDot} />
                <Text style={styles.brandTagText}>Serrata Kost • Penghuni</Text>
              </View>
              <Text style={styles.greetingText}>Selamat Datang,</Text>
              <Text style={styles.userName} numberOfLines={1}>{data?.name || "Penghuni"}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Integrated Room & Due Date Card */}
          <View style={styles.roomHeroCard}>
            <View style={styles.roomHeroCol}>
              <View style={styles.roomIconWrap}>
                <Ionicons name="bed" size={20} color="#2563eb" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.roomHeroLabel}>Nomor Kamar</Text>
                <Text style={styles.roomHeroVal}>Kamar {data?.room_number || "-"}</Text>
              </View>
            </View>

            <View style={styles.roomHeroDivider} />

            <View style={styles.roomHeroCol}>
              <View
                style={[
                  styles.roomIconWrap,
                  { backgroundColor: isLunas ? "#ecfdf5" : isPending ? "#fffbeb" : "#fef2f2" },
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={20}
                  color={isLunas ? "#10b981" : isPending ? "#f59e0b" : "#ef4444"}
                />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.roomHeroLabel}>Jatuh Tempo</Text>
                <Text style={styles.roomHeroVal}>{data?.due_date || "-"}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* SECTION 1: SMART BILL CARD */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Status Tagihan Kamar</Text>
            {isLunas ? (
              <View style={styles.miniStatusBadgePaid}>
                <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                <Text style={styles.miniStatusBadgePaidText}>Aman</Text>
              </View>
            ) : null}
          </View>

          {isLunas ? (
            /* Card Kondisi LUNAS */
            <View style={styles.billCardPaid}>
              <View style={styles.billCardPaidTop}>
                <View style={styles.billIconCirclePaid}>
                  <Ionicons name="checkmark-done" size={26} color="#10b981" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={styles.paidBadgeRow}>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>LUNAS</Text>
                    </View>
                    <Text style={styles.paidSubInfo}>Periode Aktif</Text>
                  </View>
                  <Text style={styles.billPaidTitle}>Tagihan Periode Ini Beres! 🎉</Text>
                  <Text style={styles.billPaidDesc}>
                    Jatuh tempo berikutnya pada{" "}
                    <Text style={{ fontWeight: "700", color: "#1e293b" }}>{data?.due_date || "-"}</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.billCardPaidDivider} />
              <TouchableOpacity
                style={styles.billCardPaidAction}
                onPress={() => router.push("/tenant/payment/history")}
                activeOpacity={0.7}
              >
                <Ionicons name="receipt-outline" size={16} color="#2563eb" />
                <Text style={styles.billCardPaidActionText}>Lihat Riwayat & Bukti Pembayaran</Text>
                <Ionicons name="chevron-forward" size={16} color="#2563eb" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            </View>
          ) : isPending ? (
            /* Card Kondisi MENUNGGU VERIFIKASI */
            <View style={styles.billCardPending}>
              <View style={styles.billCardPendingTop}>
                <View style={styles.billIconCirclePending}>
                  <Ionicons name="time" size={26} color="#f59e0b" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>MENUNGGU VERIFIKASI</Text>
                  </View>
                  <Text style={styles.billPendingAmount}>{formatRupiah(data?.bill_amount || 0)}</Text>
                  <Text style={styles.billPendingDesc}>
                    Bukti transfer Anda sudah terkirim dan sedang dicek oleh pengelola.
                  </Text>
                </View>
              </View>
              <View style={styles.billCardPendingDivider} />
              <TouchableOpacity
                style={styles.billCardPendingAction}
                onPress={() => router.push("/tenant/payment/history")}
                activeOpacity={0.7}
              >
                <Ionicons name="eye-outline" size={16} color="#d97706" />
                <Text style={styles.billCardPendingActionText}>Cek Status Bukti Transfer</Text>
                <Ionicons name="chevron-forward" size={16} color="#d97706" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Card Kondisi BELUM BAYAR */
            <View style={styles.billCardUnpaid}>
              <View style={styles.billCardUnpaidTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.unpaidBadgeRow}>
                    <View style={styles.unpaidBadge}>
                      <Text style={styles.unpaidBadgeText}>BELUM BAYAR</Text>
                    </View>
                    {data?.days_left_msg ? (
                      <Text style={styles.unpaidDaysMsg} numberOfLines={1}>{data.days_left_msg}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.billUnpaidLabel}>Total Tagihan Sewa Kamar</Text>
                  <Text style={styles.billUnpaidAmount}>{formatRupiah(data?.bill_amount || 0)}</Text>
                </View>
                <View style={styles.billUnpaidIconWrap}>
                  <Ionicons name="alert-circle" size={32} color="#ef4444" />
                </View>
              </View>

              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={() => router.push("/tenant/payment")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#0f172a", "#1e3a8a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payNowGradient}
                >
                  <Ionicons name="card-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.payNowText}>BAYAR SEKARANG</Text>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* SECTION 2: LAYANAN PENGHUNI (6 GRID ITEMS) */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Layanan Penghuni</Text>
          <View style={styles.menuGrid}>
            <ActionMenu
              icon="card-outline"
              title="Bayar Tagihan"
              subtitle="Upload transfer"
              color="#10b981"
              bgColor="#ecfdf5"
              onPress={() => router.push("/tenant/payment")}
            />
            <ActionMenu
              icon="wallet-outline"
              title="Riwayat Bayar"
              subtitle="Kwitansi sewa"
              color="#2563eb"
              bgColor="#eff6ff"
              onPress={() => router.push("/tenant/payment/history")}
            />
            <ActionMenu
              icon="megaphone-outline"
              title="Lapor Keluhan"
              subtitle="Fasilitas rusak"
              color="#f59e0b"
              bgColor="#fffbeb"
              onPress={() => router.push("/tenant/report")}
            />
            <ActionMenu
              icon="receipt-outline"
              title="Riwayat Laporan"
              subtitle="Status proses"
              color="#8b5cf6"
              bgColor="#f5f3ff"
              onPress={() => router.push("/tenant/complaint-history")}
            />
            <ActionMenu
              icon="shield-checkmark-outline"
              title="Tata Tertib"
              subtitle="Aturan kost"
              color="#0284c7"
              bgColor="#f0f9ff"
              onPress={() => setRulesModalVisible(true)}
            />
            <ActionMenu
              icon="person-circle-outline"
              title="Profil Saya"
              subtitle="Info akun"
              color="#475569"
              bgColor="#f1f5f9"
              onPress={() => router.push("/tenant/profile")}
            />
          </View>

          {/* SECTION 3: BANTUAN & KONTAK PENGELOLA (WHATSAPP) */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={styles.helpIconWrap}>
                <Ionicons name="logo-whatsapp" size={22} color="#16a34a" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.helpTitle}>Butuh Bantuan Langsung?</Text>
                <Text style={styles.helpSub}>
                  Ada kendala darurat kamar atau pertanyaan seputar kos? Hubungi pengelola langsung via WhatsApp.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.helpWaBtn}
              onPress={handleContactOwner}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.helpWaBtnText}>Chat Pengelola Kost</Text>
            </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setRulesModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              activeOpacity={0.8}
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

const ActionMenu = ({ icon, title, subtitle, color, bgColor, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.menuLabel} numberOfLines={1}>{title}</Text>
    {subtitle ? (
      <Text style={styles.menuSubLabel} numberOfLines={1}>{subtitle}</Text>
    ) : null}
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },

  /* HEADER */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brandTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38bdf8",
    marginRight: 6,
  },
  brandTagText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  greetingText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  userName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ROOM & DUE DATE HERO CARD */
  roomHeroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roomHeroCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  roomIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  roomHeroLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  roomHeroVal: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: 14,
    marginTop: 2,
  },
  roomHeroDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 10,
  },

  /* CONTENT AREA */
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  miniStatusBadgePaid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  miniStatusBadgePaidText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "700",
  },

  /* BILL CARD: LUNAS */
  billCardPaid: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    elevation: 2,
    shadowColor: "#10b981",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  billCardPaidTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  billIconCirclePaid: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  paidBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  paidBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  paidSubInfo: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "500",
  },
  billPaidTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
    marginTop: 2,
  },
  billPaidDesc: {
    fontSize: 12,
    color: "#475569",
    marginTop: 3,
  },
  billCardPaidDivider: {
    height: 1,
    backgroundColor: "#dcfce7",
    marginVertical: 12,
  },
  billCardPaidAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  billCardPaidActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    marginLeft: 6,
  },

  /* BILL CARD: PENDING */
  billCardPending: {
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
    elevation: 2,
    shadowColor: "#f59e0b",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  billCardPendingTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  billIconCirclePending: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  pendingBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  billPendingAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#92400e",
  },
  billPendingDesc: {
    fontSize: 12,
    color: "#78350f",
    marginTop: 3,
  },
  billCardPendingDivider: {
    height: 1,
    backgroundColor: "#fde68a",
    marginVertical: 12,
  },
  billCardPendingAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  billCardPendingActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
    marginLeft: 6,
  },

  /* BILL CARD: UNPAID */
  billCardUnpaid: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#fecaca",
    elevation: 3,
    shadowColor: "#ef4444",
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  billCardUnpaidTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  unpaidBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  unpaidBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unpaidBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  unpaidDaysMsg: {
    fontSize: 11,
    color: "#b91c1c",
    fontWeight: "700",
  },
  billUnpaidLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
  },
  billUnpaidAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  billUnpaidIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  payNowBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  payNowGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  payNowText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  /* MENU GRID (6 ITEMS) */
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  menuItem: {
    width: "48%",
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuLabel: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: 13,
    textAlign: "center",
  },
  menuSubLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
    textAlign: "center",
  },

  /* HELP & WHATSAPP CARD */
  helpCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  helpIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  helpSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
    lineHeight: 17,
  },
  helpWaBtn: {
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 12,
  },
  helpWaBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },

  /* RULES MODAL */
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
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
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  ruleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#eff6ff",
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
    fontSize: 13,
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
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  closeRulesText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
