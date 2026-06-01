"use client";

import { useEffect, useState } from "react";
import { getUserGroups, createGroup } from "@/lib/firestore";
import { useProfile } from "@/hooks/useProfile";
import type { Group, GroupMember } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function GroupsPage() {
  const { profile } = useProfile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [ownerDisplayName, setOwnerDisplayName] = useState("");

  useEffect(() => {
    if (profile) setOwnerDisplayName(profile.displayName);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    getUserGroups(profile.uid).then((g) => {
      setGroups(g);
      setLoading(false);
    });
  }, [profile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setShowForm(false);
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">グループ一覧</h1>
          <div className="flex gap-2">
            <Link href="/join" className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
              コードで参加
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + 新規作成
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">グループを作成</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="グループ名（例: 田中家, 沖縄旅行メンバー）"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="説明（任意）"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div>
                <label className="block text-xs text-gray-500 mb-1">このグループでの名前</label>
                <input
                  type="text"
                  value={ownerDisplayName}
                  onChange={(e) => setOwnerDisplayName(e.target.value)}
                  placeholder={profile?.displayName ?? "名前"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  キャンセル
                </button>
                <button type="submit" disabled={creating} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {creating ? "作成中..." : "作成"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">👨‍👩‍👧‍👦</p>
            <p className="font-medium">まだグループがありません</p>
            <p className="text-sm mt-1">グループを作って家族や友人と家計を共有しましょう</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((g) => (
              <li key={g.id}>
                <Link href={`/groups/${g.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{g.name}</h3>
                      {g.description && <p className="text-sm text-gray-500 mt-0.5">{g.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{g.members.length}人</p>
                      <p className="text-xs text-gray-300">{new Date(g.createdAt).toLocaleDateString("ja-JP")}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
