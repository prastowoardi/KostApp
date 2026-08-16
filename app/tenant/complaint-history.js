import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";
import ScreenHeader from "../../components/ScreenHeader";
import { API_URL } from "../../helpers/api";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";

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

  // Helper untuk variant status
  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case "open":
      case "closed":
        return "destructive";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "muted";
    }
  };

  const renderItem = ({ item }) => {
    const variant = getStatusVariant(item.status);

    return (
      <Card className="mb-4 rounded-[18px] p-4 shadow-sm" asChild>
        <TouchableOpacity
          onPress={() => router.push(`/complaint/${item.id || item.uuid}`)}
        >
          <View className="mb-2.5 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold tracking-wider text-primary">{item.category.toUpperCase()}</Text>
            <Badge variant={variant} className="px-2.5 py-1">
              <Text className="text-[10px] font-bold capitalize text-white">
                {item.status.replace("_", " ")}
              </Text>
            </Badge>
          </View>

          <Text className="mb-1 text-base font-bold text-foreground" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="mb-3 text-sm leading-5 text-muted-foreground" numberOfLines={2}>
            {item.description}
          </Text>

          <View className="flex-row items-center justify-between border-t border-muted pt-3">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#95a5a6" />
              <Text className="ml-1.5 text-xs text-muted-foreground">
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
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      <GlobalAlert {...alertConfig} />

      <ScreenHeader title="Riwayat Laporan" />

      {loading ? (
        <View className="p-5 pt-2.5">
          <Skeleton className="h-28 w-full rounded-[18px]" />
          <Skeleton className="mt-4 h-28 w-full rounded-[18px]" />
          <Skeleton className="mt-4 h-28 w-full rounded-[18px]" />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => (item.id || item.uuid).toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
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
              <Ionicons
                name="document-text-outline"
                size={80}
                color="#d1d8e0"
              />
              <Text className="mt-5 text-lg font-bold text-foreground">Belum Ada Laporan</Text>
              <Text className="mt-2 px-10 text-center text-sm text-muted-foreground">
                Semua komplain yang Anda buat akan muncul di sini.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
