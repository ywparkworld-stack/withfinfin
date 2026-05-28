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
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Group, GroupMember, Transaction, Budget } from "@/types";

// Groups
export async function createGroup(
  name: string,
  description: string,
  owner: GroupMember
): Promise<string> {
  const ref = await addDoc(collection(db, "groups"), {
    name,
    description,
    members: [owner],
    createdBy: owner.uid,
    createdAt: new Date().toISOString(),
    currency: "JPY",
  });
  return ref.id;
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  const q = query(
    collection(db, "groups"),
    where("members", "array-contains", { uid } as Partial<GroupMember>)
  );
  // array-contains with object requires exact match; use a different approach
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

export async function addMemberToGroup(
  groupId: string,
  members: GroupMember[]
): Promise<void> {
  await updateDoc(doc(db, "groups", groupId), { members });
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
