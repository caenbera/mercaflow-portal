
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Organization } from '@/types';
import { useAuth } from '@/context/auth-context';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useOrganizations() {
  const { user, role } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const orgsCollection = collection(db, 'organizations');
    let q = query(orgsCollection, orderBy('createdAt', 'desc'));

    // Si no es superadmin, solo debería ver su propia organización (aunque esto es para el panel global)
    if (role !== 'superadmin') {
        // En una fase posterior filtraremos más estrictamente, por ahora permitimos lectura al staff
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const orgsData: Organization[] = [];
        querySnapshot.forEach((doc) => {
          orgsData.push({ id: doc.id, ...doc.data() } as Organization);
        });
        setOrganizations(orgsData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: orgsCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, role]);

  return { organizations, loading };
}
