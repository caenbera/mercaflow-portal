"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface ProductUnit {
    id: string;
    es: string;
    en: string;
}

export function useProductUnits() {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unitsCollection = collection(db, 'productUnits');
    const q = query(unitsCollection, orderBy('es', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const unitsData: ProductUnit[] = [];
        querySnapshot.forEach((doc) => {
          unitsData.push({ id: doc.id, ...doc.data() } as ProductUnit);
        });
        setUnits(unitsData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: unitsCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { units, loading };
}
