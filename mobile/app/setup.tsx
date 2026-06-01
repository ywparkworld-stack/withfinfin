import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useProfile } from "../hooks/useProfile";

export default function SetupScreen() {
  const { saveProfile } = useProfile();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await saveProfile(name.trim());
    router.replace("/(app)/groups");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>mitH</Text>
        <Text style={styles.tagline}>みんなで管理するお金アプリ</Text>

        <Text style={styles.label}>あなたの名前を教えてください</Text>
        <TextInput
          style={styles.input}
          placeholder="例: パパ、ママ、たろう"
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleStart}
        />

        <TouchableOpacity
          style={[styles.btn, (!name.trim() || saving) && styles.btnDisabled]}
          onPress={handleStart}
          disabled={!name.trim() || saving}
        >
          <Text style={styles.btnText}>はじめる</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF6FF" },
  inner: { flex: 1, justifyContent: "center", padding: 36 },
  logo: {
    fontSize: 40,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 48,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
