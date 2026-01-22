
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
import { awardPointsForOrder } from './rewards';

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
    const orderSnapshot = await getDoc(orderDoc);
    if (!orderSnapshot.exists()) {
      throw new Error("Order not found");
    }
    const currentStatus = orderSnapshot.data().status;

    await updateDoc(orderDoc, orderData);

    if (orderData.status === 'delivered' && currentStatus !== 'delivered') {
      const order = { id, ...orderSnapshot.data() } as Order;
      
      const userDoc = await getDoc(doc(db, 'users', order.userId));
      if (userDoc.exists()) {
          const userProfile = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
          
          // Fetch all active rules
          const rulesQuery = query(collection(db, 'rewardRules'), where('isActive', '==', true));
          const rulesSnapshot = await getDocs(rulesQuery);
          const allRules = rulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RewardRule);

          // Fetch all user's orders for complex rules
          const userOrdersQuery = query(collection(db, 'orders'), where('userId', '==', order.userId));
          const userOrdersSnapshot = await getDocs(userOrdersQuery);
          const allOrders = userOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);

          // Award points using the rule engine
          await awardPointsForOrder(order, userProfile, allRules, allOrders);
      }
    }
  } catch(serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: orderDoc.path,
      operation: 'update',
      requestResourceData: orderData,
    });
    errorEmitter.emit('permission-error', permissionError);
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
