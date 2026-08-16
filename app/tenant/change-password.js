import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import GlobalAlert from "../../components/GlobalAlert";
import ScreenHeader from "../../components/ScreenHeader";
import { API_URL } from "../../helpers/api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

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

  const insets = useSafeAreaInsets();
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

      await axios.post(`${API_URL}/change-password`, form, {        headers: {
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
      className="flex-1 bg-background"
    >
      <StatusBar barStyle="light-content" />

      <ScreenHeader title="Ganti Password" />

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="p-6 shadow-sm">
          <Text className="mb-6 text-sm leading-5 text-muted-foreground">
            Demi keamanan, silakan masukkan password lama Anda sebelum membuat
            password baru.
          </Text>

          {/* Password Lama */}
          <View className="mb-5">
            <Text className="mb-2 text-[13px] font-bold uppercase text-primary">Password Saat Ini</Text>
            <View className="flex-row items-center rounded-[15px] border border-border bg-muted/50 px-3.5">
              <Ionicons
                name="lock-open-outline"
                size={20}
                color="#858796"
                style={{ marginRight: 10 }}
              />
              <TextInput
                className="flex-1 py-3.5 text-[15px] text-foreground"
                placeholder="Masukkan password lama"
                placeholderTextColor="hsl(var(--muted-foreground))"
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
          <View className="mb-5">
            <Text className="mb-2 text-[13px] font-bold uppercase text-primary">Password Baru</Text>
            <View className="flex-row items-center rounded-[15px] border border-border bg-muted/50 px-3.5">
              <Ionicons
                name="key-outline"
                size={20}
                color="#858796"
                style={{ marginRight: 10 }}
              />
              <TextInput
                className="flex-1 py-3.5 text-[15px] text-foreground"
                placeholder="Minimal 8 karakter"
                placeholderTextColor="hsl(var(--muted-foreground))"
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
          <View className="mb-5">
            <Text className="mb-2 text-[13px] font-bold uppercase text-primary">Ulangi Password Baru</Text>
            <View className="flex-row items-center rounded-[15px] border border-border bg-muted/50 px-3.5">
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#858796"
                style={{ marginRight: 10 }}
              />
              <TextInput
                className="flex-1 py-3.5 text-[15px] text-foreground"
                placeholder="Ketik ulang password baru"
                placeholderTextColor="hsl(var(--muted-foreground))"
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

          <Button
            className="mt-2.5 h-[58px] rounded-[15px]"
            style={{ marginBottom: insets.bottom }}
            onPress={handleChangePassword}
            disabled={loading}
            loading={loading}
          >
            {!loading && (
              <>
                <Text className="text-base font-bold text-white">Simpan Perubahan</Text>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color="white"
                  style={{ marginLeft: 10 }}
                />
              </>
            )}
          </Button>
        </Card>
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
