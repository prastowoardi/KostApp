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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ChangePasswordScreen() {
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
  });

  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleChangePassword = async () => {
    if (
      !form.current_password ||
      !form.new_password ||
      !form.new_password_confirmation
    ) {
      return showAlert("Error", "Semua kolom harus diisi", "warning");
    }

    if (form.new_password.length < 8) {
      return showAlert("Error", "Password baru minimal 8 karakter", "warning");
    }

    if (form.new_password !== form.new_password_confirmation) {
      return showAlert(
        "Error",
        "Konfirmasi password baru tidak cocok",
        "warning",
      );
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");

      const response = await axios.post(`${API_URL}/change-password`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      showAlert(
        "Berhasil",
        "Password Anda telah berhasil diperbarui",
        "success",
      );

      setTimeout(() => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        router.back();
      }, 2000);
    } catch (error) {
      console.log("Change Password Error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Gagal mengubah password. Pastikan password lama benar.";
      showAlert("Gagal", errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={["#4e73df", "#224abe"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ganti Password</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.instruction}>
            Demi keamanan, silakan masukkan password lama Anda sebelum membuat
            password baru.
          </Text>

          {/* Password Lama */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password Saat Ini</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-open-outline"
                size={20}
                color="#858796"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password lama"
                secureTextEntry={!showPass.old}
                value={form.current_password}
                onChangeText={(val) =>
                  setForm({ ...form, current_password: val })
                }
              />
              <TouchableOpacity
                onPress={() => setShowPass({ ...showPass, old: !showPass.old })}
              >
                <Ionicons
                  name={showPass.old ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#858796"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Baru */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password Baru</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="key-outline"
                size={20}
                color="#858796"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Minimal 8 karakter"
                secureTextEntry={!showPass.new}
                value={form.new_password}
                onChangeText={(val) => setForm({ ...form, new_password: val })}
              />
              <TouchableOpacity
                onPress={() => setShowPass({ ...showPass, new: !showPass.new })}
              >
                <Ionicons
                  name={showPass.new ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#858796"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Konfirmasi Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ulangi Password Baru</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#858796"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ketik ulang password baru"
                secureTextEntry={!showPass.confirm}
                value={form.new_password_confirmation}
                onChangeText={(val) =>
                  setForm({ ...form, new_password_confirmation: val })
                }
              />
              <TouchableOpacity
                onPress={() =>
                  setShowPass({ ...showPass, confirm: !showPass.confirm })
                }
              >
                <Ionicons
                  name={showPass.confirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#858796"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.submitText}>Simpan Perubahan</Text>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color="white"
                  style={{ marginLeft: 10 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <GlobalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "white" },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  content: { padding: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  instruction: {
    fontSize: 14,
    color: "#858796",
    marginBottom: 25,
    lineHeight: 20,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4e73df",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fc",
    borderRadius: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e3e6f0",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: "#2c3e50" },
  submitBtn: {
    backgroundColor: "#4e73df",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
  },
  submitText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
