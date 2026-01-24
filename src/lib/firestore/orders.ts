
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Order, UserProfile, RewardRule } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type OrderInput = Omit<Order, 'id' | 'createdAt'>;
type OrderUpdateInput = Partial<Omit<Order, 'id' | 'createdAt' | 'userId'>>;

const ordersCollection = collection(db, 'orders');

export const addOrder = async (orderData: OrderInput) => {
  const dataWithTimestamp = {
    ...orderData,
    createdAt: serverTimestamp(),
  };
  try {
    const docRef = await addDoc(ordersCollection, dataWithTimestamp);
    return docRef;

  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: ordersCollection.path,
      operation: 'create',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw to be caught by the calling function
  }
};

export const updateOrder = async (id: string, orderData: OrderUpdateInput) => {
  const orderDoc = doc(db, 'orders', id);
  
  try {
    // The logic for awarding points is now handled by a Cloud Function (onOrderUpdate)
    // to ensure reliability and security. We simply update the document from the client.
    await updateDoc(orderDoc, orderData);
  } catch(serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: orderDoc.path,
      operation: 'update',
      requestResourceData: orderData,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw to be handled by the calling component (e.g., show a toast)
    throw serverError;
  }
};

export const deleteOrder = (id: string) => {
  const orderDoc = doc(db, 'orders', id);
  deleteDoc(orderDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: orderDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
};
