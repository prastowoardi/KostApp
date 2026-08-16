import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from '../../../helpers/api';
import { Skeleton } from '../../../components/ui/skeleton';
import ScreenHeader from '../../../components/ScreenHeader';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';

export default function PaymentHistory() {
  const insets = useSafeAreaInsets();
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
      <Card className="mb-4 rounded-[20px] border-l-[5px] p-0 shadow-sm" style={{ borderLeftColor: isPaid ? "#1cc88a" : "#e74a3b" }}>
        <TouchableOpacity
          className="flex-1 flex-row overflow-hidden"
          onPress={() =>
            router.push({
              pathname: "/tenant/payment/detail",
              params: { id: item.id || item.uuid },
            })
          }
        >
          <View className="flex-1 flex-row items-center justify-between p-5">
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-muted-foreground">
                #{item.invoice_number || "INV-000"}
              </Text>
              <Text className="my-1 text-sm font-medium text-foreground">Periode: {formattedDate}</Text>
              <Text className="text-base font-bold text-primary">
                Rp{" "}
                {Math.round(item.total || item.amount || 0).toLocaleString(
                  "id-ID",
                )}
              </Text>
            </View>

            <View className="ml-2.5 items-end">
              <Badge variant={isPaid ? "success" : "destructive"} className="mb-1.5 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-white">
                  {isPaid ? "Lunas" : "Ditolak"}
                </Text>
              </Badge>
              <Ionicons name="chevron-forward" size={20} color="#d1d3e2" />
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Skeleton className="h-28 w-full rounded-b-[30px]" />
        <View className="px-6 pt-7">
          <Skeleton className="h-24 w-full rounded-[20px]" />
          <Skeleton className="mt-4 h-24 w-full rounded-[20px]" />
          <Skeleton className="mt-4 h-24 w-full rounded-[20px]" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Riwayat Bayar" />

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id?.toString() || item.uuid?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 25, paddingTop: 30, paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#b21f1f"]}
            tintColor="#b21f1f"
          />
        }
        ListEmptyComponent={
          <View className="mt-24 items-center">
            <MaterialCommunityIcons name="receipt" size={80} color="#eaecf4" />
            <Text className="mt-2.5 text-sm font-medium text-muted-foreground">Belum ada riwayat pembayaran</Text>
          </View>
        }
      />
    </View>
  );
}
