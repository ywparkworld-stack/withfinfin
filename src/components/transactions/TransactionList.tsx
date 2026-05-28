"use client";

import type { Transaction } from "@/types";
import { CATEGORY_LABELS } from "@/types";

interface Props {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  currentUserId?: string;
  memberColors?: Record<string, string>;
}

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  transport: "🚃",
  utilities: "💡",
  entertainment: "🎮",
  healthcare: "🏥",
  education: "📚",
  shopping: "🛍️",
  housing: "🏠",
  salary: "💰",
  other: "📝",
};

export default function TransactionList({
  transactions,
  onDelete,
  currentUserId,
  memberColors,
}: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">📊</p>
        <p>まだ記録がありません</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {transactions.map((tx) => {
        const nameColor = memberColors?.[tx.createdBy];
        return (
          <li key={tx.id} className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{CATEGORY_ICONS[tx.category] ?? "📝"}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {tx.description || CATEGORY_LABELS[tx.category]}
                </p>
                <p className="text-xs">
                  <span className="text-gray-400">{tx.date} · </span>
                  <span
                    style={nameColor ? { color: nameColor } : undefined}
                    className={nameColor ? "font-medium" : "text-gray-400"}
                  >
                    {tx.createdByName}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  tx.type === "income" ? "text-green-600" : "text-red-500"
                }`}
              >
                {tx.type === "income" ? "+" : "-"}
                {tx.amount.toLocaleString("ja-JP")}円
              </span>
              {onDelete && currentUserId === tx.createdBy && (
                <button
                  onClick={() => onDelete(tx.id)}
                  className="text-gray-300 hover:text-red-400 text-xs"
                >
                  削除
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
