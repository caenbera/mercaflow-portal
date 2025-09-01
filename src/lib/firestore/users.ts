
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserRole } from '@/types';

export const updateUserRole = (uid: string, newRole: 'admin' | 'client') => {
  const userDoc = doc(db, 'users', uid);
  return updateDoc(userDoc, {
    role: newRole,
  });
};

export const addAdminInvite = (email: string) => {
  // Use the email as the document ID for easy lookup
  const inviteDoc = doc(collection(db, 'adminInvites'), email);
  return setDoc(inviteDoc, {
    email: email,
    role: 'admin',
  });
};
