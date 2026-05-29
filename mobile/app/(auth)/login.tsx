import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { router } from "expo-router";

type Mode = "login" | "signup";

export default function LoginScreen() {
  const { loginWithEmail, signupWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) return;
    if (mode === "signup" && !displayName) return;
    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, displayName);
      }
      router.replace("/(app)/groups");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>mitH</Text>
        <Text style={styles.subtitle}>みんなで管理するお金アプリ</Text>

        {/* Mode toggle */}
        <View style={styles.toggle}>
          {(["login", "signup"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === "login" ? "ログイン" : "新規登録"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "signup" && (
          <TextInput
            style={styles.input}
            placeholder="お名前"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="none"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="パスワード（6文字以上）"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {mode === "login" ? "ログイン" : "アカウント作成"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF6FF" },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
  },
  toggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: "#2563EB" },
  toggleText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  toggleTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 12,
  },
  error: { color: "#EF4444", fontSize: 13, marginBottom: 8, textAlign: "center" },
  btn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
