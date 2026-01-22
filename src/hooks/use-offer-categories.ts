"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { OfferCategory } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useOfferCategories() {
  const [categories, setCategories] = useState<OfferCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categoriesCollection = collection(db, 'offerCategories');
    const q = query(categoriesCollection, orderBy('name.es', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const categoriesData: OfferCategory[] = [];
        querySnapshot.forEach((doc) => {
          categoriesData.push({ id: doc.id, ...doc.data() } as OfferCategory);
        });
        setCategories(categoriesData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: categoriesCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { categories, loading };
}
