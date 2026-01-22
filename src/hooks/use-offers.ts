"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Offer } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const offersCollection = collection(db, 'offers');
    const now = Timestamp.now();
    // Query for offers that have not expired yet
    const q = query(offersCollection, where('expiresAt', '>', now));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const offersData: Offer[] = [];
        querySnapshot.forEach((doc) => {
          offersData.push({ id: doc.id, ...doc.data() } as Offer);
        });
        setOffers(offersData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: offersCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { offers, loading };
}
