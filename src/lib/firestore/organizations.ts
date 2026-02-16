
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Organization } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const organizationsCollection = collection(db, 'organizations');

export const createOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt'>) => {
  const dataWithTimestamp = {
    ...orgData,
    createdAt: serverTimestamp(),
  };
  try {
    const docRef = await addDoc(organizationsCollection, dataWithTimestamp);
    return docRef.id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: organizationsCollection.path,
      operation: 'create',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};

export const updateOrganization = async (id: string, orgData: Partial<Organization>) => {
  const orgDoc = doc(db, 'organizations', id);
  
  // Limpiar undefined para evitar errores de Firestore
  const cleanData = Object.fromEntries(Object.entries(orgData).filter(([_, v]) => v !== undefined));

  try {
    await updateDoc(orgDoc, cleanData);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: orgDoc.path,
      operation: 'update',
      requestResourceData: cleanData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};

export const deleteOrganization = async (id: string) => {
  const orgDoc = doc(db, 'organizations', id);
  try {
    await deleteDoc(orgDoc);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: orgDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
};
