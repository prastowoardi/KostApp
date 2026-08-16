import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
  children,
  colors = ['#1a2a6c', '#b21f1f'],
}) {
  const router = useRouter();

  return (
    <LinearGradient colors={colors} className="rounded-b-[30px] px-5 pb-7 pt-14">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onBack || (() => router.back())}
          className="rounded-xl bg-white/20 p-2"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="ml-3 flex-1">
          <Text className="text-xl font-bold text-white">{title}</Text>
          {subtitle ? <Text className="mt-0.5 text-xs text-white/70">{subtitle}</Text> : null}
        </View>
        {right || <View className="w-10" />}
      </View>
      {children}
    </LinearGradient>
  );
}
