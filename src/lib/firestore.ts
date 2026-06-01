import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Group, GroupMember, Transaction, Budget } from "@/types";

// Invite code: 8 uppercase alphanumeric chars, excluding ambiguous chars (0, O, I, 1, L)
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generateInviteCode(): string {
  return Array.from({ length: 8 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join("");
}

// Groups
export async function createGroup(
  name: string,
  description: string,
  owner: GroupMember
): Promise<{ id: string; inviteCode: string }> {
  const inviteCode = generateInviteCode();
  const ref = await addDoc(collection(db, "groups"), {
    name,
    description,
    members: [owner],
    createdBy: owner.uid,
    createdAt: new Date().toISOString(),
    currency: "JPY",
    inviteCode,
  });
  return { id: ref.id, inviteCode };
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  const all = await getDocs(collection(db, "groups"));
  return all.docs
    .filter((d) => {
      const data = d.data();
      return (data.members as GroupMember[]).some((m) => m.uid === uid);
    })
    .map((d) => ({ id: d.id, ...d.data() } as Group));
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, "groups", groupId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Group;
}

export async function getGroupByInviteCode(code: string): Promise<Group | null> {
  const q = query(
    collection(db, "groups"),
    where("inviteCode", "==", code.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Group;
}

export async function addMemberToGroup(
  groupId: string,
  members: GroupMember[]
): Promise<void> {
  await updateDoc(doc(db, "groups", groupId), { members });
}

export async function updateMemberColor(
  groupId: string,
  uid: string,
  color: string,
  currentMembers: GroupMember[]
): Promise<void> {
  const updated = currentMembers.map((m) =>
    m.uid === uid ? { ...m, color } : m
  );
  await updateDoc(doc(db, "groups", groupId), { members: updated });
}

export async function updateMemberDisplayName(
  groupId: string,
  uid: string,
  displayName: string,
  currentMembers: GroupMember[]
): Promise<void> {
  const updated = currentMembers.map((m) =>
    m.uid === uid ? { ...m, displayName } : m
  );
  await updateDoc(doc(db, "groups", groupId), { members: updated });
}

export async function regenerateInviteCode(groupId: string): Promise<string> {
  const newCode = generateInviteCode();
  await updateDoc(doc(db, "groups", groupId), { inviteCode: newCode });
  return newCode;
}

// Transactions
export async function addTransaction(
  tx: Omit<Transaction, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "groups", tx.groupId, "transactions"), {
    ...tx,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getTransactions(
  groupId: string,
  month?: string
): Promise<Transaction[]> {
  const ref = collection(db, "groups", groupId, "transactions");
  const q = query(ref, orderBy("date", "desc"));
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
  if (!month) return all;
  return all.filter((t) => t.date.startsWith(month));
}

export async function deleteTransaction(
  groupId: string,
  transactionId: string
): Promise<void> {
  await deleteDoc(doc(db, "groups", groupId, "transactions", transactionId));
}

// Budgets
export async function setBudget(budget: Omit<Budget, "id">): Promise<void> {
  const id = `${budget.month}_${budget.category}`;
  await setDoc(doc(db, "groups", budget.groupId, "budgets", id), budget);
}

export async function getBudgets(
  groupId: string,
  month: string
): Promise<Budget[]> {
  const ref = collection(db, "groups", groupId, "budgets");
  const q = query(ref, where("month", "==", month));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget));
}
