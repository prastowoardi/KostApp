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
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../../components/GlobalAlert";
import { API_URL } from "../../../helpers/api";
import { formatDate } from "../../../helpers/formatters";
import styles from "../../../styles/adminComplaint.styles";

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
        colors={["#0f172a", "#1e293b", "#1e3a8a"]}
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
          <ActivityIndicator size="large" color="#2563eb" />
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
              colors={["#2563eb"]}
              tintColor="#2563eb"
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
