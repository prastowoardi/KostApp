import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchHistory = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem("userToken"),
        AsyncStorage.getItem("userData"),
      ]);

      const cleanToken = token ? token.replace(/"/g, "").trim() : "";

      const user = userData ? JSON.parse(userData) : null;
      const userName = user?.name || "User Tidak Diketahui";

      console.log(`📌 [PAYMENT_HISTORY] Fetching Data User: ${userName}`);

      const response = await axios.get(`${API_URL}/tenant/payments`, {
        headers: { Authorization: `Bearer ${cleanToken}` },
        "ngrok-skip-browser-warning": "69420",
      });

      console.log(
        "📦 [PAYMENT_DATA_JSON]:",
        JSON.stringify(response.data, null, 2),
      );

      const arrayData = response.data.data;
      if (Array.isArray(arrayData)) {
        setPayments(arrayData);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.log("❌ [RESPONSE_ERROR] Failed Get History");
      console.log("⚠️ [ERROR_DETAIL]:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }) => {
    if (!item) return null;
    const isPaid =
      item.status === "paid" ||
      item.status === "Lunas" ||
      item.status === "verified";
    const formattedDate = item.period_month
      ? new Date(item.period_month).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        })
      : "-";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { borderLeftColor: isPaid ? "#1cc88a" : "#e74a3b" },
        ]}
        onPress={() =>
          router.push({
            pathname: "/tenant/payment/payment-detail",
            params: { id: item.id },
          })
        }
      >
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceText}>
              #{item.invoice_number || "INV-000"}
            </Text>
            <Text style={styles.dateText}>Periode: {formattedDate}</Text>
            <Text style={styles.amountText}>
              Rp{" "}
              {Math.round(item.total || item.amount || 0).toLocaleString(
                "id-ID",
              )}
            </Text>
          </View>

          <View style={styles.rightInfo}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isPaid ? "#f0fdf4" : "#fff1f2" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isPaid ? "#16a34a" : "#e11d48" },
                ]}
              >
                {isPaid ? "Lunas" : "Ditolak"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d3e2" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4e73df" />
        <Text style={{ marginTop: 10, color: "#858796" }}>
          Memuat Riwayat...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#4e73df", "#224abe"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Riwayat Bayar</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#b21f1f"]}
            tintColor="#b21f1f"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="receipt" size={80} color="#eaecf4" />
            <Text style={styles.emptyText}>Belum ada riwayat pembayaran</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  listContainer: { paddingHorizontal: 25, paddingTop: 30, paddingBottom: 40 },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderLeftWidth: 5,
    flexDirection: "row", // Tambahkan ini agar konten sejajar
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceText: { fontSize: 11, color: "#858796", fontWeight: "bold" },
  dateText: {
    fontSize: 14,
    color: "#2c3e50",
    marginVertical: 4,
    fontWeight: "500",
  },
  amountText: { fontSize: 16, fontWeight: "bold", color: "#4e73df" },
  rightInfo: { alignItems: "flex-end", marginLeft: 10 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  statusText: { fontSize: 10, fontWeight: "bold" },
  emptyBox: { alignItems: "center", marginTop: 100 },
  emptyText: {
    color: "#b7b9cc",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
  },
});
