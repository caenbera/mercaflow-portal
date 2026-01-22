
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
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
    
    // --- REWARDS LOGIC (for order creation, e.g., points per dollar) ---
    // This is a simplified version. A real app might wait for 'delivered' status.
    const userDoc = await getDoc(doc(db, 'users', orderData.userId)));
    if (userDoc.exists()) {
      const userProfile = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
      // In a real app, you would fetch rules and all orders here.
      // For now, let's assume simple logic is handled on delivery.
    }
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
    // We get the order state BEFORE updating it
    const orderSnapshot = await getDoc(orderDoc);
    if (!orderSnapshot.exists()) {
      throw new Error("Order not found");
    }
    const currentStatus = orderSnapshot.data().status;

    // Perform the update
    await updateDoc(orderDoc, orderData);

    // --- REWARDS LOGIC ---
    // If the status is being updated TO 'delivered' from something else
    if (orderData.status === 'delivered' && currentStatus !== 'delivered') {
      const order = { id, ...orderSnapshot.data() } as Order;
      
      const userDoc = await getDoc(doc(db, 'users', order.userId));
      if (userDoc.exists()) {
          const userProfile = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
          // For now, we'll use a simplified logic: 1 point per dollar.
          const pointsToAward = Math.floor(order.total);
          // A more complex system would use the awardPointsForOrder function.
          if (pointsToAward > 0) {
            const userRef = doc(db, 'users', userProfile.uid);
            const activityRef = doc(collection(db, 'users', userProfile.uid, 'rewardsActivity'));
            const batch = writeBatch(db);

            batch.update(userRef, { rewardPoints: (userProfile.rewardPoints || 0) + pointsToAward });
            batch.set(activityRef, {
                description: `Order #${order.id.substring(0, 6)}`,
                points: pointsToAward,
                createdAt: serverTimestamp()
            });
            await batch.commit();
          }
      }
    }
  } catch(serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: orderDoc.path,
      operation: 'update',
      requestResourceData: orderData,
    });
    errorEmitter.emit('permission-error', permissionError);
    // We don't re-throw here to avoid double-toasting if the calling function has a catch block.
    // The error is already emitted globally.
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
