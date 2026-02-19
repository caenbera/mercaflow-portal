
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Newsletter } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addNewsletter = (data: Omit<Newsletter, 'id' | 'createdAt' | 'opens'>) => {
  const coll = collection(db, 'newsletters');
  const finalData = {
    ...data,
    opens: 0,
    createdAt: serverTimestamp(),
  };

  return addDoc(coll, finalData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: coll.path,
      operation: 'create',
      requestResourceData: finalData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const updateNewsletter = (id: string, data: Partial<Omit<Newsletter, 'id' | 'createdAt'>>) => {
  const docRef = doc(db, 'newsletters', id);
  return updateDoc(docRef, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteNewsletter = (id: string) => {
  const docRef = doc(db, 'newsletters', id);
  return deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const trackNewsletterOpen = (id: string) => {
  const docRef = doc(db, 'newsletters', id);
  return updateDoc(docRef, {
    opens: increment(1)
  }).catch((e) => console.error("Error tracking newsletter open:", e));
};
