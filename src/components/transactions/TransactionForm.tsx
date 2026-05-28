"use client";

import { useState } from "react";
import type { TransactionType, Category } from "@/types";
import { CATEGORY_LABELS } from "@/types";

interface Props {
  onSubmit: (data: {
    type: TransactionType;
    amount: number;
    category: Category;
    description: string;
    date: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const INCOME_CATEGORIES: Category[] = ["salary", "other"];
const EXPENSE_CATEGORIES: Category[] = [
  "food", "transport", "utilities", "entertainment",
  "healthcare", "education", "shopping", "housing", "other",
];

export default function TransactionForm({ onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: Number(amount),
        category,
        description,
        date,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-300">
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory(t === "income" ? "salary" : "food");
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              type === t
                ? t === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "expense" ? "支出" : "収入"}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">金額（円）</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="0"
          min="1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="例: スーパーで買い物"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
