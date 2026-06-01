"use client";

import { useEffect, useState } from "react";
import { getUserGroups, getTransactions } from "@/lib/firestore";
import { useProfile } from "@/hooks/useProfile";
import type { Group, Transaction } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function DashboardPage() {
  const { profile } = useProfile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentTxs, setRecentTxs] = useState<(Transaction & { groupName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!profile) return;
    getUserGroups(profile.uid).then(async (gs) => {
      setGroups(gs);
      const txArrays = await Promise.all(
        gs.map(async (g) => {
          const txs = await getTransactions(g.id, currentMonth);
          return txs.map((t) => ({ ...t, groupName: g.name }));
        })
      );
      const all = txArrays
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      setRecentTxs(all);
      setLoading(false);
    });
  }, [profile]);

  const totalExpense = recentTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = recentTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            こんにちは、{profile?.displayName ?? "さん"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}の集計
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-700 font-medium">今月の収入</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{totalIncome.toLocaleString("ja-JP")}円</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium">今月の支出</p>
            <p className="text-2xl font-bold text-red-800 mt-1">{totalExpense.toLocaleString("ja-JP")}円</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">グループ</h2>
            <Link href="/groups" className="text-sm text-blue-600 hover:text-blue-700">管理 →</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">グループがまだありません</p>
              <Link href="/groups" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                グループを作成する →
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div>
                    <p className="font-medium text-gray-900">{g.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{g.members.length}人のメンバー</p>
                  </div>
                  <span className="text-gray-400 text-lg">›</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {recentTxs.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">最近の取引</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description || tx.category}</p>
                    <p className="text-xs text-gray-400">{tx.groupName} · {tx.date}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("ja-JP")}円
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
