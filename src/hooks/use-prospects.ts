
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Prospect } from '@/types';
import { useAuth } from '@/context/auth-context';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useProspects() {
  const { user, role } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !role) {
      setLoading(false);
      return;
    }

    const prospectsCollection = collection(db, 'prospects');
    let q;

    if (role === 'salesperson') {
      // Salespeople can only see their own prospects.
      // The orderBy was removed to prevent a composite index requirement.
      q = query(
        prospectsCollection,
        where('salespersonId', '==', user.uid)
      );
    } else if (role === 'admin' || role === 'superadmin') {
      // Admins can see all prospects, ordered by creation date.
      q = query(prospectsCollection, orderBy('createdAt', 'desc'));
    } else {
      // Other roles shouldn't see any prospects.
      setProspects([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const prospectsData: Prospect[] = [];
        querySnapshot.forEach((doc) => {
          prospectsData.push({ id: doc.id, ...doc.data() } as Prospect);
        });

        // If we didn't sort in the query (for salespeople), sort here on the client-side.
        if (role === 'salesperson') {
          prospectsData.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
          });
        }

        setProspects(prospectsData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: prospectsCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, role]);

  return { prospects, loading, error };
}
