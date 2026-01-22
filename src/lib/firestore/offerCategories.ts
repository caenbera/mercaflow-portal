import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { OfferCategory } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type CategoryInput = Omit<OfferCategory, 'id'>;

const categoriesCollection = collection(db, 'offerCategories');

export const addOfferCategory = (data: CategoryInput) => {
  return addDoc(categoriesCollection, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: categoriesCollection.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const updateOfferCategory = (id: string, data: Partial<CategoryInput>) => {
  const categoryDoc = doc(db, 'offerCategories', id);
  return updateDoc(categoryDoc, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: categoryDoc.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteOfferCategory = (id: string) => {
  const categoryDoc = doc(db, 'offerCategories', id);
  return deleteDoc(categoryDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: categoryDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
