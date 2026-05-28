"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getGroup,
  getTransactions,
  addTransaction,
  deleteTransaction,
  getBudgets,
  regenerateInviteCode,
  updateMemberColor,
} from "@/lib/firestore";
import type { Group, Transaction, Budget, Category } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionList from "@/components/transactions/TransactionList";
import ColorPicker from "@/components/members/ColorPicker";


export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [colorPickerOpenFor, setColorPickerOpenFor] = useState<string | null>(null);
  const [savingColor, setSavingColor] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "budget">("transactions");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getGroup(groupId),
      getTransactions(groupId, selectedMonth),
      getBudgets(groupId, selectedMonth),
    ]).then(([g, txs, bgs]) => {
      setGroup(g);
      setTransactions(txs);
      setBudgets(bgs);
      setLoading(false);
    });
  }, [groupId, user, selectedMonth]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Expenses by category
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  const handleAddTransaction = async (data: {
    type: "income" | "expense";
    amount: number;
    category: Category;
    description: string;
    date: string;
  }) => {
    if (!user) return;
    const id = await addTransaction({
      ...data,
      groupId,
      createdBy: user.uid,
      createdByName: user.displayName ?? user.email ?? "unknown",
    });
    const newTx: Transaction = {
      id,
      ...data,
      groupId,
      createdBy: user.uid,
      createdByName: user.displayName ?? user.email ?? "unknown",
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    setShowForm(false);
  };

  const handleDelete = async (txId: string) => {
    await deleteTransaction(groupId, txId);
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
  };

  const handleCopyCode = async () => {
    if (!group?.inviteCode) return;
    await navigator.clipboard.writeText(group.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!group) return;
    setRegenerating(true);
    const newCode = await regenerateInviteCode(groupId);
    setGroup((prev) => prev ? { ...prev, inviteCode: newCode } : prev);
    setRegenerating(false);
  };

  const isOwner = user?.uid === group?.createdBy;

  const memberColorMap: Record<string, string> = {};
  if (group) {
    for (const m of group.members) {
      if (m.color) memberColorMap[m.uid] = m.color;
    }
  }

  const handleColorChange = async (color: string) => {
    if (!user || !group) return;
    setSavingColor(true);
    await updateMemberColor(groupId, user.uid, color, group.members);
    setGroup((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members.map((m) =>
              m.uid === user.uid ? { ...m, color } : m
            ),
          }
        : prev
    );
    setSavingColor(false);
    setColorPickerOpenFor(null);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!group) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <p className="text-center pt-20 text-gray-500">グループが見つかりません</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Balance hero card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-5">
            {/* Group name + members */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
                <p className="text-xs mt-0.5 flex flex-wrap gap-x-1">
                  {group.members.map((m, i) => (
                    <span key={m.uid}>
                      <span
                        style={m.color ? { color: m.color } : undefined}
                        className={m.color ? "font-medium" : "text-gray-400"}
                      >
                        {m.displayName}
                      </span>
                      {i < group.members.length - 1 && (
                        <span className="text-gray-300">, </span>
                      )}
                    </span>
                  ))}
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0"
              >
                + 記録
              </button>
            </div>

            {/* Month selector */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => {
                  const d = new Date(selectedMonth + "-01");
                  d.setMonth(d.getMonth() - 1);
                  setSelectedMonth(d.toISOString().slice(0, 7));
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ‹
              </button>
              <span className="text-sm font-medium text-gray-600 w-28 text-center">
                {new Date(selectedMonth + "-01").toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
              <button
                onClick={() => {
                  const d = new Date(selectedMonth + "-01");
                  d.setMonth(d.getMonth() + 1);
                  setSelectedMonth(d.toISOString().slice(0, 7));
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ›
              </button>
            </div>

            {/* Total balance */}
            <div className="text-center mb-5">
              <p className="text-xs text-gray-400 mb-1">残高</p>
              <p
                className="text-4xl font-bold tabular-nums"
                style={{ color: balance >= 0 ? "#1d4ed8" : "#dc2626" }}
              >
                {balance >= 0 ? "+" : ""}
                {balance.toLocaleString("ja-JP")}
                <span className="text-xl font-medium ml-1">円</span>
              </p>
            </div>

            {/* Income / Expense row */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 pt-4">
              <div className="text-center pr-4">
                <p className="text-xs text-gray-400 mb-0.5">収入</p>
                <p className="text-lg font-semibold text-green-600 tabular-nums">
                  +{totalIncome.toLocaleString("ja-JP")}円
                </p>
              </div>
              <div className="text-center pl-4">
                <p className="text-xs text-gray-400 mb-0.5">支出</p>
                <p className="text-lg font-semibold text-red-500 tabular-nums">
                  -{totalExpense.toLocaleString("ja-JP")}円
                </p>
              </div>
            </div>
          </div>

          {/* Add form modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h2 className="font-semibold text-gray-900 mb-4">収支を記録</h2>
                <TransactionForm
                  onSubmit={handleAddTransaction}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            {(["transactions", "budget"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab === "transactions" ? "取引一覧" : "カテゴリ別"}
              </button>
            ))}
          </div>

          {activeTab === "transactions" ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4">
              <TransactionList
                transactions={transactions}
                onDelete={handleDelete}
                currentUserId={user?.uid}
                memberColors={memberColorMap}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {Object.entries(expenseByCategory).length === 0 ? (
                <p className="text-center py-10 text-gray-400">支出の記録がありません</p>
              ) : (
                Object.entries(expenseByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => {
                    const budget = budgets.find((b) => b.category === cat);
                    const ratio = budget ? Math.min(amount / budget.amount, 1) : null;
                    return (
                      <div key={cat} className="px-4 py-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {CATEGORY_LABELS[cat as Category] ?? cat}
                          </span>
                          <span className="text-sm text-gray-900 font-semibold">
                            {amount.toLocaleString("ja-JP")}円
                            {budget && (
                              <span className="text-xs text-gray-400 ml-1">
                                / {budget.amount.toLocaleString("ja-JP")}円
                              </span>
                            )}
                          </span>
                        </div>
                        {ratio !== null && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ratio >= 1 ? "bg-red-500" : "bg-blue-400"}`}
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* Invite code */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">招待コード</h3>
              <button
                onClick={() => setShowInvite((v) => !v)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showInvite ? "隠す" : "表示する"}
              </button>
            </div>
            {showInvite ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-center font-mono text-2xl font-bold tracking-widest bg-gray-50 rounded-lg py-3 border border-gray-200 text-gray-800">
                    {group.inviteCode ?? "——"}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 min-w-[72px]"
                  >
                    {codeCopied ? "コピー済" : "コピー"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  このコードを共有するとグループに参加できます
                </p>
                {isOwner && (
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="w-full py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {regenerating ? "更新中..." : "コードを再発行する"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                コードを共有してメンバーを招待できます
              </p>
            )}
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              メンバー（{group.members.length}人）
            </h3>
            <ul className="space-y-1">
              {group.members.map((m) => {
                const isMe = m.uid === user?.uid;
                const isPickerOpen = colorPickerOpenFor === m.uid;
                return (
                  <li key={m.uid} className="rounded-lg">
                    <div className="flex items-center justify-between py-2 px-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium"
                          style={m.color ? { color: m.color } : { color: "#374151" }}
                        >
                          {m.displayName}
                          {isMe && (
                            <span className="text-xs text-gray-400 font-normal ml-1">（自分）</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {m.role === "owner" ? "オーナー" : "メンバー"}
                        </span>
                        {isMe && (
                          <button
                            onClick={() =>
                              setColorPickerOpenFor(isPickerOpen ? null : m.uid)
                            }
                            className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-2 py-0.5"
                          >
                            色を変更
                          </button>
                        )}
                      </div>
                    </div>
                    {isPickerOpen && isMe && (
                      <div className="px-3 pb-3">
                        <p className="text-xs text-gray-400 mb-1">あなたの表示色を選んでください</p>
                        <ColorPicker
                          value={m.color}
                          onChange={handleColorChange}
                        />
                        {savingColor && (
                          <p className="text-xs text-gray-400 mt-2">保存中...</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
