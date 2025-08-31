
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Order } from '@/types';

type OrderInput = Omit<Order, 'id' | 'createdAt'>;
type OrderUpdateInput = Partial<Omit<Order, 'id' | 'createdAt' | 'userId'>>;

const ordersCollection = collection(db, 'orders');

export const addOrder = (orderData: OrderInput) => {
  return addDoc(ordersCollection, {
    ...orderData,
    createdAt: serverTimestamp(),
  });
};

export const updateOrder = (id: string, orderData: OrderUpdateInput) => {
  const orderDoc = doc(db, 'orders', id);
  return updateDoc(orderDoc, orderData);
};

export const deleteOrder = (id: string) => {
  const orderDoc = doc(db, 'orders', id);
  return deleteDoc(orderDoc);
};
