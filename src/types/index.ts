export type TransactionType = "income" | "expense";

export type Category =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "healthcare"
  | "education"
  | "shopping"
  | "housing"
  | "salary"
  | "other";

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GroupMember {
  uid: string;
  displayName: string;
  email: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  currency: string;
  inviteCode: string;
}

export interface Transaction {
  id: string;
  groupId: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  groupId: string;
  month: string; // "YYYY-MM"
  category: Category;
  amount: number;
  createdBy: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  food: "食費",
  transport: "交通費",
  utilities: "光熱費",
  entertainment: "娯楽",
  healthcare: "医療",
  education: "教育",
  shopping: "買い物",
  housing: "住居",
  salary: "給与",
  other: "その他",
};
