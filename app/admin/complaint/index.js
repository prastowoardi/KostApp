import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../../components/GlobalAlert";
import { API_URL } from "../../../helpers/api";
import { formatDate } from "../../../helpers/formatters";

export default function AdminComplaints() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";
      const response = await axios.get(`${API_URL}/admin/complaints`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
        },
      });

      if (response.data && response.data.data) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        router.replace("/");
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
    const targetId = selectedItem?.uuid || selectedItem?.id;

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";
      await axios.post(
        `${API_URL}/admin/complaints/${targetId}/respond`,
        {
          status: dbStatus,
          response: reply,
        },
        {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            Accept: "application/json",
          },
        },
      );

      showAlert("Berhasil", "Laporan berhasil diperbarui.", "success");
      setModalVisible(false);
      setReply("");
      fetchComplaints();
    } catch (e) {
      showAlert(
        "Gagal",
        e.response?.data?.message || "Terjadi kesalahan sistem.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((item) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "open") return item.status === "open";
    if (filterStatus === "in_progress") return item.status === "in_progress";
    if (filterStatus === "resolved") return item.status === "resolved" || item.status === "closed";
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return { label: "Baru", bg: "#eff6ff", text: "#3b82f6" };
      case "in_progress":
        return { label: "Diproses", bg: "#fffbeb", text: "#f59e0b" };
      case "resolved":
        return { label: "Selesai", bg: "#ecfdf5", text: "#10b981" };
      case "closed":
        return { label: "Ditutup", bg: "#f1f5f9", text: "#64748b" };
      default:
        return { label: status, bg: "#f1f5f9", text: "#64748b" };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusBadge(item.status);
    const targetId = item.uuid || item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/admin/complaint/${targetId}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>
              {item.category ? item.category.toUpperCase() : "UMUM"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.tenantName}>
              {item.tenant?.user?.name || item.tenant?.name || "Penghuni"}
            </Text>
            <Text style={styles.roomText}>
              Kamar {item.room?.room_number || "-"} • {formatDate(item.created_at)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.quickRespondBtn}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedItem(item);
              setReply(item.response || "");
              setModalVisible(true);
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={15} color="#4e73df" />
            <Text style={styles.quickRespondText}>Respon</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={["#1a2a6c", "#b21f1f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Komplain Penghuni</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {[
            { key: "all", label: "Semua" },
            { key: "open", label: "Baru" },
            { key: "in_progress", label: "Diproses" },
            { key: "resolved", label: "Selesai" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filterStatus === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setFilterStatus(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#b21f1f" />
          <Text style={styles.loadingText}>Memuat komplain...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => (item.uuid || item.id || Math.random()).toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#b21f1f"]}
              tintColor="#b21f1f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Tidak Ada Komplain</Text>
              <Text style={styles.emptySubtitle}>
                Tidak ada laporan keluhan dengan status ini.
              </Text>
            </View>
          }
        />
      )}

      {/* Quick Respond Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tanggapi Komplain</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              {selectedItem?.title} • {selectedItem?.tenant?.name}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Tulis pesan/respon untuk penghuni..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={reply}
              onChangeText={setReply}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}
                onPress={() => handleUpdateStatus("process")}
                disabled={submitting}
              >
                <Ionicons name="time" size={16} color="#2563eb" />
                <Text style={[styles.modalBtnText, { color: "#2563eb" }]}>Proses</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#10b981", borderColor: "#10b981" }]}
                onPress={() => handleUpdateStatus("resolved")}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                    <Text style={[styles.modalBtnText, { color: "#ffffff" }]}>Selesaikan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  filterTabActive: {
    backgroundColor: "#ffffff",
  },
  filterTabText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: "#1a2a6c",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tenantName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  roomText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  quickRespondBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  quickRespondText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4e73df",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
