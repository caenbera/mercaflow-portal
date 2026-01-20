"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Supplier } from '@/types';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const suppliersData: Supplier[] = [];
        querySnapshot.forEach((doc) => {
          suppliersData.push({ id: doc.id, ...doc.data() } as Supplier);
        });
        setSuppliers(suppliersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching suppliers:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { suppliers, loading, error };
}
