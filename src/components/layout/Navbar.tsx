"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

export default function Navbar() {
  const { profile } = useProfile();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-xl font-bold text-blue-600">
        mitH
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ダッシュボード
        </Link>
        <Link href="/groups" className="text-sm text-gray-600 hover:text-gray-900">
          グループ
        </Link>
        <Link href="/join" className="text-sm text-gray-600 hover:text-gray-900">
          コードで参加
        </Link>
        {profile && (
          <span className="text-sm text-gray-500">{profile.displayName}</span>
        )}
      </div>
    </nav>
  );
}
