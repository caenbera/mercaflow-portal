
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Reward, RewardTier, RewardRule, UserProfile, Order } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Helper to remove undefined values from data objects
const cleanDataForFirestore = (data: object) => {
  const cleanedData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  for (const key in cleanedData) {
      if (typeof (cleanedData as any)[key] === 'object' && (cleanedData as any)[key] !== null) {
          (cleanedData as any)[key] = cleanDataForFirestore((cleanedData as any)[key]);
      }
  }
  return cleanedData;
};

// --- CRUD for Admin Management ---

export const manageReward = (id: string | null, data: Partial<Omit<Reward, 'id'>>) => {
  const cleanData = cleanDataForFirestore(data);
  if (id) {
    const ref = doc(db, 'rewards', id);
    return updateDoc(ref, cleanData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'update', requestResourceData: cleanData }));
      throw e;
    });
  } else {
    const collectionRef = collection(db, 'rewards');
    return addDoc(collectionRef, cleanData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collectionRef.path, operation: 'create', requestResourceData: cleanData }));
      throw e;
    });
  }
};

export const deleteReward = (id: string) => {
  const ref = doc(db, 'rewards', id);
  return deleteDoc(ref).catch(async (e) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'delete' }));
    throw e;
  });
};

export const manageTier = (id: string | null, data: Partial<Omit<RewardTier, 'id'>>) => {
  const cleanData = cleanDataForFirestore(data);
  if (id) {
    const ref = doc(db, 'rewardTiers', id);
    return updateDoc(ref, cleanData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'update', requestResourceData: cleanData }));
      throw e;
    });
  } else {
    const collectionRef = collection(db, 'rewardTiers');
    return addDoc(collectionRef, cleanData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collectionRef.path, operation: 'create', requestResourceData: cleanData }));
      throw e;
    });
  }
};

export const deleteTier = (id: string) => {
  const ref = doc(db, 'rewardTiers', id);
  return deleteDoc(ref).catch(async (e) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'delete' }));
    throw e;
  });
};

export const manageRule = (id: string | null, data: Partial<Omit<RewardRule, 'id'>>) => {
  const cleanData = cleanDataForFirestore(data);
  if (id) {
    const ref = doc(db, 'rewardRules', id);
    return updateDoc(ref, cleanData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'update', requestResourceData: cleanData }));
      throw e;
    });
  } else {
    const collectionRef = collection(db, 'rewardRules');
    return addDoc(collectionRef, cleanData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collectionRef.path, operation: 'create', requestResourceData: cleanData }));
      throw e;
    });
  }
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

  // 1. Decrement points
  batch.update(userRef, {
    rewardPoints: increment(-cost)
  });

  // 2. Add activity log
  batch.set(activityRef, {
    description: `Redeemed: ${name}`,
    points: -cost,
    createdAt: serverTimestamp()
  });

  // 3. Apply the actual benefit
  if (name.toLowerCase().includes('credit') || name.toLowerCase().includes('crédito')) {
    const creditAmountMatch = name.match(/\\$?(\d+(\\.\\d{1,2})?)/);
    const creditAmount = creditAmountMatch ? parseFloat(creditAmountMatch[1]) : 0;
    if (creditAmount > 0) {
      batch.update(userRef, {
        creditBalance: increment(creditAmount)
      });
    }
  }
  // Future logic for other rewards like 'Free Shipping' would go here.

  return batch.commit().catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { rewardPoints: `decrement by ${cost}` } }));
      throw e;
  });
};

// --- Point Calculation Engine ---

export const awardPointsForOrder = async (order: Order, user: UserProfile, allRules: RewardRule[], allOrders: Order[]) => {
  let totalPoints = 0;
  const activeRules = allRules.filter(rule => rule.isActive);
  const orderDay = (order.createdAt as Timestamp).toDate().getDay(); // 0 for Sunday, 1 for Monday, etc.

  // Separate multipliers from additive rules
  const additiveRules = activeRules.filter(r => r.ruleType !== 'multiplierPerDay');
  const multiplierRules = activeRules.filter(r => r.ruleType === 'multiplierPerDay' && r.dayOfWeek === orderDay);

  // Calculate base points from additive rules
  for (const rule of additiveRules) {
    let pointsFromRule = 0;
    switch (rule.ruleType) {
      case 'pointsPerDollar':
        if (rule.points && rule.perAmount) {
            pointsFromRule = Math.floor(order.total / rule.perAmount) * rule.points;
        }
        break;
      case 'bonusForAmount':
        if (rule.points && rule.amount && order.total > rule.amount) {
            pointsFromRule = rule.points;
        }
        break;
      case 'fixedPointsPerOrder':
        if (rule.points) {
            pointsFromRule = rule.points;
        }
        break;
      case 'bonusForProduct':
        if (rule.points && rule.productId && order.items.some(item => item.productId === rule.productId)) {
            pointsFromRule = rule.points;
        }
        break;
       case 'firstOrderBonus':
        // Check if this is the user's first delivered order
        const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
        if (rule.points && deliveredOrders.length === 1 && deliveredOrders[0].id === order.id) {
          pointsFromRule = rule.points;
        }
        break;
      case 'anniversaryBonus':
        const userAnniversaryMonth = user.createdAt.toDate().getMonth();
        const orderMonth = (order.createdAt as Timestamp).toDate().getMonth();
        if (rule.points && userAnniversaryMonth === orderMonth) {
            pointsFromRule = rule.points;
        }
        break;
      case 'bonusForVariety':
          if (rule.points && rule.amount && order.items.length > rule.amount) {
              pointsFromRule = rule.points;
          }
          break;
      // 'bonusForCategory' and 'consecutiveBonus' require more complex data fetching and are omitted for now.
    }
    totalPoints += pointsFromRule;
  }

  // Apply multipliers
  for (const rule of multiplierRules) {
      if (rule.multiplier) {
          totalPoints *= rule.multiplier;
      }
  }

  totalPoints = Math.floor(totalPoints); // Ensure points are an integer

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
