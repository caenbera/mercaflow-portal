
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  where,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Supplier, SupplierInput } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addSupplier = async (supplierData: SupplierInput) => {
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
  
  try {
    const docRef = await addDoc(suppliersCollection, newSupplierData);
    
    // RECIPROCIDAD AUTOMÁTICA
    // Si el usuario está vinculando un edificio existente de la red usando un slug/linkedOrgId
    if (supplierData.linkedOrgId && supplierData.organizationId) {
      // Verificamos si ya existe una conexión para no duplicar
      const connectionsRef = collection(db, 'connections');
      const q = query(
        connectionsRef, 
        where('fromOrgId', '==', supplierData.organizationId),
        where('toOrgId', '==', supplierData.linkedOrgId),
        limit(1)
      );
      
      const existingConn = await getDocs(q);
      
      if (existingConn.empty) {
        // Creamos la conexión comercial formal. 
        // Al ser por "Código de Red", se marca como aceptada automáticamente.
        await addDoc(connectionsRef, {
          fromOrgId: supplierData.organizationId,
          toOrgId: supplierData.linkedOrgId,
          status: 'accepted',
          type: 'supplier-client',
          createdAt: serverTimestamp(),
        });
      }
    }
    
    return docRef;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: suppliersCollection.path,
      operation: 'create',
      requestResourceData: newSupplierData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
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
