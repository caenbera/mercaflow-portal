import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface ProductUnit {
  es: string;
  en: string;
}

type UnitInput = ProductUnit;

const unitsCollection = collection(db, 'productUnits');

export const addProductUnit = (data: UnitInput) => {
  return addDoc(unitsCollection, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: unitsCollection.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const updateProductUnit = (id: string, data: Partial<UnitInput>) => {
  const unitDoc = doc(db, 'productUnits', id);
  return updateDoc(unitDoc, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: unitDoc.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteProductUnit = (id: string) => {
  const unitDoc = doc(db, 'productUnits', id);
  return deleteDoc(unitDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: unitDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
