"use client";

export const MEMBER_COLORS: { label: string; value: string }[] = [
  { label: "ブルー",    value: "#3B82F6" },
  { label: "レッド",    value: "#EF4444" },
  { label: "グリーン",  value: "#22C55E" },
  { label: "パープル",  value: "#A855F7" },
  { label: "オレンジ",  value: "#F97316" },
  { label: "ピンク",    value: "#EC4899" },
  { label: "ティール",  value: "#0D9488" },
  { label: "イエロー",  value: "#CA8A04" },
  { label: "インディゴ", value: "#6366F1" },
  { label: "ローズ",    value: "#F43F5E" },
  { label: "エメラルド", value: "#059669" },
  { label: "アンバー",  value: "#D97706" },
];

interface Props {
  value?: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {MEMBER_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: c.value,
            borderColor: value === c.value ? "#1e293b" : "transparent",
            boxShadow: value === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : undefined,
          }}
          aria-label={c.label}
        />
      ))}
    </div>
  );
}
