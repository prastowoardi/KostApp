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
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ComplaintHistoryScreen() {
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

  const fetchComplaints = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(`${API_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Sesuaikan dengan struktur response Laravel kamu
      // Jika di Laravel return response()->json(['data' => $data])
      setComplaints(response.data.data || []);
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
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints();
  }, []);

  // Helper untuk warna status
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "open":
        return { color: "#4e73df", bg: "#eef2ff" };
      case "in_progress":
        return { color: "#f6c23e", bg: "#fffbe6" };
      case "resolved":
        return { color: "#1cc88a", bg: "#e6fffa" };
      case "closed":
        return { color: "#858796", bg: "#f8f9fc" };
      default:
        return { color: "#4e73df", bg: "#f1f3f9" };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/complaint/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {item.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        <Text style={styles.titleText} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.descText} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color="#95a5a6" />
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GlobalAlert {...alertConfig} />

      <LinearGradient colors={["#4e73df", "#224abe"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Laporan</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4e73df" />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#b21f1f"]}
              tintColor="#b21f1f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={80}
                color="#d1d8e0"
              />
              <Text style={styles.emptyTitle}>Belum Ada Laporan</Text>
              <Text style={styles.emptySub}>
                Semua komplain yang Anda buat akan muncul di sini.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backBtn: {
    padding: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    marginRight: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  listContent: { padding: 20, paddingTop: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4e73df",
    letterSpacing: 1,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: "capitalize" },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  descText: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f3f9",
    paddingTop: 12,
  },
  dateInfo: { flexDirection: "row", alignItems: "center" },
  dateText: { fontSize: 12, color: "#95a5a6", marginLeft: 5 },
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
