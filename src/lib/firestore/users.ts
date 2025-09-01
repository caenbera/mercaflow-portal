
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const updateUserRole = (uid: string, newRole: 'admin' | 'client') => {
  const userDoc = doc(db, 'users', uid);
  return updateDoc(userDoc, {
    role: newRole,
  });
};

// This function is no longer needed with the simplified role management.
// We keep it here in case we want to re-introduce a pre-approval flow later,
// but it is not used by any component.
export const addAdminInvite = (email: string) => {
  const inviteDocRef = doc(db, 'adminInvites', email.toLowerCase());
  return setDoc(inviteDocRef, {
    email: email.toLowerCase(),
    status: 'pending',
  });
};
