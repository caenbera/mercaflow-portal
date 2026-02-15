
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { OrganizationConnection } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const connectionsCollection = collection(db, 'connections');

export const sendConnectionRequest = async (fromOrgId: string, toOrgId: string) => {
  const data = {
    fromOrgId,
    toOrgId,
    status: 'pending',
    type: 'supplier-client',
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(connectionsCollection, data);
    return docRef.id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: connectionsCollection.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};

export const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'rejected') => {
  const connectionDoc = doc(db, 'connections', connectionId);
  const data = { status };

  try {
    await updateDoc(connectionDoc, data);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: connectionDoc.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};

export const deleteConnection = async (connectionId: string) => {
  const connectionDoc = doc(db, 'connections', connectionId);
  try {
    await deleteDoc(connectionDoc);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: connectionDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};
