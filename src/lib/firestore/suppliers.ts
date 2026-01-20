import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Supplier } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// The form data is a subset of the Supplier type
type SupplierFormData = Omit<Supplier, 'id' | 'rating' | 'status' | 'verified' | 'finance'>;

export const addSupplier = (supplierData: SupplierFormData) => {
  const suppliersCollection = collection(db, 'suppliers');
  
  // Add default values for fields not present in the form
  const newSupplierData: Omit<Supplier, 'id'> = {
    ...supplierData,
    rating: 0,
    status: 'active',
    verified: false,
    finance: {
      pendingBalance: 0,
      ytdSpend: 0,
      fillRate: 100, // Default to 100%
      onTimeDelivery: true, // Default to true
    },
  };
  
  addDoc(suppliersCollection, newSupplierData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: suppliersCollection.path,
      operation: 'create',
      requestResourceData: newSupplierData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
  const supplierDoc = doc(db, 'suppliers', id);
  updateDoc(supplierDoc, supplierData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: supplierDoc.path,
      operation: 'update',
      requestResourceData: supplierData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const updateSupplierRating = (id: string, newRating: number) => {
    const supplierDoc = doc(db, 'suppliers', id);
    updateDoc(supplierDoc, { rating: newRating }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: supplierDoc.path,
            operation: 'update',
            requestResourceData: { rating: newRating },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

export const deleteSupplier = (id: string) => {
  const supplierDoc = doc(db, 'suppliers', id);
  deleteDoc(supplierDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: supplierDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const getSupplier = async (id: string): Promise<Supplier | null> => {
  const supplierDocRef = doc(db, 'suppliers', id);
  // The custom FirestorePermissionError is for client-side components.
  // For server-rendered pages, we let the error bubble up to Next.js,
  // which will display it in the dev overlay.
  const docSnap = await getDoc(supplierDocRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Supplier;
  } else {
    return null;
  }
};
