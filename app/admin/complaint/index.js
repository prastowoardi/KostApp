import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../../components/GlobalAlert";
import ScreenHeader from "../../../components/ScreenHeader";
import { API_URL } from "../../../helpers/api";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Skeleton } from "../../../components/ui/skeleton";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_COLORS = {
  open: { border: "#e74a3b", bg: "#ffeaea", text: "#e74a3b", label: "OPEN" },
  in_progress: { border: "#f6c23e", bg: "#fff4e5", text: "#d39e00", label: "PROSES" },
  resolved: { border: "#1cc88a", bg: "#eafaf1", text: "#1cc88a", label: "SELESAI" },
};

export default function AdminComplaints() {
  const insets = useSafeAreaInsets();
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const showAlert = (title, message, type = "success") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [reply, setReply] = useState("");
  const router = useRouter();

  const fetchComplaints = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(`${API_URL}/admin/complaints`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      if (response.data && response.data.data) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        router.replace("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleUpdateStatus = async (status) => {
    if (!reply && status === "resolved") {
      showAlert(
        "Oops",
        "Berikan pesan solusi sebelum menyelesaikan laporan.",
        "warning",
      );
      return;
    }

    const dbStatus = status === "process" ? "in_progress" : status;

    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.post(
        `${API_URL}/admin/complaints/${selectedItem.id || selectedItem.uuid}/respond`,
        {
          status: dbStatus,
          response: reply,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      showAlert("Berhasil", "Laporan berhasil diperbarui.", "success");

      setModalVisible(false);
      setReply("");
      fetchComplaints();
    } catch (e) {
      console.log("Update Error:", e.response?.data || e.message);
      showAlert(
        "Gagal",
        "Terjadi kesalahan saat memperbarui laporan.",
        "error",
      );
    }
  };

  const filteredComplaints = complaints.filter((item) =>
    filterStatus === "all"
      ? true
      : filterStatus === "process"
        ? item.status === "in_progress"
        : item.status === filterStatus,
  );

  const stats = {
    pending: complaints.filter((c) => c.status === "open").length,
    process: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  const renderItem = ({ item }) => {
    const st = STATUS_COLORS[item.status] || STATUS_COLORS.open;
    return (
      <Card className="mb-3.5 rounded-[15px] border-l-[6px] p-[18px] shadow-sm" asChild style={{ borderLeftColor: st.border }}>
        <TouchableOpacity
          onPress={() => {
            setSelectedItem(item);
            setReply(item.response || "");
            setModalVisible(true);
          }}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] font-bold text-primary">
              Kamar {item.room?.room_number || "-"} • {item.tenant?.name || "User"}
            </Text>
            <Badge className="px-2.5 py-1" variant={item.status === "open" ? "destructive" : item.status === "in_progress" ? "warning" : "success"}>
              <Text className="text-[10px] font-bold text-white">{st.label}</Text>
            </Badge>
          </View>
          <Text className="text-base font-bold text-foreground">{item.title}</Text>
          <Text className="mt-1.5 text-[13px] text-muted-foreground" numberOfLines={2}>
            {item.description}
          </Text>
          <Text className="mt-2.5 text-right text-[11px] text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString("id-ID")}
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* KOMPONEN GLOBAL ALERT KAMU */}
      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      <ScreenHeader
        title="Laporan Tenant"
        right={
          <TouchableOpacity onPress={onRefresh} className="rounded-xl bg-white/20 p-2">
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>
        }
      >
        <View className="mt-5 flex-row items-center justify-around rounded-[20px] bg-white/15 px-1 py-3.5">
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white">{stats.pending}</Text>
            <Text className="mt-1 text-[10px] font-semibold text-white/80">Pending</Text>
          </View>
          <View className="h-8 w-px bg-white/30" />
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white">{stats.process}</Text>
            <Text className="mt-1 text-[10px] font-semibold text-white/80">Proses</Text>
          </View>
          <View className="h-8 w-px bg-white/30" />
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white">{stats.resolved}</Text>
            <Text className="mt-1 text-[10px] font-semibold text-white/80">Selesai</Text>
          </View>
        </View>
      </ScreenHeader>

      <View className="flex-row justify-around border-b border-border bg-card py-3.5">
        {["all", "open", "process", "resolved"].map((status) => (
          <TouchableOpacity
            key={status}
            className={`rounded-full px-3.5 py-1.5 ${filterStatus === status ? "bg-destructive" : "bg-muted/60"}`}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              className={`text-[11px] font-bold ${filterStatus === status ? "text-white" : "text-muted-foreground"}`}
            >
              {status === "all"
                ? "All"
                : status === "open"
                  ? "PENDING"
                  : status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="p-5">
          <Skeleton className="h-24 w-full rounded-[15px]" />
          <Skeleton className="mt-3.5 h-24 w-full rounded-[15px]" />
          <Skeleton className="mt-3.5 h-24 w-full rounded-[15px]" />
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => (item.id || item.uuid).toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#b21f1f"]}
              tintColor="#b21f1f"
            />
          }
          contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
          ListEmptyComponent={
            <Text className="mt-24 text-center text-muted-foreground">Tidak ada laporan aktif.</Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-[30px] bg-card p-6" style={{ maxHeight: SCREEN_HEIGHT * 0.85 }}>
            <Text className="mb-4 text-center text-xl font-bold text-foreground">Respon Laporan</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">Keluhan Tenant:</Text>
              <View className="mb-4 rounded-xl border border-dashed border-border bg-muted/50 p-3">
                <Text className="text-sm leading-5 text-foreground">
                  {selectedItem?.description}
                </Text>
              </View>

              <Label className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">Tulis Pesan / Solusi:</Label>
              <Input
                className="mb-5 h-24 items-start rounded-xl border-border bg-muted/50 p-3.5 text-align-top"
                placeholder="Pesan akan dikirim sebagai notifikasi..."
                multiline
                numberOfLines={4}
                value={reply}
                onChangeText={setReply}
              />

              <View className="mb-2.5 flex-row justify-between">
                <Button variant="warning" className="flex-[0.48] rounded-xl p-4" onPress={() => handleUpdateStatus("process")}>
                  <Ionicons name="construct-outline" size={18} color="white" />
                  <Text className="ml-1 font-bold text-white"> Proses</Text>
                </Button>
                <Button variant="success" className="flex-[0.48] rounded-xl p-4" onPress={() => handleUpdateStatus("resolved")}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="white"
                  />
                  <Text className="ml-1 font-bold text-white"> Selesai</Text>
                </Button>
              </View>

              <TouchableOpacity
                className="items-center py-3.5"
                style={{ marginBottom: insets.bottom }}
                onPress={() => setModalVisible(false)}
              >
                <Text className="font-bold text-muted-foreground">Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
