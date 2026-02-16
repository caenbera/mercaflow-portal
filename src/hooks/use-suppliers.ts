
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Supplier } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useOrganization } from '@/context/organization-context';

export function useSuppliers() {
  const { activeOrgId } = useOrganization();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeOrgId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    const suppliersCollection = collection(db, 'suppliers');
    const q = query(
      suppliersCollection,
      where('organizationId', '==', activeOrgId)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const suppliersData: Supplier[] = [];
        querySnapshot.forEach((doc) => {
          suppliersData.push({ id: doc.id, ...doc.data() } as Supplier);
        });
        
        // Ordenamos por nombre en el cliente
        suppliersData.sort((a, b) => a.name.localeCompare(b.name));
        
        setSuppliers(suppliersData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: suppliersCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOrgId]);

  return { suppliers, loading, error };
}
