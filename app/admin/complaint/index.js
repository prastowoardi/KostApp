import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../../components/GlobalAlert";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AdminComplaints() {
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

  const fetchComplaints = async () => {
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
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

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
        `${API_URL}/admin/complaints/${selectedItem.id}/respond`,
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderLeftColor:
            item.status === "open"
              ? "#e74a3b"
              : item.status === "in_progress"
                ? "#f6c23e"
                : "#1cc88a",
        },
      ]}
      onPress={() => {
        setSelectedItem(item);
        setReply(item.response || "");
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.roomText}>
          Kamar {item.room?.room_number || "-"} • {item.tenant?.name || "User"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "open"
                  ? "#ffeaea"
                  : item.status === "in_progress"
                    ? "#fff4e5"
                    : "#eafaf1",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "open"
                    ? "#e74a3b"
                    : item.status === "in_progress"
                      ? "#d39e00"
                      : "#1cc88a",
              },
            ]}
          >
            {item.status === "in_progress"
              ? "PROSES"
              : item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.descText} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.dateText}>
        {new Date(item.created_at).toLocaleDateString("id-ID")}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* KOMPONEN GLOBAL ALERT KAMU */}
      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      <LinearGradient colors={["#1a2a6c", "#b21f1f"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Laporan Tenant</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { borderBottomColor: "#e74a3b" }]}>
          <Text style={styles.statsNumber}>{stats.pending}</Text>
          <Text style={styles.statsLabel}>Pending</Text>
        </View>
        <View style={[styles.statsCard, { borderBottomColor: "#f6c23e" }]}>
          <Text style={styles.statsNumber}>{stats.process}</Text>
          <Text style={styles.statsLabel}>Proses</Text>
        </View>
        <View style={[styles.statsCard, { borderBottomColor: "#1cc88a" }]}>
          <Text style={styles.statsNumber}>{stats.resolved}</Text>
          <Text style={styles.statsLabel}>Selesai</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {["all", "open", "process", "resolved"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterBtn,
              filterStatus === status && styles.filterBtnActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === status && styles.filterTextActive,
              ]}
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
        <ActivityIndicator
          size="large"
          color="#b21f1f"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item.id.toString()}
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
            <Text style={styles.emptyText}>Tidak ada laporan aktif.</Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Respon Laporan</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Keluhan Tenant:</Text>
              <View style={styles.bubbleTenant}>
                <Text style={styles.modalDesc}>
                  {selectedItem?.description}
                </Text>
              </View>

              <Text style={styles.modalLabel}>Tulis Pesan / Solusi:</Text>
              <TextInput
                style={styles.input}
                placeholder="Pesan akan dikirim sebagai notifikasi..."
                multiline
                numberOfLines={4}
                value={reply}
                onChangeText={setReply}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#f6c23e" }]}
                  onPress={() => handleUpdateStatus("process")}
                >
                  <Ionicons name="construct-outline" size={18} color="white" />
                  <Text style={styles.btnText}> Proses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#1cc88a" }]}
                  onPress={() => handleUpdateStatus("resolved")}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="white"
                  />
                  <Text style={styles.btnText}> Selesai</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#858796", fontWeight: "bold" }}>
                  Tutup
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  header: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -35,
    marginBottom: 10,
  },
  statsCard: {
    flex: 0.31,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    elevation: 4,
    borderBottomWidth: 4,
  },
  statsNumber: { fontSize: 18, fontWeight: "bold", color: "#2c3e50" },
  statsLabel: {
    fontSize: 10,
    color: "#858796",
    marginTop: 2,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f1f3f9",
  },
  filterBtnActive: { backgroundColor: "#b21f1f" },
  filterText: { fontSize: 11, fontWeight: "bold", color: "#858796" },
  filterTextActive: { color: "white" },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    borderLeftWidth: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roomText: { fontWeight: "bold", color: "#4e73df", fontSize: 13 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "bold" },
  titleText: { fontSize: 16, fontWeight: "bold", color: "#2c3e50" },
  descText: { fontSize: 13, color: "#858796", marginTop: 5 },
  dateText: { fontSize: 11, color: "#ccc", marginTop: 10, textAlign: "right" },
  emptyText: { textAlign: "center", marginTop: 100, color: "#858796" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#34495e",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  bubbleTenant: {
    backgroundColor: "#f8f9fc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#d1d3e2",
  },
  modalDesc: { fontSize: 14, color: "#2c3e50", lineHeight: 20 },
  input: {
    backgroundColor: "#f1f3f9",
    borderRadius: 12,
    padding: 15,
    textAlignVertical: "top",
    marginBottom: 20,
    height: 100,
    borderWidth: 1,
    borderColor: "#d1d3e2",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalBtn: {
    flex: 0.48,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    flexDirection: "row",
    justifyContent: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
  closeBtn: { alignItems: "center", paddingVertical: 15 },
});
