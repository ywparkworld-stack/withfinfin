import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useAuth } from "../../../hooks/useAuth";
import {
  getGroup,
  getTransactions,
  addTransaction,
  deleteTransaction,
  regenerateInviteCode,
  updateMemberColor,
} from "../../../lib/firestore";
import type { Group, Transaction, Category } from "../../../types";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "../../../types";

type Tab = "transactions" | "category";

const COLORS = [
  "#3B82F6","#EF4444","#22C55E","#A855F7",
  "#F97316","#EC4899","#0D9488","#CA8A04",
];

const INCOME_CATS: Category[] = ["salary", "other"];
const EXPENSE_CATS: Category[] = [
  "food","transport","utilities","entertainment",
  "healthcare","education","shopping","housing","other",
];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tab, setTab] = useState<Tab>("transactions");
  const [loading, setLoading] = useState(true);

  // Add transaction form
  const [showForm, setShowForm] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState<Category>("food");
  const [txDesc, setTxDesc] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  // Invite code
  const [showInvite, setShowInvite] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Color picker
  const [colorTarget, setColorTarget] = useState<string | null>(null);

  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([getGroup(id), getTransactions(id, selectedMonth)]).then(([g, txs]) => {
      setGroup(g);
      setTransactions(txs);
      setLoading(false);
      navigation.setOptions({ title: g?.name ?? "グループ" });
    });
  }, [id, user, selectedMonth]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const memberColors: Record<string, string> = {};
  if (group) {
    for (const m of group.members) {
      if (m.color) memberColors[m.uid] = m.color;
    }
  }

  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  const handleAddTx = async () => {
    if (!user || !group || !txAmount) return;
    setSaving(true);
    try {
      const txId = await addTransaction({
        type: txType,
        amount: Number(txAmount),
        category: txCategory,
        description: txDesc,
        date: txDate,
        groupId: id,
        createdBy: user.uid,
        createdByName: user.displayName ?? user.email ?? "unknown",
      });
      setTransactions((prev) => [
        {
          id: txId,
          type: txType,
          amount: Number(txAmount),
          category: txCategory,
          description: txDesc,
          date: txDate,
          groupId: id,
          createdBy: user.uid,
          createdByName: user.displayName ?? user.email ?? "unknown",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTxAmount("");
      setTxDesc("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (txId: string) => {
    Alert.alert("削除", "この記録を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(id, txId);
          setTransactions((prev) => prev.filter((t) => t.id !== txId));
        },
      },
    ]);
  };

  const handleRegenerate = async () => {
    if (!group) return;
    setRegenerating(true);
    const newCode = await regenerateInviteCode(id);
    setGroup((prev) => prev ? { ...prev, inviteCode: newCode } : prev);
    setRegenerating(false);
  };

  const handleColorChange = async (color: string) => {
    if (!user || !group) return;
    await updateMemberColor(id, user.uid, color, group.members);
    setGroup((prev) =>
      prev ? { ...prev, members: prev.members.map((m) => m.uid === user.uid ? { ...m, color } : m) } : prev
    );
    setColorTarget(null);
  };

  const scrollToList = () => {
    setTab("transactions");
    setTimeout(() => listRef.current?.scrollTo({ y: 400, animated: true }), 50);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  if (!group) return <View style={styles.center}><Text>グループが見つかりません</Text></View>;

  const isOwner = user?.uid === group.createdBy;
  const cats = txType === "income" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <View style={styles.container}>
      <ScrollView ref={listRef} contentContainerStyle={styles.scroll}>
        {/* ── BALANCE HERO CARD ── */}
        <TouchableOpacity style={styles.heroCard} onPress={scrollToList} activeOpacity={0.8}>
          {/* Members row */}
          <View style={styles.membersRow}>
            {group.members.map((m, i) => (
              <Text key={m.uid} style={[styles.memberName, m.color ? { color: m.color } : null]}>
                {m.displayName}{i < group.members.length - 1 ? "、" : ""}
              </Text>
            ))}
          </View>

          {/* Month selector */}
          <View style={styles.monthRow}>
            <TouchableOpacity
              onPress={() => {
                const d = new Date(selectedMonth + "-01");
                d.setMonth(d.getMonth() - 1);
                setSelectedMonth(d.toISOString().slice(0, 7));
              }}
            >
              <Text style={styles.monthArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {new Date(selectedMonth + "-01").toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const d = new Date(selectedMonth + "-01");
                d.setMonth(d.getMonth() + 1);
                setSelectedMonth(d.toISOString().slice(0, 7));
              }}
            >
              <Text style={styles.monthArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Balance */}
          <Text style={styles.balanceLabel}>残高</Text>
          <Text style={[styles.balanceAmount, { color: balance >= 0 ? "#1D4ED8" : "#DC2626" }]}>
            {balance >= 0 ? "+" : ""}{balance.toLocaleString("ja-JP")}円
          </Text>
          <Text style={styles.historyHint}>履歴を見る ↓</Text>

          {/* Income / Expense */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>収入</Text>
              <Text style={styles.summaryIncome}>+{totalIncome.toLocaleString("ja-JP")}円</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>支出</Text>
              <Text style={styles.summaryExpense}>-{totalExpense.toLocaleString("ja-JP")}円</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── TABS ── */}
        <View style={styles.tabs}>
          {(["transactions", "category"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "transactions" ? "取引一覧" : "カテゴリ別"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TRANSACTION LIST ── */}
        {tab === "transactions" && (
          <View style={styles.card}>
            {transactions.length === 0 ? (
              <View style={styles.emptyList}>
                <Text style={{ fontSize: 32 }}>📊</Text>
                <Text style={styles.emptyListText}>まだ記録がありません</Text>
              </View>
            ) : (
              transactions.map((tx, i) => (
                <View key={tx.id} style={[styles.txRow, i > 0 && styles.txDivider]}>
                  <Text style={styles.txIcon}>{CATEGORY_ICONS[tx.category]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>{tx.description || CATEGORY_LABELS[tx.category]}</Text>
                    <Text style={styles.txMeta}>
                      {tx.date} ·{" "}
                      <Text style={memberColors[tx.createdBy] ? { color: memberColors[tx.createdBy], fontWeight: "600" } : {}}>
                        {tx.createdByName}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, tx.type === "income" ? styles.incomeColor : styles.expenseColor]}>
                      {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("ja-JP")}円
                    </Text>
                    {tx.createdBy === user?.uid && (
                      <TouchableOpacity onPress={() => handleDelete(tx.id)}>
                        <Text style={styles.deleteBtn}>削除</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── CATEGORY BREAKDOWN ── */}
        {tab === "category" && (
          <View style={styles.card}>
            {Object.entries(expenseByCategory).length === 0 ? (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>支出の記録がありません</Text>
              </View>
            ) : (
              Object.entries(expenseByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount], i) => (
                  <View key={cat} style={[styles.catRow, i > 0 && styles.txDivider]}>
                    <Text style={styles.catName}>{CATEGORY_LABELS[cat as Category] ?? cat}</Text>
                    <Text style={styles.catAmount}>{amount.toLocaleString("ja-JP")}円</Text>
                  </View>
                ))
            )}
          </View>
        )}

        {/* ── INVITE CODE ── */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowInvite((v) => !v)}
          >
            <Text style={styles.sectionTitle}>招待コード</Text>
            <Text style={styles.sectionToggle}>{showInvite ? "隠す" : "表示"}</Text>
          </TouchableOpacity>
          {showInvite && (
            <View>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{group.inviteCode}</Text>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => setCodeCopied(true)}
                >
                  <Text style={styles.copyBtnText}>{codeCopied ? "✓" : "コピー"}</Text>
                </TouchableOpacity>
              </View>
              {isOwner && (
                <TouchableOpacity
                  style={styles.regenBtn}
                  onPress={handleRegenerate}
                  disabled={regenerating}
                >
                  <Text style={styles.regenBtnText}>{regenerating ? "更新中…" : "コードを再発行"}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── MEMBERS ── */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>メンバー（{group.members.length}人）</Text>
          {group.members.map((m) => (
            <View key={m.uid}>
              <View style={styles.memberRow}>
                <Text style={[styles.memberRowName, m.color ? { color: m.color } : null]}>
                  {m.displayName}
                  {m.uid === user?.uid && <Text style={styles.meLabel}> (自分)</Text>}
                </Text>
                <View style={styles.memberRowRight}>
                  <Text style={styles.roleLabel}>{m.role === "owner" ? "オーナー" : "メンバー"}</Text>
                  {m.uid === user?.uid && (
                    <TouchableOpacity
                      style={styles.colorChangeBtn}
                      onPress={() => setColorTarget(colorTarget === m.uid ? null : m.uid)}
                    >
                      <Text style={styles.colorChangeBtnText}>色を変更</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {colorTarget === m.uid && (
                <View style={styles.palette}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        m.color === c && styles.colorSwatchSelected,
                      ]}
                      onPress={() => handleColorChange(c)}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+ 記録</Text>
      </TouchableOpacity>

      {/* ── ADD TRANSACTION MODAL ── */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>収支を記録</Text>

            {/* Type toggle */}
            <View style={styles.typeToggle}>
              {(["expense", "income"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    txType === t && (t === "expense" ? styles.typeBtnExpense : styles.typeBtnIncome),
                  ]}
                  onPress={() => {
                    setTxType(t);
                    setTxCategory(t === "income" ? "salary" : "food");
                  }}
                >
                  <Text style={[styles.typeBtnText, txType === t && { color: "#fff" }]}>
                    {t === "expense" ? "支出" : "収入"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder="金額"
              value={txAmount}
              onChangeText={setTxAmount}
              keyboardType="number-pad"
            />

            {/* Category */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, txCategory === c && styles.catChipActive]}
                  onPress={() => setTxCategory(c)}
                >
                  <Text style={[styles.catChipText, txCategory === c && styles.catChipTextActive]}>
                    {CATEGORY_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="メモ（任意）"
              value={txDesc}
              onChangeText={setTxDesc}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, saving && { opacity: 0.5 }]}
                onPress={handleAddTx}
                disabled={saving}
              >
                <Text style={styles.confirmBtnText}>{saving ? "保存中…" : "保存"}</Text>
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
  scroll: { padding: 16 },

  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  membersRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  memberName: { fontSize: 13, color: "#94A3B8" },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  monthArrow: { fontSize: 22, color: "#94A3B8", paddingHorizontal: 12 },
  monthLabel: { fontSize: 14, fontWeight: "600", color: "#475569", width: 120, textAlign: "center" },
  balanceLabel: { textAlign: "center", fontSize: 12, color: "#94A3B8", marginBottom: 4 },
  balanceAmount: { textAlign: "center", fontSize: 40, fontWeight: "800" },
  historyHint: { textAlign: "center", fontSize: 11, color: "#CBD5E1", marginTop: 4, marginBottom: 16 },
  summaryRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 14 },
  summaryCol: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: "#F1F5F9" },
  summaryLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 2 },
  summaryIncome: { fontSize: 17, fontWeight: "700", color: "#16A34A" },
  summaryExpense: { fontSize: 17, fontWeight: "700", color: "#DC2626" },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#2563EB" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#64748B" },
  tabTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  emptyList: { alignItems: "center", paddingVertical: 24 },
  emptyListText: { color: "#94A3B8", fontSize: 14, marginTop: 8 },

  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  txDivider: { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  txIcon: { fontSize: 22, marginRight: 10 },
  txTitle: { fontSize: 14, fontWeight: "500", color: "#1E293B" },
  txMeta: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "700" },
  incomeColor: { color: "#16A34A" },
  expenseColor: { color: "#DC2626" },
  deleteBtn: { fontSize: 11, color: "#CBD5E1", marginTop: 2 },

  catRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  catName: { fontSize: 14, color: "#374151" },
  catAmount: { fontSize: 14, fontWeight: "600", color: "#1E293B" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  sectionToggle: { fontSize: 13, color: "#2563EB" },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeText: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontFamily: "monospace",
  },
  copyBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  copyBtnText: { color: "#fff", fontWeight: "600" },
  regenBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  regenBtnText: { color: "#EF4444", fontSize: 13 },

  memberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  memberRowName: { fontSize: 15, fontWeight: "500", color: "#1E293B" },
  meLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "400" },
  memberRowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleLabel: { fontSize: 12, color: "#94A3B8" },
  colorChangeBtn: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  colorChangeBtnText: { fontSize: 12, color: "#2563EB" },
  palette: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 8 },
  colorSwatch: { width: 30, height: 30, borderRadius: 15 },
  colorSwatchSelected: { borderWidth: 3, borderColor: "#1E293B" },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: "#2563EB",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 13,
    shadowColor: "#2563EB",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 14,
  },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  typeBtnExpense: { backgroundColor: "#EF4444" },
  typeBtnIncome: { backgroundColor: "#22C55E" },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  amountInput: { fontSize: 22, textAlign: "right", fontWeight: "700" },
  catScroll: { marginBottom: 12 },
  catChip: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: "#F8FAFC",
  },
  catChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  catChipText: { fontSize: 13, color: "#64748B" },
  catChipTextActive: { color: "#fff" },
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
