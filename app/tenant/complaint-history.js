import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../components/GlobalAlert";
import { API_URL } from "../../helpers/api";
import { formatDate } from "../../helpers/formatters";
import styles from "../../styles/tenantComplaintHistory.styles";

export default function ComplaintHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    onClose: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
  });

  const fetchComplaints = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";
      const response = await axios.get(`${API_URL}/complaints`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
        },
      });

      setComplaints(response.data?.data || response.data || []);
    } catch (e) {
      setAlertConfig({
        visible: true,
        title: "Gagal Memuat",
        message:
          e.response?.data?.message ||
          "Tidak dapat mengambil riwayat komplain.",
        type: "error",
        onClose: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return { label: "Menunggu", color: "#2563eb", bg: "#eff6ff" };
      case "in_progress":
        return { label: "Diproses", color: "#d97706", bg: "#fffbeb" };
      case "resolved":
        return { label: "Selesai", color: "#059669", bg: "#ecfdf5" };
      case "closed":
        return { label: "Ditutup", color: "#64748b", bg: "#f1f5f9" };
      default:
        return { label: status || "Baru", color: "#2563eb", bg: "#eff6ff" };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const targetId = item.uuid || item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/complaint/${targetId}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>
              {item.category ? item.category.toUpperCase() : "UMUM"}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={styles.dateText}>{formatDate(item.created_at, true)}</Text>
          </View>
          <View style={styles.detailLink}>
            <Text style={styles.detailLinkText}>Lihat Detail</Text>
            <Ionicons name="chevron-forward" size={14} color="#4e73df" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#1e3a8a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Riwayat Komplain</Text>
          <TouchableOpacity
            onPress={() => router.push("/tenant/report")}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Memuat riwayat keluhan...</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => (item.uuid || item.id || Math.random()).toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Belum Ada Laporan</Text>
              <Text style={styles.emptySubtitle}>
                Semua keluhan fasilitas atau kamar yang Anda laporkan akan tersimpan di sini.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push("/tenant/report")}
              >
                <Ionicons name="add-circle-outline" size={18} color="white" />
                <Text style={styles.createBtnText}>Buat Laporan Baru</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={alertConfig.onClose}
      />
    </View>
  );
}
