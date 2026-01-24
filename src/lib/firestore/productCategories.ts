import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ProductCategory } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type CategoryInput = ProductCategory;

const categoriesCollection = collection(db, 'productCategories');

export const addProductCategory = (data: CategoryInput) => {
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

export const updateProductCategory = (id: string, data: Partial<CategoryInput>) => {
  const categoryDoc = doc(db, 'productCategories', id);
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

export const deleteProductCategory = (id: string) => {
  const categoryDoc = doc(db, 'productCategories', id);
  return deleteDoc(categoryDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: categoryDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
