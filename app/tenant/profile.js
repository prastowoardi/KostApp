import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../components/GlobalAlert";
import { API_URL } from "../../helpers/api";
import styles from "../../styles/tenantProfile.styles";

const OWNER_WHATSAPP = "https://wa.me/6285111203521";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  const fetchProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";

      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
        },
      });

      const userData = response.data?.user || response.data;
      setUser(userData);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      console.log("Fetch Profile Error:", error.response?.data || error.message);
      const localData = await AsyncStorage.getItem("userData");
      if (localData) setUser(JSON.parse(localData));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        if (onConfirm) onConfirm();
      },
    });
  };

  const handleLogout = () => {
    showAlert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      "confirmation",
      async () => {
        await AsyncStorage.multiRemove(["userToken", "userData"]);
        router.replace("/");
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  const userName = user?.name || "Penghuni";
  const userInitial = userName.charAt(0).toUpperCase();

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
          <Text style={styles.headerTitle}>Profil Saya</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.profileHero}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
          <Text style={styles.heroName}>{userName}</Text>
          <View style={styles.roomPill}>
            <Ionicons name="bed-outline" size={14} color="#ffffff" />
            <Text style={styles.roomPillText}>
              Kamar {user?.room_number || "-"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
      >
        {/* Personal Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>Informasi Pribadi</Text>

          <InfoItem icon="mail-outline" label="Alamat Email" value={user?.email || "-"} />
          <InfoItem
            icon="call-outline"
            label="Nomor Handphone"
            value={user?.phone || "-"}
            onPress={() => {
              if (user?.phone) {
                Linking.openURL(`tel:${user.phone}`);
              }
            }}
          />
          <InfoItem icon="card-outline" label="Nomor KTP" value={user?.id_card || "-"} />
          <InfoItem icon="location-outline" label="Alamat Asal" value={user?.address || "-"} />
        </View>

        {/* Settings Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>Pengaturan Akun</Text>

          <MenuButton
            icon="lock-closed-outline"
            label="Ubah Password"
            onPress={() => router.push("/tenant/change-password")}
          />
          <MenuButton
            icon="logo-whatsapp"
            label="Hubungi Pengelola Kost"
            color="#10b981"
            onPress={() => Linking.openURL(OWNER_WHATSAPP)}
          />
          <MenuButton
            icon="log-out-outline"
            label="Keluar dari Aplikasi"
            color="#ef4444"
            onPress={handleLogout}
            showDivider={false}
          />
        </View>

        <Text style={styles.copyrightText}>
          Serrata Kost Management v1.0.0
        </Text>
      </ScrollView>

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

const InfoItem = ({ icon, label, value, onPress }) => (
  <TouchableOpacity
    style={styles.infoItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <View style={styles.infoIconCircle}>
      <Ionicons name={icon} size={18} color="#4e73df" />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
    {onPress ? <Ionicons name="chevron-forward" size={16} color="#cbd5e1" /> : null}
  </TouchableOpacity>
);

const MenuButton = ({ icon, label, color = "#1e293b", onPress, showDivider = true }) => (
  <>
    <TouchableOpacity style={styles.menuBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={color} style={{ marginRight: 12 }} />
      <Text style={[styles.menuBtnLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
    {showDivider ? <View style={styles.divider} /> : null}
  </>
);
