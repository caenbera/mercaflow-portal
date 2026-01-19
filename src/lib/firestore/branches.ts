import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Branch } from '@/types';

type BranchInput = Omit<Branch, 'id'>;

export const addBranch = (userId: string, branchData: BranchInput) => {
  const branchesCollection = collection(db, 'users', userId, 'branches');
  return addDoc(branchesCollection, branchData);
};

export const updateBranch = (userId: string, branchId: string, branchData: Partial<BranchInput>) => {
  const branchDoc = doc(db, 'users', userId, 'branches', branchId);
  return updateDoc(branchDoc, branchData);
};

export const deleteBranch = (userId: string, branchId: string) => {
  const branchDoc = doc(db, 'users', userId, 'branches', branchId);
  return deleteDoc(branchDoc);
};
