"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ProductCategory } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Define the type with an ID
export type ProductCategoryWithId = ProductCategory & { id: string };

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategoryWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categoriesCollection = collection(db, 'productCategories');
    const q = query(categoriesCollection, orderBy('es', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const categoriesData: ProductCategoryWithId[] = [];
        querySnapshot.forEach((doc) => {
          categoriesData.push({ id: doc.id, ...doc.data() } as ProductCategoryWithId);
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
