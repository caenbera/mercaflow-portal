
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Order, UserProfile, RewardRule } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
// We will create this file in the next step
// import { awardPointsForOrder } from './rewards';

type OrderInput = Omit<Order, 'id' | 'createdAt'>;
type OrderUpdateInput = Partial<Omit<Order, 'id' | 'createdAt' | 'userId'>>;

const ordersCollection = collection(db, 'orders');

export const addOrder = (orderData: OrderInput) => {
  const dataWithTimestamp = {
    ...orderData,
    createdAt: serverTimestamp(),
  };
  addDoc(ordersCollection, dataWithTimestamp).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: ordersCollection.path,
      operation: 'create',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
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
      
      // Fetch user profile to get current points
      const userDoc = await getDoc(doc(db, 'users', order.userId));
      if (userDoc.exists()) {
          const userProfile = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
          // In a real app, you would fetch rules and all orders here.
          // For now, we'll use a simplified logic: 1 point per dollar.
          const pointsToAward = Math.floor(order.total);

          if (pointsToAward > 0) {
            // awardPointsForOrder would be a more complex function as discussed
            // but for now, we just update the user's points directly.
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
