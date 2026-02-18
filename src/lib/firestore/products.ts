
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type WithFieldValue,
  getDocs,
  query,
  where,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product, ProductInput } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type ProductUpdateInput = Partial<ProductInput>;

const productsCollection = collection(db, 'products');

export const addProduct = (productData: ProductInput) => {
  const dataWithTimestamp = {
    ...productData,
    createdAt: serverTimestamp(),
  } as WithFieldValue<Product>;

  return addDoc(productsCollection, dataWithTimestamp).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: productsCollection.path,
      operation: 'create',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const updateProduct = (id: string, productData: ProductUpdateInput) => {
  const productDoc = doc(db, 'products', id);
  const dataToUpdate = { ...productData };
  
  Object.keys(dataToUpdate).forEach(key => {
    if ((dataToUpdate as any)[key] === undefined) {
      delete (dataToUpdate as any)[key];
    }
  });

  return updateDoc(productDoc, dataToUpdate).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: productDoc.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteProduct = (id: string) => {
  const productDoc = doc(db, 'products', id);
  return deleteDoc(productDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: productDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  if (!sku) return null;
  const q = query(collection(db, 'products'), where('sku', '==', sku), limit(1));
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (e) {
    console.error("Error fetching product by SKU: ", e);
    return null;
  }
};

/**
 * Vincula todos los productos que no tienen organizationId a una organización específica.
 * Realiza un escaneo total para atrapar campos inexistentes.
 */
export const migrateLegacyProducts = async (targetOrgId: string) => {
  const allSnapshot = await getDocs(collection(db, 'products'));
  const batch = writeBatch(db);
  let count = 0;

  allSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    // Captura campos nulos, vacíos o inexistentes
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
