"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { getGroupByInviteCode, addMemberToGroup } from "@/lib/firestore";
import type { GroupMember } from "@/types";
import Navbar from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";

type Step = "input" | "confirm" | "done";

export default function JoinPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundGroupId, setFoundGroupId] = useState("");
  const [foundGroupName, setFoundGroupName] = useState("");
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [groupDisplayName, setGroupDisplayName] = useState("");

  const normalizeCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError("");
    setLoading(true);
    try {
      const group = await getGroupByInviteCode(code);
      if (!group) { setError("招待コードが見つかりません。もう一度確認してください。"); return; }
      setFoundGroupId(group.id);
      setFoundGroupName(group.name);
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
      if (!group) { setError("グループが見つかりませんでした。"); setStep("input"); return; }
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-8">
          {step === "input" && (
            <>
              <div className="text-center mb-6">
                <p className="text-4xl mb-2">🔑</p>
                <h1 className="text-xl font-bold text-gray-900">グループに参加</h1>
                <p className="text-sm text-gray-500 mt-1">招待コードを入力してグループに参加しましょう</p>
              </div>
              <form onSubmit={handleLookup} className="space-y-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(normalizeCode(e.target.value))}
                  placeholder="例: XKCD4782"
                  maxLength={8}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || code.length < 8}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "検索中..." : "グループを検索"}
                </button>
              </form>
            </>
          )}
          {step === "confirm" && (
            <>
              <div className="text-center mb-6">
                <p className="text-4xl mb-2">👥</p>
                <h1 className="text-xl font-bold text-gray-900">グループが見つかりました</h1>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
                <p className="text-lg font-semibold text-blue-900">{foundGroupName}</p>
                <p className="text-sm text-blue-600 mt-1">{code}</p>
              </div>
              {alreadyMember ? (
                <>
                  <p className="text-center text-gray-500 text-sm mb-4">すでにこのグループのメンバーです</p>
                  <button onClick={() => router.push(`/groups/${foundGroupId}`)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                    グループを開く
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      このグループでの名前
                    </label>
                    <input
                      type="text"
                      value={groupDisplayName}
                      onChange={(e) => setGroupDisplayName(e.target.value)}
                      placeholder={profile?.displayName ?? "名前"}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">グループ内での表示名です。後から変更できます。</p>
                  </div>
                  <div className="space-y-2">
                    <button onClick={handleJoin} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                      {loading ? "参加中..." : "このグループに参加する"}
                    </button>
                    <button onClick={() => { setStep("input"); setError(""); }} className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      戻る
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {step === "done" && (
            <div className="text-center">
              <p className="text-5xl mb-3">🎉</p>
              <h1 className="text-xl font-bold text-gray-900 mb-2">参加しました！</h1>
              <p className="text-gray-500 text-sm mb-6">
                <span className="font-medium text-gray-700">{foundGroupName}</span> のメンバーになりました
              </p>
              <button onClick={() => router.push(`/groups/${foundGroupId}`)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                グループを開く
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
