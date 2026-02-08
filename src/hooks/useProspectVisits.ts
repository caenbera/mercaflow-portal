"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ProspectVisit } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useProspectVisits(prospectId: string | null) {
  const [visits, setVisits] = useState<ProspectVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!prospectId) {
      setVisits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const visitsCollection = collection(db, 'prospects', prospectId, 'visits');
    const q = query(visitsCollection, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const visitsData: ProspectVisit[] = [];
        querySnapshot.forEach((doc) => {
          visitsData.push({ id: doc.id, ...doc.data() } as ProspectVisit);
        });
        setVisits(visitsData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: visitsCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [prospectId]);

  return { visits, loading, error };
}
