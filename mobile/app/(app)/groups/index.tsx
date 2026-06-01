import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useEffect, useState } from "react";
import { router, useNavigation } from "expo-router";
import { useProfile } from "../../../hooks/useProfile";
import { getUserGroups, createGroup } from "../../../lib/firestore";
import type { Group, GroupMember } from "../../../types";

export default function GroupsScreen() {
  const { profile } = useProfile();
  const navigation = useNavigation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerDisplayName, setOwnerDisplayName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: "mitH" });
  }, []);

  useEffect(() => {
    if (profile) setOwnerDisplayName(profile.displayName);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    getUserGroups(profile.uid).then((gs) => {
      setGroups(gs);
      setLoading(false);
    });
  }, [profile]);

  const handleCreate = async () => {
    if (!profile || !name.trim()) return;
    setCreating(true);
    const owner: GroupMember = {
      uid: profile.uid,
      displayName: ownerDisplayName.trim() || profile.displayName,
      email: "",
      role: "owner",
      joinedAt: new Date().toISOString(),
    };
    const { id, inviteCode } = await createGroup(name.trim(), description.trim(), owner);
    setGroups((prev) => [
      ...prev,
      {
        id,
        name: name.trim(),
        description: description.trim(),
        members: [owner],
        createdBy: profile.uid,
        createdAt: new Date().toISOString(),
        currency: "JPY",
        inviteCode,
      },
    ]);
    setName("");
    setDescription("");
    setOwnerDisplayName(profile.displayName);
    setShowCreate(false);
    setCreating(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyTitle}>グループがありません</Text>
            <Text style={styles.emptyText}>グループを作って家族や友人と共有しましょう</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/groups/${item.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardMeta}>{item.members.length}人</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(app)/join")}>
          <Text style={styles.secondaryBtnText}>🔑 コードで参加</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.primaryBtnText}>+ 新規作成</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>グループを作成</Text>
            <TextInput
              style={styles.input}
              placeholder="グループ名（例: 田中家）"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="説明（任意）"
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.inputLabel}>このグループでの名前</Text>
            <TextInput
              style={styles.input}
              placeholder={profile?.displayName ?? "名前"}
              value={ownerDisplayName}
              onChangeText={setOwnerDisplayName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, creating && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.confirmBtnText}>{creating ? "作成中…" : "作成"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 4 },
  emptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardName: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  cardDesc: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardMeta: { fontSize: 13, color: "#94A3B8" },
  chevron: { fontSize: 20, color: "#CBD5E1" },
  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#2563EB", fontWeight: "600", fontSize: 14 },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  inputLabel: { fontSize: 12, color: "#64748B", marginBottom: 4, marginTop: -4 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: { color: "#64748B", fontWeight: "500" },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "600" },
});
