
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Reward, RewardTier, RewardRule } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useRewardData() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(query(collection(db, 'rewards'), orderBy('pointCost', 'asc')), (snapshot) => {
        setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward)));
      }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'rewards', operation: 'list' }));
        console.error("Error fetching rewards:", error);
      }),
      onSnapshot(query(collection(db, 'rewardTiers'), orderBy('minPoints', 'asc')), (snapshot) => {
        setTiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RewardTier)));
      }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'rewardTiers', operation: 'list' }));
        console.error("Error fetching tiers:", error);
      }),
      onSnapshot(query(collection(db, 'rewardRules'), orderBy('name', 'asc')), (snapshot) => {
        setRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RewardRule)));
      }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'rewardRules', operation: 'list' }));
        console.error("Error fetching rules:", error);
      }),
    ];

    Promise.all(unsubscribers).then(() => {
      // This is a bit of a simplification. Loading is set to false as soon as subscriptions start.
      // A more robust solution might wait for the first data snapshot from all subscriptions.
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  return { rewards, tiers, rules, loading };
}
