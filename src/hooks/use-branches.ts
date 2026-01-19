"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/auth-context';
import type { Branch } from '@/types';

export function useBranches() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'branches'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const branchesData: Branch[] = [];
        querySnapshot.forEach((doc) => {
          branchesData.push({ id: doc.id, ...doc.data() } as Branch);
        });
        setBranches(branchesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching branches:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { branches, loading, error };
}
