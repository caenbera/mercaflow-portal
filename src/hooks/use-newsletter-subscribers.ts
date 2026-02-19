
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { NewsletterSubscriber } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useNewsletterSubscribers(orgId: string | null) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setSubscribers([]);
      setLoading(false);
      return;
    }

    const coll = collection(db, 'newsletterSubscribers');
    const q = query(coll, where('organizationId', '==', orgId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as NewsletterSubscriber));
        
        list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        setSubscribers(list);
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

  return { subscribers, loading };
}
