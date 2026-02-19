
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Newsletter } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useNewsletters(orgId: string | null) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setNewsletters([]);
      setLoading(false);
      return;
    }

    const coll = collection(db, 'newsletters');
    const q = query(coll, where('organizationId', '==', orgId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Newsletter));
        
        // Manual client-side sort
        list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        setNewsletters(list);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: coll.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  return { newsletters, loading };
}
