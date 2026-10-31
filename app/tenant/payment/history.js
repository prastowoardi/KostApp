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
import { API_URL } from "../../../helpers/api";
import { formatRupiah, formatDate, formatMonthYear } from "../../../helpers/formatters";
import styles from "../../../styles/tenantPaymentHistory.styles";

export default function PaymentHistory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";

      const response = await axios.get(`${API_URL}/tenant/payments`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
        },
      });

      const arrayData = response.data?.data || response.data || [];
      if (Array.isArray(arrayData)) {
        setPayments(arrayData);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.log("Error fetch payment history:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }) => {
    if (!item) return null;
    const statusLower = (item.status || "").toLowerCase();
    const isPaid = statusLower === "paid" || statusLower === "lunas" || statusLower === "verified";
    const isPending = statusLower === "pending";

    const statusBg = isPaid ? "#ecfdf5" : isPending ? "#fffbeb" : "#fef2f2";
    const statusColor = isPaid ? "#10b981" : isPending ? "#f59e0b" : "#ef4444";
    const statusLabel = isPaid ? "Lunas" : isPending ? "Menunggu" : "Ditolak";
    const targetId = item.uuid || item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/tenant/payment/detail",
            params: { id: targetId },
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.invoiceRow}>
            <Ionicons name="receipt-outline" size={16} color="#4e73df" />
            <Text style={styles.invoiceText}>#{item.invoice_number || "INV-000"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.periodLabel}>Periode Sewa</Text>
            <Text style={styles.periodValue}>
              {item.period_month ? formatMonthYear(item.period_month) : "-"}
            </Text>
            <Text style={styles.paymentDate}>
              Dibayar: {formatDate(item.payment_date || item.created_at)}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amountLabel}>Total Tagihan</Text>
            <Text style={styles.amountValue}>
              {formatRupiah(item.total || item.amount || 0)}
            </Text>
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
          <Text style={styles.headerTitle}>Riwayat Pembayaran</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
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
              <Ionicons name="receipt-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Belum Ada Pembayaran</Text>
              <Text style={styles.emptySubtitle}>
                Riwayat pembayaran sewa kamar Anda akan muncul di sini.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
