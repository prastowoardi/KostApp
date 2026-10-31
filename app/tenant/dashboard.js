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
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../components/GlobalAlert";
import { API_URL } from "../../helpers/api";
import { formatRupiah } from "../../helpers/formatters";
import styles from "../../styles/tenantDashboard.styles";

const OWNER_WHATSAPP = "https://wa.me/6285111203521";

export default function TenantDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [tenantName, setTenantName] = useState("Penghuni");
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
    AsyncStorage.getItem("userData").then((userStr) => {
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u?.name) setTenantName(u.name);
        } catch {}
      }
    });
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
              <Text style={styles.userName} numberOfLines={1}>{data?.name || tenantName || "Penghuni"}</Text>
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

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* UMUM */}
              <View style={styles.ruleCategoryHeader}>
                <Ionicons name="location" size={14} color="#1e3a8a" />
                <Text style={styles.ruleCategoryTitle}>KETENTUAN UMUM</Text>
              </View>
              <RuleItem
                num="1"
                title="Ketenangan & Keamanan"
                desc="Saling menjaga ketenangan dan keamanan ya, biar waktu istirahat makin pol dan nyaman."
              />
              <RuleItem
                num="2"
                title="Bebas Miras & Narkoba"
                desc="Lingkungan Serrata Kost wajib bersih dari Miras, Narkoba, atau barang terlarang lainnya."
              />
              <RuleItem
                num="3"
                title="No Smoking Inside"
                desc="Dilarang merokok di dalam kamar. Kamar harus tetap bersih dan wangi tanpa asap rokok."
              />
              <RuleItem
                num="4"
                title="Hewan Peliharaan"
                desc="Mohon maaf, Serrata Kost belum bisa menerima anabul atau hewan peliharaan apa pun."
              />
              <RuleItem
                num="5"
                title="Etika & Norma"
                desc="Saling menjaga etika bersosialisasi dan menghindari tindakan asusila demi kenyamanan bersama."
              />
              <RuleItem
                num="6"
                title="Jaga Nama Baik"
                desc="Mari kita jaga nama baik Serrata Kost bersama-sama di mana pun berada."
              />
              <RuleItem
                num="7"
                title="Pembayaran Tepat Waktu"
                desc="Pembayaran sewa kost wajib tepat waktu sesuai tanggal jatuh tempo yang telah disepakati."
              />

              {/* JAM KEGIATAN & TAMU */}
              <View style={styles.ruleCategoryHeader}>
                <Ionicons name="time" size={14} color="#1e3a8a" />
                <Text style={styles.ruleCategoryTitle}>JAM KEGIATAN & TAMU</Text>
              </View>
              <RuleItem
                num="8"
                title="Jam Malam (Pukul 22.00 WIB)"
                desc="Batas jam malam maksimal pukul 22.00 WIB. Jika terpaksa pulang larut, wajib mengabari Ibu Kost terlebih dahulu."
              />
              <RuleItem
                num="9"
                title="Tamu Lawan Jenis"
                desc="Khusus tamu laki-laki dilarang masuk ke dalam kamar (bertemu di area teras/tamu saja)."
              />
              <RuleItem
                num="10"
                title="Keluarga Menginap"
                desc="Jika ada keluarga yang ingin menginap, wajib konfirmasi dan izin ke Ibu Kost terlebih dahulu (maksimal 2 orang)."
              />

              {/* KEBERSIHAN & KERAPIHAN */}
              <View style={styles.ruleCategoryHeader}>
                <Ionicons name="sparkles" size={14} color="#1e3a8a" />
                <Text style={styles.ruleCategoryTitle}>KEBERSIHAN & KERAPIHAN</Text>
              </View>
              <RuleItem
                num="11"
                title="Kamar & Kamar Mandi"
                desc="Kamar dan kamar mandi pribadi wajib dijaga tetap bersih dan rapi agar semakin betah."
              />
              <RuleItem
                num="12"
                title="Pembuangan Sampah"
                desc="Buang sampah pada tempatnya. Dilarang keras membuang sampah, tisu, atau pembalut ke dalam kloset agar tidak mampet."
              />
              <RuleItem
                num="13"
                title="Tempat Jemuran"
                desc="Jemur pakaian di area jemuran yang sudah disediakan, jangan menjemur di depan kamar agar lingkungan tetap rapi."
              />

              {/* FASILITAS KOST */}
              <View style={styles.ruleCategoryHeader}>
                <Ionicons name="water" size={14} color="#1e3a8a" />
                <Text style={styles.ruleCategoryTitle}>FASILITAS KOST</Text>
              </View>
              <RuleItem
                num="14"
                title="Penggunaan Bijak"
                desc="Gunakan seluruh fasilitas kost dengan bijak, tertib, dan penuh rasa tanggung jawab."
              />
              <RuleItem
                num="15"
                title="Tanggung Jawab Kerusakan"
                desc="Jika terjadi kerusakan fasilitas akibat kelalaian pribadi, biaya perbaikannya ditanggung oleh penghuni."
              />
              <RuleItem
                num="16"
                title="Hemat Air & Energi"
                desc="Hemat penggunaan air dan listrik ya Kak, gunakan secukupnya saja sesuai kebutuhan."
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
