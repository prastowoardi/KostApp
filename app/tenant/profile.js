import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";
import ScreenHeader from "../../components/ScreenHeader";
import { API_URL } from "../../helpers/api";
import { Card } from "../../components/ui/card";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm,
    });
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");

      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      console.log("User Data:", JSON.stringify(response.data, null, 2));

      const userData = response.data.user || response.data;
      setUser(userData);

      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      console.log("Fetch Profile Error:", error);
      const localData = await AsyncStorage.getItem("userData");
      if (localData) setUser(JSON.parse(localData));
    } finally {
      setLoading(false);
    }
  };

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
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(var(--primary))" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      <ScreenHeader title="Profil Saya">
        <View className="mt-5 items-center">
          <View className="relative mb-4">
            <View className="h-24 w-24 items-center justify-center rounded-full border-[3px] border-white bg-white/30">
              <Text className="text-[40px] font-bold text-white">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-success">
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-[22px] font-bold text-white">{user?.name || "User"}</Text>
          <Text className="mt-1 text-sm text-white/80">
            {user?.role === "admin"
              ? "Administrator"
              : `Penghuni Kamar ${user?.room_number || "-"}`}
          </Text>
        </View>
      </ScreenHeader>

      <ScrollView
        className="p-5"
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
        <Card className="mb-5 p-5 shadow-sm">
          <Text className="mb-5 text-[13px] font-bold uppercase tracking-wider text-primary">
            Informasi Pribadi
          </Text>

          <InfoItem
            icon="mail-outline"
            label="Email"
            value={user?.email || "-"}
          />
          <InfoItem
            icon="call-outline"
            label="Nomor HP"
            value={user?.phone || "-"}
          />
          <InfoItem
            icon="card-outline"
            label="No. KTP"
            value={user?.id_card || "-"}
          />
          <InfoItem
            icon="location-outline"
            label="Alamat Asal"
            value={user?.address || "-"}
          />
        </Card>

        <Card className="mb-5 p-5 shadow-sm">
          <Text className="mb-5 text-[13px] font-bold uppercase tracking-wider text-primary">
            Pengaturan
          </Text>

          <MenuButton
            icon="lock-closed-outline"
            label="Ganti Password"
            onPress={() => router.push("/tenant/change-password")}
          />
          <MenuButton
            icon="help-circle-outline"
            label="Pusat Bantuan"
            onPress={() =>
              showAlert(
                "Hubungi Pengelola",
                "Apakah Anda ingin menghubungi pengelola via WhatsApp?",
                "confirmation",
                () => Linking.openURL("https://wa.me/6285111203521"),
              )
            }
          />
        </Card>

        <TouchableOpacity
          className="mt-2.5 flex-row items-center justify-center rounded-[20px] border-[1.5px] border-destructive/20 bg-card p-4"
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="hsl(var(--destructive))"
            style={{ marginRight: 10 }}
          />
          <Text className="text-base font-bold text-destructive">Keluar Akun</Text>
        </TouchableOpacity>
        <View style={{ height: insets.bottom + 50 }} />
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

const InfoItem = ({ icon, label, value }) => (
  <View className="mb-5 flex-row items-center">
    <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent">
      <Ionicons name={icon} size={20} color="#4e73df" />
    </View>
    <View className="ml-3.5 flex-1">
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
      <Text className="mt-0.5 text-[15px] font-semibold text-foreground">{value}</Text>
    </View>
  </View>
);

const MenuButton = ({ icon, label, onPress }) => (
  <TouchableOpacity
    className="flex-row items-center justify-between border-b border-muted py-3.5"
    onPress={onPress}
  >
    <View className="flex-row items-center">
      <Ionicons name={icon} size={22} color="#858796" />
      <Text className="ml-3.5 text-[15px] text-foreground">{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);
