import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useProfile } from "../../../hooks/useProfile";
import { getGroupByInviteCode, addMemberToGroup } from "../../../lib/firestore";
import type { GroupMember } from "../../../types";

type Step = "input" | "confirm" | "done";

export default function JoinScreen() {
  const { profile } = useProfile();
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundId, setFoundId] = useState("");
  const [foundName, setFoundName] = useState("");
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [groupDisplayName, setGroupDisplayName] = useState("");

  const normalizeCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const handleLookup = async () => {
    if (!profile || code.length < 8) return;
    setError("");
    setLoading(true);
    try {
      const group = await getGroupByInviteCode(code);
      if (!group) { setError("招待コードが見つかりません"); return; }
      setFoundId(group.id);
      setFoundName(group.name);
      setAlreadyMember(group.members.some((m) => m.uid === profile.uid));
      setGroupDisplayName(profile.displayName);
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const group = await getGroupByInviteCode(code);
      if (!group) { setError("グループが見つかりません"); setStep("input"); return; }
      const newMember: GroupMember = {
        uid: profile.uid,
        displayName: groupDisplayName.trim() || profile.displayName,
        email: "",
        role: "member",
        joinedAt: new Date().toISOString(),
      };
      await addMemberToGroup(group.id, [...group.members, newMember]);
      setStep("done");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        {step === "input" && (
          <>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={styles.title}>グループに参加</Text>
            <Text style={styles.subtitle}>招待コードを入力してください</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="XXXXXXXX"
              value={code}
              onChangeText={(v) => setCode(normalizeCode(v))}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity
              style={[styles.btn, (loading || code.length < 8) && styles.btnDisabled]}
              onPress={handleLookup}
              disabled={loading || code.length < 8}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>グループを検索</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === "confirm" && (
          <>
            <Text style={styles.emoji}>👥</Text>
            <Text style={styles.title}>グループが見つかりました</Text>
            <View style={styles.groupBox}>
              <Text style={styles.groupName}>{foundName}</Text>
              <Text style={styles.groupCode}>{code}</Text>
            </View>
            {alreadyMember ? (
              <>
                <Text style={styles.subtitle}>すでにメンバーです</Text>
                <TouchableOpacity style={styles.btn} onPress={() => router.push(`/(app)/groups/${foundId}`)}>
                  <Text style={styles.btnText}>グループを開く</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.nameField}>
                  <Text style={styles.nameLabel}>このグループでの名前</Text>
                  <TextInput
                    style={styles.nameInput}
                    value={groupDisplayName}
                    onChangeText={setGroupDisplayName}
                    placeholder={profile?.displayName ?? "名前"}
                  />
                  <Text style={styles.nameHint}>グループ内での表示名です。後から変更できます。</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStep("input"); setError(""); }}>
                    <Text style={styles.cancelBtnText}>戻る</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { flex: 1 }, loading && styles.btnDisabled]}
                    onPress={handleJoin}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>参加する</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}

        {step === "done" && (
          <>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>参加しました！</Text>
            <Text style={styles.subtitle}>{foundName} のメンバーになりました</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.push(`/(app)/groups/${foundId}`)}>
              <Text style={styles.btnText}>グループを開く</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#1E293B", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#94A3B8", marginBottom: 24, textAlign: "center" },
  codeInput: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 14,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 6,
    color: "#1E293B",
    backgroundColor: "#fff",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  error: { color: "#EF4444", fontSize: 13, marginBottom: 12 },
  nameField: { width: "100%", marginBottom: 20 },
  nameLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  nameInput: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#fff",
  },
  nameHint: { fontSize: 11, color: "#94A3B8", marginTop: 4 },
  btn: {
    width: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  groupBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  groupName: { fontSize: 20, fontWeight: "700", color: "#1D4ED8" },
  groupCode: { fontSize: 13, color: "#93C5FD", marginTop: 4 },
  buttonRow: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#64748B", fontWeight: "500" },
});
