import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FAQ } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addFaq = (data: Omit<FAQ, 'id' | 'createdAt'>) => {
  const coll = collection(db, 'faqs');
  const finalData = {
    ...data,
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

export const updateFaq = (id: string, data: Partial<Omit<FAQ, 'id' | 'createdAt'>>) => {
  const faqDoc = doc(db, 'faqs', id);
  return updateDoc(faqDoc, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: faqDoc.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteFaq = (id: string) => {
  const faqDoc = doc(db, 'faqs', id);
  return deleteDoc(faqDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: faqDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
