
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
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
    // Eliminamos el orderBy para evitar problemas de índices en el prototipo inicial.
    // Ordenamos manualmente en el cliente si es necesario.
    const q = query(orgsCollection);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const orgsData: Organization[] = [];
        querySnapshot.forEach((doc) => {
          orgsData.push({ id: doc.id, ...doc.data() } as Organization);
        });
        
        // Ordenamos por fecha de creación descendente en el cliente
        orgsData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
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
