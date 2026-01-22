
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { RewardActivity } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useRewardActivity(userId?: string) {
  const [activities, setActivities] = useState<RewardActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const activityCollection = collection(db, 'users', userId, 'rewardsActivity');
    const q = query(activityCollection, orderBy('createdAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const activityData: RewardActivity[] = [];
        querySnapshot.forEach((doc) => {
          activityData.push({ id: doc.id, ...doc.data() } as RewardActivity);
        });
        setActivities(activityData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: activityCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { activities, loading };
}
