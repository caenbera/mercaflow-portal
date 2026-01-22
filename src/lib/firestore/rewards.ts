
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Reward, RewardTier, RewardRule, UserProfile, Order } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// --- CRUD for Admin Management ---

export const manageReward = (id: string | null, data: Partial<Omit<Reward, 'id'>>) => {
  const ref = id ? doc(db, 'rewards', id) : doc(collection(db, 'rewards'));
  return (id ? updateDoc(ref, data) : addDoc(collection(db, 'rewards'), data)).catch(async (e) => {
    const op = id ? 'update' : 'create';
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: op, requestResourceData: data }));
    throw e;
  });
};

export const deleteReward = (id: string) => {
  const ref = doc(db, 'rewards', id);
  return deleteDoc(ref).catch(async (e) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'delete' }));
    throw e;
  });
};

export const manageTier = (id: string | null, data: Partial<Omit<RewardTier, 'id'>>) => {
  const ref = id ? doc(db, 'rewardTiers', id) : doc(collection(db, 'rewardTiers'));
  return (id ? updateDoc(ref, data) : addDoc(collection(db, 'rewardTiers'), data)).catch(async (e) => {
    const op = id ? 'update' : 'create';
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: op, requestResourceData: data }));
    throw e;
  });
};

export const deleteTier = (id: string) => {
  const ref = doc(db, 'rewardTiers', id);
  return deleteDoc(ref).catch(async (e) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'delete' }));
    throw e;
  });
};

export const manageRule = (id: string | null, data: Partial<Omit<RewardRule, 'id'>>) => {
  const ref = id ? doc(db, 'rewardRules', id) : doc(collection(db, 'rewardRules'));
  return (id ? updateDoc(ref, data) : addDoc(collection(db, 'rewardRules'), data)).catch(async (e) => {
    const op = id ? 'update' : 'create';
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: op, requestResourceData: data }));
    throw e;
  });
};

export const deleteRule = (id: string) => {
  const ref = doc(db, 'rewardRules', id);
  return deleteDoc(ref).catch(async (e) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'delete' }));
    throw e;
  });
};

// --- Client-facing actions ---

export const redeemReward = async (userId: string, rewardId: string, cost: number, name: string) => {
  const userRef = doc(db, 'users', userId);
  const activityRef = doc(collection(db, 'users', userId, 'rewardsActivity'));
  
  const batch = writeBatch(db);

  batch.update(userRef, {
    rewardPoints: increment(-cost)
  });

  batch.set(activityRef, {
    description: `Redeemed ${name}`,
    points: -cost,
    createdAt: serverTimestamp()
  });

  return batch.commit().catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { rewardPoints: `decrement by ${cost}` } }));
      throw e;
  });
};

// --- Point Calculation Engine ---

export const awardPointsForOrder = async (order: Order, user: UserProfile, allRules: RewardRule[], allOrders: Order[]) => {
  let totalPoints = 0;
  const activeRules = allRules.filter(rule => rule.isActive);

  for (const rule of activeRules) {
    let pointsFromRule = 0;
    switch (rule.ruleType) {
      case 'pointsPerDollar':
        if (rule.points && rule.perAmount) {
            pointsFromRule = Math.floor(order.total / rule.perAmount) * rule.points;
        }
        break;
      // ... other rule calculations would go here
    }
    totalPoints += pointsFromRule;
  }
  
  if (totalPoints > 0) {
    const userRef = doc(db, 'users', user.uid);
    const activityRef = doc(collection(db, 'users', user.uid, 'rewardsActivity'));

    const batch = writeBatch(db);

    batch.update(userRef, {
        rewardPoints: increment(totalPoints)
    });

    batch.set(activityRef, {
        description: `Order #${order.id.substring(0, 6)}`,
        points: totalPoints,
        createdAt: serverTimestamp()
    });

    await batch.commit().catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { rewardPoints: `increment by ${totalPoints}` } }));
        throw e;
    });
  }

  return totalPoints;
};
