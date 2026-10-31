import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAlert from "../../components/GlobalAlert";
import { API_URL } from "../../helpers/api";
import styles from "../../styles/tenantChangePassword.styles";

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

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

  const handleChangePassword = async () => {
    if (
      !form.current_password.trim() ||
      !form.new_password.trim() ||
      !form.new_password_confirmation.trim()
    ) {
      return showAlert("Peringatan", "Semua kolom password wajib diisi.", "warning");
    }

    if (form.new_password.length < 8) {
      return showAlert("Peringatan", "Password baru minimal terdiri dari 8 karakter.", "warning");
    }

    if (form.new_password !== form.new_password_confirmation) {
      return showAlert(
        "Peringatan",
        "Konfirmasi password baru tidak cocok. Periksa kembali input Anda.",
        "warning"
      );
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const cleanToken = token ? token.replace(/"/g, "").trim() : "";

      await axios.post(`${API_URL}/change-password`, form, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
        },
      });

      showAlert(
        "Berhasil",
        "Password Anda telah berhasil diperbarui. Silakan gunakan password baru pada sesi masuk berikutnya.",
        "success",
        () => router.back()
      );
    } catch (error) {
      console.log("Change Password Error:", error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message ||
        "Gagal mengubah password. Pastikan password lama Anda benar.";
      showAlert("Gagal", errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
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
          <Text style={styles.headerTitle}>Ubah Password</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#4e73df" />
            <Text style={styles.instruction}>
              Gunakan kombinasi minimal 8 karakter dengan angka dan huruf demi keamanan akun Anda.
            </Text>
          </View>

          {/* Current Password */}
          <Text style={styles.inputLabel}>Password Lama *</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={18} color="#4e73df" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Masukkan password saat ini"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPass.old}
              value={form.current_password}
              onChangeText={(text) => setForm({ ...form, current_password: text })}
            />
            <TouchableOpacity onPress={() => setShowPass({ ...showPass, old: !showPass.old })}>
              <Ionicons
                name={showPass.old ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <Text style={styles.inputLabel}>Password Baru (Min. 8 Karakter) *</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="key-outline" size={18} color="#4e73df" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Masukkan password baru"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPass.new}
              value={form.new_password}
              onChangeText={(text) => setForm({ ...form, new_password: text })}
            />
            <TouchableOpacity onPress={() => setShowPass({ ...showPass, new: !showPass.new })}>
              <Ionicons
                name={showPass.new ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {/* Confirmation */}
          <Text style={styles.inputLabel}>Konfirmasi Password Baru *</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="checkmark-done-outline" size={18} color="#4e73df" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Ketik ulang password baru"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPass.confirm}
              value={form.new_password_confirmation}
              onChangeText={(text) => setForm({ ...form, new_password_confirmation: text })}
            />
            <TouchableOpacity onPress={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}>
              <Ionicons
                name={showPass.confirm ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.8 }]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#0f172a", "#1e3a8a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveBtnText}>SIMPAN PASSWORD BARU</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={alertConfig.onConfirm}
      />
    </KeyboardAvoidingView>
  );
}
