
import { doc, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile, UserRole } from '@/types';

export const updateUserProfile = (uid: string, data: Partial<UserProfile>) => {
  const userDoc = doc(db, 'users', uid);
  // Ensure we don't try to write undefined values
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

  return updateDoc(userDoc, cleanData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userDoc.path,
      operation: 'update',
      requestResourceData: cleanData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw to allow component-level error handling
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        }
        return null;
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
}

export const deleteUser = (uid: string) => {
  const userDoc = doc(db, 'users', uid);
  return deleteDoc(userDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

/**
 * Crea o actualiza una invitación de pre-aprobación para un usuario.
 * @param email Correo invitado
 * @param role Rol asignado
 * @param organizationId (Opcional) Edificio vinculado
 */
export const addAdminInvite = (email: string, role: UserRole, organizationId?: string) => {
  const inviteDocRef = doc(db, 'adminInvites', email.toLowerCase());
  const inviteData = {
    email: email.toLowerCase(),
    role: role,
    status: 'pending',
    organizationId: organizationId || null,
  };
  
  return setDoc(inviteDocRef, inviteData, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: inviteDocRef.path,
      operation: 'create',
      requestResourceData: inviteData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
