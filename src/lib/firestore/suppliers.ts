
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Supplier } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type SupplierInput = Omit<Supplier, 'id' | 'rating' | 'status' | 'verified' | 'finance'>;

export const addSupplier = (supplierData: SupplierInput) => {
  const suppliersCollection = collection(db, 'suppliers');
  
  const newSupplierData: Omit<Supplier, 'id'> = {
    ...supplierData,
    rating: 0,
    status: 'active',
    verified: false,
    finance: {
      pendingBalance: 0,
      ytdSpend: 0,
      fillRate: 100,
      onTimeDelivery: true,
    },
  };
  
  return addDoc(suppliersCollection, newSupplierData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: suppliersCollection.path,
      operation: 'create',
      requestResourceData: newSupplierData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
  const supplierDoc = doc(db, 'suppliers', id);
  return updateDoc(supplierDoc, supplierData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: supplierDoc.path,
      operation: 'update',
      requestResourceData: supplierData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteSupplier = (id: string) => {
  const supplierDoc = doc(db, 'suppliers', id);
  return deleteDoc(supplierDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: supplierDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

/**
 * Vincula todos los proveedores sin organizationId a una organización específica.
 */
export const migrateLegacySuppliers = async (targetOrgId: string) => {
  const allSnapshot = await getDocs(collection(db, 'suppliers'));
  const batch = writeBatch(db);
  let count = 0;

  allSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.organizationId || data.organizationId === null || data.organizationId === "") {
      batch.update(docSnap.ref, { organizationId: targetOrgId });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }
  return count;
};
