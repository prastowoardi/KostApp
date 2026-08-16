import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";
import { API_URL } from "../../helpers/api";

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";

      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
          "Cache-Control": "no-cache",
          "ngrok-skip-browser-warning": "69420",
        },
      });

      console.log("Dashboard Data:", response.data);
      setData(response.data);
    } catch (error) {
      console.log("Error Fetch Dashboard:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
    fetchData();
  }, []);

  if (loading)
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(var(--primary))" />
      </View>
    );

  const getStatusColor = () => {
    const status = data?.payment_status?.toLowerCase();
    switch (status) {
      case "paid":
      case "lunas":
        return "#1cc88a";
      case "pending":
      case "waiting":
        return "#f6c23e";
      default:
        return "#e74a3b";
    }
  };

  const isLunas =
    data?.payment_status?.toLowerCase() === "lunas" ||
    data?.payment_status?.toLowerCase() === "paid";
  const isPending =
    data?.payment_status?.toLowerCase() === "pending" ||
    data?.payment_status?.toLowerCase() === "waiting";

  return (
    <View className="flex-1 bg-background">
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
        {/* HEADER BERGRADASI */}
        <LinearGradient colors={["#1a2a6c", "#b21f1f"]} className="rounded-b-[30px] px-6 pb-24 pt-14">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-base text-white/80">Selamat Datang,</Text>
              <Text className="text-2xl font-bold text-white">{data?.name || "User"}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} className="rounded-xl bg-white/20 p-2.5">
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* CARD INFO KAMAR */}
        <View className="-mt-14 mx-6 flex-row items-center justify-around rounded-2xl bg-card p-5 shadow-xl shadow-black/5">
          <View className="flex-row items-center">
            <Ionicons name="business" size={20} color="hsl(var(--primary))" />
            <Text className="ml-2.5 font-semibold text-primary">
              Kamar {data?.room_number || "-"}
            </Text>
          </View>
          <View className="h-full w-px bg-border" />
          <View className="flex-row items-center">
            <Ionicons
              name="calendar"
              size={20}
              color={isLunas ? "#1cc88a" : "#e74a3b"}
            />
            <Text className="ml-2.5 font-semibold text-primary">
              Tempo: {data?.due_date || "-"}
            </Text>
          </View>
        </View>

        <View className="mt-14 px-6">
          {/* SECTION TAGIHAN DINAMIS */}
          <Text className="mb-3.5 mt-2.5 text-lg font-bold text-foreground">Status Tagihan</Text>
          <View
            className="mb-6 flex-row items-center justify-between rounded-2xl border-l-4 border-primary bg-card p-5 shadow-sm"
            style={{ borderLeftColor: getStatusColor() }}
          >
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">
                Tagihan: {data?.payment_status || "Belum Bayar"}
              </Text>
              <Text className="mt-1 text-xl font-bold text-foreground">
                Rp {(data?.bill_amount || 0).toLocaleString("id-ID")}
              </Text>
              {data?.days_left_msg ? (
                <Text className="mt-1 text-xs font-bold" style={{ color: getStatusColor() }}>
                  {data?.days_left_msg}
                </Text>
              ) : null}
            </View>

            {isLunas ? (
              <View className="items-center">
                <Ionicons name="checkmark-circle" size={32} color="#1cc88a" />
                <Text className="mt-0.5 text-[10px] font-bold text-muted-foreground">LUNAS</Text>
              </View>
            ) : isPending ? (
              <View className="items-center">
                <Ionicons name="time" size={32} color="#f6c23e" />
                <Text className="mt-0.5 text-[10px] font-bold text-muted-foreground">PENDING</Text>
              </View>
            ) : (
              <TouchableOpacity
                className="rounded-xl bg-success px-5 py-2.5"
                onPress={() => router.push("/tenant/payment")}
              >
                <Text className="text-sm font-bold text-white">Bayar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* QUICK ACTIONS */}
          <Text className="mb-3.5 mt-2.5 text-lg font-bold text-foreground">Layanan Penghuni</Text>
          <View className="flex-row flex-wrap justify-between">
            <ActionMenu
              icon="shield-checkmark-outline"
              title="Peraturan"
              color="#1cc88a"
            />
            <ActionMenu
              icon="wallet-outline"
              title="Riwayat Bayar"
              color="#1cc88a"
              onPress={() => router.push("/tenant/payment/history")}
            />
            <ActionMenu
              icon="chatbubble-ellipses-outline"
              title="Komplain"
              color="#f6c23e"
              onPress={() => router.push("/tenant/report")}
            />
            <ActionMenu
              icon="receipt-outline"
              title="Riwayat Komplain"
              color="#4e73df"
              onPress={() => router.push("/tenant/complaint-history")}
            />
            <ActionMenu
              icon="settings-outline"
              title="Profil"
              color="#858796"
              onPress={() => router.push("/tenant/profile")}
            />
          </View>

          {/* BANNER INFO */}
          <View className="mb-8 flex-row items-center rounded-2xl bg-accent p-5">
            <Ionicons name="megaphone" size={24} color="hsl(var(--primary))" />
            <View className="ml-4 flex-1">
              <Text className="font-bold text-foreground">Pengumuman</Text>
              <Text className="text-xs text-muted-foreground">
                Gunakan aplikasi untuk mempermudah pelaporan kendala kamar.
              </Text>
            </View>
          </View>
        </View>
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

const ActionMenu = ({ icon, title, color, onPress }) => (
  <TouchableOpacity className="mb-4 w-[47%] items-center rounded-2xl bg-card p-5 shadow-sm" onPress={onPress}>
    <View style={{ backgroundColor: color + "20" }} className="mb-2.5 rounded-full p-3.5">
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text className="text-center text-[13px] font-semibold text-primary">{title}</Text>
  </TouchableOpacity>
);
