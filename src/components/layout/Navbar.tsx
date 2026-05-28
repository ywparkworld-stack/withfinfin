"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-xl font-bold text-blue-600">
        withfinfin
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ダッシュボード
        </Link>
        <Link href="/groups" className="text-sm text-gray-600 hover:text-gray-900">
          グループ
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{user?.displayName ?? user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}
